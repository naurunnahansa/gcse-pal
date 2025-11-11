'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  Message,
  MessageContent,
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  PromptInput,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  type PromptInputMessage,
} from '@/components/ai-elements';
import { Loader } from '@/components/ai-elements/loader';
import { useChat } from '@ai-sdk/react';
import { useParams } from 'next/navigation';
import {
  MessageCircle,
  Brain,
  BookOpen,
  Target,
  Clock,
  ChevronLeft,
  Lightbulb,
  FileText,
  Video,
  HelpCircle,
  Share2,
  Bookmark,
  History,
} from "lucide-react";

interface TopicResource {
  id: string;
  type: 'video' | 'text' | 'practice' | 'quiz';
  title: string;
  description: string;
  duration?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  resources?: TopicResource[];
}

const TopicChat = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const [mounted, setMounted] = React.useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Mock topic data based on URL parameter
  const topicData = {
    'quadratic-equations': {
      subject: 'Mathematics',
      title: 'Quadratic Equations',
      description: 'Learn to solve quadratic equations using various methods',
      difficulty: 'Intermediate',
      estimatedTime: '45 min',
      icon: Brain,
      color: 'bg-blue-500',
    },
    'cell-structure': {
      subject: 'Biology',
      title: 'Cell Structure and Function',
      description: 'Explore the components and functions of cells',
      difficulty: 'Foundation',
      estimatedTime: '30 min',
      icon: BookOpen,
      color: 'bg-green-500',
    },
    'macbeth-analysis': {
      subject: 'English Literature',
      title: 'Macbeth Act 1 Analysis',
      description: 'Deep dive into Shakespeare\'s Macbeth opening act',
      difficulty: 'Advanced',
      estimatedTime: '60 min',
      icon: FileText,
      color: 'bg-purple-500',
    },
  };

  const currentTopic = topicData[params.topic as keyof typeof topicData] || topicData['quadratic-equations'];

  // Mock conversation history
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hi ${user?.name || 'Student'}! I'm your AI tutor for ${currentTopic.title}. I'm here to help you understand this topic better. What would you like to learn about?`,
      timestamp: new Date(Date.now() - 5 * 60000),
      resources: [
        {
          id: 'r1',
          type: 'video',
          title: 'Introduction to Quadratic Equations',
          description: '5-minute video overview',
          duration: '5 min',
          difficulty: 'Easy',
        },
        {
          id: 'r2',
          type: 'text',
          title: 'Complete Study Guide',
          description: 'Comprehensive written explanation',
          difficulty: 'Intermediate',
        },
      ],
    },
  ]);

  const [input, setInput] = useState('');

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message.text,
      timestamp: new Date(),
    };

    // Simulate AI response
    const aiResponse = generateAIResponse(message.text);
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: aiResponse.content,
      timestamp: new Date(),
      resources: aiResponse.resources,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
  };

  const generateAIResponse = (userInput: string): { content: string; resources?: TopicResource[] } => {
    const responses = [
      {
        content: `Great question! Let me break this down for you. When working with ${currentTopic.title.toLowerCase()}, it's important to understand the fundamental concepts first.`,
        resources: [
          {
            id: 'r3',
            type: 'practice',
            title: 'Practice Problems',
            description: 'Try these 5 practice questions',
            difficulty: 'Medium',
          },
        ],
      },
      {
        content: `I understand you're curious about this aspect. ${currentTopic.title} builds on several key concepts. Let me explain this step by step.`,
        resources: [
          {
            id: 'r4',
            type: 'quiz',
            title: 'Quick Check Quiz',
            description: 'Test your understanding',
            difficulty: 'Easy',
          },
        ],
      },
      {
        content: `That's an excellent question! ${currentTopic.title} can be challenging at first, but with practice it becomes much clearer. Let me show you a practical example.`,
        resources: [],
      },
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleResourceClick = (resource: TopicResource) => {
    // Handle resource clicks - could open modals, navigate to other pages, etc.
    console.log('Resource clicked:', resource);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access the AI tutor.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 flex">
        {/* Topic Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Topic Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)}>
                  ×
                </Button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className={`p-3 rounded-lg ${currentTopic.color}`}>
                  <currentTopic.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{currentTopic.title}</h2>
                  <p className="text-sm text-gray-600">{currentTopic.subject}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{currentTopic.difficulty}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{currentTopic.estimatedTime}</span>
                </div>
              </div>

              <p className="text-sm text-gray-700 mt-3">{currentTopic.description}</p>
            </div>

            {/* Topic Outline */}
            <div className="flex-1 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Topic Outline</h3>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">Introduction</p>
                  <p className="text-xs text-gray-600">Basic concepts and definitions</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">Core Concepts</p>
                  <p className="text-xs text-gray-600">Essential principles and rules</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">Problem Solving</p>
                  <p className="text-xs text-gray-600">Step-by-step examples</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">Practice</p>
                  <p className="text-xs text-gray-600">Exercises and applications</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Watch Video Lesson
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View Study Guide
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Take Practice Quiz
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!showSidebar && (
                  <Button variant="ghost" size="sm" onClick={() => setShowSidebar(true)}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Show Topic
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-black" />
                  <div>
                    <h1 className="font-bold text-gray-900">AI Tutor Chat</h1>
                    <p className="text-sm text-gray-600">
                      {currentTopic.title} • {currentTopic.subject}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-1" />
                  History
                </Button>
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4 mr-1" />
                  Save Chat
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              <div className="flex-1">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        message.type === 'user'
                          ? 'bg-black text-white'
                          : 'bg-white border border-gray-200'
                      } rounded-lg p-4`}
                    >
                      <div className="mb-2">
                        {message.content.split('\n').map((line, index) => (
                          <p key={index} className={index === 0 ? 'font-medium' : ''}>
                            {line}
                          </p>
                        ))}
                      </div>

                      {/* Resources */}
                      {message.resources && message.resources.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm opacity-75">Helpful Resources:</p>
                          {message.resources.map((resource) => (
                            <button
                              key={resource.id}
                              onClick={() => handleResourceClick(resource)}
                              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                                message.type === 'user'
                                  ? 'border-white/20 hover:border-white/40 bg-white/10'
                                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${
                                resource.type === 'video' ? 'bg-red-100' :
                                resource.type === 'text' ? 'bg-blue-100' :
                                resource.type === 'practice' ? 'bg-green-100' :
                                'bg-purple-100'
                              }`}>
                                {resource.type === 'video' && <Video className="h-4 w-4 text-red-600" />}
                                {resource.type === 'text' && <FileText className="h-4 w-4 text-blue-600" />}
                                {resource.type === 'practice' && <Target className="h-4 w-4 text-green-600" />}
                                {resource.type === 'quiz' && <HelpCircle className="h-4 w-4 text-purple-600" />}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{resource.title}</p>
                                <p className="text-xs opacity-75">{resource.description}</p>
                                {resource.duration && (
                                  <p className="text-xs opacity-75">{resource.duration}</p>
                                )}
                              </div>
                              <Lightbulb className="h-4 w-4 opacity-50" />
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2 text-xs opacity-60">
                        <span>{formatTime(message.timestamp)}</span>
                        <span>•</span>
                        <span>{message.type === 'user' ? 'You' : 'AI Tutor'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="mt-4">
                <PromptInput onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg">
                  <PromptInputBody>
                    <PromptInputTextarea
                      placeholder={`Ask me anything about ${currentTopic.title.toLowerCase()}...`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      rows={3}
                    />
                  </PromptInputBody>
                  <PromptInputFooter>
                    <PromptInputSubmit disabled={!input.trim()} />
                  </PromptInputFooter>
                </PromptInput>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TopicChat;