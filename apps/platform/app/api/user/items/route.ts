import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  userItems,
  itemTags,
  createUserItem,
  createItemTags,
  findUserItems,
  findItemTags,
  updateUserItem,
  deleteUserItem
} from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

// GET /api/user/items - Get user's consolidated items (notes, tasks, bookmarks)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const userResults = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (userResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResults[0];

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const itemType = searchParams.get('type'); // 'note', 'task', 'bookmark'
    const lessonId = searchParams.get('lessonId');

    // Get user items with filtering
    const items = await findUserItems(user.id, itemType || undefined, lessonId || undefined);

    // Get tags for each item
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const tags = await findItemTags(item.id);
        return {
          ...item,
          tags: tags.map(tag => tag.tag),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        items: enrichedItems,
        summary: {
          total: items.length,
          notes: items.filter(item => item.itemType === 'note').length,
          tasks: items.filter(item => item.itemType === 'task').length,
          bookmarks: items.filter(item => item.itemType === 'bookmark').length,
        }
      }
    });

  } catch (error) {
    console.error('Get user items error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/user/items - Create a new user item (note, task, or bookmark)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const userResults = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (userResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResults[0];

    const body = await req.json();
    const {
      itemType, // 'note', 'task', 'bookmark'
      lessonId,
      title,
      content,
      metadata,
      tags = []
    } = body;

    // Validate required fields
    if (!itemType || !lessonId || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: itemType, lessonId, title' },
        { status: 400 }
      );
    }

    // Create the user item
    const newItem = await createUserItem({
      userId: user.id,
      lessonId,
      itemType: itemType as any,
      title,
      content: content || null,
      metadata: metadata || null,
    });

    // Create tags if provided
    if (tags.length > 0) {
      await createItemTags(newItem.id, tags);
    }

    // Get the created item with tags
    const createdItem = await findUserItems(user.id, itemType, lessonId);
    const itemTags = await findItemTags(newItem.id);

    return NextResponse.json({
      success: true,
      data: {
        ...createdItem[0],
        tags: itemTags.map(tag => tag.tag),
      }
    });

  } catch (error) {
    console.error('Create user item error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/user/items/[id] - Update a user item
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const {
      title,
      content,
      metadata,
      status,
      tags
    } = body;

    // Verify user owns the item
    const itemResults = await db.select()
      .from(userItems)
      .where(eq(userItems.id, id))
      .limit(1);

    if (itemResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    const item = itemResults[0];

    // Get user to verify ownership
    const userResults = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (userResults.length === 0 || userResults[0].id !== item.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update the item
    const updatedItem = await updateUserItem(id, {
      title,
      content,
      metadata,
      status,
      updatedAt: new Date()
    });

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await db.delete(itemTags)
        .where(eq(itemTags.itemId, id));

      // Create new tags
      if (tags.length > 0) {
        await createItemTags(id, tags);
      }
    }

    // Get updated item with tags
    const itemTags = await findItemTags(id);

    return NextResponse.json({
      success: true,
      data: {
        ...updatedItem,
        tags: itemTags.map(tag => tag.tag),
      }
    });

  } catch (error) {
    console.error('Update user item error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/items/[id] - Delete a user item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify user owns the item
    const itemResults = await db.select()
      .from(userItems)
      .where(eq(userItems.id, id))
      .limit(1);

    if (itemResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    const item = itemResults[0];

    // Get user to verify ownership
    const userResults = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (userResults.length === 0 || userResults[0].id !== item.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete tags first
    await db.delete(itemTags)
      .where(eq(itemTags.itemId, id));

    // Delete the item
    await deleteUserItem(id);

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Delete user item error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}