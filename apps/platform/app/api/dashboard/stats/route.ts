import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { ensureUserExists } from '@/lib/user-sync';

// GET /api/dashboard/stats - Get user dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user exists in our database (creates if doesn't exist)
    const userRecord = await ensureUserExists();

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get basic statistics
    const [
      totalCoursesEnrolled,
      coursesCompleted,
      totalStudyTime,
      averageQuizScores,
      recentActivity,
      upcomingDeadlines,
    ] = await Promise.all([
      // Total enrolled courses
      prisma.enrollment.count({
        where: { userId: user.id },
      }),

      // Completed courses
      prisma.enrollment.count({
        where: {
          userId: user.id,
          status: 'completed',
        },
      }),

      // Total study time in minutes
      prisma.studySession.aggregate({
        where: { userId: user.id },
        _sum: { duration: true },
      }),

      // Average quiz scores
      prisma.quizAttempt.aggregate({
        where: { userId: user.id },
        _avg: { score: true },
      }),

      // Recent activity (last 7 days)
      prisma.studySession.findMany({
        where: {
          userId: user.id,
          startTime: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              subject: true,
            },
          },
          lesson: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { startTime: 'desc' },
        take: 10,
      }),

      // Upcoming deadlines (tasks with due dates in next 30 days)
      prisma.task.findMany({
        where: {
          userId: user.id,
          dueDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
            gte: new Date(),
          },
          status: 'pending',
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
    ]);

    // Get current study streak
    const studySessions = await prisma.studySession.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: { startTime: 'desc' },
    });

    const currentStreak = calculateStudyStreak(studySessions);

    // Get weekly progress
    const weeklyGoal = await prisma.userSettings.findUnique({
      where: { userId: user.id },
      select: { dailyGoal: true },
    });

    const weeklyStudyTime = await prisma.studySession.aggregate({
      where: {
        userId: user.id,
        startTime: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      _sum: { duration: true },
    });

    // Get subject distribution
    const subjectProgress = await prisma.progress.groupBy({
      by: ['courseId'],
      where: {
        userId: user.id,
        status: 'completed',
      },
      _count: true,
    });

    const courseIds = subjectProgress.map(p => p.courseId);
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
      },
      select: {
        id: true,
        subject: true,
      },
    });

    const subjectStats = courses.reduce((acc: Record<string, number>, course) => {
      const subject = course.subject;
      const progressCount = subjectProgress.find(p => p.courseId === course.id)?._count || 0;
      acc[subject] = (acc[subject] || 0) + progressCount;
      return acc;
    }, {});

    // Calculate weekly goal progress
    const weeklyTarget = (weeklyGoal?.dailyGoal || 60) * 7; // 7 days
    const weeklyCurrent = weeklyStudyTime._sum.duration || 0;
    const weeklyProgressPercentage = weeklyTarget > 0 ? (weeklyCurrent / weeklyTarget) * 100 : 0;

    // Get enrolled courses for dashboard
    const enrolledCourses = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            subject: true,
            level: true,
            thumbnail: true,
            difficulty: true,
            duration: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 3, // Show only last 3 enrolled courses
    });

    const dashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      progress: {
        totalCoursesEnrolled,
        coursesCompleted,
        totalStudyTime: totalStudyTime._sum.duration || 0,
        averageQuizScore: averageQuizScores._avg.score || 0,
        currentStreak,
        weeklyGoal: {
          target: weeklyTarget,
          current: weeklyCurrent,
          percentage: Math.round(weeklyProgressPercentage),
        },
      },
      recentActivity: recentActivity.map(session => ({
        id: session.id,
        type: session.lessonId ? 'lesson' : 'course',
        course: session.course,
        lesson: session.lesson,
        startTime: session.startTime,
        duration: session.duration,
      })),
      upcomingDeadlines: upcomingDeadlines.map(task => ({
        id: task.id,
        title: task.title,
        course: task.course,
        priority: task.priority,
        dueDate: task.dueDate,
      })),
      subjectDistribution: subjectStats,
      enrolledCourses: enrolledCourses.map(enrollment => ({
        ...enrollment.course,
        enrollment: {
          id: enrollment.id,
          progress: enrollment.progress,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
        },
      })),
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate study streak
function calculateStudyStreak(sessions: any[]): number {
  if (sessions.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  // Create a set of study session dates
  const studyDates = new Set(
    sessions.map(session => {
      const date = new Date(session.startTime);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  // Calculate consecutive days
  while (studyDates.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}