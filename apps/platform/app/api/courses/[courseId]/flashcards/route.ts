import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  courses,
  chapters,
  flashCards,
  flashCardReviews,
  enrollments
} from '@/lib/db/queries';
import { eq, and, or, desc, asc, inArray } from 'drizzle-orm';

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
    // Get flashcards directly or through chapters that belong to this course
    const flashCardsQuery = db.select({
      id: flashCards.id,
      front: flashCards.front,
      back: flashCards.back,
      category: flashCards.category,
      difficulty: flashCards.difficulty,
      tags: flashCards.tags,
      courseId: flashCards.courseId,
      chapterId: flashCards.chapterId,
      isPublished: flashCards.isPublished,
      createdAt: flashCards.createdAt,
      updatedAt: flashCards.updatedAt,
      // Chapter information
      chapter: {
        id: chapters.id,
        title: chapters.title,
        order: chapters.order
      }
    })
      .from(flashCards)
      .leftJoin(chapters, eq(flashCards.chapterId, chapters.id))
      .where(and(
        eq(flashCards.isPublished, true),
        or(
          eq(flashCards.courseId, courseId),
          eq(chapters.courseId, courseId)
        ),
        chapterId ? eq(flashCards.chapterId, chapterId) : undefined,
        category ? eq(flashCards.category, category) : undefined,
        difficulty ? eq(flashCards.difficulty, difficulty.toLowerCase() as any) : undefined
      ))
      .orderBy(asc(chapters.order), asc(flashCards.createdAt));

    if (limit) {
      flashCardsQuery.limit(limit);
    }

    const flashCardsData = await flashCardsQuery;

    // Get user's review status for each flashcard
    const flashCardIds = flashCardsData.map(card => card.id);
    let reviewData = [];
    if (flashCardIds.length > 0) {
      reviewData = await db.select()
        .from(flashCardReviews)
        .where(and(
          eq(flashCardReviews.userId, user.id),
          inArray(flashCardReviews.flashCardId, flashCardIds)
        ));
    }

    // Format the response
    const formattedFlashCards = flashCardsData.map(card => {
      // Find the review for this card
      const review = reviewData.find(r => r.flashCardId === card.id);
      return {
        id: card.id,
        front: card.front,
        back: card.back,
        category: card.category,
        difficulty: card.difficulty,
        tags: card.tags,
        chapter: card.chapter,
        reviewStatus: review || null,
        needsReview: review ? new Date() > new Date(review.nextReview) : true
      };
    });

    // Get available categories and difficulties for filters
    const categoriesQuery = db.select({ category: flashCards.category })
      .from(flashCards)
      .leftJoin(chapters, eq(flashCards.chapterId, chapters.id))
      .where(and(
        eq(flashCards.isPublished, true),
        or(
          eq(flashCards.courseId, courseId),
          eq(chapters.courseId, courseId)
        )
      ));

    const difficultiesQuery = db.select({ difficulty: flashCards.difficulty })
      .from(flashCards)
      .leftJoin(chapters, eq(flashCards.chapterId, chapters.id))
      .where(and(
        eq(flashCards.isPublished, true),
        or(
          eq(flashCards.courseId, courseId),
          eq(chapters.courseId, courseId)
        )
      ));

    const categories = await categoriesQuery;
    const difficulties = await difficultiesQuery;

    // Get distinct values
    const uniqueCategories = Array.from(new Set(categories.map(c => c.category).filter(Boolean)));
    const uniqueDifficulties = Array.from(new Set(difficulties.map(d => d.difficulty).filter(Boolean)));

    const response = {
      success: true,
      data: {
        flashCards: formattedFlashCards,
        filters: {
          categories: uniqueCategories,
          difficulties: uniqueDifficulties,
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
    const flashCardResults = await db.insert(flashCards)
      .values({
        front,
        back,
        category,
        difficulty: difficulty || 'beginner',
        tags: tags || [],
        chapterId: chapterId || null,
        courseId: chapterId ? null : courseId,
        isPublished: isPublished || false
      })
      .returning();

    const flashCard = flashCardResults[0];

    // Get chapter information if chapterId is provided
    let chapterInfo = null;
    if (flashCard.chapterId) {
      const chapterResults = await db.select({
        id: chapters.id,
        title: chapters.title
      })
        .from(chapters)
        .where(eq(chapters.id, flashCard.chapterId))
        .limit(1);

      chapterInfo = chapterResults[0] || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...flashCard,
        chapter: chapterInfo
      }
    });
  } catch (error) {
    console.error('Create flash card error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}