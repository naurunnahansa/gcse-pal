'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Search,
  Filter,
  Download,
  Mail,
  Calendar,
  TrendingUp,
  BarChart3,
  MoreVertical,
  Clock,
  Award,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useStudents } from "@/hooks/useStudents";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  enrolledCourses: number;
  completedCourses: number;
  studyTime: number;
  lastActive: string;
  status: 'active' | 'inactive' | 'at-risk';
  progress: number;
}

const StudentsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    students,
    stats,
    loading,
    error,
    fetchStudents,
    refetch,
  } = useStudents({
    autoFetch: true,
    search: debouncedSearchTerm,
    grade: selectedGrade,
    status: selectedStatus,
  });

  const handleRefresh = () => {
    toast.info('Refreshing student data...');
    refetch();
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'at-risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show error state
  if (error && !loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error Loading Students</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Student Management</h1>
        <p className="text-muted-foreground">
          Monitor student progress and manage accounts
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold">{stats.atRisk}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">{stats.avgProgress}%</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email All
              </Button>
            </div>

            <div className="flex-1 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="9">Grade 9</SelectItem>
                  <SelectItem value="10">Grade 10</SelectItem>
                  <SelectItem value="11">Grade 11</SelectItem>
                  <SelectItem value="12">Grade 12</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium">Student</th>
                  <th className="text-left p-4 font-medium">Grade</th>
                  <th className="text-left p-4 font-medium">Courses</th>
                  <th className="text-left p-4 font-medium">Progress</th>
                  <th className="text-left p-4 font-medium">Study Time</th>
                  <th className="text-left p-4 font-medium">Last Active</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">Loading students...</p>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-muted-foreground" />
                        <p className="text-lg font-medium">No students found</p>
                        <p className="text-muted-foreground">
                          {searchTerm || selectedGrade !== 'all' || selectedStatus !== 'all'
                            ? 'Try adjusting your filters'
                            : 'No students have registered yet'
                          }
                        </p>
                        {(searchTerm || selectedGrade !== 'all' || selectedStatus !== 'all') && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedGrade('all');
                              setSelectedStatus('all');
                            }}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="border-b border-border hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">Grade {student.grade}</span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p>{student.completedCourses}/{student.enrolledCourses}</p>
                          <p className="text-muted-foreground">courses</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{student.studyTime}h</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">{student.lastActive}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => {
                            toast.info('Student details view coming soon');
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            toast.info('Student editing coming soon');
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            toast.info('More student actions coming soon');
                          }}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentsPage;