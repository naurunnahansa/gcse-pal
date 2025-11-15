import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  courses,
  flashCards,
  enrollments
} from '@/lib/db/queries';
import { eq, and, ilike } from 'drizzle-orm';

// GET /api/courses/[courseId]/flashcards - Get flash cards for a course
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await params;
    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get('chapterId');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Get user from database
    const userResults = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    const user = userResults[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in the course
    const enrollmentResults = await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.userId, user.id),
        eq(enrollments.courseId, courseId)
      ))
      .limit(1);

    const enrollment = enrollmentResults[0];

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Build the where clause for filtering
    const whereClause: any = {
      isPublished: true,
      OR: [
        { courseId: courseId },
        {
          chapter: {
            courseId: courseId
          }
        }
      ]
    };

    if (chapterId) {
      whereClause.chapterId = chapterId;
    }

    if (category) {
      whereClause.category = category;
    }

    if (difficulty) {
      whereClause.difficulty = difficulty.toLowerCase();
    }

    // Get flash cards with user's review status
    const flashCards = await prisma.flashCard.findMany({
      where: whereClause,
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            order: true
          }
        },
        reviews: {
          where: {
            userId: user.id
          },
          select: {
            quality: true,
            easeFactor: true,
            interval: true,
            repetitions: true,
            reviewedAt: true,
            nextReview: true
          }
        }
      },
      orderBy: [
        { chapter: { order: 'asc' } },
        { createdAt: 'asc' }
      ],
      take: limit
    });

    // Format the response
    const formattedFlashCards = flashCards.map(card => ({
      id: card.id,
      front: card.front,
      back: card.back,
      category: card.category,
      difficulty: card.difficulty,
      tags: card.tags,
      chapter: card.chapter,
      reviewStatus: card.reviews[0] || null,
      needsReview: card.reviews[0] ?
        new Date() > new Date(card.reviews[0].nextReview) : true
    }));

    // Get available categories and difficulties for filters
    const categories = await prisma.flashCard.findMany({
      where: {
        isPublished: true,
        OR: [
          { courseId: courseId },
          {
            chapter: {
              courseId: courseId
            }
          }
        ]
      },
      select: {
        category: true
      },
      distinct: ['category']
    });

    const difficulties = await prisma.flashCard.findMany({
      where: {
        isPublished: true,
        OR: [
          { courseId: courseId },
          {
            chapter: {
              courseId: courseId
            }
          }
        ]
      },
      select: {
        difficulty: true
      },
      distinct: ['difficulty']
    });

    const response = {
      success: true,
      data: {
        flashCards: formattedFlashCards,
        filters: {
          categories: categories.map(c => c.category),
          difficulties: difficulties.map(d => d.difficulty),
        },
        stats: {
          totalCards: formattedFlashCards.length,
          reviewedCards: formattedFlashCards.filter(card => card.reviewStatus).length,
          cardsNeedingReview: formattedFlashCards.filter(card => card.needsReview).length
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get flash cards error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/flashcards - Create new flash card (admin/teacher only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await params;
    const body = await req.json();
    const { front, back, category, difficulty, tags, chapterId, isPublished } = body;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or teacher
    if (user.role === 'student') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!front || !back || !category) {
      return NextResponse.json(
        { success: false, error: 'Front, back, and category are required' },
        { status: 400 }
      );
    }

    // Create flash card
    const flashCard = await prisma.flashCard.create({
      data: {
        front,
        back,
        category,
        difficulty: difficulty || 'beginner',
        tags: tags || [],
        chapterId: chapterId || null,
        courseId: chapterId ? null : courseId,
        isPublished: isPublished || false
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: flashCard
    });
  } catch (error) {
    console.error('Create flash card error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}