'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  TrendingUp,
  Clock,
  Target,
  Award,
  Calendar,
  BarChart3,
  Brain,
  BookOpen,
  CheckCircle,
  Zap,
  Trophy,
  Activity,
  PieChart,
  Users,
  Star,
} from "lucide-react";

const Progress = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data for progress tracking
  const overallStats = {
    totalStudyTime: 48, // hours
    weeklyGoal: 10, // hours
    weeklyProgress: 7.5, // hours
    totalQuestions: 245,
    accuracyRate: 78,
    streak: 5, // days
    subjectsStudied: 4,
  };

  const subjectProgress = [
    {
      id: 'mathematics',
      name: 'Mathematics',
      progress: 68,
      totalTopics: 45,
      completedTopics: 31,
      studyTime: 12, // hours
      questionsAnswered: 89,
      accuracy: 85,
      color: 'bg-blue-500',
      icon: BarChart3,
    },
    {
      id: 'english-literature',
      name: 'English Literature',
      progress: 45,
      totalTopics: 38,
      completedTopics: 17,
      studyTime: 8, // hours
      questionsAnswered: 56,
      accuracy: 72,
      color: 'bg-green-500',
      icon: BookOpen,
    },
    {
      id: 'biology',
      name: 'Biology',
      progress: 82,
      totalTopics: 32,
      completedTopics: 26,
      studyTime: 18, // hours
      questionsAnswered: 76,
      accuracy: 91,
      color: 'bg-purple-500',
      icon: Brain,
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      progress: 53,
      totalTopics: 29,
      completedTopics: 15,
      studyTime: 10, // hours
      questionsAnswered: 24,
      accuracy: 65,
      color: 'bg-orange-500',
      icon: Zap,
    },
  ];

  const weeklyActivity = [
    { day: 'Mon', hours: 1.5, topics: 3, questions: 15 },
    { day: 'Tue', hours: 2.0, topics: 2, questions: 20 },
    { day: 'Wed', hours: 1.0, topics: 4, questions: 12 },
    { day: 'Thu', hours: 1.5, topics: 2, questions: 18 },
    { day: 'Fri', hours: 0.5, topics: 1, questions: 8 },
    { day: 'Sat', hours: 0.0, topics: 0, questions: 0 },
    { day: 'Sun', hours: 1.0, topics: 3, questions: 16 },
  ];

  const achievements = [
    {
      id: 'first-quiz',
      title: 'Quiz Beginner',
      description: 'Complete your first flash quiz',
      icon: Brain,
      earned: true,
      earnedDate: '2024-01-15',
    },
    {
      id: 'week-streak',
      title: 'Week Warrior',
      description: 'Study for 7 days in a row',
      icon: Calendar,
      earned: true,
      earnedDate: '2024-01-20',
    },
    {
      id: 'subject-master',
      title: 'Subject Master',
      description: 'Complete 100% of any subject',
      icon: Trophy,
      earned: false,
      progress: 82,
    },
    {
      id: 'quiz-champion',
      title: 'Quiz Champion',
      description: 'Score 90% or higher on 5 quizzes',
      icon: Star,
      earned: false,
      progress: 3,
      total: 5,
    },
  ];

  const recentMilestones = [
    {
      type: 'topic-completed',
      title: 'Completed Cell Biology',
      subject: 'Biology',
      date: '2 hours ago',
      icon: CheckCircle,
    },
    {
      type: 'quiz-score',
      title: 'Scored 91% on Algebra Quiz',
      subject: 'Mathematics',
      date: '5 hours ago',
      icon: Target,
    },
    {
      type: 'streak',
      title: '5 day study streak!',
      subject: 'All Subjects',
      date: 'Yesterday',
      icon: Activity,
    },
    {
      type: 'time-goal',
      title: 'Weekly study goal achieved',
      subject: 'All Subjects',
      date: '2 days ago',
      icon: Clock,
    },
  ];

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

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

  return (
    <DashboardLayout>
      <div className="flex-1">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Progress Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your learning journey and achievements</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <a href="/learning">Back to Learning</a>
              </Button>
              <Button size="sm" asChild>
                <a href="/evals/flash-quiz">Take Quiz</a>
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 flex-1 p-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Study Time</p>
                    <p className="text-xl font-bold text-gray-900">{overallStats.totalStudyTime}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Accuracy Rate</p>
                    <p className="text-xl font-bold text-gray-900">{overallStats.accuracyRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Questions</p>
                    <p className="text-xl font-bold text-gray-900">{overallStats.totalQuestions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Study Streak</p>
                    <p className="text-xl font-bold text-gray-900">{overallStats.streak} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-sm text-gray-600">Subjects</p>
                    <p className="text-xl font-bold text-gray-900">{overallStats.subjectsStudied}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subject Progress */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Subject Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjectProgress.map((subject) => (
                      <div key={subject.id} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${subject.color}`}>
                              <subject.icon className="h-4 w-4 text-white" />
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

                        <ProgressBar value={subject.progress} className="h-2 mb-3" />

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Study Time</p>
                            <p className="font-medium text-gray-900">{subject.studyTime}h</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Questions</p>
                            <p className="font-medium text-gray-900">{subject.questionsAnswered}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Accuracy</p>
                            <p className="font-medium text-gray-900">{subject.accuracy}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Weekly Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Weekly Goal</span>
                      <span className="text-sm font-medium text-gray-900">
                        {overallStats.weeklyProgress}/{overallStats.weeklyGoal} hours
                      </span>
                    </div>
                    <ProgressBar
                      value={(overallStats.weeklyProgress / overallStats.weeklyGoal) * 100}
                      className="h-3"
                    />
                  </div>

                  <div className="space-y-3">
                    {weeklyActivity.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900 w-12">{day.day}</span>
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-blue-500 rounded-full"
                                style={{ width: `${(day.hours / 3) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{day.hours}h</p>
                          <p className="text-xs text-gray-500">{day.questions} questions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className={`flex items-start gap-3 p-3 rounded-lg ${
                        achievement.earned ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className={`p-2 rounded-lg ${
                          achievement.earned ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <achievement.icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium text-sm ${
                            achievement.earned ? 'text-green-900' : 'text-gray-600'
                          }`}>
                            {achievement.title}
                          </h4>
                          <p className={`text-xs ${
                            achievement.earned ? 'text-green-700' : 'text-gray-500'
                          }`}>
                            {achievement.description}
                          </p>
                          {achievement.earnedDate && (
                            <p className="text-xs text-green-600 mt-1">Earned {achievement.earnedDate}</p>
                          )}
                          {!achievement.earned && achievement.progress !== undefined && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{achievement.progress}{achievement.total ? `/${achievement.total}` : '%'}</span>
                              </div>
                              <ProgressBar value={achievement.progress} className="h-1" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentMilestones.map((milestone, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <milestone.icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{milestone.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{milestone.subject}</span>
                            <span>•</span>
                            <span>{milestone.date}</span>
                          </div>
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
    </DashboardLayout>
  );
};

export default Progress;