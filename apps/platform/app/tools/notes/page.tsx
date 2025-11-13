'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  FileText,
  PenTool,
  BookOpen,
  Search,
  Tag,
  Share2,
  Download,
  Upload,
  FolderOpen,
  Hash,
  Star,
  Lock,
  Clock,
  CheckCircle,
  Edit3,
  Trash2,
  Plus,
  Filter,
} from "lucide-react";

const Notes = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access your notes.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <UnifiedLayout userRole="student" title="Notes">
      <div className="bg-gray-50 flex-1">
        <div className="px-6 py-8">
          {/* Coming Soon Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6 mx-auto">
              <FileText className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Notes</h1>
            <p className="text-xl text-gray-600 mb-8">Coming Soon!</p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              We're developing a smart note-taking system to help you capture, organize, and revise your learning materials. Get ready to take your studying to the next level!
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            <Card className="border-yellow-200 bg-yellow-50/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <PenTool className="w-8 h-8 text-yellow-600 mr-3" />
                  <h3 className="text-lg font-semibold text-yellow-900">Smart Note-Taking</h3>
                </div>
                <p className="text-gray-700">
                  Rich text editor with formatting, mathematical equations, and code snippets support.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <FolderOpen className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-blue-900">Organization System</h3>
                </div>
                <p className="text-gray-700">
                  Organize notes by subject, topic, and custom tags with powerful search functionality.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <BookOpen className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Study Integration</h3>
                </div>
                <p className="text-gray-700">
                  Link notes to lessons, chapters, and courses for seamless studying experience.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Notes Interface Placeholder */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">My Notes</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Note
                  </Button>
                </div>
              </div>

              {/* Note Categories */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4 text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Mathematics (0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>English (0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>Science (0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>General (0)</span>
                  </div>
                </div>
              </div>

              {/* Notes List Placeholder */}
              <div className="space-y-3">
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">Note Collection</p>
                  <p className="text-gray-400">
                    Your organized notes will appear here once launched.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Features Preview */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Tag className="w-6 h-6 text-purple-600 mr-3" />
                  <h3 className="font-semibold">Smart Tags</h3>
                </div>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Auto-tagging suggestions</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Custom tag creation</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Tag-based filtering</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Share2 className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="font-semibold">Collaboration</h3>
                </div>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Share notes with classmates</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Study group collaboration</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Comment and feedback</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Hash className="w-6 h-6 text-yellow-600 mr-3" />
                  <h3 className="font-semibold">Advanced Tools</h3>
                </div>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Version history</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Export to PDF/Word</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Offline access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Preview */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">📝 Note Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Favorite
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Private
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">🔍 Search & Organization</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Full Text
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Folders
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Import
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Preview */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">📊 Note Analytics</h3>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-900">156</p>
                  <p className="text-sm text-blue-700">Total Notes</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-900">42</p>
                  <p className="text-sm text-green-700">This Month</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-900">8</p>
                  <p className="text-sm text-yellow-700">Subjects</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-900">94%</p>
                  <p className="text-sm text-purple-700">Study Efficiency</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <FileText className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">Beta Access</h3>
                <p className="text-yellow-800">
                  Want to be among the first to try our smart note-taking system?
                  <Button variant="link" className="text-yellow-600 underline ml-1 p-0 h-auto">
                    Join the beta program
                  </Button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default Notes;