'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Video,
  Plus,
  Search,
  Filter,
  Play,
  Eye,
  Edit,
  Trash2,
  Clock,
  Users,
  BarChart3,
  Upload,
  FolderOpen,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface VideoData {
  id: string;
  title: string;
  description: string;
  duration: string;
  course: string;
  chapter: string;
  views: number;
  status: 'published' | 'draft' | 'archived';
  uploadDate: string;
}

const VideosPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access admin features.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  // Mock videos data
  const videos: VideoData[] = [
    {
      id: '1',
      title: 'Introduction to Algebra - Variables and Expressions',
      description: 'Learn the fundamentals of algebraic expressions and how to work with variables',
      duration: '12:34',
      course: 'Mathematics',
      chapter: 'Algebra Basics',
      views: 245,
      status: 'published',
      uploadDate: '2024-01-15',
    },
    {
      id: '2',
      title: 'Cell Structure and Function',
      description: 'Explore the different parts of a cell and their specific functions',
      duration: '15:22',
      course: 'Biology',
      chapter: 'Cell Biology',
      views: 189,
      status: 'published',
      uploadDate: '2024-01-14',
    },
    {
      id: '3',
      title: 'Chemistry Lab Safety Procedures',
      description: 'Essential safety guidelines for working in a chemistry laboratory',
      duration: '8:45',
      course: 'Chemistry',
      chapter: 'Laboratory Skills',
      views: 156,
      status: 'draft',
      uploadDate: '2024-01-13',
    },
    {
      id: '4',
      title: 'Essay Writing Structure and Techniques',
      description: 'Master the art of structuring and writing compelling essays',
      duration: '18:10',
      course: 'English',
      chapter: 'Writing Skills',
      views: 312,
      status: 'published',
      uploadDate: '2024-01-12',
    },
  ];

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || video.course === selectedCourse;
    const matchesStatus = selectedStatus === 'all' || video.status === selectedStatus;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const courses = ['all', ...new Set(videos.map(v => v.course))];
  const stats = {
    total: videos.length,
    published: videos.filter(v => v.status === 'published').length,
    totalViews: videos.reduce((sum, v) => sum + v.views, 0),
    totalDuration: '54:51', // Mock total duration
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Video Library</h1>
        <p className="text-muted-foreground">
          Manage educational video content and multimedia resources
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Videos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Video className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{stats.published}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="text-2xl font-bold">{stats.totalDuration}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Button className="crayon-effect">
                <Plus className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
              <Button variant="outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                Organize
              </Button>
            </div>

            <div className="flex-1 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg"
              >
                {courses.map(course => (
                  <option key={course} value={course}>
                    {course === 'all' ? 'All Courses' : course}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Videos Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredVideos.map((video) => (
          <Card key={video.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(video.status)}`}>
                      {video.status}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {video.duration}
                    </span>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <FolderOpen className="h-4 w-4" />
                    {video.course}
                  </span>
                  <span className="text-muted-foreground">{video.chapter}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    {video.views} views
                  </div>
                  <span className="text-muted-foreground">{video.uploadDate}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Play className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredVideos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCourse !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Get started by uploading your first video'}
            </p>
            <Button className="crayon-effect">
              <Plus className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideosPage;