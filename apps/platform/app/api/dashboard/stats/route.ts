import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  findUserByClerkId,
  findEnrollmentsByUserId,
  getUserCourseStats,
  getQuizPerformanceStats,
} from '@/lib/db/queries';

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

    // Get user from database
    const user = await findUserByClerkId(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get user statistics using available query functions
    const [
      enrollmentsData,
      quizStats,
    ] = await Promise.all([
      // User's course enrollments with progress
      findEnrollmentsByUserId(user.id),

      // User's quiz performance statistics
      getQuizPerformanceStats(user.id),
    ]);

    const totalCoursesEnrolled = enrollmentsData.length;
    const coursesCompleted = enrollmentsData.filter(enrollment =>
      enrollment.progress >= 100 || enrollment.completedAt
    ).length;

    // Get course details for enrolled courses
    const courseStats = await getUserCourseStats(user.id);

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
        totalStudyTime: 0, // Would need implementation using lessonProgress.timeSpentSeconds
        averageQuizScore: quizStats.averageScore,
        currentStreak: 0, // Would need implementation
        weeklyGoal: {
          target: 0, // Would need implementation
          current: 0,
          percentage: 0,
        },
      },
      recentActivity: [], // Would need implementation using lessonProgress
      upcomingDeadlines: [], // Would need implementation
      subjectDistribution: {}, // Would need implementation
      enrolledCourses: courseStats.map(({ course, enrollment, progress }) => ({
        id: course.id,
        title: course.title,
        subject: course.subject,
        level: course.level,
        thumbnail: course.thumbnailUrl,
        difficulty: course.difficulty,
        duration: course.duration,
        enrollment: {
          id: enrollment?.id || '',
          progress: enrollment?.progress || 0,
          status: enrollment?.progress >= 100 ? 'completed' : 'in_progress',
          enrolledAt: enrollment?.enrolledAt || new Date(),
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