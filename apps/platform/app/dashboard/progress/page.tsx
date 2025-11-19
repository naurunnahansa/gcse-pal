'use client';

import React from 'react';
import { useProgress, ProgressData } from '@/hooks/useProgress';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  BookOpen,
  Target,
  Calendar,
  Clock,
  Award,
  BarChart3,
} from "lucide-react";
import {
  ProgressStatsSkeleton,
  SubjectProgressSkeleton,
  AchievementSkeleton,
} from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/AuthProvider";

interface ProgressData {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  overallStats: {
    totalStudyTime: number;
    weeklyGoal: number;
    weeklyProgress: number;
    totalQuestions: number;
    accuracyRate: number;
    streak: number;
    subjectsStudied: number;
  };
  subjectProgress: Array<{
    name: string;
    progress: number;
    color: string;
    totalLessons: number;
    completedLessons: number;
    studyTime: number;
    accuracy: number;
    icon: string;
  }>;
  weeklyActivity: Array<{
    day: string;
    hours: number;
    topics: number;
    questions: number;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    earned: boolean;
    earnedDate?: string;
    progress?: number;
    total?: number;
  }>;
  recentMilestones: Array<{
    title: string;
    description: string;
    date: string;
    icon: string;
    score?: number;
  }>;
}

const ProgressPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: progressData, loading, error, refresh: fetchProgressData } = useProgress();

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
      BookOpen,
      Award,
      Target,
      Calendar,
      TrendingUp,
      Clock,
      BarChart3,
    };
    return icons[iconName] || BarChart3;
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to view your progress.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <ProgressStatsSkeleton />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <SubjectProgressSkeleton />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <AchievementSkeleton key={i} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-red-600">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchProgressData}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Progress Data</h1>
          <p className="text-muted-foreground mb-4">Start studying to see your progress here.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={fetchProgressData} variant="outline">Refresh</Button>
            <Button asChild>
              <a href="/dashboard">Browse Courses</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { overallStats, subjectProgress, weeklyActivity, achievements, recentMilestones } = progressData;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Progress</h1>
        <p className="text-muted-foreground">
          Track your learning journey and celebrate your achievements
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{Math.round(overallStats.accuracyRate)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Study Streak</p>
                <p className="text-2xl font-bold">{overallStats.streak} days</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Study Time</p>
                <p className="text-2xl font-bold">{overallStats.totalStudyTime.toFixed(1)} hrs</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold">{achievements.filter(a => a.earned).length}</p>
              </div>
              <Award className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Subject Progress */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Subject Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {subjectProgress.map((subject) => (
                  <div key={subject.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getIcon(subject.icon)}
                        <h3 className="font-medium">{subject.name}</h3>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {subject.completedLessons}/{subject.totalLessons} lessons
                      </span>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{subject.progress}% complete</span>
                      <Button variant="outline" size="sm">
                        Continue
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Achievements */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.filter(a => a.earned).slice(0, 5).map((achievement, index) => (
                  <div key={achievement.id} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                      <Award className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground mb-1">{achievement.description}</p>
                      {achievement.earnedDate && (
                        <p className="text-xs text-muted-foreground">
                          Earned {new Date(achievement.earnedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {achievements.filter(a => a.earned).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No achievements earned yet. Start studying to unlock your first achievement!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Study Time</span>
                    <span>{Math.round(overallStats.weeklyProgress / 60 * 10) / 10}/{overallStats.weeklyGoal / 60} hrs</span>
                  </div>
                  <Progress value={Math.min((overallStats.weeklyProgress / overallStats.weeklyGoal) * 100, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Lessons Completed</span>
                    <span>{subjectProgress.reduce((acc, s) => acc + s.completedLessons, 0)}</span>
                  </div>
                  <Progress value={Math.min((subjectProgress.reduce((acc, s) => acc + s.completedLessons, 0) / Math.max(subjectProgress.reduce((acc, s) => acc + s.totalLessons, 0), 1)) * 100, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Practice Questions</span>
                    <span>{overallStats.totalQuestions}</span>
                  </div>
                  <Progress value={Math.min((overallStats.accuracyRate / 100) * 100, 100)} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;