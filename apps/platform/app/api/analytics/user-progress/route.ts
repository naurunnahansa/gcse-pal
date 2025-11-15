import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  getUserLearningProgress,
  getActivityInsights,
  getUserPreferences,
  updateUserPreferences
} from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

// GET /api/analytics/user-progress - Get comprehensive user learning analytics
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const userResults = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (userResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResults[0];

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const days = parseInt(searchParams.get('days') || '30');

    // Get comprehensive analytics data in parallel
    const [
      learningProgress,
      activityInsights,
      userPreferences,
    ] = await Promise.all([
      getUserLearningProgress(user.id, courseId || undefined),
      getActivityInsights(user.id, days),
      getUserPreferences(user.id),
    ]);

    // Calculate additional metrics
    const totalEnrolledCourses = learningProgress.length;
    const completedCourses = learningProgress.filter(course =>
      course.enrollmentStatus === 'completed'
    ).length;
    const totalStudyTime = learningProgress.reduce((sum, course) =>
      sum + (course.totalStudyTime || 0), 0
    );
    const averageQuizScore = learningProgress.length > 0
      ? learningProgress.reduce((sum, course) => sum + (course.averageQuizScore || 0), 0) / learningProgress.length
      : 0;

    // Calculate study streak and habits
    const recentActivity = Object.entries(activityInsights.dailyStats)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7);

    const studyStreak = calculateStudyStreak(recentActivity);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          preferences: userPreferences,
        },
        overview: {
          totalEnrolledCourses,
          completedCourses,
          totalStudyTime,
          averageQuizScore,
          studyStreak,
          completionRate: totalEnrolledCourses > 0
            ? Math.round((completedCourses / totalEnrolledCourses) * 100)
            : 0,
        },
        courses: learningProgress.map(course => ({
          id: course.courseId,
          title: course.courseTitle,
          progress: course.enrollmentProgress || 0,
          status: course.enrollmentStatus,
          completedChapters: course.completedChapters || 0,
          totalChapters: course.totalChapters || 0,
          lastActivity: course.lastActivity,
          totalStudyTime: course.totalStudyTime || 0,
          averageQuizScore: course.averageQuizScore || 0,
        })),
        activity: {
          totalActivities: activityInsights.totalActivities,
          totalStudyTime: activityInsights.totalStudyTime,
          averageSessionTime: Math.round(activityInsights.averageSessionTime),
          activityBreakdown: activityInsights.activityBreakdown,
          dailyStats: activityInsights.dailyStats,
          recentActivity: recentActivity.map(([date, stats]) => ({
            date,
            studyTime: stats.studyTime,
            activities: stats.activities,
          })),
        },
        recommendations: generateRecommendations(learningProgress, activityInsights, userPreferences),
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/analytics/user-progress - Update user preferences
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const userResults = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (userResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResults[0];
    const body = await req.json();

    // Update user preferences
    const updatedUser = await updateUserPreferences(user.id, body);

    return NextResponse.json({
      success: true,
      data: {
        preferences: updatedUser.preferences,
      }
    });

  } catch (error) {
    console.error('Update user preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate study streak
function calculateStudyStreak(recentActivity: Array<[string, { studyTime: number; activities: number }]>): number {
  let streak = 0;
  let currentDate = new Date();

  for (const [date, stats] of recentActivity) {
    const activityDate = new Date(date);

    // Check if this activity was on consecutive day
    const daysDiff = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === streak && stats.studyTime > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Helper function to generate personalized recommendations
function generateRecommendations(
  learningProgress: any[],
  activityInsights: any,
  userPreferences: any
): string[] {
  const recommendations: string[] = [];

  // Study time recommendations
  if (activityInsights.averageSessionTime < 30) {
    recommendations.push("Consider longer study sessions for better retention");
  } else if (activityInsights.averageSessionTime > 90) {
    recommendations.push("Take regular breaks during long study sessions");
  }

  // Consistency recommendations
  if (activityInsights.dailyStats && Object.keys(activityInsights.dailyStats).length < 5) {
    recommendations.push("Try to study more consistently for better learning outcomes");
  }

  // Course progress recommendations
  const incompleteCourses = learningProgress.filter(course =>
    course.enrollmentProgress < 100 && course.enrollmentStatus === 'active'
  );

  if (incompleteCourses.length > 3) {
    recommendations.push("Focus on completing current courses before starting new ones");
  }

  // Quiz performance recommendations
  const lowPerformingCourses = learningProgress.filter(course =>
    (course.averageQuizScore || 0) < 70
  );

  if (lowPerformingCourses.length > 0) {
    recommendations.push("Review quiz material and consider additional practice");
  }

  // Study time recommendations based on goals
  const dailyGoal = userPreferences?.dailyGoal || 60;
  const actualDailyTime = activityInsights.totalStudyTime / 30; // Average per day

  if (actualDailyTime < dailyGoal * 0.8) {
    recommendations.push(`You're averaging ${Math.round(actualDailyTime)} minutes/day. Consider increasing to meet your ${dailyGoal} minute goal.`);
  }

  return recommendations;
}