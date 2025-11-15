"use client";

import { Brain, BookOpen, Award, Globe, Users, Target } from "lucide-react";
import CardSwap, { Card } from "@/components/CardSwap";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface DashboardStats {
  progress: {
    totalCoursesEnrolled: number;
    totalStudyTime: number;
    currentStreak: number;
    weeklyGoal: {
      target: number;
      current: number;
      percentage: number;
    };
  };
  recentActivity: Array<{
    type: string;
    course: {
      title: string;
      subject: string;
    };
    lesson?: {
      title: string;
    };
  }>;
  enrolledCourses: Array<{
    id: string;
    title: string;
    subject: string;
    enrollment: {
      progress: number;
    };
  }>;
}

const ShowcaseCards = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real dashboard stats for demo purposes
    const fetchStats = async () => {
      try {
        // For demo purposes, we'll create realistic mock data
        // In a real scenario, this would fetch from the API
        const demoStats: DashboardStats = {
          progress: {
            totalCoursesEnrolled: 3,
            totalStudyTime: 270, // 4.5 hours in minutes
            currentStreak: 5,
            weeklyGoal: {
              target: 420, // 7 hours * 60 minutes
              current: 270,
              percentage: 64,
            },
          },
          recentActivity: [
            {
              type: 'lesson',
              course: {
                title: 'Mathematics: Algebra and Functions',
                subject: 'mathematics',
              },
              lesson: {
                title: 'Quadratic Equations',
              },
            },
            {
              type: 'quiz',
              course: {
                title: 'Science: Biology Fundamentals',
                subject: 'science',
              },
            },
          ],
          enrolledCourses: [
            {
              id: '1',
              title: 'Mathematics: Algebra and Functions',
              subject: 'mathematics',
              enrollment: {
                progress: 85,
              },
            },
            {
              id: '2',
              title: 'Science: Biology Fundamentals',
              subject: 'science',
              enrollment: {
                progress: 45,
              },
            },
            {
              id: '3',
              title: 'English Literature: Shakespeare and Poetry',
              subject: 'english',
              enrollment: {
                progress: 76,
              },
            },
          ],
        };

        setStats(demoStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fallback data while loading or if error occurs
  const getProgressPercentage = (subject?: string) => {
    if (!stats?.enrolledCourses) return 0;

    if (subject) {
      const course = stats.enrolledCourses.find(c => c.subject === subject);
      return course?.enrollment.progress || 0;
    }

    // Overall progress
    return Math.round(
      stats.enrolledCourses.reduce((sum, course) => sum + course.enrollment.progress, 0) /
      stats.enrolledCourses.length
    );
  };

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;
  };

  const activeTopics = stats?.enrolledCourses.length || 3;
  const studyTime = stats?.progress.totalStudyTime || 270;
  const mathProgress = getProgressPercentage('mathematics');
  const scienceProgress = getProgressPercentage('science');
  const englishProgress = getProgressPercentage('english');
  return (
    <section className="py-24 relative">
      <div className="container mx-auto">
        <h2 className="text-center text-4xl font-bold mb-4">
          See GCSE Pal in Action
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          Explore our intelligent learning platform through interactive demonstrations
        </p>

        {/* CardSwap Webpage Demo */}
        <div className="relative" style={{ height: '600px' }}>
          <CardSwap
            width={450}
            height={300}
            cardDistance={80}
            verticalDistance={60}
            delay={5000}
            pauseOnHover={true}
            skewAmount={3}
            easing="elastic"
          >
            <Card className="bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden">
              {/* Browser Header */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-xs text-gray-600 font-mono">gcse-pal.com/dashboard</div>
                </div>
                <div className="text-xs text-gray-500">Smart Assessments</div>
              </div>

              {/* Browser Content */}
              <div className="p-6 bg-gradient-to-br from-orange-50 to-white">
                <div className="flex items-center mb-6">
                  <Brain className="h-12 w-12 text-orange-500 mr-4" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Smart Assessment System</h3>
                    <p className="text-sm text-gray-600">AI-powered adaptive testing</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Mathematics Quiz</span>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">{mathProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: `${mathProgress}%`}}></div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Science Mock Exam</span>
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">In Progress</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{width: `${scienceProgress}%`}}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                    Start New Quiz
                  </button>
                  <button className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                    View Analytics
                  </button>
                </div>
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden">
              {/* Browser Header */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-xs text-gray-600 font-mono">gcse-pal.com/learn</div>
                </div>
                <div className="text-xs text-gray-500">Personalized Learning</div>
              </div>

              {/* Browser Content */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-center mb-6">
                  <BookOpen className="h-12 w-12 text-blue-500 mr-4" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Personalized Study Path</h3>
                    <p className="text-sm text-gray-600">Tailored to your learning style</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-blue-600">{activeTopics}</div>
                    <div className="text-xs text-gray-600">Active Topics</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-green-600">{formatStudyTime(studyTime)}</div>
                    <div className="text-xs text-gray-600">Study Time</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm">Algebra - Quadratic Equations</span>
                    </div>
                    <span className="text-xs text-orange-500">Video</span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm">Chemistry - Atomic Structure</span>
                    </div>
                    <span className="text-xs text-blue-500">Quiz</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden">
              {/* Browser Header */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-xs text-gray-600 font-mono">gcse-pal.com/progress</div>
                </div>
                <div className="text-xs text-gray-500">Progress Tracking</div>
              </div>

              {/* Browser Content */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-white">
                <div className="flex items-center mb-6">
                  <Award className="h-12 w-12 text-purple-500 mr-4" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Knowledge Graph</h3>
                    <p className="text-sm text-gray-600">Visual learning analytics</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-lg font-bold text-purple-600">{getProgressPercentage()}%</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">Math</div>
                      <div className="text-xs text-gray-600">{mathProgress}%</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">Science</div>
                      <div className="text-xs text-gray-600">{scienceProgress}%</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">English</div>
                      <div className="text-xs text-gray-600">{englishProgress}%</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium mb-2">Recent Achievements</div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">🏆</span>
                      <span className="text-sm">{stats?.recentActivity.length || 2} activities completed this week</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg mr-2">🎯</span>
                      <span className="text-sm">{stats?.progress.currentStreak || 5}-day study streak</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </CardSwap>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Hover over the cards to pause • Cards rotate automatically every 5 seconds
          </p>
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
            Start Your Free Trial
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ShowcaseCards;