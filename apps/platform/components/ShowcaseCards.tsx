"use client";

import { Brain, BookOpen, Award, Globe, Users, Target } from "lucide-react";
import CardSwap, { Card } from "@/components/CardSwap";
import { Button } from "@/components/ui/button";

const ShowcaseCards = () => {
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
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Science Mock Exam</span>
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">In Progress</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '45%'}}></div>
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
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-xs text-gray-600">Active Topics</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-green-600">4.5h</div>
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
                    <span className="text-lg font-bold text-purple-600">78%</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">Math</div>
                      <div className="text-xs text-gray-600">85%</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">Science</div>
                      <div className="text-xs text-gray-600">72%</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">English</div>
                      <div className="text-xs text-gray-600">76%</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium mb-2">Recent Achievements</div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">🏆</span>
                      <span className="text-sm">Completed 10 quizzes this week</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg mr-2">🎯</span>
                      <span className="text-sm">5-day study streak</span>
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