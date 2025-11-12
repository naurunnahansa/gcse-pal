'use client';

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  Users,
  Star,
  Play,
  FileText,
  Headphones,
  Video,
  Award,
  TrendingUp,
} from "lucide-react";

const BrowseCourses = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

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
          <p className="text-muted-foreground mb-4">Please sign in to browse courses.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  // Sample course data
  const allCourses = [
    {
      id: 1,
      title: "GCSE Mathematics Complete Course",
      subject: "Mathematics",
      level: "GCSE",
      description: "Master all topics required for GCSE Mathematics including algebra, geometry, statistics, and more.",
      duration: "120 hours",
      enrolled: 1234,
      rating: 4.8,
      lessons: 145,
      type: "comprehensive",
      difficulty: "intermediate",
      thumbnail: "/api/placeholder/300/200",
      price: 49.99,
      instructor: "Dr. Sarah Johnson",
      topics: ["Algebra", "Geometry", "Statistics", "Probability", "Number Theory"]
    },
    {
      id: 2,
      title: "English Literature: Shakespeare & Poetry",
      subject: "English Literature",
      level: "GCSE",
      description: "Explore Shakespeare's major works and develop skills in poetry analysis and essay writing.",
      duration: "80 hours",
      enrolled: 892,
      rating: 4.9,
      lessons: 98,
      type: "literature",
      difficulty: "intermediate",
      thumbnail: "/api/placeholder/300/200",
      price: 39.99,
      instructor: "Prof. Michael Chen",
      topics: ["Shakespeare", "Poetry Analysis", "Essay Writing", "Literary Devices", "Modern Literature"]
    },
    {
      id: 3,
      title: "GCSE Biology: Life Sciences",
      subject: "Biology",
      level: "GCSE",
      description: "Complete coverage of GCSE Biology including cell biology, genetics, ecology, and human biology.",
      duration: "100 hours",
      enrolled: 756,
      rating: 4.7,
      lessons: 112,
      type: "science",
      difficulty: "intermediate",
      thumbnail: "/api/placeholder/300/200",
      price: 44.99,
      instructor: "Dr. Emily Roberts",
      topics: ["Cell Biology", "Genetics", "Ecology", "Human Biology", "Evolution"]
    },
    {
      id: 4,
      title: "Chemistry Fundamentals",
      subject: "Chemistry",
      level: "GCSE",
      description: "Learn atomic structure, chemical reactions, organic chemistry, and practical laboratory skills.",
      duration: "90 hours",
      enrolled: 623,
      rating: 4.6,
      lessons: 105,
      type: "science",
      difficulty: "intermediate",
      thumbnail: "/api/placeholder/300/200",
      price: 42.99,
      instructor: "Dr. James Wilson",
      topics: ["Atomic Structure", "Chemical Reactions", "Organic Chemistry", "Laboratory Skills", "Periodic Table"]
    },
    {
      id: 5,
      title: "Physics: Mechanics & Energy",
      subject: "Physics",
      level: "GCSE",
      description: "Understand forces, motion, energy, electricity, and waves through interactive lessons.",
      duration: "85 hours",
      enrolled: 545,
      rating: 4.7,
      lessons: 95,
      type: "science",
      difficulty: "intermediate",
      thumbnail: "/api/placeholder/300/200",
      price: 41.99,
      instructor: "Dr. Alan Turing",
      topics: ["Mechanics", "Energy", "Electricity", "Waves", "Forces"]
    },
    {
      id: 6,
      title: "History: World Events & Civilizations",
      subject: "History",
      level: "GCSE",
      description: "Explore major world events, civilizations, and historical developments from ancient to modern times.",
      duration: "70 hours",
      enrolled: 412,
      rating: 4.8,
      lessons: 82,
      type: "humanities",
      difficulty: "beginner",
      thumbnail: "/api/placeholder/300/200",
      price: 35.99,
      instructor: "Dr. Margaret Brown",
      topics: ["Ancient Civilizations", "World Wars", "Industrial Revolution", "Modern History", "Historical Analysis"]
    }
  ];

  const subjects = ['all', 'Mathematics', 'English Literature', 'Biology', 'Chemistry', 'Physics', 'History'];
  const levels = ['all', 'GCSE', 'A-Level'];

  // Filter courses based on search and filters
  const filteredCourses = useMemo(() => {
    return allCourses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSubject = selectedSubject === 'all' || course.subject === selectedSubject;
      const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;

      return matchesSearch && matchesSubject && matchesLevel;
    });
  }, [allCourses, searchTerm, selectedSubject, selectedLevel]);

  const getCourseTypeIcon = (type: string) => {
    switch (type) {
      case 'comprehensive': return <BookOpen className="h-4 w-4" />;
      case 'science': return <Video className="h-4 w-4" />;
      case 'literature': return <FileText className="h-4 w-4" />;
      case 'humanities': return <Headphones className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <UnifiedLayout userRole="student">
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Courses</h1>
            <p className="text-gray-600">Discover comprehensive GCSE courses to accelerate your learning</p>
          </div>
        </div>

        <div className="bg-gray-50 flex-1">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Search and Filters */}
            <div className="mb-8 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses, topics, or instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>

                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>
                      {subject === 'all' ? 'All Subjects' : subject}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {levels.map(level => (
                    <option key={level} value={level}>
                      {level === 'all' ? 'All Levels' : level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mb-6">
              <p className="text-gray-600">
                Found <span className="font-semibold">{filteredCourses.length}</span> courses
              </p>
            </div>

            {/* Course Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="group cursor-pointer transition-all hover:shadow-lg">
                  {/* Course Thumbnail */}
                  <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
                    {getCourseTypeIcon(course.type)}
                    <span className="ml-2 text-sm text-gray-600">{course.type}</span>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-black transition-colors">
                        {course.title}
                      </CardTitle>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(course.difficulty)}`}>
                        {course.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.lessons} lessons
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Topics */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {course.topics.slice(0, 3).map((topic, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                        >
                          {topic}
                        </span>
                      ))}
                      {course.topics.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          +{course.topics.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Course Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{course.enrolled.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{course.rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Instructor */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500">Instructor: {course.instructor}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-black text-white hover:bg-gray-800">
                        Enroll Now - £{course.price}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* No Results */}
            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search terms or filters</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSubject('all');
                    setSelectedLevel('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default BrowseCourses;