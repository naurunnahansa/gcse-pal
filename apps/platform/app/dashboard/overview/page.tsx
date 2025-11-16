'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Clock,
  TrendingUp,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useDashboard } from "@/hooks/useDashboard";
import FloatingChat from "@/components/FloatingChat";

const DashboardOverview = () => {
  const { user, isAuthenticated } = useAuth();
  const { stats, loading, error, refetch } = useDashboard();
  const [mounted, setMounted] = React.useState(false);

  // Convert API data to subject progress format - MUST be before any early returns
  const subjects = React.useMemo(() => {
    if (!stats?.subjectDistribution) return [];

    return Object.entries(stats.subjectDistribution).map(([subject, count]) => {
      const colors: Record<string, string> = {
        mathematics: "bg-blue-500",
        english: "bg-green-500",
        science: "bg-purple-500",
        history: "bg-orange-500",
        geography: "bg-red-500",
        other: "bg-gray-500",
      };

      return {
        name: subject.charAt(0).toUpperCase() + subject.slice(1),
        progress: Math.min((count / 10) * 100, 100), // Normalize to percentage
        color: colors[subject.toLowerCase()] || "bg-gray-500",
      };
    });
  }, [stats?.subjectDistribution]);

  // Convert API recent activity to display format - MUST be before any early returns
  const recentActivity = React.useMemo(() => {
    if (!stats?.recentActivity) return [];

    return stats.recentActivity.slice(0, 3).map(activity => ({
      subject: activity.course.subject.charAt(0).toUpperCase() + activity.course.subject.slice(1),
      topic: activity.lesson?.title || activity.course.title,
      type: activity.type === 'lesson' ? 'Video Lesson' : 'Course',
      score: null,
      time: new Date(activity.startTime).toLocaleString(),
    }));
  }, [stats?.recentActivity]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access your dashboard.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 flex-1">
        <div className="px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="mb-2 text-4xl font-bold">Welcome back, {user.name}</h1>
          <p className="text-lg text-muted-foreground">
            Ready to continue your GCSE preparation?
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Subject Progress */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Subjects</h2>
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : subjects.length > 0 ? (
                subjects.map((subject) => (
                  <Card key={subject.name} className="border-border p-6">
                    <CardContent className="p-0">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{subject.name}</h3>
                        <span className="text-sm font-medium text-muted-foreground">
                          {subject.progress}%
                        </span>
                      </div>
                      <Progress value={subject.progress} className="h-2" />
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={`/dashboard/learning/${subject.name.toLowerCase().replace(/\s+/g, '-')}`}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Continue Learning
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-border p-6">
                  <CardContent className="p-0 text-center py-8">
                    <p className="text-muted-foreground">No subject data available yet.</p>
                    <p className="text-sm text-muted-foreground">Start learning to see your progress!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Stats */}
            <Card className="border-border p-6">
              <CardContent className="p-0">
                <h3 className="mb-4 text-lg font-semibold">This Week</h3>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-500">Failed to load stats</p>
                    <Button size="sm" variant="outline" onClick={refetch} className="mt-2">
                      Retry
                    </Button>
                  </div>
                ) : stats ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {Math.round((stats.progress.weeklyGoal?.current || 0) / 60 * 10) / 10}
                        </p>
                        <p className="text-sm text-muted-foreground">Hours studied</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {Math.round(stats.progress.averageQuizScore)}%
                        </p>
                        <p className="text-sm text-muted-foreground">Avg. quiz score</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.progress.currentStreak}</p>
                        <p className="text-sm text-muted-foreground">Day streak</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-border p-6">
              <CardContent className="p-0">
                <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="border-b border-border pb-4 last:border-0 last:pb-0"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-sm font-medium">{activity.subject}</p>
                          {activity.score && (
                            <span className="text-sm font-semibold">
                              {activity.score}%
                            </span>
                          )}
                        </div>
                        <p className="mb-1 text-sm text-muted-foreground">
                          {activity.topic}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.type} • {activity.time}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                    <p className="text-xs text-muted-foreground">Start learning to see your activity here!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
      <FloatingChat />
    </>
  );
};

export default DashboardOverview;