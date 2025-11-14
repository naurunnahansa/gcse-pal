'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Upload, Save, Eye, FileText, Settings, BookOpen, ChevronRight, ChevronDown, File, Video, Edit3, Download, FileJson, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout';
import { useAuth } from '@/components/AuthProvider';

interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  duration: number;
  isPublished: boolean;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content?: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isPublished: boolean;
}

interface CourseData {
  title: string;
  description: string;
  subject: string;
  level: string;
  difficulty: string;
  instructor: string;
  duration: number;
  price: number;
  topics: string[];
  thumbnail?: string;
  status: string;
  chapters: Chapter[];
}

const EditCoursePage = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<{ type: 'chapter' | 'lesson'; id: string } | null>(null);

  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    subject: '',
    level: '',
    difficulty: '',
    instructor: '',
    duration: 0,
    price: 0,
    topics: [],
    thumbnail: '',
    status: 'draft',
    chapters: [],
  });

  const [newTopic, setNewTopic] = useState('');
  const [selectedChapterForLesson, setSelectedChapterForLesson] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      const result = await response.json();
      if (result.success) {
        const course = result.data;
        setCourseData({
          title: course.title || '',
          description: course.description || '',
          subject: course.subject || '',
          level: course.level || '',
          difficulty: course.difficulty || '',
          instructor: course.instructor || '',
          duration: course.duration || 0,
          price: course.price || 0,
          topics: course.topics || [],
          thumbnail: course.thumbnail || '',
          status: course.status || 'draft',
          chapters: course.chapters || [],
        });

        // Auto-expand first chapter if exists
        if (course.chapters && course.chapters.length > 0) {
          setExpandedChapters(new Set([course.chapters[0].id]));
          setSelectedItem({ type: 'lesson', id: course.chapters[0].lessons?.[0]?.id || course.chapters[0].id });
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = async (publish = false) => {
    if (!courseData.title.trim() || !courseData.description.trim() || !courseData.subject.trim() || !courseData.instructor.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...courseData,
          status: publish ? 'published' : 'draft',
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(publish ? 'Course published successfully!' : 'Course saved successfully!');
        if (publish) {
          router.push('/admin/courses');
        }
      } else {
        throw new Error(result.error || 'Failed to save course');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: 'New Chapter',
      description: '',
      order: courseData.chapters.length,
      duration: 0,
      isPublished: false,
      lessons: [],
    };

    setCourseData(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter]
    }));

    setExpandedChapters(prev => new Set([...prev, newChapter.id]));
    setSelectedItem({ type: 'chapter', id: newChapter.id });
  };

  const updateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    setCourseData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId ? { ...chapter, ...updates } : chapter
      )
    }));
  };

  const deleteChapter = (chapterId: string) => {
    setCourseData(prev => ({
      ...prev,
      chapters: prev.chapters.filter(chapter => chapter.id !== chapterId)
    }));
    setSelectedItem(null);
  };

  const addLesson = (chapterId: string) => {
    const chapter = courseData.chapters.find(c => c.id === chapterId);
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: 'New Lesson',
      description: '',
      duration: 0,
      order: chapter?.lessons?.length || 0,
      isPublished: false,
    };

    setCourseData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? { ...chapter, lessons: [...(chapter.lessons || []), newLesson] }
          : chapter
      )
    }));

    setSelectedItem({ type: 'lesson', id: newLesson.id });
  };

  const updateLesson = (chapterId: string, lessonId: string, updates: Partial<Lesson>) => {
    setCourseData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? {
              ...chapter,
              lessons: chapter.lessons?.map(lesson =>
                lesson.id === lessonId ? { ...lesson, ...updates } : lesson
              )
            }
          : chapter
      )
    }));
  };

  const deleteLesson = (chapterId: string, lessonId: string) => {
    setCourseData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? {
              ...chapter,
              lessons: chapter.lessons?.filter(lesson => lesson.id !== lessonId)
            }
          : chapter
      )
    }));
    setSelectedItem(null);
  };

  const addTopic = () => {
    if (newTopic.trim() && !courseData.topics.includes(newTopic.trim())) {
      setCourseData(prev => ({
        ...prev,
        topics: [...prev.topics, newTopic.trim()]
      }));
      setNewTopic('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setCourseData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }));
  };

  const exportToJson = () => {
    const dataToExport = {
      ...courseData,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `${courseData.title.toLowerCase().replace(/\s+/g, '-')}-course.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.success('Course exported successfully!');
  };

  const importFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        setCourseData({
          title: importedData.title || '',
          description: importedData.description || '',
          subject: importedData.subject || '',
          level: importedData.level || '',
          difficulty: importedData.difficulty || '',
          instructor: importedData.instructor || '',
          duration: importedData.duration || 0,
          price: importedData.price || 0,
          topics: importedData.topics || [],
          thumbnail: importedData.thumbnail || '',
          status: importedData.status || 'draft',
          chapters: importedData.chapters || [],
        });
        toast.success('Course imported successfully!');
      } catch (error) {
        toast.error('Failed to import course. Please check the JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            saveCourse(false);
            break;
          case 'Enter':
            e.preventDefault();
            saveCourse(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [courseData]);

  if (!mounted || !isAuthenticated || !user) {
    return (
      <UnifiedLayout userRole="admin" title="Authentication Required">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access admin features.</p>
            <Button asChild>
              <a href="/auth/signin">Sign In</a>
            </Button>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  if (loading) {
    return (
      <UnifiedLayout userRole="admin" title="Loading Course">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading course...</p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  const selectedChapter = courseData.chapters.find(c => c.id === selectedItem?.id && selectedItem.type === 'chapter');
  const selectedLesson = courseData.chapters
    .flatMap(c => c.lessons || [])
    .find(l => l.id === selectedItem?.id && selectedItem.type === 'lesson');

  return (
    <UnifiedLayout userRole="admin" title="Edit Course">
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
                <p className="text-gray-600">Edit your course content and settings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportToJson}>
                <Download className="h-4 w-4 mr-1" />
                Export JSON
              </Button>
              <Button variant="outline" asChild>
                <label className="cursor-pointer flex items-center">
                  <Upload className="h-4 w-4 mr-1" />
                  Import JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={importFromJson}
                    className="hidden"
                  />
                </label>
              </Button>
              <Button
                variant="outline"
                onClick={() => saveCourse(false)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                onClick={() => saveCourse(true)}
                disabled={saving}
              >
                <Eye className="h-4 w-4 mr-1" />
                {saving ? 'Publishing...' : 'Publish Course'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Course Content</h3>
                <Button
                  size="sm"
                  onClick={addChapter}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  New Chapter
                </Button>
              </div>

              {/* Chapters */}
              <div className="space-y-2">
                {courseData.chapters.map((chapter) => (
                  <div key={chapter.id} className="border border-gray-200 rounded-lg">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleChapter(chapter.id)}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          className={`h-4 w-4 text-gray-500 transition-transform ${
                            expandedChapters.has(chapter.id) ? 'rotate-90' : ''
                          }`}
                        />
                        <BookOpen className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{chapter.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {chapter.lessons?.length || 0} lessons
                        </Badge>
                      </div>
                    </div>

                    {expandedChapters.has(chapter.id) && (
                      <div className="border-t border-gray-200">
                        {chapter.lessons?.map((lesson) => (
                          <div
                            key={lesson.id}
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 border-l-2 ${
                              selectedItem?.id === lesson.id && selectedItem?.type === 'lesson'
                                ? 'border-black bg-black/5'
                                : 'border-transparent'
                            }`}
                            onClick={() => setSelectedItem({ type: 'lesson', id: lesson.id })}
                          >
                            <Video className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{lesson.title}</span>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start px-3 py-2 text-gray-500 hover:text-gray-700"
                          onClick={() => addLesson(chapter.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          New Lesson
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Course Actions */}
            <div className="border-t border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-2">
                Total: {courseData.chapters.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0)} lessons
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Tabs */}
            <div className="bg-white border-b border-gray-200">
              <div className="flex">
                <button
                  className={`px-6 py-3 font-medium text-sm border-b-2 ${
                    activeTab === 'content'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('content')}
                >
                  <Edit3 className="h-4 w-4 inline mr-2" />
                  Edit Course Content
                </button>
                <button
                  className={`px-6 py-3 font-medium text-sm border-b-2 ${
                    activeTab === 'settings'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="h-4 w-4 inline mr-2" />
                  Edit Course Settings
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {activeTab === 'content' && (
                <div className="p-6">
                  {selectedItem ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {selectedItem.type === 'chapter' ? (
                            <>
                              <BookOpen className="h-5 w-5" />
                              Chapter: {selectedChapter?.title}
                            </>
                          ) : (
                            <>
                              <Video className="h-5 w-5" />
                              Lesson: {selectedLesson?.title}
                            </>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedItem.type === 'chapter' && selectedChapter && (
                          <div className="space-y-4">
                            <div>
                              <Label>Chapter Title</Label>
                              <Input
                                value={selectedChapter.title}
                                onChange={(e) => updateChapter(selectedChapter.id, { title: e.target.value })}
                                placeholder="Enter chapter title"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={selectedChapter.description}
                                onChange={(e) => updateChapter(selectedChapter.id, { description: e.target.value })}
                                placeholder="Enter chapter description"
                                rows={3}
                              />
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`published-${selectedChapter.id}`}
                                  checked={selectedChapter.isPublished}
                                  onChange={(e) => updateChapter(selectedChapter.id, { isPublished: e.target.checked })}
                                />
                                <Label htmlFor={`published-${selectedChapter.id}`}>Published</Label>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteChapter(selectedChapter.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete Chapter
                              </Button>
                            </div>
                          </div>
                        )}

                        {selectedItem.type === 'lesson' && selectedLesson && (
                          <div className="space-y-4">
                            <div>
                              <Label>Lesson Title</Label>
                              <Input
                                value={selectedLesson.title}
                                onChange={(e) => {
                                  const chapterId = courseData.chapters.find(c => c.lessons?.some(l => l.id === selectedLesson.id))?.id;
                                  if (chapterId) updateLesson(chapterId, selectedLesson.id, { title: e.target.value });
                                }}
                                placeholder="Enter lesson title"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={selectedLesson.description}
                                onChange={(e) => {
                                  const chapterId = courseData.chapters.find(c => c.lessons?.some(l => l.id === selectedLesson.id))?.id;
                                  if (chapterId) updateLesson(chapterId, selectedLesson.id, { description: e.target.value });
                                }}
                                placeholder="Enter lesson description"
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label>Content (Markdown)</Label>
                              <Textarea
                                value={selectedLesson.content || ''}
                                onChange={(e) => {
                                  const chapterId = courseData.chapters.find(c => c.lessons?.some(l => l.id === selectedLesson.id))?.id;
                                  if (chapterId) updateLesson(chapterId, selectedLesson.id, { content: e.target.value });
                                }}
                                placeholder="Enter lesson content in Markdown format"
                                rows={8}
                                className="font-mono text-sm"
                              />
                            </div>
                            <div>
                              <Label>Video URL</Label>
                              <Input
                                value={selectedLesson.videoUrl || ''}
                                onChange={(e) => {
                                  const chapterId = courseData.chapters.find(c => c.lessons?.some(l => l.id === selectedLesson.id))?.id;
                                  if (chapterId) updateLesson(chapterId, selectedLesson.id, { videoUrl: e.target.value });
                                }}
                                placeholder="Enter video URL (optional)"
                              />
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`lesson-published-${selectedLesson.id}`}
                                  checked={selectedLesson.isPublished}
                                  onChange={(e) => {
                                    const chapterId = courseData.chapters.find(c => c.lessons?.some(l => l.id === selectedLesson.id))?.id;
                                    if (chapterId) updateLesson(chapterId, selectedLesson.id, { isPublished: e.target.checked });
                                  }}
                                />
                                <Label htmlFor={`lesson-published-${selectedLesson.id}`}>Published</Label>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const chapterId = courseData.chapters.find(c => c.lessons?.some(l => l.id === selectedLesson.id))?.id;
                                  if (chapterId) deleteLesson(chapterId, selectedLesson.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete Lesson
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select Content to Edit</h3>
                        <p className="text-gray-600">Choose a chapter or lesson from the sidebar to start editing.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Settings</CardTitle>
                      <p>Basic information and metadata about your course</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label>Course Title *</Label>
                            <Input
                              value={courseData.title}
                              onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Enter course title"
                              required
                            />
                          </div>
                          <div>
                            <Label>Instructor Name *</Label>
                            <Input
                              value={courseData.instructor}
                              onChange={(e) => setCourseData(prev => ({ ...prev, instructor: e.target.value }))}
                              placeholder="Enter instructor name"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Description *</Label>
                          <Textarea
                            value={courseData.description}
                            onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter course description"
                            rows={4}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <Label>Subject *</Label>
                            <Select value={courseData.subject} onValueChange={(value) => setCourseData(prev => ({ ...prev, subject: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mathematics">Mathematics</SelectItem>
                                <SelectItem value="biology">Biology</SelectItem>
                                <SelectItem value="chemistry">Chemistry</SelectItem>
                                <SelectItem value="physics">Physics</SelectItem>
                                <SelectItem value="english-literature">English Literature</SelectItem>
                                <SelectItem value="history">History</SelectItem>
                                <SelectItem value="geography">Geography</SelectItem>
                                <SelectItem value="computer-science">Computer Science</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Level</Label>
                            <Select value={courseData.level} onValueChange={(value) => setCourseData(prev => ({ ...prev, level: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gcse">GCSE</SelectItem>
                                <SelectItem value="a-level">A-Level</SelectItem>
                                <SelectItem value="ks3">KS3</SelectItem>
                                <SelectItem value="undergraduate">Undergraduate</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Difficulty</Label>
                            <Select value={courseData.difficulty} onValueChange={(value) => setCourseData(prev => ({ ...prev, difficulty: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label>Duration (minutes)</Label>
                            <Input
                              type="number"
                              value={courseData.duration}
                              onChange={(e) => setCourseData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label>Price ($)</Label>
                            <Input
                              type="number"
                              value={courseData.price}
                              onChange={(e) => setCourseData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Thumbnail URL</Label>
                          <Input
                            value={courseData.thumbnail}
                            onChange={(e) => setCourseData(prev => ({ ...prev, thumbnail: e.target.value }))}
                            placeholder="Enter thumbnail URL"
                          />
                        </div>

                        <div>
                          <Label>Topics</Label>
                          <div className="flex gap-2 mb-2">
                            <Input
                              value={newTopic}
                              onChange={(e) => setNewTopic(e.target.value)}
                              placeholder="Add a topic"
                              onKeyPress={(e) => e.key === 'Enter' && addTopic()}
                            />
                            <Button onClick={addTopic} disabled={!newTopic.trim()}>
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {courseData.topics.map((topic, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {topic}
                                <button
                                  onClick={() => removeTopic(topic)}
                                  className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label>Status</Label>
                          <Select value={courseData.status} onValueChange={(value: string) => setCourseData(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default EditCoursePage;