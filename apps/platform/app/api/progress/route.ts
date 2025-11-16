import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getUserActivityStats,
  getUserLearningProgress,
  getQuizStats,
  getWeeklyActivity,
  getRecentProgress
} from '@/lib/db';
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
    const user = await ensureUserExists(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user in database' },
        { status: 500 }
      );
    }

    // Get all progress data using the new real functions
    const [
      activityStats,
      learningProgress,
      quizStats,
      weeklyActivityData,
      recentProgressData
    ] = await Promise.all([
      // User activity statistics
      getUserActivityStats(user.id),
      // Learning progress by subject/course
      getUserLearningProgress(user.id),
      // Quiz performance statistics
      getQuizStats(user.id),
      // Weekly activity data
      getWeeklyActivity(user.id),
      // Recent progress/milestones
      getRecentProgress(user.id)
    ]);

    // Transform learning progress data for UI
    const subjectProgress = learningProgress.map(({ course, totalLessons, completedLessons, progressPercent }) => ({
      name: course.title,
      progress: progressPercent,
      color: getSubjectColor(course.subject || 'other'),
      totalLessons,
      completedLessons,
      studyTime: Math.round((activityStats.totalTimeSpentHours / learningProgress.length) * 10) / 10,
      accuracy: Math.round(quizStats.averageScore),
      icon: getSubjectIcon(course.subject || 'other')
    }));

    // Transform weekly activity for UI
    const weeklyActivityUI = weeklyActivityData.dailyActivity.map((day) => ({
      day: new Date(day.date).toLocaleDateString('en', { weekday: 'short' }),
      hours: day.lessons * 0.5 + day.quizzes * 0.1, // Estimate hours based on activity
      topics: day.lessons,
      questions: day.quizzes * 5 // Estimate questions per quiz
    }));

    const progressData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      overallStats: {
        totalStudyTime: activityStats.totalTimeSpentHours,
        weeklyGoal: 60, // Default 60 minutes per day
        weeklyProgress: weeklyActivityData.totalTimeSpentMinutes,
        totalQuestions: quizStats.totalQuizzes * 5,
        accuracyRate: activityStats.averageQuizScore || 0,
        streak: activityStats.currentStreak,
        subjectsStudied: subjectProgress.length,
      },
      subjectProgress,
      weeklyActivity: weeklyActivityUI,
      achievements: generateAchievements(activityStats, quizStats),
      recentMilestones: transformRecentProgress(recentProgressData),
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
    return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
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

// Helper function to generate achievements based on real data
function generateAchievements(activityStats: any, quizStats: any) {
  return [
    {
      id: 'first-quiz',
      title: 'Quiz Beginner',
      description: 'Complete your first quiz',
      earned: quizStats.totalQuizzes > 0,
      earnedDate: quizStats.totalQuizzes > 0 ? new Date().toISOString().split('T')[0] : null,
    },
    {
      id: 'week-streak',
      title: 'Week Warrior',
      description: 'Study for 7 days in a row',
      earned: activityStats.currentStreak >= 7,
      earnedDate: activityStats.currentStreak >= 7 ? new Date().toISOString().split('T')[0] : null,
      progress: Math.min(activityStats.currentStreak, 7),
      total: 7,
    },
    {
      id: 'subject-master',
      title: 'Subject Master',
      description: 'Complete 100% of any subject',
      earned: activityStats.overallProgress === 100,
      earnedDate: activityStats.overallProgress === 100 ? new Date().toISOString().split('T')[0] : null,
      progress: activityStats.overallProgress,
      total: 100,
    },
    {
      id: 'quiz-champion',
      title: 'Quiz Champion',
      description: 'Score 90% or higher on 5 quizzes',
      earned: quizStats.recentQuizzes.filter((q: any) => q.score >= 90).length >= 5,
      progress: Math.min(quizStats.recentQuizzes.filter((q: any) => q.score >= 90).length, 5),
      total: 5,
    },
    {
      id: 'study-time',
      title: 'Dedicated Student',
      description: 'Study for 50+ hours total',
      earned: activityStats.totalTimeSpentHours >= 50,
      earnedDate: activityStats.totalTimeSpentHours >= 50 ? new Date().toISOString().split('T')[0] : null,
      progress: Math.min(Math.round(activityStats.totalTimeSpentHours), 50),
      total: 50,
    },
  ];
}

// Helper function to transform recent progress data for UI
function transformRecentProgress(recentProgress: any[]) {
  return recentProgress.slice(0, 6).map((achievement) => {
    const icons: Record<string, string> = {
      'lesson': 'BookOpen',
      'quiz': 'Award',
      'task': 'CheckCircle',
    };

    return {
      title: achievement.title,
      description: achievement.description,
      date: formatRelativeTime(new Date(achievement.date)),
      icon: icons[achievement.type] || 'Star',
      score: achievement.score,
    };
  });
}