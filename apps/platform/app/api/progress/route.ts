import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { ensureUserExists } from '@/lib/user-sync';

// GET /api/progress - Get comprehensive progress data for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user exists in our database
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

    // Get user settings for daily goals
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    // Get all progress data in parallel for better performance
    const [
      overallStats,
      subjectProgress,
      weeklyActivity,
      recentProgress,
      recentQuizAttempts,
      achievements,
      studyStreak
    ] = await Promise.all([
      // Overall statistics
      getOverallStats(user.id),
      // Subject-wise progress
      getSubjectProgress(user.id),
      // Weekly activity data
      getWeeklyActivity(user.id),
      // Recent progress/milestones
      getRecentProgress(user.id),
      // Recent quiz attempts
      getRecentQuizAttempts(user.id),
      // User achievements (mock for now, can be implemented later)
      getAchievements(user.id),
      // Study streak calculation
      getStudyStreak(user.id)
    ]);

    const progressData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      overallStats: {
        totalStudyTime: Math.round(overallStats.totalStudyTime / 60), // Convert minutes to hours
        weeklyGoal: userSettings?.dailyGoal || 60, // minutes per day
        weeklyProgress: overallStats.weeklyStudyTime, // minutes
        totalQuestions: overallStats.totalQuestions,
        accuracyRate: overallStats.averageScore || 0,
        streak: studyStreak,
        subjectsStudied: subjectProgress.length,
      },
      subjectProgress,
      weeklyActivity,
      achievements,
      recentMilestones: recentProgress,
    };

    return NextResponse.json({
      success: true,
      data: progressData,
    });
  } catch (error) {
    console.error('Get progress data error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get overall statistics
async function getOverallStats(userId: string) {
  const [
    totalStudyTime,
    weeklyStudyTime,
    totalQuestions,
    averageScore,
    enrollments
  ] = await Promise.all([
    // Total study time (all time)
    prisma.studySession.aggregate({
      where: { userId },
      _sum: { duration: true },
    }),
    // Weekly study time (last 7 days)
    prisma.studySession.aggregate({
      where: {
        userId,
        startTime: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { duration: true },
    }),
    // Total quiz questions attempted
    prisma.quizAttempt.count({
      where: { userId },
    }),
    // Average quiz score
    prisma.quizAttempt.aggregate({
      where: { userId },
      _avg: { score: true },
    }),
    // Number of enrolled courses
    prisma.enrollment.count({
      where: { userId },
    }),
  ]);

  return {
    totalStudyTime: totalStudyTime._sum.duration || 0,
    weeklyStudyTime: weeklyStudyTime._sum.duration || 0,
    totalQuestions,
    averageScore: averageScore._avg.score || 0,
    enrollments,
  };
}

// Helper function to get subject-wise progress
async function getSubjectProgress(userId: string) {
  // Get progress by subject through courses
  const progressByCourse = await prisma.progress.groupBy({
    by: ['courseId'],
    where: {
      userId,
      status: 'completed',
    },
    _count: true,
  });

  const courseIds = progressByCourse.map(p => p.courseId);
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: {
      id: true,
      subject: true,
    },
  });

  // Get study time and quiz stats per subject
  const subjectStats = await prisma.studySession.groupBy({
    by: ['courseId'],
    where: { userId },
    _sum: { duration: true },
    _count: true,
  });

  const quizStats = await prisma.quizAttempt.groupBy({
    by: ['quizId'],
    where: { userId },
    _avg: { score: true },
  });

  // Combine all data by subject
  const subjectProgressMap = new Map();

  // Initialize with enrolled courses
  courses.forEach(course => {
    if (!subjectProgressMap.has(course.subject)) {
      subjectProgressMap.set(course.subject, {
        id: course.subject,
        name: course.subject.charAt(0).toUpperCase() + course.subject.slice(1),
        progress: 0,
        totalTopics: 0,
        completedTopics: 0,
        studyTime: 0,
        questionsAnswered: 0,
        accuracy: 0,
        color: getSubjectColor(course.subject),
        icon: getSubjectIcon(course.subject),
      });
    }
  });

  // Update with progress data
  progressByCourse.forEach(progress => {
    const course = courses.find(c => c.id === progress.courseId);
    if (course) {
      const subject = subjectProgressMap.get(course.subject);
      if (subject) {
        subject.completedTopics += progress._count;
      }
    }
  });

  // Update with study time data
  subjectStats.forEach(stat => {
    const course = courses.find(c => c.id === stat.courseId);
    if (course) {
      const subject = subjectProgressMap.get(course.subject);
      if (subject) {
        subject.studyTime += Math.round((stat._sum.duration || 0) / 60); // Convert to hours
      }
    }
  });

  // Calculate progress percentages and total topics
  const totalTopicsByCourse = await prisma.lesson.count({
    where: {
      chapter: {
        course: {
          enrollments: {
            some: { userId }
          }
        }
      }
    }
  });

  subjectProgressMap.forEach(subject => {
    subject.totalTopics = totalTopicsByCourse;
    subject.progress = subject.totalTopics > 0
      ? Math.round((subject.completedTopics / subject.totalTopics) * 100)
      : 0;
    subject.questionsAnswered = quizStats.length;
    subject.accuracy = quizStats.length > 0
      ? Math.round((quizStats.reduce((sum, stat) => sum + (stat._avg.score || 0), 0) / quizStats.length) * 100)
      : 0;
  });

  return Array.from(subjectProgressMap.values());
}

// Helper function to get weekly activity
async function getWeeklyActivity(userId: string) {
  const weeklyActivity = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const [studyTime, sessionCount, questionCount] = await Promise.all([
      // Study time for this day
      prisma.studySession.aggregate({
        where: {
          userId,
          startTime: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: { duration: true },
        _count: true,
      }),
      // Session count
      prisma.studySession.count({
        where: {
          userId,
          startTime: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
      // Questions answered on this day
      prisma.quizAttempt.count({
        where: {
          userId,
          startedAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
    ]);

    weeklyActivity.push({
      day: date.toLocaleDateString('en', { weekday: 'short' }),
      hours: Math.round((studyTime._sum.duration || 0) / 60 * 10) / 10, // Round to 1 decimal
      topics: sessionCount,
      questions: questionCount,
    });
  }

  return weeklyActivity;
}

// Helper function to get recent progress/milestones
async function getRecentProgress(userId: string) {
  const [
    recentLessons,
    recentQuizzes,
    recentTasks
  ] = await Promise.all([
    // Recent completed lessons
    prisma.progress.findMany({
      where: {
        userId,
        status: 'completed',
        completedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        lesson: {
          include: {
            chapter: {
              include: {
                course: {
                  select: { subject: true }
                }
              }
            }
          }
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    }),
    // Recent quiz attempts
    prisma.quizAttempt.findMany({
      where: {
        userId,
        completedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        quiz: {
          include: {
            course: {
              select: { subject: true }
            }
          }
        }
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    }),
    // Recent completed tasks
    prisma.task.findMany({
      where: {
        userId,
        status: 'completed',
        completedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        course: {
          select: { subject: true }
        }
      },
      orderBy: { completedAt: 'desc' },
      take: 3,
    }),
  ]);

  const milestones = [];

  // Add lesson completions
  recentLessons.forEach(progress => {
    if (progress.lesson) {
      milestones.push({
        type: 'topic-completed',
        title: `Completed ${progress.lesson.title}`,
        subject: progress.lesson.chapter?.course?.subject || 'General',
        date: formatRelativeTime(progress.completedAt!),
        icon: 'CheckCircle',
      });
    }
  });

  // Add quiz scores
  recentQuizzes.forEach(attempt => {
    if (attempt.score >= 90) {
      milestones.push({
        type: 'quiz-score',
        title: `Scored ${Math.round(attempt.score)}% on ${attempt.quiz.title}`,
        subject: attempt.quiz.course?.subject || 'General',
        date: formatRelativeTime(attempt.completedAt!),
        icon: 'Target',
      });
    }
  });

  // Add task completions
  recentTasks.forEach(task => {
    milestones.push({
      type: 'task-completed',
      title: `Completed task: ${task.title}`,
      subject: task.course?.subject || 'General',
      date: formatRelativeTime(task.completedAt!),
      icon: 'CheckCircle',
    });
  });

  return milestones.slice(0, 10); // Limit to 10 most recent
}

// Helper function to get quiz attempts
async function getRecentQuizAttempts(userId: string) {
  return await prisma.quizAttempt.findMany({
    where: { userId },
    include: {
      quiz: {
        include: {
          course: {
            select: { subject: true }
          }
        }
      }
    },
    orderBy: { completedAt: 'desc' },
    take: 10,
  });
}

// Helper function to get achievements (mock for now)
async function getAchievements(userId: string) {
  const [totalQuizzes, totalStudyTime, completedCourses] = await Promise.all([
    prisma.quizAttempt.count({ where: { userId } }),
    prisma.studySession.aggregate({
      where: { userId },
      _sum: { duration: true },
    }),
    prisma.enrollment.count({
      where: { userId, status: 'completed' },
    }),
  ]);

  return [
    {
      id: 'first-quiz',
      title: 'Quiz Beginner',
      description: 'Complete your first flash quiz',
      earned: totalQuizzes > 0,
      earnedDate: totalQuizzes > 0 ? new Date().toISOString().split('T')[0] : null,
    },
    {
      id: 'week-streak',
      title: 'Week Warrior',
      description: 'Study for 7 days in a row',
      earned: false, // TODO: Implement streak calculation
      progress: 0,
    },
    {
      id: 'subject-master',
      title: 'Subject Master',
      description: 'Complete 100% of any subject',
      earned: false, // TODO: Implement subject mastery calculation
      progress: 0,
    },
    {
      id: 'quiz-champion',
      title: 'Quiz Champion',
      description: 'Score 90% or higher on 5 quizzes',
      earned: false, // TODO: Implement high score tracking
      progress: 0,
      total: 5,
    },
  ];
}

// Helper function to calculate study streak
async function getStudyStreak(userId: string): Promise<number> {
  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
      startTime: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    orderBy: { startTime: 'desc' },
  });

  if (sessions.length === 0) return 0;

  const studyDates = new Set(
    sessions.map(session => {
      const date = new Date(session.startTime);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  while (studyDates.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

// Helper functions for UI
function getSubjectColor(subject: string): string {
  const colors: Record<string, string> = {
    mathematics: 'bg-blue-500',
    english: 'bg-green-500',
    science: 'bg-purple-500',
    history: 'bg-orange-500',
    geography: 'bg-yellow-500',
    other: 'bg-gray-500',
  };
  return colors[subject] || 'bg-gray-500';
}

function getSubjectIcon(subject: string): string {
  const icons: Record<string, string> = {
    mathematics: 'BarChart3',
    english: 'BookOpen',
    science: 'Brain',
    history: 'Clock',
    geography: 'Map',
    other: 'BookOpen',
  };
  return icons[subject] || 'BookOpen';
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 0 && diffHours === 0) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} hours ago`;
  } else if (diffDays === 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}