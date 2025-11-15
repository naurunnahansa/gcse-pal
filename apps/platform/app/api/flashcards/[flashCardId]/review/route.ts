import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  courses,
  chapters,
  flashCards,
  flashCardReviews,
  evaluationStats,
  enrollments,
  findUserByClerkId,
  findEnrollment
} from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

// POST /api/flashcards/[flashCardId]/review - Record flash card review
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ flashCardId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { flashCardId } = await params;
    const body = await req.json();
    const { quality } = body;

    // Get user from database
    const user = await findUserByClerkId(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get flash card
    const flashCardResult = await db.select({
      id: flashCards.id,
      courseId: flashCards.courseId,
      chapterId: flashCards.chapterId,
      front: flashCards.front,
      back: flashCards.back,
      tags: flashCards.tags,
      difficulty: flashCards.difficulty,
    })
      .from(flashCards)
      .where(eq(flashCards.id, flashCardId))
      .limit(1);

    if (flashCardResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Flash card not found' },
        { status: 404 }
      );
    }

    const flashCard = flashCardResult[0];

    // Check if user is enrolled in the course
    const enrollment = await findEnrollment(user.id, flashCard.courseId!);

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Validate quality
    const validQualities = ['again', 'hard', 'good', 'easy'];
    if (!validQualities.includes(quality)) {
      return NextResponse.json(
        { success: false, error: 'Invalid quality rating' },
        { status: 400 }
      );
    }

    // Get existing review
    const existingReviewResult = await db.select()
      .from(flashCardReviews)
      .where(and(
        eq(flashCardReviews.userId, user.id),
        eq(flashCardReviews.flashCardId, flashCardId)
      ))
      .limit(1);

    const existingReview = existingReviewResult[0] || null;

    // Calculate new values using SM-2 algorithm
    let newEaseFactor, newInterval, newRepetitions, nextReviewDate;

    if (existingReview) {
      const { easeFactor, interval, repetitions } = existingReview;

      // Map quality to numeric value
      const qualityMap = { again: 0, hard: 1, good: 3, easy: 5 };
      const qualityValue = qualityMap[quality as keyof typeof qualityMap];

      newRepetitions = qualityValue >= 3 ? repetitions + 1 : 0;

      if (newRepetitions === 1) {
        newInterval = 1;
        newEaseFactor = easeFactor + (0.1 - (5 - qualityValue) * (0.08 + (5 - qualityValue) * 0.02));
      } else if (newRepetitions === 2) {
        newInterval = 6;
        newEaseFactor = easeFactor + (0.1 - (5 - qualityValue) * (0.08 + (5 - qualityValue) * 0.02));
      } else {
        newInterval = Math.round(interval * (easeFactor + 0.1 - (5 - qualityValue) * (0.08 + (5 - qualityValue) * 0.02)));
        newEaseFactor = easeFactor + (0.1 - (5 - qualityValue) * (0.08 + (5 - qualityValue) * 0.02));
      }

      newEaseFactor = Math.max(1.3, newEaseFactor);
      nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

      // Update existing review
      await db.update(flashCardReviews)
        .set({
          quality: quality as any,
          easeFactor: newEaseFactor,
          interval: newInterval,
          repetitions: newRepetitions,
          reviewedAt: new Date(),
          nextReview: nextReviewDate
        })
        .where(and(
          eq(flashCardReviews.userId, user.id),
          eq(flashCardReviews.flashCardId, flashCardId)
        ));
    } else {
      // Create new review
      newRepetitions = quality === 'again' ? 0 : 1;
      newInterval = quality === 'again' ? 1 : quality === 'hard' ? 1 : quality === 'good' ? 1 : 4;
      newEaseFactor = 2.5;

      if (quality === 'hard') {
        newEaseFactor = 2.0;
      } else if (quality === 'easy') {
        newEaseFactor = 2.6;
      }

      nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

      await db.insert(flashCardReviews)
        .values({
          userId: user.id,
          flashCardId: flashCardId,
          quality: quality as any,
          easeFactor: newEaseFactor,
          interval: newInterval,
          repetitions: newRepetitions,
          reviewedAt: new Date(),
          nextReview: nextReviewDate
        });
    }

    // Update evaluation stats
    const existingStatsResult = await db.select()
      .from(evaluationStats)
      .where(and(
        eq(evaluationStats.userId, user.id),
        eq(evaluationStats.courseId, flashCard.courseId!)
      ))
      .limit(1);

    if (existingStatsResult.length > 0) {
      await db.update(evaluationStats)
        .set({
          lastStudiedAt: new Date()
        })
        .where(and(
          eq(evaluationStats.userId, user.id),
          eq(evaluationStats.courseId, flashCard.courseId!)
        ));
    } else {
      await db.insert(evaluationStats)
        .values({
          userId: user.id,
          courseId: flashCard.courseId!,
          lastStudiedAt: new Date()
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        quality,
        easeFactor: newEaseFactor,
        interval: newInterval,
        repetitions: newRepetitions,
        nextReview: nextReviewDate
      }
    });
  } catch (error) {
    console.error('Flash card review error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}