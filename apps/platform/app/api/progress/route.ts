import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Simple database connection
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Simple client for this API only
const client = postgres(connectionString, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

const db = drizzle(client);

// Simple schema definition for this API only
const enrollments = {
  id: 'id',
  userId: 'userId',
  courseId: 'courseId',
  enrolledAt: 'enrolledAt',
};

// GET /api/progress - Get basic progress data for the authenticated user
export async function GET(req: NextRequest) {
  try {
    console.log('Progress API called');

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', userId);

    // Use raw SQL query to avoid ORM complexity
    let enrollments = [];
    try {
      enrollments = await client`SELECT id, user_id, course_id, enrolled_at FROM enrollments WHERE user_id = ${userId} LIMIT 10`;
      console.log('Enrollments found:', enrollments.length);
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      // Continue with empty enrollments if DB fails
    }

    const progressData = {
      user: {
        id: userId,
        name: 'Student',
        email: '',
        avatar: undefined,
      },
      overallStats: {
        totalStudyTime: 0,
        weeklyGoal: 60,
        weeklyProgress: 0,
        totalQuestions: 0,
        accuracyRate: 0,
        streak: 0,
        subjectsStudied: enrollments.length,
      },
      subjectProgress: enrollments.map((enrollment, index) => ({
        name: `Course ${index + 1}`,
        progress: 0,
        color: 'bg-blue-500',
        totalLessons: 0,
        completedLessons: 0,
        studyTime: 0,
        accuracy: 0,
        icon: 'BookOpen',
      })),
      weeklyActivity: [
        { day: 'Mon', hours: 0, topics: 0, questions: 0 },
        { day: 'Tue', hours: 0, topics: 0, questions: 0 },
        { day: 'Wed', hours: 0, topics: 0, questions: 0 },
        { day: 'Thu', hours: 0, topics: 0, questions: 0 },
        { day: 'Fri', hours: 0, topics: 0, questions: 0 },
        { day: 'Sat', hours: 0, topics: 0, questions: 0 },
        { day: 'Sun', hours: 0, topics: 0, questions: 0 },
      ],
      achievements: [
        {
          id: 'first-quiz',
          title: 'Quiz Beginner',
          description: 'Complete your first quiz',
          earned: false,
          progress: 0,
          total: 1,
        },
        {
          id: 'week-streak',
          title: 'Week Warrior',
          description: 'Study for 7 days in a row',
          earned: false,
          progress: 0,
          total: 7,
        },
      ],
      recentMilestones: [],
    };

    console.log('Returning progress data');

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

