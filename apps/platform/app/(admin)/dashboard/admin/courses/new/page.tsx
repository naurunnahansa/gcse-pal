'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Upload, Save, Eye, FileText, Settings, BookOpen, ChevronRight, ChevronDown, File, Video, Edit3, Download, FileJson, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
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

interface SelectedPage {
  type: 'course' | 'chapter' | 'lesson';
  chapterId?: string;
  lessonId?: string;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [topicInput, setTopicInput] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [selectedPage, setSelectedPage] = useState<SelectedPage>({ type: 'course' });
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    subject: '',
    level: 'gcse',
    difficulty: 'beginner',
    instructor: '',
    duration: 0,
    price: 0,
    topics: [],
    status: 'draft',
    chapters: [],
  });

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!courseData.title.trim() || !courseData.description.trim()) return;

    setIsAutoSaving(true);
    try {
      // Save to localStorage as draft
      localStorage.setItem('course-draft', JSON.stringify(courseData));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [courseData]);

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('course-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setCourseData(prev => ({ ...prev, ...draft }));
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, []);

  // Auto-save on changes with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave();
    }, 2000); // 2 seconds debounce

    return () => clearTimeout(timer);
  }, [courseData, autoSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save as draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit('draft');
      }
      // Ctrl/Cmd + Enter to publish
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit('published');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [courseData]);

  const handleInputChange = (field: keyof CourseData, value: any) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTopic = () => {
    if (topicInput.trim() && !courseData.topics.includes(topicInput.trim())) {
      setCourseData(prev => ({
        ...prev,
        topics: [...prev.topics, topicInput.trim()]
      }));
      setTopicInput('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setCourseData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }));
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: '',
      description: '',
      order: courseData.chapters.length,
      duration: 0,
      isPublished: false,
      lessons: []
    };

    setCourseData(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter]
    }));
  };

  const updateChapter = (chapterId: string, field: keyof Chapter, value: any) => {
    setCourseData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId ? { ...chapter, [field]: value } : chapter
      )
    }));
  };

  const removeChapter = (chapterId: string) => {
    setCourseData(prev => ({
      ...prev,
      chapters: prev.chapters.filter(chapter => chapter.id !== chapterId)
    }));
  };

  const addLesson = (chapterId: string) => {
    const chapter = courseData.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const newLesson: Lesson = {
      id: Date.now().toString(),
      title: '',
      description: '',
      duration: 0,
      order: chapter.lessons.length,
      isPublished: false
    };

    updateChapter(chapterId, 'lessons', [...chapter.lessons, newLesson]);
  };

  const updateLesson = (chapterId: string, lessonId: string, field: keyof Lesson, value: any) => {
    const chapter = courseData.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const updatedLessons = chapter.lessons.map(lesson =>
      lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
    );

    updateChapter(chapterId, 'lessons', updatedLessons);
  };

  const removeLesson = (chapterId: string, lessonId: string) => {
    const chapter = courseData.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const updatedLessons = chapter.lessons.filter(lesson => lesson.id !== lessonId);
    updateChapter(chapterId, 'lessons', updatedLessons);
  };

  const calculateTotalDuration = () => {
    return courseData.chapters.reduce((total, chapter) => {
      const chapterDuration = chapter.lessons.reduce((chapterTotal, lesson) => {
        return chapterTotal + (lesson.duration || 0);
      }, 0);
      return total + Math.max(chapter.duration || 0, chapterDuration);
    }, 0);
  };

  const validateCourse = () => {
    const errors = [];

    if (!courseData.title.trim()) errors.push('Course title is required');
    if (!courseData.description.trim()) errors.push('Course description is required');
    if (!courseData.subject) errors.push('Subject is required');
    if (!courseData.instructor.trim()) errors.push('Instructor name is required');
    if (courseData.chapters.length === 0) errors.push('At least one chapter is required');

    const chaptersWithLessons = courseData.chapters.filter(chapter => chapter.lessons.length > 0);
    if (chaptersWithLessons.length === 0) errors.push('At least one chapter must have lessons');

    for (const chapter of courseData.chapters) {
      if (!chapter.title.trim()) {
        errors.push(`Chapter ${chapter.order + 1} title is required`);
      }
      for (const lesson of chapter.lessons) {
        if (!lesson.title.trim()) {
          errors.push(`Lesson in chapter ${chapter.order + 1} title is required`);
        }
      }
    }

    return errors;
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    const errors = validateCourse();
    if (errors.length > 0) {
      toast.error('Please fix the following errors:', {
        description: errors.join(', ')
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const courseToSubmit = {
        ...courseData,
        status,
        duration: calculateTotalDuration(),
      };

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseToSubmit),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Course creation API error:', error);
        throw new Error(error.error || error.message || 'Failed to create course');
      }

      const result = await response.json();

      toast.success(`Course ${status === 'published' ? 'published' : 'saved as draft'} successfully!`, {
        description: `"${courseData.title}" has been created.`
      });

      // Clear draft from localStorage
      localStorage.removeItem('course-draft');

      // Redirect to course management or course edit page
      router.push('/dashboard/admin/courses');

    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('course-draft');
    setLastSaved(null);
    toast.info('Draft cleared');
  };

  const toggleChapterExpanded = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const selectPage = (page: SelectedPage) => {
    setSelectedPage(page);
  };

  const getSelectedContent = () => {
    if (selectedPage.type === 'course') {
      return {
        title: courseData.title,
        description: courseData.description,
        content: '',
        type: 'course'
      };
    } else if (selectedPage.type === 'chapter') {
      const chapter = courseData.chapters.find(c => c.id === selectedPage.chapterId);
      if (!chapter) return null;
      return {
        title: chapter.title,
        description: chapter.description,
        content: '',
        type: 'chapter',
        chapter
      };
    } else if (selectedPage.type === 'lesson') {
      const chapter = courseData.chapters.find(c => c.id === selectedPage.chapterId);
      if (!chapter) return null;
      const lesson = chapter.lessons.find(l => l.id === selectedPage.lessonId);
      if (!lesson) return null;
      return {
        title: lesson.title,
        description: lesson.description,
        content: lesson.content || '',
        videoUrl: lesson.videoUrl,
        type: 'lesson',
        chapter,
        lesson
      };
    }
    return null;
  };

  const updateSelectedContent = (field: string, value: any) => {
    if (selectedPage.type === 'course') {
      handleInputChange(field as keyof CourseData, value);
    } else if (selectedPage.type === 'chapter') {
      updateChapter(selectedPage.chapterId!, field as keyof Chapter, value);
    } else if (selectedPage.type === 'lesson') {
      updateLesson(selectedPage.chapterId!, selectedPage.lessonId!, field as keyof Lesson, value);
    }
  };

  const downloadCourseJSON = () => {
    try {
      const courseExport = {
        ...courseData,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        type: 'course-export'
      };

      const jsonString = JSON.stringify(courseExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${courseData.title || 'course'}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Course exported successfully', {
        description: 'The course data has been downloaded as a JSON file.'
      });
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'An error occurred while exporting the course.'
      });
    }
  };

  const uploadCourseJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Invalid file type', {
        description: 'Please select a JSON file to import.'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // Validate the structure
        if (!importedData.type || importedData.type !== 'course-export') {
          throw new Error('Invalid course file format');
        }

        // Basic validation of required fields
        if (!importedData.title || !importedData.description || !importedData.chapters) {
          throw new Error('Missing required course data');
        }

        // Validate chapters and lessons structure
        if (!Array.isArray(importedData.chapters)) {
          throw new Error('Invalid chapters data');
        }

        for (const chapter of importedData.chapters) {
          if (!chapter.id || !chapter.title) {
            throw new Error('Invalid chapter data');
          }
          if (chapter.lessons && !Array.isArray(chapter.lessons)) {
            throw new Error('Invalid lessons data');
          }
        }

        // Remove export-specific fields
        const { exportedAt, version, type, ...courseImport } = importedData;

        // Apply the imported data
        setCourseData({
          title: courseImport.title || '',
          description: courseImport.description || '',
          subject: courseImport.subject || '',
          level: courseImport.level || 'gcse',
          difficulty: courseImport.difficulty || 'beginner',
          instructor: courseImport.instructor || '',
          duration: courseImport.duration || 0,
          price: courseImport.price || 0,
          topics: courseImport.topics || [],
          thumbnail: courseImport.thumbnail || '',
          status: courseImport.status || 'draft',
          chapters: courseImport.chapters || []
        });

        toast.success('Course imported successfully', {
          description: `"${importedData.title}" has been loaded. Don't forget to save your changes!`
        });

      } catch (error) {
        toast.error('Import failed', {
          description: error instanceof Error ? error.message : 'An error occurred while importing the course file.'
        });
      }
    };

    reader.readAsText(file);

    // Reset the file input
    event.target.value = '';
  };

  if (!isAuthenticated) {
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

  return (
    <div className="flex-1 bg-white h-screen flex flex-col">
        {/* Document-style header with save controls */}
        <header className="sticky top-0 z-10 bg-white border-b px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <Input
                value={courseData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Course Title..."
                className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0 py-0 w-96"
              />
            </div>

            <div className="flex items-center gap-3">
              {lastSaved && (
                <span className="text-sm text-muted-foreground">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {isAutoSaving && (
                <span className="text-sm text-blue-600">Saving...</span>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearDraft}
                disabled={!lastSaved}
              >
                Clear Draft
              </Button>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={uploadCourseJSON}
                  className="hidden"
                  id="import-json"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('import-json')?.click()}
                  disabled={isSubmitting}
                >
                  <FileJson className="w-4 h-4 mr-2" />
                  Import
                </Button>

                <Button
                  variant="outline"
                  onClick={downloadCourseJSON}
                  disabled={isSubmitting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>

              <Button
                onClick={() => handleSubmit('published')}
                disabled={isSubmitting}
              >
                <Eye className="w-4 h-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-6 mt-4">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Edit Course Content
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Edit Course Settings
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 bg-white overflow-hidden">
          {activeTab === 'content' ? (
            <div className="flex h-full">
              {/* Left sidebar with pages */}
              <aside className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                <div className="p-4">
                  <div className="mb-4">
                    <button
                      onClick={() => selectPage({ type: 'course' })}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors ${
                        selectedPage.type === 'course'
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <div className="flex-1">
                        <div className="font-medium">Course Overview</div>
                        <div className="text-sm opacity-75">Course description and details</div>
                      </div>
                    </button>
                  </div>

                  {/* Chapters and Lessons */}
                  <div className="space-y-1">
                    {courseData.chapters.map((chapter) => (
                      <div key={chapter.id} className="mb-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleChapterExpanded(chapter.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {expandedChapters.has(chapter.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => selectPage({ type: 'chapter', chapterId: chapter.id })}
                            className={`flex-1 text-left px-2 py-1 rounded-md flex items-center gap-2 transition-colors ${
                              selectedPage.type === 'chapter' && selectedPage.chapterId === chapter.id
                                ? 'bg-blue-100 text-blue-700'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <File className="w-4 h-4" />
                            <span className="text-sm font-medium">{chapter.title || 'Untitled Chapter'}</span>
                          </button>
                        </div>

                        {expandedChapters.has(chapter.id) && (
                          <div className="ml-6 mt-1 space-y-1">
                            {chapter.lessons.map((lesson) => (
                              <button
                                key={lesson.id}
                                onClick={() => selectPage({ type: 'lesson', chapterId: chapter.id, lessonId: lesson.id })}
                                className={`w-full text-left px-2 py-1 rounded-md flex items-center gap-2 transition-colors ${
                                  selectedPage.type === 'lesson' && selectedPage.lessonId === lesson.id
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'hover:bg-gray-100 text-gray-600'
                                }`}
                              >
                                <Video className="w-3 h-3" />
                                <span className="text-sm">{lesson.title || 'Untitled Lesson'}</span>
                              </button>
                            ))}
                            <Button
                              onClick={() => addLesson(chapter.id)}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-gray-500 hover:text-blue-500 text-xs h-6 px-2"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              New Lesson
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}

                    <Button
                      onClick={addChapter}
                      variant="ghost"
                      className="w-full justify-start text-gray-500 hover:text-blue-500 text-sm h-8"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Chapter
                    </Button>
                  </div>
                </div>
              </aside>

              {/* Main content editor */}
              <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  {(() => {
                    const content = getSelectedContent();
                    if (!content) return <div className="text-center text-gray-500 py-8">Select a page to edit</div>;

                    return (
                      <div className="space-y-6">
                        <div>
                          <Input
                            value={content.title}
                            onChange={(e) => updateSelectedContent('title', e.target.value)}
                            placeholder={content.type === 'course' ? 'Course Title' :
                                       content.type === 'chapter' ? 'Chapter Title' : 'Lesson Title'}
                            className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto p-0 mb-4"
                          />
                        </div>

                        <div>
                          <Textarea
                            value={content.description}
                            onChange={(e) => updateSelectedContent('description', e.target.value)}
                            placeholder={content.type === 'course' ? 'Course description...' :
                                       content.type === 'chapter' ? 'Chapter description...' : 'Lesson description...'}
                            rows={content.type === 'course' ? 6 : 3}
                            className="border-none shadow-none focus-visible:ring-0 px-0 resize-none text-lg"
                          />
                        </div>

                        {content.type === 'lesson' && (
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Video URL</Label>
                              <Input
                                value={content.videoUrl || ''}
                                onChange={(e) => updateSelectedContent('videoUrl', e.target.value)}
                                placeholder="https://example.com/video.mp4"
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700">Duration (minutes)</Label>
                              <Input
                                type="number"
                                value={content.lesson?.duration || 0}
                                onChange={(e) => updateSelectedContent('duration', parseInt(e.target.value) || 0)}
                                placeholder="0"
                                min="0"
                                className="mt-1 w-32"
                              />
                            </div>
                          </div>
                        )}

                        {content.type === 'lesson' && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Lesson Content</Label>
                            <Textarea
                              value={content.content}
                              onChange={(e) => updateSelectedContent('content', e.target.value)}
                              placeholder="Write your lesson content here..."
                              rows={12}
                              className="mt-2 border border-gray-200 rounded-lg p-4"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </main>
            </div>
          ) : (
            /* Settings Tab */
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Details</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="instructor">Instructor</Label>
                        <Input
                          id="instructor"
                          value={courseData.instructor}
                          onChange={(e) => handleInputChange('instructor', e.target.value)}
                          placeholder="e.g., Dr. Sarah Smith"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Select value={courseData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mathematics">Mathematics</SelectItem>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="science">Science</SelectItem>
                            <SelectItem value="history">History</SelectItem>
                            <SelectItem value="geography">Geography</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Level</Label>
                          <Select value={courseData.level} onValueChange={(value) => handleInputChange('level', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gcse">GCSE</SelectItem>
                              <SelectItem value="igcse">IGCSE</SelectItem>
                              <SelectItem value="a_level">A-Level</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Difficulty</Label>
                          <Select value={courseData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price">Price (£)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={courseData.price}
                          onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="thumbnail">Thumbnail URL</Label>
                        <Input
                          id="thumbnail"
                          value={courseData.thumbnail || ''}
                          onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                          placeholder="https://example.com/thumbnail.jpg"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Topics</h3>
                    <div className="space-y-2">
                      <Input
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        placeholder="Add topic tag..."
                        onKeyPress={(e) => e.key === 'Enter' && addTopic()}
                      />
                      <div className="flex flex-wrap gap-2">
                        {courseData.topics.map((topic, index) => (
                          <Badge key={index} variant="secondary" className="cursor-pointer">
                            {topic}
                            <button
                              onClick={() => removeTopic(topic)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{courseData.chapters.length}</div>
                        <div className="text-gray-500">Chapters</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {courseData.chapters.reduce((total, chapter) => total + chapter.lessons.length, 0)}
                        </div>
                        <div className="text-gray-500">Lessons</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{calculateTotalDuration()}</div>
                        <div className="text-gray-500">Minutes</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">£{courseData.price.toFixed(2)}</div>
                        <div className="text-gray-500">Price</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Import/Export Info Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Import/Export</h3>
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileJson className="w-4 h-4" />
                            Export Course
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-3">
                            Download your course as a JSON file for backup or sharing.
                          </p>
                          <div className="space-y-2 text-xs text-gray-500">
                            <p>• Includes all chapters and lessons</p>
                            <p>• Preserves course structure</p>
                            <p>• Easy to import back</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Import Course
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-3">
                            Upload a JSON file to restore or duplicate a course.
                          </p>
                          <div className="space-y-2 text-xs text-gray-500">
                            <p>• Only accepts exported JSON files</p>
                            <p>• Validates data structure</p>
                            <p>• Replaces current content</p>
                          </div>
                          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-800">
                                Import will replace your current course content. Save your work first!
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Button
                            onClick={downloadCourseJSON}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Current Course
                          </Button>
                          <div>
                            <input
                              type="file"
                              accept=".json"
                              onChange={uploadCourseJSON}
                              className="hidden"
                              id="import-json-settings"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => document.getElementById('import-json-settings')?.click()}
                            >
                              <FileJson className="w-4 h-4 mr-2" />
                              Import Course File
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}