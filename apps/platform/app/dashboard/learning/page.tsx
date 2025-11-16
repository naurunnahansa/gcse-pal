'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/AuthProvider";
import {
  BookOpen,
  Brain,
  Clock,
  TrendingUp,
  Play,
  MessageCircle,
  Target,
  Award,
  ChevronRight,
  BarChart3,
  Zap,
} from "lucide-react";

const Learning = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);

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
          <p className="text-muted-foreground mb-4">Please sign in to access your learning hub.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  // Mock data for subjects and progress
  const subjects = [
    {
      id: 'mathematics',
      name: 'Mathematics',
      progress: 68,
      totalTopics: 45,
      completedTopics: 31,
      lastStudied: '2 hours ago',
      color: 'bg-blue-500',
      icon: BarChart3,
    },
    {
      id: 'english-literature',
      name: 'English Literature',
      progress: 45,
      totalTopics: 38,
      completedTopics: 17,
      lastStudied: '1 day ago',
      color: 'bg-green-500',
      icon: BookOpen,
    },
    {
      id: 'biology',
      name: 'Biology',
      progress: 82,
      totalTopics: 32,
      completedTopics: 26,
      lastStudied: '3 hours ago',
      color: 'bg-purple-500',
      icon: Brain,
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      progress: 53,
      totalTopics: 29,
      completedTopics: 15,
      lastStudied: 'Yesterday',
      color: 'bg-orange-500',
      icon: Zap,
    },
  ];

  const recommendedTopics = [
    {
      id: 'quadratic-equations',
      subject: 'Mathematics',
      title: 'Quadratic Equations',
      type: 'Topic Walkthrough',
      duration: '25 min',
      difficulty: 'Intermediate',
      reason: 'Based on your recent quiz results',
    },
    {
      id: 'macbeth-analysis',
      subject: 'English Literature',
      title: 'Macbeth Act 1 Analysis',
      type: 'Video Lesson',
      duration: '30 min',
      difficulty: 'Intermediate',
      reason: 'Continue your current learning path',
    },
    {
      id: 'cell-structure',
      subject: 'Biology',
      title: 'Cell Structure and Function',
      type: 'Interactive Practice',
      duration: '20 min',
      difficulty: 'Foundation',
      reason: 'Strengthen core concepts',
    },
  ];

  const recentActivity = [
    {
      type: 'quiz',
      subject: 'Mathematics',
      title: 'Flash Quiz: Algebra',
      score: 85,
      time: '2 hours ago',
      icon: Brain,
    },
    {
      type: 'video',
      subject: 'Biology',
      title: 'Cell Division Video',
      progress: 100,
      time: '3 hours ago',
      icon: Play,
    },
    {
      type: 'chat',
      subject: 'English Literature',
      title: 'AI Tutor: Poetry Analysis',
      time: '5 hours ago',
      icon: MessageCircle,
    },
  ];

  const quickActions = [
    {
      title: 'Continue Learning',
      description: 'Pick up where you left off',
      icon: Play,
      action: 'Resume',
      href: '/learning/topic/current',
      color: 'bg-blue-500',
    },
    {
      title: 'Quick Assessment',
      description: 'Check your understanding',
      icon: Brain,
      action: 'Start Quiz',
      href: '/evals/flash-quiz',
      color: 'bg-green-500',
    },
    {
      title: 'AI Tutor Chat',
      description: 'Get help from your AI tutor',
      icon: MessageCircle,
      action: 'Start Chat',
      href: '/chats',
      color: 'bg-purple-500',
    },
  ];

  return (
      <div className="flex-1">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Learning Hub</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user.name}! Ready to continue your GCSE preparation?</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <a href="/progress">View Progress</a>
              </Button>
              <Button size="sm" asChild>
                <a href="/evals/flash-quiz">Quick Quiz</a>
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 flex-1 p-6">
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Card key={index} className="group cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={action.href}>
                          <ChevronRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Your Subjects */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Your Subjects</h2>
                  <Button variant="outline" size="sm">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {subjects.map((subject) => (
                    <Card key={subject.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${subject.color}`}>
                              <subject.icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                              <p className="text-sm text-gray-600">
                                {subject.completedTopics}/{subject.totalTopics} topics completed
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-500">
                            {subject.progress}%
                          </span>
                        </div>

                        <Progress value={subject.progress} className="h-2 mb-4" />

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">
                            Last studied {subject.lastStudied}
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Play className="h-4 w-4 mr-1" />
                              Learn
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Chat
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recommended Topics */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Recommended for You
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendedTopics.map((topic, index) => (
                      <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{topic.title}</h4>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {topic.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{topic.subject}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{topic.type}</span>
                          <span>•</span>
                          <span>{topic.duration}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">{topic.reason}</p>
                        <Button variant="outline" size="sm" className="w-full mt-3">
                          Start Learning
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <activity.icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.subject}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{activity.time}</p>
                          {activity.score && (
                            <p className="text-xs font-semibold text-green-600">{activity.score}%</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Learning;