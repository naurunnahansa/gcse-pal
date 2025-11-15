import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  courses,
  chapters,
  quizzes,
  questions,
  quizAttempts,
  quizAnswers,
  evaluationStats,
  enrollments,
  findUserByClerkId,
  findEnrollment
} from '@/lib/db/queries';
import { eq, and, or, desc, asc, sql } from 'drizzle-orm';

// GET /api/courses/[courseId]/quiz - Get quiz questions for a course
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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const includeAnswered = searchParams.get('includeAnswered') === 'true';

    // Get user from database
    const user = await findUserByClerkId(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await findEnrollment(user.id, courseId);

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Build the where clause
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

    // Get quizzes with questions
    const quizzes = await db.quiz.findMany({
      where: whereClause,
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            order: true
          }
        },
        questions: {
          orderBy: {
            order: 'asc'
          }
        },
        attempts: {
          where: {
            userId: user.id
          },
          select: {
            id: true,
            score: true,
            passed: true,
            startedAt: true,
            completedAt: true,
            timeSpent: true,
            attemptNumber: true
          },
          orderBy: {
            startedAt: 'desc'
          }
        }
      },
      orderBy: [
        { chapter: { order: 'asc' } },
        { createdAt: 'asc' }
      ]
    });

    // Format questions and check if they've been answered
    const formattedQuestions = [];
    const userAttempts = [];

    for (const quiz of quizzes) {
      // Add quiz info to attempts
      for (const attempt of quiz.attempts) {
        userAttempts.push({
          id: attempt.id,
          quizId: quiz.id,
          quizTitle: quiz.title,
          chapterTitle: quiz.chapter?.title || 'Course Quiz',
          score: attempt.score,
          passed: attempt.passed,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt,
          timeSpent: attempt.timeSpent,
          attemptNumber: attempt.attemptNumber
        });
      }

      // Add questions
      for (const question of quiz.questions) {
        // Check if this question has been answered in the most recent attempt
        const mostRecentAttempt = quiz.attempts[0];
        let isAnswered = false;
        let userAnswer = null;
        let isCorrect = false;

        if (mostRecentAttempt) {
          const answer = await db.quizAnswer.findFirst({
            where: {
              attemptId: mostRecentAttempt.id,
              questionId: question.id
            }
          });

          if (answer) {
            isAnswered = true;
            userAnswer = answer.userAnswer;
            isCorrect = answer.isCorrect;
          }
        }

        // Skip answered questions if not including them
        if (!includeAnswered && isAnswered) {
          continue;
        }

        formattedQuestions.push({
          id: question.id,
          quizId: quiz.id,
          quizTitle: quiz.title,
          chapterTitle: quiz.chapter?.title || 'Course Quiz',
          type: question.type,
          question: question.question,
          options: question.options ? JSON.parse(question.options) : null,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          points: question.points,
          order: question.order,
          isAnswered,
          userAnswer,
          isCorrect
        });
      }
    }

    // Apply limit if specified
    const limitedQuestions = limit ? formattedQuestions.slice(0, limit) : formattedQuestions;

    // Get quiz statistics
    const totalQuizzes = quizzes.length;
    const attemptedQuizzes = quizzes.filter(quiz => quiz.attempts.length > 0).length;
    const passedQuizzes = quizzes.filter(quiz =>
      quiz.attempts.some(attempt => attempt.passed)
    ).length;
    const averageScore = attemptedQuizzes > 0
      ? userAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / userAttempts.length
      : 0;

    const response = {
      success: true,
      data: {
        questions: limitedQuestions,
        stats: {
          totalQuizzes,
          attemptedQuizzes,
          passedQuizzes,
          averageScore,
          totalQuestions: limitedQuestions.length,
          answeredQuestions: limitedQuestions.filter(q => q.isAnswered).length,
          correctAnswers: limitedQuestions.filter(q => q.isCorrect).length
        },
        recentAttempts: userAttempts.slice(0, 5)
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get quiz questions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/quiz - Submit quiz attempt
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
    const { quizId, answers, timeSpent } = body;

    // Get user from database
    const user = await findUserByClerkId(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await findEnrollment(user.id, courseId);

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Get quiz
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Calculate attempt number
    const existingAttempts = await db.quizAttempt.count({
      where: {
        userId: user.id,
        quizId: quizId
      }
    });

    if (existingAttempts >= quiz.maxAttempts) {
      return NextResponse.json(
        { success: false, error: 'Maximum attempts reached' },
        { status: 400 }
      );
    }

    // Calculate score
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const quizAnswers = [];

    for (const question of quiz.questions) {
      const userAnswer = answers[question.id];
      const isCorrect = checkAnswer(question, userAnswer);

      totalPoints += question.points;
      if (isCorrect) {
        correctCount++;
        earnedPoints += question.points;
      }

      quizAnswers.push({
        questionId: question.id,
        userAnswer: String(userAnswer),
        isCorrect,
        points: isCorrect ? question.points : 0
      });
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = score >= quiz.passingScore;

    // Create quiz attempt
    const attempt = await db.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: quizId,
        score,
        passed,
        timeSpent,
        attemptNumber: existingAttempts + 1,
        completedAt: new Date()
      }
    });

    // Create quiz answers
    await db.quizAnswer.createMany({
      data: quizAnswers.map(answer => ({
        attemptId: attempt.id,
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect: answer.isCorrect,
        points: answer.points
      }))
    });

    // Update evaluation stats
    await db.evaluationStats.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      },
      update: {
        totalQuestions: { increment: quiz.questions.length },
        correctAnswers: { increment: correctCount },
        totalTimeSpent: { increment: timeSpent },
        averageScore: score,
        bestScore: Math.max(score, await db.evaluationStats.findUnique({
          where: { userId_courseId: { userId: user.id, courseId } }
        }).then(stats => stats?.bestScore || 0)),
        lastStudiedAt: new Date()
      },
      create: {
        userId: user.id,
        courseId: courseId,
        totalQuestions: quiz.questions.length,
        correctAnswers: correctCount,
        totalTimeSpent: timeSpent,
        averageScore: score,
        bestScore: score,
        lastStudiedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        score,
        passed,
        correctCount,
        totalQuestions: quiz.questions.length,
        earnedPoints,
        totalPoints,
        timeSpent,
        attemptNumber: existingAttempts + 1,
        answers: quizAnswers.map(answer => ({
          questionId: answer.questionId,
          isCorrect: answer.isCorrect,
          userAnswer: answer.userAnswer
        }))
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function checkAnswer(question: any, userAnswer: any): boolean {
  if (userAnswer === undefined || userAnswer === null) {
    return false;
  }

  switch (question.type) {
    case 'multiple_choice':
      return parseInt(userAnswer) === parseInt(question.correctAnswer);
    case 'true_false':
      return userAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
    case 'short_answer':
      // Simple exact match for now - could be enhanced with fuzzy matching
      return userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    default:
      return false;
  }
}