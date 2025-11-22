'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Header from "@/components/Header";
import QuestionCard from "@/components/QuestionCard";
import { approveQuestion, 
  disapproveQuestion, 
  getAllQuestionsWithAnswers,
  approveAnswer,
  disapproveAnswer,
} from "./actions";

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    const questions = await getAllQuestionsWithAnswers();
    setQuestions(questions)
  }

  const onQuestionApproved = async (id: number) => {
    await approveQuestion(id)
    fetchQuestions()
  }

  const onQuestionDisapproved = async (id: number) => {
    await disapproveQuestion(id)
    fetchQuestions()
  }

  const onAnswerApproved = async (answerId: number) => {
    await approveAnswer(answerId)
    fetchQuestions()
  }

  const onAnswerDisapproved = async (answerId: number) => {
    await disapproveAnswer(answerId)
    fetchQuestions()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="flex justify-end mb-4">
          <Button>
            <Link href="/admin/set-user-roles">Set Roles</Link>
          </Button>
        </div>
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard 
              key={question.id}
              question={question} 
              onQuestionApproved={onQuestionApproved}
              onQuestionDisapproved={onQuestionDisapproved}
              onAnswerApproved={onAnswerApproved}
              onAnswerDisapproved={onAnswerDisapproved}
            />
          ))}
        </div>
      </main>
    </div>
  );
}