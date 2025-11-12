'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  Brain,
  Clock,
  Target,
  ArrowRight,
  BarChart3,
  CheckCircle,
  XCircle,
  RotateCcw,
  Home,
  BookOpen,
  Play,
  MessageCircle,
} from "lucide-react";

interface Question {
  id: string;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation?: string;
}

const mockQuestions: Question[] = [
  {
    id: '1',
    subject: 'Mathematics',
    topic: 'Algebra',
    question: 'What is the solution to the equation 2x + 5 = 13?',
    options: ['x = 4', 'x = 6', 'x = 8', 'x = 3'],
    correctAnswer: 0,
    difficulty: 'Easy',
    explanation: 'Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4'
  },
  {
    id: '2',
    subject: 'Biology',
    topic: 'Cell Structure',
    question: 'What is the function of mitochondria in cells?',
    options: [
      'Photosynthesis',
      'Energy production (ATP)',
      'Protein synthesis',
      'Genetic storage'
    ],
    correctAnswer: 1,
    difficulty: 'Medium',
    explanation: 'Mitochondria are the powerhouses of the cell, responsible for producing ATP through cellular respiration'
  },
  {
    id: '3',
    subject: 'English Literature',
    topic: 'Poetry Analysis',
    question: 'What is the term for a repeated sound in poetry?',
    options: ['Metaphor', 'Simile', 'Alliteration', 'Personification'],
    correctAnswer: 2,
    difficulty: 'Easy',
    explanation: 'Alliteration is the repetition of initial consonant sounds in nearby words'
  }
];

const FlashQuiz = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Quiz state
  const [quizState, setQuizState] = useState<'setup' | 'active' | 'results'>('setup');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const subjects = [
    { id: 'mathematics', name: 'Mathematics', icon: BarChart3, color: 'bg-blue-500' },
    { id: 'english-literature', name: 'English Literature', icon: BookOpen, color: 'bg-green-500' },
    { id: 'biology', name: 'Biology', icon: Brain, color: 'bg-purple-500' },
    { id: 'chemistry', name: 'Chemistry', icon: Play, color: 'bg-orange-500' },
  ];

  const difficulties = [
    { id: 'all', name: 'All Levels' },
    { id: 'easy', name: 'Easy' },
    { id: 'medium', name: 'Medium' },
    { id: 'hard', name: 'Hard' },
  ];

  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (quizState === 'active' && startTime) {
      interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizState, startTime]);

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to take a quiz.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  const startQuiz = () => {
    // Filter questions based on selected criteria
    let questions = [...mockQuestions];
    if (selectedSubject && selectedSubject !== 'all') {
      questions = questions.filter(q => q.subject.toLowerCase().includes(selectedSubject));
    }
    if (selectedDifficulty !== 'all') {
      questions = questions.filter(q => q.difficulty.toLowerCase() === selectedDifficulty);
    }

    setQuizQuestions(questions);
    setAnswers(new Array(questions.length).fill(null));
    setQuizState('active');
    setStartTime(Date.now());
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(answers[currentQuestionIndex + 1]);
      setShowFeedback(false);
    } else {
      endQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1]);
      setShowFeedback(false);
    }
  };

  const endQuiz = () => {
    setQuizState('results');
  };

  const restartQuiz = () => {
    setQuizState('setup');
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowFeedback(false);
    setTimeSpent(0);
    setStartTime(null);
  };

  const calculateScore = () => {
    if (quizQuestions.length === 0) return 0;
    const correct = answers.reduce((acc, answer, index) => {
      return acc + (answer === quizQuestions[index].correctAnswer ? 1 : 0);
    }, 0);
    return Math.round((correct / quizQuestions.length) * 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup Screen
  if (quizState === 'setup') {
    return (
      <UnifiedLayout userRole="student">
        <div className="flex-1">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-black" />
              <h1 className="text-2xl font-bold text-gray-900">Flash Quiz</h1>
            </div>
            <p className="text-gray-600 mt-1">Quick assessment to check your understanding</p>
          </div>

          <div className="bg-gray-50 flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">Quiz Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Subject Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Select Subject</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {subjects.map((subject) => (
                        <button
                          key={subject.id}
                          onClick={() => setSelectedSubject(subject.id)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedSubject === subject.id
                              ? 'border-black bg-black/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className={`p-2 rounded-lg ${subject.color}`}>
                              <subject.icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{subject.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Difficulty Level</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {difficulties.map((difficulty) => (
                        <button
                          key={difficulty.id}
                          onClick={() => setSelectedDifficulty(difficulty.id)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            selectedDifficulty === difficulty.id
                              ? 'border-black bg-black/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-sm font-medium text-gray-900">{difficulty.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      onClick={startQuiz}
                      disabled={!selectedSubject}
                      className="w-full md:w-auto"
                    >
                      Start Quiz
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Questions</p>
                        <p className="text-lg font-semibold text-gray-900">5-10</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Avg. Time</p>
                        <p className="text-lg font-semibold text-gray-900">5-10 min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Purpose</p>
                        <p className="text-lg font-semibold text-gray-900">Quick Check</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  // Active Quiz Screen
  if (quizState === 'active' && quizQuestions.length > 0) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

    return (
      <UnifiedLayout userRole="student">
        <div className="flex-1">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-black" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Flash Quiz</h1>
                  <p className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of {quizQuestions.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-mono">{formatTime(timeSpent)}</span>
                </div>
                <Button variant="outline" size="sm" onClick={endQuiz}>
                  End Quiz
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-black h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 flex-1 p-6">
            <div className="max-w-3xl mx-auto">
              <Card>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {currentQuestion.subject}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {currentQuestion.difficulty}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      {currentQuestion.question}
                    </h2>
                  </div>

                  <div className="space-y-3 mb-6">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedAnswer === index;
                      const isCorrect = index === currentQuestion.correctAnswer;
                      const showCorrect = showFeedback && isCorrect;
                      const showWrong = showFeedback && isSelected && !isCorrect;

                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          disabled={showFeedback}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            showCorrect
                              ? 'border-green-500 bg-green-50'
                              : showWrong
                              ? 'border-red-500 bg-red-50'
                              : isSelected
                              ? 'border-black bg-black/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                isSelected || showCorrect
                                  ? 'border-black bg-black'
                                  : 'border-gray-300'
                              }`}>
                                {(isSelected || showCorrect) && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>
                              <span className="text-gray-900">{option}</span>
                            </div>
                            {showCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {showWrong && <XCircle className="h-5 w-5 text-red-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {showFeedback && currentQuestion.explanation && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Explanation:</strong> {currentQuestion.explanation}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                    >
                      Previous
                    </Button>

                    <div className="flex gap-3">
                      {!showFeedback && selectedAnswer !== null && (
                        <Button
                          variant="outline"
                          onClick={() => setShowFeedback(true)}
                        >
                          Check Answer
                        </Button>
                      )}
                      <Button
                        onClick={handleNext}
                        disabled={selectedAnswer === null}
                      >
                        {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish' : 'Next'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  // Results Screen
  if (quizState === 'results') {
    const score = calculateScore();
    const correct = answers.reduce((acc, answer, index) => {
      return acc + (answer === quizQuestions[index].correctAnswer ? 1 : 0);
    }, 0);

    return (
      <UnifiedLayout userRole="student">
        <div className="flex-1">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-black" />
              <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
            </div>
          </div>

          <div className="bg-gray-50 flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {/* Score Summary */}
              <Card className="mb-6">
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                      score >= 80 ? 'bg-green-100' : score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <span className={`text-3xl font-bold ${
                        score >= 80 ? 'text-green-700' : score >= 60 ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        {score}%
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good Job!' : 'Keep Practicing!'}
                    </h2>
                    <p className="text-gray-600">
                      You got {correct} out of {quizQuestions.length} questions correct
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Time Taken</p>
                      <p className="text-xl font-semibold text-gray-900">{formatTime(timeSpent)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Accuracy</p>
                      <p className="text-xl font-semibold text-gray-900">{score}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Questions</p>
                      <p className="text-xl font-semibold text-gray-900">{quizQuestions.length}</p>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3">
                    <Button onClick={restartQuiz} variant="outline">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                    <Button asChild>
                      <a href="/learning">Continue Learning</a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/chats">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Chat with Tutor
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Question Review */}
              <Card>
                <CardHeader>
                  <CardTitle>Question Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {quizQuestions.map((question, index) => {
                      const userAnswer = answers[index];
                      const isCorrect = userAnswer === question.correctAnswer;

                      return (
                        <div key={question.id} className="border-b border-gray-200 pb-4 last:border-0">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              isCorrect ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Question {index + 1}
                                </span>
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {question.subject}
                                </span>
                              </div>
                              <p className="text-gray-900 mb-2">{question.question}</p>
                              <div className="text-sm">
                                <p className="text-gray-600">
                                  Your answer: <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                                    {userAnswer !== null ? question.options[userAnswer] : 'Not answered'}
                                  </span>
                                </p>
                                {!isCorrect && userAnswer !== null && (
                                  <p className="text-green-700">
                                    Correct answer: {question.options[question.correctAnswer]}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  return null;
};

export default FlashQuiz;