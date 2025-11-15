'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout';
import {
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  ArrowLeft,
  Home,
  RotateCcw,
  Trophy,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const mockQuestions: Question[] = [
  {
    id: '1',
    type: 'multiple-choice',
    question: 'What is the primary function of mitochondria in cells?',
    options: [
      'Protein synthesis',
      'Energy production (ATP generation)',
      'Cell division',
      'DNA replication'
    ],
    correctAnswer: 1,
    explanation: 'Mitochondria are known as the powerhouses of the cell because they generate most of the cell\'s ATP through cellular respiration.',
    category: 'Cell Biology',
    difficulty: 'medium'
  },
  {
    id: '2',
    type: 'true-false',
    question: 'Photosynthesis occurs in all plant cells.',
    correctAnswer: 'false',
    explanation: 'Photosynthesis primarily occurs in chloroplasts, which are mainly found in leaf cells and other green tissues. Not all plant cells contain chloroplasts.',
    category: 'Plant Biology',
    difficulty: 'easy'
  },
  {
    id: '3',
    type: 'multiple-choice',
    question: 'Which nitrogenous base is found in RNA but not in DNA?',
    options: ['Adenine', 'Guanine', 'Cytosine', 'Uracil'],
    correctAnswer: 3,
    explanation: 'Uracil replaces thymine in RNA. DNA contains thymine while RNA contains uracil.',
    category: 'Genetics',
    difficulty: 'medium'
  },
  {
    id: '4',
    type: 'multiple-choice',
    question: 'What is the correct order of phases in mitosis?',
    options: [
      'Prophase, Metaphase, Anaphase, Telophase',
      'Anaphase, Metaphase, Prophase, Telophase',
      'Telophase, Anaphase, Metaphase, Prophase',
      'Metaphase, Prophase, Telophase, Anaphase'
    ],
    correctAnswer: 0,
    explanation: 'The correct order of mitosis phases is Prophase → Metaphase → Anaphase → Telophase.',
    category: 'Cell Biology',
    difficulty: 'hard'
  },
  {
    id: '5',
    type: 'true-false',
    question: 'All ecosystems require sunlight to function.',
    correctAnswer: 'false',
    explanation: 'While most ecosystems rely on sunlight, there are deep-sea ecosystems that function around hydrothermal vents using chemosynthesis instead of photosynthesis.',
    category: 'Ecology',
    difficulty: 'medium'
  }
];

const QuestionsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const chapterId = searchParams?.get('chapter');

  const [mounted, setMounted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number>('');
  const [answers, setAnswers] = useState<Map<string, string | number>>(new Map());
  const [showResult, setShowResult] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    setMounted(true);
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (mounted && timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      submitQuiz();
    }
  }, [timeLeft, mounted, isSubmitted]);

  const currentQuestion = questions[currentQuestionIndex];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectAnswer = (answer: string | number) => {
    setSelectedAnswer(answer);
    setAnswers(new Map(answers).set(currentQuestion.id, answer));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      const nextAnswer = answers.get(questions[currentQuestionIndex + 1].id);
      setSelectedAnswer(nextAnswer || '');
      setShowResult(false);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevAnswer = answers.get(questions[currentQuestionIndex - 1].id);
      setSelectedAnswer(prevAnswer || '');
      setShowResult(false);
    }
  };

  const checkAnswer = () => {
    setShowResult(true);
  };

  const submitQuiz = () => {
    setIsSubmitted(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question) => {
      const userAnswer = answers.get(question.id);
      if (userAnswer === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const getScorePercentage = () => {
    return Math.round((calculateScore() / questions.length) * 100);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const restart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setAnswers(new Map());
    setShowResult(false);
    setIsSubmitted(false);
    setTimeLeft(600);
    setStartTime(Date.now());
  };

  if (!mounted || !isAuthenticated) {
    return (
      <UnifiedLayout userRole="student" title="Authentication Required">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access practice questions.</p>
            <Button asChild>
              <a href="/auth/signin">Sign In</a>
            </Button>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  if (isSubmitted) {
    const score = calculateScore();
    const percentage = getScorePercentage();
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    return (
      <UnifiedLayout
        userRole="student"
        title="Quiz Results"
        showCourseTabs={true}
        courseId={courseId}
        activeTab="evaluate"
      >
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className={`h-12 w-12 ${percentage >= 70 ? 'text-yellow-500' : percentage >= 50 ? 'text-gray-400' : 'text-red-500'}`} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
              <p className="text-lg text-gray-600">
                {chapterId ? 'Chapter Assessment' : 'Course Assessment'} Results
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className={`text-3xl font-bold mb-2 ${percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {score}/{questions.length}
                  </div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className={`text-3xl font-bold mb-2 ${percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {percentage}%
                  </div>
                  <div className="text-sm text-gray-600">Score</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatTime(timeSpent)}
                  </div>
                  <div className="text-sm text-gray-600">Time Taken</div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Performance Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {percentage >= 70 && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-green-900">Excellent Work!</h3>
                        <p className="text-green-700">You've demonstrated a strong understanding of the material.</p>
                      </div>
                    </div>
                  )}
                  {percentage >= 50 && percentage < 70 && (
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-yellow-900">Good Progress</h3>
                        <p className="text-yellow-700">You have a decent understanding but there's room for improvement.</p>
                      </div>
                    </div>
                  )}
                  {percentage < 50 && (
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-red-900">Keep Practicing</h3>
                        <p className="text-red-700">Review the material and try again to improve your score.</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={restart}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => router.push(`/learning/${courseId}/evaluate`)}>
                <Home className="h-4 w-4 mr-2" />
                Back to Evaluations
              </Button>
            </div>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      userRole="student"
      title={`${chapterId ? 'Chapter Questions' : 'Practice Questions'}`}
      showCourseTabs={true}
      courseId={courseId}
      activeTab="evaluate"
      fullScreen={true}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/learning/${courseId}/evaluate`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Evaluations
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Practice Questions</h1>
                <p className="text-gray-600">
                  {chapterId ? 'Chapter Assessment' : 'Course Assessment'} • {questions.length} questions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-white text-gray-700'
              }`}>
                <Clock className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
              <Button variant="outline" size="sm" onClick={submitQuiz}>
                Submit Quiz
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{currentQuestionIndex + 1} of {questions.length}</span>
            </div>
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />
          </div>
        </div>

        {/* Question */}
        <div className="max-w-4xl mx-auto">
          {currentQuestion && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">
                    Question {currentQuestionIndex + 1}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                      {currentQuestion.difficulty}
                    </span>
                    <span className="text-sm text-gray-500">
                      {currentQuestion.category}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-gray-800 mb-6">{currentQuestion.question}</p>

                {/* Answer Options */}
                {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                  <RadioGroup value={selectedAnswer.toString()} onValueChange={(value) => selectAnswer(parseInt(value))}>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                        {showResult && (
                          <div className="ml-2">
                            {index === currentQuestion.correctAnswer ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : selectedAnswer === index ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : null}
                          </div>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* True/False */}
                {currentQuestion.type === 'true-false' && (
                  <RadioGroup value={selectedAnswer.toString()} onValueChange={selectAnswer}>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                      <RadioGroupItem value="true" id="true" />
                      <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                      {showResult && (
                        <div className="ml-2">
                          {currentQuestion.correctAnswer === 'true' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : selectedAnswer === 'true' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                      <RadioGroupItem value="false" id="false" />
                      <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                      {showResult && (
                        <div className="ml-2">
                          {currentQuestion.correctAnswer === 'false' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : selectedAnswer === 'false' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </RadioGroup>
                )}

                {/* Explanation */}
                {showResult && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    selectedAnswer === currentQuestion.correctAnswer
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <div className="mt-1">
                        {selectedAnswer === currentQuestion.correctAnswer ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium mb-1">
                          {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                        </p>
                        <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers.has(questions[index].id)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>

            {!showResult ? (
              <Button
                onClick={checkAnswer}
                disabled={selectedAnswer === ''}
              >
                Check Answer
              </Button>
            ) : (
              <Button
                onClick={currentQuestionIndex < questions.length - 1 ? nextQuestion : submitQuiz}
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Submit Quiz'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default QuestionsPage;