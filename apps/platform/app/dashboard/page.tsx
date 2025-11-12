'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import {
  BookOpen,
  Brain,
  Network,
  Zap,
  Clock,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  const subjects = [
    { name: "Mathematics", progress: 68, color: "bg-blue-500" },
    { name: "English Literature", progress: 45, color: "bg-green-500" },
    { name: "Biology", progress: 82, color: "bg-purple-500" },
    { name: "Chemistry", progress: 53, color: "bg-orange-500" },
  ];

  const quickActions = [
    {
      icon: Zap,
      title: "Flash Quiz",
      description: "Quick 5-minute assessment",
      action: "Start Quiz",
    },
    {
      icon: Brain,
      title: "Mid Exam",
      description: "1-hour comprehensive test",
      action: "Begin Exam",
    },
    {
      icon: BookOpen,
      title: "Continue Learning",
      description: "Pick up where you left off",
      action: "Resume",
    },
  ];

  const recentActivity = [
    {
      subject: "Mathematics",
      topic: "Quadratic Equations",
      type: "Flash Quiz",
      score: 85,
      time: "2 hours ago",
    },
    {
      subject: "Biology",
      topic: "Cell Structure",
      type: "Topic Chat",
      score: null,
      time: "5 hours ago",
    },
    {
      subject: "English Literature",
      topic: "Macbeth Analysis",
      type: "Mid Exam",
      score: 72,
      time: "Yesterday",
    },
  ];

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
    <UnifiedLayout userRole="student">
      <div className="bg-gray-50 flex-1">
        <div className="px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="mb-2 text-4xl font-bold">Welcome back, {user.name}</h1>
          <p className="text-lg text-muted-foreground">
            Ready to continue your GCSE preparation?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="group cursor-pointer border-border p-6 transition-all hover:border-foreground hover:shadow-lg"
            >
              <CardContent className="p-0">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-foreground group-hover:scale-110 transition-transform">
                  <action.icon className="h-6 w-6 text-background" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">{action.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {action.description}
                </p>
                <Button variant="outline" className="w-full group-hover:bg-foreground group-hover:text-background">
                  {action.action}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
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
              {subjects.map((subject) => (
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
                      <Button size="sm" variant="outline">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Learn
                      </Button>
                      <Button size="sm" variant="outline">
                        <Brain className="mr-2 h-4 w-4" />
                        Test
                      </Button>
                      <Button size="sm" variant="outline">
                        <Network className="mr-2 h-4 w-4" />
                        Graph
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Stats */}
            <Card className="border-border p-6">
              <CardContent className="p-0">
                <h3 className="mb-4 text-lg font-semibold">This Week</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">12.5</p>
                      <p className="text-sm text-muted-foreground">Hours studied</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">+15%</p>
                      <p className="text-sm text-muted-foreground">Avg. score increase</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-border p-6">
              <CardContent className="p-0">
                <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </UnifiedLayout>
  );
};

export default Dashboard;