import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  courses,
  chapters,
  lessons,
  quizzes,
  questions,
  flashCards,
  enrollments,
  quizAttempts,
  quizAnswers,
  flashCardReviews,
  evaluationStats
} from '@/lib/db/queries';
import { eq, and, inArray } from 'drizzle-orm';

// GET /api/courses/[courseId]/evaluations - Get evaluation stats and available content
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

    // Get course
    const courseResults = await db.select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    const course = courseResults[0];

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in the course
    const enrollmentResults = await db.select()
      .from(enrollments)
      .where(and(
        eq(enrollments.userId, user.id),
        eq(enrollments.courseId, course.id)
      ))
      .limit(1);

    const enrollment = enrollmentResults[0];

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Get user's evaluation stats
    const evaluationStatsResults = await db.select()
      .from(evaluationStats)
      .where(and(
        eq(evaluationStats.userId, user.id),
        eq(evaluationStats.courseId, course.id)
      ))
      .limit(1);

    const evaluationStats = evaluationStatsResults[0];

    // Get user's quiz attempts with related data
    const quizAttemptsData = await db.select({
      id: quizAttempts.id,
      userId: quizAttempts.userId,
      quizId: quizAttempts.quizId,
      score: quizAttempts.score,
      passed: quizAttempts.passed,
      startedAt: quizAttempts.startedAt,
      completedAt: quizAttempts.completedAt,
      timeSpent: quizAttempts.timeSpent,
      quizTitle: quizzes.title,
      chapterId: quizzes.chapterId,
      chapterTitle: chapters.title,
    })
      .from(quizAttempts)
      .leftJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .leftJoin(chapters, eq(quizzes.chapterId, chapters.id))
      .where(and(
        eq(quizAttempts.userId, user.id),
        eq(quizzes.courseId, course.id)
      ))
      .orderBy(quizAttempts.startedAt)
      .limit(50); // Limit for performance

    // Get quiz answers for each attempt
    const quizAttemptIds = quizAttemptsData.map(attempt => attempt.id);
    const quizAnswersData = quizAttemptIds.length > 0
      ? await db.select()
          .from(quizAnswers)
          .where(inArray(quizAnswers.attemptId, quizAttemptIds))
      : [];

    // Combine quiz attempts with their answers
    const quizAttempts = quizAttemptsData.map(attempt => ({
      ...attempt,
      answers: quizAnswersData.filter(answer => answer.attemptId === attempt.id)
    }));

    // Get user's flash card reviews
    const flashCardReviewsData = await db.select({
      id: flashCardReviews.id,
      userId: flashCardReviews.userId,
      flashCardId: flashCardReviews.flashCardId,
      quality: flashCardReviews.quality,
      reviewedAt: flashCardReviews.reviewedAt,
      flashCardCategory: flashCards.category,
      flashCardDifficulty: flashCards.difficulty,
      chapterId: flashCards.chapterId,
      chapterTitle: chapters.title,
    })
      .from(flashCardReviews)
      .leftJoin(flashCards, eq(flashCardReviews.flashCardId, flashCards.id))
      .leftJoin(chapters, eq(flashCards.chapterId, chapters.id))
      .where(and(
        eq(flashCardReviews.userId, user.id),
        eq(flashCards.courseId, course.id)
      ))
      .orderBy(flashCardReviews.reviewedAt)
      .limit(50); // Limit for performance

    const flashCardReviews = flashCardReviewsData;

    // Get course content data for statistics
    const courseChapters = await db.select({
      id: chapters.id,
      title: chapters.title,
      duration: chapters.duration,
    })
      .from(chapters)
      .where(eq(chapters.courseId, course.id));

    const chapterIds = courseChapters.map(chapter => chapter.id);

    // Get quiz count and questions
    const courseQuizzes = await db.select({
      id: quizzes.id,
      chapterId: quizzes.chapterId,
    })
      .from(quizzes)
      .where(and(
        eq(quizzes.courseId, course.id),
        eq(quizzes.isPublished, true)
      ));

    const quizIds = courseQuizzes.map(quiz => quiz.id);
    const courseQuestions = quizIds.length > 0
      ? await db.select()
          .from(questions)
          .where(inArray(questions.quizId, quizIds))
      : [];

    // Get flash cards count
    const courseFlashCards = await db.select({
      id: flashCards.id,
      chapterId: flashCards.chapterId,
    })
      .from(flashCards)
      .where(and(
        eq(flashCards.courseId, course.id),
        eq(flashCards.isPublished, true)
      ));

    // Calculate statistics
    const totalQuestions = courseQuestions.length;
    const correctAnswers = quizAttempts.reduce((sum, attempt) =>
      sum + attempt.answers.filter(answer => answer.isCorrect).length, 0
    );
    const averageScore = quizAttempts.length > 0
      ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length
      : 0;
    const bestScore = quizAttempts.length > 0
      ? Math.max(...quizAttempts.map(attempt => attempt.score))
      : 0;
    const totalTimeSpent = quizAttempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0);

    // Chapter-wise statistics
    const chapterStats = courseChapters.map(chapter => {
      const chapterQuizIds = courseQuizzes.filter(quiz => quiz.chapterId === chapter.id).map(q => q.id);
      const chapterQuizAttempts = quizAttempts.filter(attempt =>
        chapterQuizIds.includes(attempt.quizId)
      );
      const chapterFlashCards = flashCardReviews.filter(review =>
        review.chapterId === chapter.id
      );

      const chapterQuestions = courseQuestions.filter(question =>
        chapterQuizIds.includes(question.quizId)
      ).length;
      const chapterCorrect = chapterQuizAttempts.reduce((sum, attempt) =>
        sum + attempt.answers.filter(answer => answer.isCorrect).length, 0
      );
      const chapterAverageScore = chapterQuizAttempts.length > 0
        ? chapterQuizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / chapterQuizAttempts.length
        : 0;

      const chapterFlashCardCount = courseFlashCards.filter(fc => fc.chapterId === chapter.id).length;

      return {
        id: chapter.id,
        title: chapter.title,
        totalQuestions: chapterQuestions,
        correctAnswers: chapterCorrect,
        averageScore: chapterAverageScore,
        totalFlashCards: chapterFlashCardCount,
        reviewedFlashCards: chapterFlashCards.length,
        quizzesCount: courseQuizzes.filter(q => q.chapterId === chapter.id).length,
        completedQuizzes: chapterQuizAttempts.length,
        lessonsCount: 0, // TODO: Get lesson count if needed
        duration: chapter.duration
      };
    });

    const response = {
      success: true,
      data: {
        course: {
          id: course.id,
          title: course.title,
          subject: course.subject,
          difficulty: course.difficulty,
          chaptersCount: courseChapters.length,
          totalQuizzes: courseQuizzes.length,
          totalFlashCards: courseFlashCards.length,
          totalQuestions: totalQuestions
        },
        overallStats: {
          totalQuestions,
          correctAnswers,
          averageScore,
          bestScore,
          totalTimeSpent,
          totalQuizAttempts: quizAttempts.length,
          totalFlashCardReviews: flashCardReviews.length,
          lastStudiedAt: evaluationStats?.lastStudiedAt || null,
          streakDays: evaluationStats?.streakDays || 0
        },
        chapterStats,
        recentActivity: {
          quizAttempts: quizAttempts.slice(0, 5).map(attempt => ({
            id: attempt.id,
            quizTitle: attempt.quizTitle || 'Quiz',
            chapterTitle: attempt.chapterTitle || 'Course Quiz',
            score: attempt.score,
            passed: attempt.passed,
            completedAt: attempt.completedAt,
            timeSpent: attempt.timeSpent
          })),
          flashCardReviews: flashCardReviews.slice(0, 5).map(review => ({
            id: review.id,
            flashCardId: review.flashCardId,
            category: review.flashCardCategory || 'General',
            difficulty: review.flashCardDifficulty || 'medium',
            quality: review.quality,
            reviewedAt: review.reviewedAt
          }))
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get evaluations error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/evaluations - Update evaluation stats
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
    const { type, data } = body;

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

    // Update or create evaluation stats
    if (type === 'quiz_completed') {
      const { score, timeSpent, passed } = data;

      // Check if stats already exist
      const existingStats = await db.select()
        .from(evaluationStats)
        .where(and(
          eq(evaluationStats.userId, user.id),
          eq(evaluationStats.courseId, courseId)
        ))
        .limit(1);

      if (existingStats.length > 0) {
        // Update existing stats
        const currentStats = existingStats[0];
        await db.update(evaluationStats)
          .set({
            totalQuestions: currentStats.totalQuestions + 1,
            correctAnswers: currentStats.correctAnswers + (passed ? 1 : 0),
            totalTimeSpent: currentStats.totalTimeSpent + timeSpent,
            averageScore: score, // Simplified - would need proper recalculation
            bestScore: Math.max(score, currentStats.bestScore),
            lastStudiedAt: new Date(),
            updatedAt: new Date()
          })
          .where(and(
            eq(evaluationStats.userId, user.id),
            eq(evaluationStats.courseId, courseId)
          ));
      } else {
        // Create new stats
        await db.insert(evaluationStats)
          .values({
            userId: user.id,
            courseId: courseId,
            totalQuestions: 1,
            correctAnswers: passed ? 1 : 0,
            totalTimeSpent: timeSpent,
            averageScore: score,
            bestScore: score,
            lastStudiedAt: new Date()
          });
      }
    } else if (type === 'flashcard_reviewed') {
      // Check if stats already exist
      const existingStats = await db.select()
        .from(evaluationStats)
        .where(and(
          eq(evaluationStats.userId, user.id),
          eq(evaluationStats.courseId, courseId)
        ))
        .limit(1);

      if (existingStats.length > 0) {
        // Update existing stats
        await db.update(evaluationStats)
          .set({
            lastStudiedAt: new Date(),
            updatedAt: new Date()
          })
          .where(and(
            eq(evaluationStats.userId, user.id),
            eq(evaluationStats.courseId, courseId)
          ));
      } else {
        // Create new stats
        await db.insert(evaluationStats)
          .values({
            userId: user.id,
            courseId: courseId,
            lastStudiedAt: new Date()
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Evaluation stats updated successfully'
    });
  } catch (error) {
    console.error('Update evaluations error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}