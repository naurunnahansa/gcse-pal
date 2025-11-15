import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

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
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get course with related content
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            lessons: true,
            quizzes: {
              where: { isPublished: true },
              include: {
                questions: true
              }
            },
            flashCards: {
              where: { isPublished: true }
            }
          }
        },
        quizzes: {
          where: { isPublished: true },
          include: {
            questions: true
          }
        },
        flashCards: {
          where: { isPublished: true }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Get user's evaluation stats
    const evaluationStats = await prisma.evaluationStats.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    // Get user's quiz attempts
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
        quiz: {
          courseId: course.id
        }
      },
      include: {
        quiz: {
          include: {
            chapter: true
          }
        },
        answers: true
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    // Get user's flash card reviews
    const flashCardReviews = await prisma.flashCardReview.findMany({
      where: {
        userId: user.id,
        flashCard: {
          courseId: course.id
        }
      },
      include: {
        flashCard: {
          include: {
            chapter: true
          }
        }
      },
      orderBy: {
        reviewedAt: 'desc'
      }
    });

    // Calculate statistics
    const totalQuestions = course.quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
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
    const chapterStats = course.chapters.map(chapter => {
      const chapterQuizAttempts = quizAttempts.filter(attempt =>
        attempt.quiz.chapterId === chapter.id
      );
      const chapterFlashCards = flashCardReviews.filter(review =>
        review.flashCard.chapterId === chapter.id
      );

      const chapterQuestions = chapter.quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
      const chapterCorrect = chapterQuizAttempts.reduce((sum, attempt) =>
        sum + attempt.answers.filter(answer => answer.isCorrect).length, 0
      );
      const chapterAverageScore = chapterQuizAttempts.length > 0
        ? chapterQuizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / chapterQuizAttempts.length
        : 0;

      return {
        id: chapter.id,
        title: chapter.title,
        totalQuestions: chapterQuestions,
        correctAnswers: chapterCorrect,
        averageScore: chapterAverageScore,
        totalFlashCards: chapter.flashCards.length,
        reviewedFlashCards: chapterFlashCards.length,
        quizzesCount: chapter.quizzes.length,
        completedQuizzes: chapterQuizAttempts.length,
        lessonsCount: chapter.lessons.length,
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
          chaptersCount: course.chapters.length,
          totalQuizzes: course.quizzes.length,
          totalFlashCards: course.flashCards.length,
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
            quizTitle: attempt.quiz.title,
            chapterTitle: attempt.quiz.chapter?.title || 'Course Quiz',
            score: attempt.score,
            passed: attempt.passed,
            completedAt: attempt.completedAt,
            timeSpent: attempt.timeSpent
          })),
          flashCardReviews: flashCardReviews.slice(0, 5).map(review => ({
            id: review.id,
            flashCardId: review.flashCardId,
            category: review.flashCard.category,
            difficulty: review.flashCard.difficulty,
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
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Update or create evaluation stats
    if (type === 'quiz_completed') {
      const { score, timeSpent, passed } = data;

      await prisma.evaluationStats.upsert({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: courseId
          }
        },
        update: {
          totalQuestions: { increment: 1 },
          correctAnswers: passed ? { increment: 1 } : undefined,
          totalTimeSpent: { increment: timeSpent },
          averageScore: {
            // This would need to be recalculated properly
            set: score // Simplified for now
          },
          bestScore: score > (await prisma.evaluationStats.findUnique({
            where: { userId_courseId: { userId: user.id, courseId } }
          }))?.bestScore || 0 ? score : undefined,
          lastStudiedAt: new Date()
        },
        create: {
          userId: user.id,
          courseId: courseId,
          totalQuestions: 1,
          correctAnswers: passed ? 1 : 0,
          totalTimeSpent: timeSpent,
          averageScore: score,
          bestScore: score,
          lastStudiedAt: new Date()
        }
      });
    } else if (type === 'flashcard_reviewed') {
      await prisma.evaluationStats.upsert({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: courseId
          }
        },
        update: {
          lastStudiedAt: new Date()
        },
        create: {
          userId: user.id,
          courseId: courseId,
          lastStudiedAt: new Date()
        }
      });
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