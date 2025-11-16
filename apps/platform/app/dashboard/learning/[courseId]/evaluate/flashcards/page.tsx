'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout';
import {
  Lightbulb,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  RotateCw,
  Home,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface FlashCard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const mockFlashCards: FlashCard[] = [
  {
    id: '1',
    front: 'What is the primary function of mitochondria in cells?',
    back: 'Mitochondria are the powerhouses of the cell, responsible for generating ATP through cellular respiration.',
    category: 'Cell Biology',
    difficulty: 'medium'
  },
  {
    id: '2',
    front: 'Define photosynthesis',
    back: 'Photosynthesis is the process by which plants, algae, and some bacteria convert light energy into chemical energy stored in glucose.',
    category: 'Plant Biology',
    difficulty: 'easy'
  },
  {
    id: '3',
    front: 'What is the difference between DNA and RNA?',
    back: 'DNA contains deoxyribose sugar and uses thymine, while RNA contains ribose sugar and uses uracil instead of thymine. DNA is typically double-stranded, RNA is single-stranded.',
    category: 'Genetics',
    difficulty: 'medium'
  },
  {
    id: '4',
    front: 'Explain the process of mitosis',
    back: 'Mitosis is cell division that produces two identical daughter cells. It consists of prophase, metaphase, anaphase, and telophase.',
    category: 'Cell Biology',
    difficulty: 'hard'
  },
  {
    id: '5',
    front: 'What is an ecosystem?',
    back: 'An ecosystem is a community of living organisms interacting with each other and their non-living environment in a specific area.',
    category: 'Ecology',
    difficulty: 'easy'
  }
];

const FlashCardsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const chapterId = searchParams?.get('chapter');

  const [mounted, setMounted] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [cards, setCards] = useState<FlashCard[]>(mockFlashCards);
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
  const [correctCards, setCorrectCards] = useState<Set<string>>(new Set());
  const [incorrectCards, setIncorrectCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentCard = cards[currentCardIndex];

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowBack(false);
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowBack(false);
    }
  };

  const flipCard = () => {
    setShowBack(!showBack);
    setReviewedCards(new Set([...reviewedCards, currentCard.id]));
  };

  const markCorrect = () => {
    setCorrectCards(new Set([...correctCards, currentCard.id]));
    setIncorrectCards(new Set([...incorrectCards].filter(id => id !== currentCard.id)));
    nextCard();
  };

  const markIncorrect = () => {
    setIncorrectCards(new Set([...incorrectCards, currentCard.id]));
    setCorrectCards(new Set([...correctCards].filter(id => id !== currentCard.id)));
    nextCard();
  };

  const restart = () => {
    setCurrentCardIndex(0);
    setShowBack(false);
    setReviewedCards(new Set());
    setCorrectCards(new Set());
    setIncorrectCards(new Set());
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!mounted || !isAuthenticated) {
    return (
      <UnifiedLayout userRole="student" title="Authentication Required">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access flash cards.</p>
            <Button asChild>
              <a href="/auth/signin">Sign In</a>
            </Button>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      userRole="student"
      title={`${chapterId ? 'Chapter Flash Cards' : 'Course Flash Cards'}`}
      showCourseTabs={true}
      courseId={courseId}
      activeTab="evaluate"
      fullScreen={true}
    >
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-6">
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
                <h1 className="text-2xl font-bold text-gray-900">Flash Cards</h1>
                <p className="text-gray-600">
                  {chapterId ? 'Chapter Review' : 'Course Review'} • {cards.length} cards
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={restart}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push(`/learning/${courseId}/evaluate`)}>
                <Home className="h-4 w-4 mr-2" />
                Exit
              </Button>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{currentCardIndex + 1}/{cards.length}</div>
              <div className="text-sm text-gray-600">Current Card</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{correctCards.size}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{incorrectCards.size}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{reviewedCards.size}</div>
              <div className="text-sm text-gray-600">Reviewed</div>
            </div>
          </div>
        </div>

        {/* Flash Card */}
        <div className="max-w-4xl mx-auto">
          {currentCard && (
            <div className="space-y-6">
              {/* Card */}
              <div className="relative">
                <Card
                  className={`mx-auto max-w-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    showBack ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'
                  }`}
                  onClick={flipCard}
                  style={{ minHeight: '400px' }}
                >
                  <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                    {/* Card Header */}
                    <div className="w-full flex justify-between items-start mb-6">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        showBack ? 'bg-blue-500 text-white' : getDifficultyColor(currentCard.difficulty)
                      }`}>
                        {currentCard.difficulty}
                      </div>
                      <div className={`text-sm ${
                        showBack ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {currentCard.category}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="text-center flex-1 flex items-center justify-center w-full">
                      <p className="text-lg font-medium leading-relaxed">
                        {showBack ? currentCard.back : currentCard.front}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="w-full flex justify-center mt-6">
                      <div className={`text-sm ${
                        showBack ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {showBack ? (
                          <span className="flex items-center gap-2">
                            <EyeOff className="h-4 w-4" />
                            Click to hide answer
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Click to reveal answer
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card Navigation */}
                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="outline"
                    onClick={previousCard}
                    disabled={currentCardIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    {cards.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentCardIndex
                            ? 'bg-orange-500'
                            : index < currentCardIndex
                              ? 'bg-gray-400'
                              : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    onClick={nextCard}
                    disabled={currentCardIndex === cards.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              {showBack && (
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={markIncorrect}
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Incorrect
                  </Button>
                  <Button
                    size="lg"
                    onClick={markCorrect}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Correct
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Completion Message */}
          {currentCardIndex === cards.length - 1 && reviewedCards.size === cards.length && (
            <div className="text-center mt-8">
              <Card className="max-w-md mx-auto">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Great Job!</h3>
                  <p className="text-gray-600 mb-4">
                    You've completed all {cards.length} flash cards
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Correct:</span>
                      <span className="font-medium text-green-600">{correctCards.size}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Incorrect:</span>
                      <span className="font-medium text-red-600">{incorrectCards.size}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Accuracy:</span>
                      <span className="font-medium">
                        {Math.round((correctCards.size / reviewedCards.size) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={restart} className="flex-1">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    <Button onClick={() => router.push(`/learning/${courseId}/evaluate`)} className="flex-1">
                      Back to Evaluations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default FlashCardsPage;