'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useChat } from '@ai-sdk/react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
import { MessageCircle, GlobeIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  isPublished: boolean;
  hasVideo: boolean;
  hasMarkdown: boolean;
  userProgress?: {
    status: string;
    completedAt?: string;
    timeSpent: number;
    score?: number;
  };
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  isPublished: boolean;
  lessons: Lesson[];
  lessonsCount: number;
  totalDuration: number;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  thumbnail?: string;
  instructor: string;
  duration: number;
  difficulty: string;
  topics: string[];
  price: number;
  status: string;
  rating: number;
  enrollmentCount: number;
  chapters: Chapter[];
  userEnrollment?: {
    id: string;
    enrolledAt: string;
    progress: number;
    status: string;
    completedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const models = [
  {
    name: 'Claude 3 Haiku',
    value: 'anthropic/claude-3-haiku-20240307',
  },
  {
    name: 'Claude 3 Sonnet',
    value: 'anthropic/claude-3-sonnet-20240229',
  },
];

const CourseChatPage = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatModel, setChatModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [isEnrolledFromClient, setIsEnrolledFromClient] = useState<boolean | null>(null);

  const { messages, sendMessage, status } = useChat({
  api: '/api/chat',
  onError: (error) => {
    console.error('Chat error:', error);
    toast.error('Failed to send message. Please try again.');
  }
});

  useEffect(() => {
    setMounted(true);
    if (courseId) {
      fetchCourse();
    }
  }, [courseId, isAuthenticated]);

  useEffect(() => {
    if (course && isEnrolledFromClient === null) {
      const checkEnrollmentFromClient = async () => {
        try {
          const response = await fetch('/api/enrollments/my');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.enrollments) {
              const found = data.data.enrollments.some((e: any) => e.courseId === course.id);
              setIsEnrolledFromClient(found);
            }
          }
        } catch (error) {
          console.error('Failed to check enrollment from client:', error);
          setIsEnrolledFromClient(false);
        }
      };
      checkEnrollmentFromClient();
    }
  }, [course?.id, isEnrolledFromClient]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      const result = await response.json();
      if (result.success) {
        setCourse(result.data);
      } else {
        throw new Error(result.error || 'Failed to load course');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load course');
      router.push('/learning/courses/browse');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    // Create course context for system prompt
    const courseContext = course ?
      `You are helping with the course "${course.title}" in ${course.subject}. ${course.description}\n\nTopics covered: ${course.topics.join(', ')}\nDifficulty: ${course.difficulty}\nLevel: ${course.level}`
      : 'You are helping with a course.';

    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files
      },
      {
        body: {
          model: chatModel,
          webSearch: webSearch,
          courseContext: courseContext,
        },
      },
    );
    setChatInput('');
  };

  if (!mounted || !isAuthenticated) {
    return (
      <UnifiedLayout userRole="student" title="Authentication Required">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access course content.</p>
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
      <UnifiedLayout userRole="student" title="Loading Course">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading course...</p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  if (!course) {
    return (
      <UnifiedLayout userRole="student" title="Course Not Found">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
            <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/learning/courses/browse')}>
              Browse Courses
            </Button>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  const isEnrolledFromAPI = !!course.userEnrollment;
  const isEnrolled = isEnrolledFromAPI || isEnrolledFromClient === true;

  if (!isEnrolled) {
    return (
      <UnifiedLayout
        userRole="student"
        title={course.title}
        showCourseTabs={true}
        courseId={courseId}
        activeTab="chat"
      >
        <div className="max-w-7xl mx-auto p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Enroll to Access AI Tutor</h3>
              <p className="text-gray-600">You need to enroll in this course to chat with the AI tutor.</p>
            </CardContent>
          </Card>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      userRole="student"
      title={course.title}
      showCourseTabs={true}
      courseId={courseId}
      activeTab="chat"
      fullScreen={true}
    >
      {/* Full screen chat interface */}
      <div className="h-[calc(100vh-4rem)] bg-white m-0">
        {/* Chat container */}
        <div className="flex flex-col h-full">
  
          {/* Chat messages area */}
          <div className="flex-1 overflow-hidden">
            <Conversation className="h-full">
              <ConversationContent className="px-6 py-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                      <Sources>
                        <SourcesTrigger
                          count={
                            message.parts.filter(
                              (part) => part.type === 'source-url',
                            ).length
                          }
                        />
                        {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                          <SourcesContent key={`${message.id}-${i}`}>
                            <Source
                              key={`${message.id}-${i}`}
                              href={part.url}
                              title={part.url}
                            />
                          </SourcesContent>
                        ))}
                      </Sources>
                    )}
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case 'text':
                          return (
                            <Message key={`${message.id}-${i}`} from={message.role}>
                              <MessageContent>
                                {part.text}
                              </MessageContent>
                            </Message>
                          );
                        case 'reasoning':
                          return (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              className="w-full"
                              isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        default:
                          return null;
                      }
                    })}
                  </div>
                ))}
                {status === 'submitted' && <Loader />}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          </div>

          {/* Chat input area */}
          <div className="border-t bg-white px-6 py-4">
            <PromptInput onSubmit={handleChatSubmit} globalDrop multiple>
              <PromptInputHeader>
                <PromptInputAttachments>
                  {(attachment) => <PromptInputAttachment data={attachment} />}
                </PromptInputAttachments>
              </PromptInputHeader>
              <PromptInputBody>
                <PromptInputTextarea
                  onChange={(e) => setChatInput(e.target.value)}
                  value={chatInput}
                  placeholder={`Ask about ${course?.title || 'this course'}...`}
                />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools>
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger />
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                  <PromptInputButton
                    variant={webSearch ? 'default' : 'ghost'}
                    onClick={() => setWebSearch(!webSearch)}
                  >
                    <GlobeIcon size={16} />
                    <span>Search</span>
                  </PromptInputButton>
                  <PromptInputSelect
                    onValueChange={(value) => {
                      setChatModel(value);
                    }}
                    value={chatModel}
                  >
                    <PromptInputSelectTrigger>
                      <PromptInputSelectValue />
                    </PromptInputSelectTrigger>
                    <PromptInputSelectContent>
                      {models.map((model) => (
                        <PromptInputSelectItem key={model.value} value={model.value}>
                          {model.name}
                        </PromptInputSelectItem>
                      ))}
                    </PromptInputSelectContent>
                  </PromptInputSelect>
                </PromptInputTools>
                <PromptInputSubmit disabled={!chatInput && !status} status={status} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default CourseChatPage;