import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  enrollments,
  studySessions,
  quizAttempts,
  tasks,
  courses,
  lessons,
  progress,
  userSettings
} from '@/lib/db/queries';
import { ensureUserExists } from '@/lib/user-sync';
import { eq, and, gte, lte, inArray, desc, asc, count, sum, avg } from 'drizzle-orm';

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
    await ensureUserExists(userId);

    const userResults = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (userResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 404 }
      );
    }

    const user = userResults[0];

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
      db.select({ count: count() })
        .from(enrollments)
        .where(eq(enrollments.userId, user.id))
        .then(result => result[0]?.count || 0),

      // Completed courses
      db.select({ count: count() })
        .from(enrollments)
        .where(and(
          eq(enrollments.userId, user.id),
          eq(enrollments.status, 'completed')
        ))
        .then(result => result[0]?.count || 0),

      // Total study time in minutes
      db.select({ total: sum(studySessions.duration) })
        .from(studySessions)
        .where(eq(studySessions.userId, user.id))
        .then(result => result[0]?.total || 0),

      // Average quiz scores
      db.select({ average: avg(quizAttempts.score) })
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, user.id))
        .then(result => result[0]?.average || 0),

      // Recent activity (last 7 days)
      db.select({
        id: studySessions.id,
        userId: studySessions.userId,
        courseId: studySessions.courseId,
        lessonId: studySessions.lessonId,
        startTime: studySessions.startTime,
        duration: studySessions.duration,
        notes: studySessions.notes,
      })
        .from(studySessions)
        .where(and(
          eq(studySessions.userId, user.id),
          gte(studySessions.startTime, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
        ))
        .orderBy(desc(studySessions.startTime))
        .limit(10),

      // Upcoming deadlines (tasks with due dates in next 30 days)
      db.select()
        .from(tasks)
        .where(and(
          eq(tasks.userId, user.id),
          lte(tasks.dueDate, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // Next 30 days
          gte(tasks.dueDate, new Date()),
          eq(tasks.status, 'pending')
        ))
        .orderBy(asc(tasks.dueDate))
        .limit(5),
    ]);

    // Enrich recent activity with course and lesson data
    const enrichedRecentActivity = await Promise.all(
      recentActivity.map(async (session) => {
        const courseResults = session.courseId
          ? await db.select({
              id: courses.id,
              title: courses.title,
              subject: courses.subject,
            })
            .from(courses)
            .where(eq(courses.id, session.courseId))
            .limit(1)
          : [];

        const lessonResults = session.lessonId
          ? await db.select({
              id: lessons.id,
              title: lessons.title,
            })
            .from(lessons)
            .where(eq(lessons.id, session.lessonId))
            .limit(1)
          : [];

        return {
          ...session,
          course: courseResults[0] || null,
          lesson: lessonResults[0] || null,
        };
      })
    );

    // Enrich upcoming deadlines with course data
    const enrichedUpcomingDeadlines = await Promise.all(
      upcomingDeadlines.map(async (task) => {
        const courseResults = task.courseId
          ? await db.select({
              id: courses.id,
              title: courses.title,
            })
            .from(courses)
            .where(eq(courses.id, task.courseId))
            .limit(1)
          : [];

        return {
          ...task,
          course: courseResults[0] || null,
        };
      })
    );

    // Get current study streak
    const studySessionsForStreak = await db.select({
      startTime: studySessions.startTime,
    })
      .from(studySessions)
      .where(and(
        eq(studySessions.userId, user.id),
        gte(studySessions.startTime, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      ))
      .orderBy(desc(studySessions.startTime));

    const currentStreak = calculateStudyStreak(studySessionsForStreak);

    // Get weekly progress
    const weeklyGoalResults = await db.select({
      dailyGoal: userSettings.dailyGoal,
    })
      .from(userSettings)
      .where(eq(userSettings.userId, user.id))
      .limit(1);

    const weeklyStudyTimeResults = await db.select({
      total: sum(studySessions.duration),
    })
      .from(studySessions)
      .where(and(
        eq(studySessions.userId, user.id),
        gte(studySessions.startTime, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
      ));

    // Get subject distribution
    const subjectProgressResults = await db.select({
      courseId: progress.courseId,
      count: count(),
    })
      .from(progress)
      .where(and(
        eq(progress.userId, user.id),
        eq(progress.status, 'completed')
      ))
      .groupBy(progress.courseId);

    const courseIds = subjectProgressResults.map(p => p.courseId);
    const coursesResults = courseIds.length > 0
      ? await db.select({
          id: courses.id,
          subject: courses.subject,
        })
        .from(courses)
        .where(inArray(courses.id, courseIds))
      : [];

    const subjectStats = coursesResults.reduce((acc: Record<string, number>, course) => {
      const subject = course.subject;
      const progressCount = subjectProgressResults.find(p => p.courseId === course.id)?.count || 0;
      acc[subject] = (acc[subject] || 0) + progressCount;
      return acc;
    }, {});

    // Calculate weekly goal progress
    const weeklyGoal = weeklyGoalResults[0];
    const weeklyTarget = (weeklyGoal?.dailyGoal || 60) * 7; // 7 days
    const weeklyStudyTime = weeklyStudyTimeResults[0];
    const weeklyCurrent = weeklyStudyTime?.total || 0;
    const weeklyProgressPercentage = weeklyTarget > 0 ? (weeklyCurrent / weeklyTarget) * 100 : 0;

    // Get enrolled courses for dashboard
    const enrolledCoursesResults = await db.select({
      id: enrollments.id,
      userId: enrollments.userId,
      courseId: enrollments.courseId,
      progress: enrollments.progress,
      status: enrollments.status,
      enrolledAt: enrollments.enrolledAt,
      completedAt: enrollments.completedAt,
      courseTitle: courses.title,
      courseSubject: courses.subject,
      courseLevel: courses.level,
      courseThumbnail: courses.thumbnail,
      courseDifficulty: courses.difficulty,
      courseDuration: courses.duration,
    })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, user.id))
      .orderBy(desc(enrollments.enrolledAt))
      .limit(3); // Show only last 3 enrolled courses

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
        totalStudyTime,
        averageQuizScore: averageQuizScores,
        currentStreak,
        weeklyGoal: {
          target: weeklyTarget,
          current: weeklyCurrent,
          percentage: Math.round(weeklyProgressPercentage),
        },
      },
      recentActivity: enrichedRecentActivity.map(session => ({
        id: session.id,
        type: session.lessonId ? 'lesson' : 'course',
        course: session.course,
        lesson: session.lesson,
        startTime: session.startTime,
        duration: session.duration,
      })),
      upcomingDeadlines: enrichedUpcomingDeadlines.map(task => ({
        id: task.id,
        title: task.title,
        course: task.course,
        priority: task.priority,
        dueDate: task.dueDate,
      })),
      subjectDistribution: subjectStats,
      enrolledCourses: enrolledCoursesResults.map(enrollment => ({
        id: enrollment.courseId,
        title: enrollment.courseTitle,
        subject: enrollment.courseSubject,
        level: enrollment.courseLevel,
        thumbnail: enrollment.courseThumbnail,
        difficulty: enrollment.courseDifficulty,
        duration: enrollment.courseDuration,
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
function calculateStudyStreak(sessions: { startTime: Date }[]): number {
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