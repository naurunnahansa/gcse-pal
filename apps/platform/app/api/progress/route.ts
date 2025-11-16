import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  enrollments,
  courses,
  lessons,
  progress,
  userItems,
  activityLog,
  quizSubmissions,
  chapters,
  tasks,
  quizzes,
  getUserActivityStats,
  getUserLearningProgress,
  getQuizStats
} from '@/lib/db';
import { eq, and, count, gte, lte, desc, inArray, lt } from 'drizzle-orm';
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

    const userResults = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    const user = userResults[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get user settings for daily goals from preferences
    const userPreferences = user.preferences || {};
    const userSettings = {
      dailyGoal: userPreferences.dailyGoal || 60,
      emailNotifications: userPreferences.emailNotifications ?? true,
      pushNotifications: userPreferences.pushNotifications ?? true,
      studyReminders: userPreferences.studyReminders ?? true
    };

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
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalStudyTime,
    weeklyStudyTime,
    totalQuestions,
    averageScore,
    enrollmentCount
  ] = await Promise.all([
    // Total study time (all time) - use activity_log table
    db.select({ totalDuration: { sum: activityLog.duration } })
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .then(result => result[0]?.totalDuration || 0),

    // Weekly study time (last 7 days) - use activity_log table
    db.select({ totalDuration: { sum: activityLog.duration } })
      .from(activityLog)
      .where(and(
        eq(activityLog.userId, userId),
        gte(activityLog.startedAt, sevenDaysAgo)
      ))
      .then(result => result[0]?.totalDuration || 0),

    // Total quiz questions attempted - use quiz_submissions table
    db.select({ count: count() })
      .from(quizSubmissions)
      .where(eq(quizSubmissions.userId, userId))
      .then(result => result[0]?.count || 0),

    // Average quiz score - use quiz_submissions table
    db.select({ avgScore: { avg: quizSubmissions.score } })
      .from(quizSubmissions)
      .where(eq(quizSubmissions.userId, userId))
      .then(result => result[0]?.avgScore || 0),

    // Number of enrolled courses
    db.select({ count: count() })
      .from(enrollments)
      .where(eq(enrollments.userId, userId))
      .then(result => result[0]?.count || 0)
  ]);

  return {
    totalStudyTime: totalStudyTime || 0,
    weeklyStudyTime: weeklyStudyTime || 0,
    totalQuestions,
    averageScore: averageScore || 0,
    enrollments: enrollmentCount,
  };
}

// Helper function to get subject-wise progress
async function getSubjectProgress(userId: string) {
  // Get enrolled courses with their subjects
  const enrolledCourses = await db.select({
    courseId: courses.id,
    subject: courses.subject,
  })
    .from(enrollments)
    .leftJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.userId, userId));

  const subjectProgressMap = new Map();

  // Initialize subjects from enrolled courses
  enrolledCourses.forEach(course => {
    if (course.subject && !subjectProgressMap.has(course.subject)) {
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

  if (enrolledCourses.length === 0) {
    return [];
  }

  // Get completed progress by course
  const completedProgress = await db.select({
    courseId: progress.courseId,
    count: count()
  })
    .from(progress)
    .where(and(
      eq(progress.userId, userId),
      eq(progress.status, 'completed')
    ))
    .groupBy(progress.courseId);

  // Get study time by course from activity_log
  const studyTimeByCourse = await db.select({
    courseId: activityLog.courseId,
    totalDuration: { sum: activityLog.duration }
  })
    .from(activityLog)
    .where(eq(activityLog.userId, userId))
    .groupBy(activityLog.courseId);

  // Get quiz stats from quiz_submissions
  const quizStatsByCourse = await db.select({
    score: quizSubmissions.score
  })
    .from(quizSubmissions)
    .leftJoin(quizzes, eq(quizSubmissions.quizId, quizzes.id))
    .where(eq(quizSubmissions.userId, userId));

  // Get total lessons per enrolled course
  const totalLessonsByCourse = await db.select({
    courseId: courses.id,
    totalLessons: count()
  })
    .from(courses)
    .leftJoin(chapters, eq(chapters.courseId, courses.id))
    .leftJoin(lessons, eq(lessons.chapterId, chapters.id))
    .where(inArray(courses.id, enrolledCourses.map(c => c.courseId!)))
    .groupBy(courses.id);

  // Update progress data
  completedProgress.forEach(progress => {
    const course = enrolledCourses.find(c => c.courseId === progress.courseId);
    if (course && course.subject) {
      const subject = subjectProgressMap.get(course.subject);
      if (subject) {
        subject.completedTopics += progress.count;
      }
    }
  });

  // Update study time data
  studyTimeByCourse.forEach(stat => {
    const course = enrolledCourses.find(c => c.courseId === stat.courseId);
    if (course && course.subject) {
      const subject = subjectProgressMap.get(course.subject);
      if (subject) {
        subject.studyTime += Math.round((stat.totalDuration || 0) / 60); // Convert to hours
      }
    }
  });

  // Calculate total topics per subject
  subjectProgressMap.forEach((subject, subjectName) => {
    const subjectCourses = enrolledCourses.filter(c => c.subject === subjectName);
    const subjectCourseIds = subjectCourses.map(c => c.courseId!);

    const totalTopics = totalLessonsByCourse
      .filter(tl => subjectCourseIds.includes(tl.courseId))
      .reduce((sum, tl) => sum + (tl.totalLessons || 0), 0);

    subject.totalTopics = totalTopics;
    subject.progress = totalTopics > 0
      ? Math.round((subject.completedTopics / totalTopics) * 100)
      : 0;
  });

  // Calculate quiz stats
  if (quizStatsByCourse.length > 0) {
    const totalQuizzes = quizStatsByCourse.length;
    const averageAccuracy = quizStatsByCourse.reduce((sum, stat) => sum + stat.score, 0) / totalQuizzes;

    subjectProgressMap.forEach(subject => {
      subject.questionsAnswered = totalQuizzes;
      subject.accuracy = Math.round(averageAccuracy * 100);
    });
  }

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

    const [studyTimeResult, sessionCount, questionCount] = await Promise.all([
      // Study time for this day - use activity_log table
      db.select({ totalDuration: { sum: activityLog.duration } })
        .from(activityLog)
        .where(and(
          eq(activityLog.userId, userId),
          gte(activityLog.startedAt, date),
          lt(activityLog.startedAt, nextDate) // startedAt < nextDate
        ))
        .then(result => result[0]?.totalDuration || 0),

      // Session count - use activity_log table
      db.select({ count: count() })
        .from(activityLog)
        .where(and(
          eq(activityLog.userId, userId),
          gte(activityLog.startedAt, date),
          lt(activityLog.startedAt, nextDate) // startedAt < nextDate
        ))
        .then(result => result[0]?.count || 0),

      // Questions answered on this day - use quiz_submissions table
      db.select({ count: count() })
        .from(quizSubmissions)
        .where(and(
          eq(quizSubmissions.userId, userId),
          gte(quizSubmissions.startedAt, date),
          lt(quizSubmissions.startedAt, nextDate) // startedAt < nextDate
        ))
        .then(result => result[0]?.count || 0),
    ]);

    weeklyActivity.push({
      day: date.toLocaleDateString('en', { weekday: 'short' }),
      hours: Math.round((studyTimeResult || 0) / 60 * 10) / 10, // Round to 1 decimal
      topics: sessionCount,
      questions: questionCount,
    });
  }

  return weeklyActivity;
}

// Helper function to get recent progress/milestones
async function getRecentProgress(userId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    recentLessons,
    recentQuizzes,
    recentTasks
  ] = await Promise.all([
    // Recent completed lessons
    db.select({
      lessonId: progress.lessonId,
      lessonTitle: lessons.title,
      chapterId: progress.chapterId,
      completedAt: progress.completedAt,
      courseSubject: courses.subject
    })
      .from(progress)
      .leftJoin(lessons, eq(progress.lessonId, lessons.id))
      .leftJoin(chapters, eq(progress.chapterId, chapters.id))
      .leftJoin(courses, eq(chapters.courseId, courses.id))
      .where(and(
        eq(progress.userId, userId),
        eq(progress.status, 'completed'),
        gte(progress.completedAt!, sevenDaysAgo)
      ))
      .orderBy(desc(progress.completedAt))
      .limit(5),

    // Recent quiz attempts
    db.select({
      quizTitle: quizzes.title,
      score: quizSubmissions.score,
      completedAt: quizSubmissions.completedAt,
      courseSubject: courses.subject
    })
      .from(quizSubmissions)
      .leftJoin(quizzes, eq(quizSubmissions.quizId, quizzes.id))
      .leftJoin(courses, eq(quizzes.courseId, courses.id))
      .where(and(
        eq(quizSubmissions.userId, userId),
        gte(quizSubmissions.completedAt!, sevenDaysAgo)
      ))
      .orderBy(desc(quizSubmissions.completedAt))
      .limit(5),

    // Recent completed tasks
    db.select({
      taskTitle: tasks.title,
      completedAt: tasks.completedAt,
      courseSubject: courses.subject
    })
      .from(tasks)
      .leftJoin(courses, eq(tasks.courseId, courses.id))
      .where(and(
        eq(tasks.userId, userId),
        eq(tasks.status, 'completed'),
        gte(tasks.completedAt!, sevenDaysAgo)
      ))
      .orderBy(desc(tasks.completedAt))
      .limit(3),
  ]);

  const milestones = [];

  // Add lesson completions
  recentLessons.forEach(progress => {
    if (progress.lessonTitle) {
      milestones.push({
        type: 'topic-completed',
        title: `Completed ${progress.lessonTitle}`,
        subject: progress.courseSubject || 'General',
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
        title: `Scored ${Math.round(attempt.score)}% on ${attempt.quizTitle}`,
        subject: attempt.courseSubject || 'General',
        date: formatRelativeTime(attempt.completedAt!),
        icon: 'Target',
      });
    }
  });

  // Add task completions
  recentTasks.forEach(task => {
    milestones.push({
      type: 'task-completed',
      title: `Completed task: ${task.taskTitle}`,
      subject: task.courseSubject || 'General',
      date: formatRelativeTime(task.completedAt!),
      icon: 'CheckCircle',
    });
  });

  return milestones.slice(0, 10); // Limit to 10 most recent
}

// Helper function to get quiz attempts
async function getRecentQuizAttempts(userId: string) {
  return await db.select({
    id: quizSubmissions.id,
    quizId: quizSubmissions.quizId,
    score: quizSubmissions.score,
    passed: quizSubmissions.passed,
    startedAt: quizSubmissions.startedAt,
    completedAt: quizSubmissions.completedAt,
    attemptNumber: quizSubmissions.attemptNumber,
    timeSpent: quizSubmissions.timeSpent,
    quizTitle: quizzes.title,
    courseSubject: courses.subject
  })
    .from(quizSubmissions)
    .leftJoin(quizzes, eq(quizSubmissions.quizId, quizzes.id))
    .leftJoin(courses, eq(quizzes.courseId, courses.id))
    .where(eq(quizSubmissions.userId, userId))
    .orderBy(desc(quizSubmissions.completedAt))
    .limit(10);
}

// Helper function to get achievements (mock for now)
async function getAchievements(userId: string) {
  const [totalQuizzes, totalStudyTimeResult, completedCourses] = await Promise.all([
    // Total quiz attempts - use quiz_submissions table
    db.select({ count: count() })
      .from(quizSubmissions)
      .where(eq(quizSubmissions.userId, userId))
      .then(result => result[0]?.count || 0),

    // Total study time - use activity_log table
    db.select({ totalDuration: { sum: activityLog.duration } })
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .then(result => result[0]?.totalDuration || 0),

    // Completed courses
    db.select({ count: count() })
      .from(enrollments)
      .where(and(
        eq(enrollments.userId, userId),
        eq(enrollments.status, 'completed')
      ))
      .then(result => result[0]?.count || 0)
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
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const activities = await db.select({
    startedAt: activityLog.startedAt
  })
    .from(activityLog)
    .where(and(
      eq(activityLog.userId, userId),
      gte(activityLog.startedAt, thirtyDaysAgo)
    ))
    .orderBy(desc(activityLog.startedAt));

  if (activities.length === 0) return 0;

  const studyDates = new Set(
    activities.map(activity => {
      const date = new Date(activity.startedAt);
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