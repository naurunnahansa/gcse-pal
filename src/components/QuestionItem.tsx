import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Pencil, Trash2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import AnswerItem from './AnswerItem'
import { formatDate } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'

interface Props {
  question: Question
  onEditQuestion: (id: number, newText: string) => void
  onDeleteQuestion: (id: number) => void
  onAddAnswer: (questionId: number, answerText: string) => void
  onEditAnswer: (answerId: number, newText: string) => void
  onDeleteAnswer: (answerId: number) => void
}

export default function QuestionItem({
  question,
  onEditQuestion,
  onDeleteQuestion,
  onAddAnswer,
  onEditAnswer,
  onDeleteAnswer,
}: Props) {
  const { user } = useUser()
  const [answer, setAnswer] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedQuestion, setEditedQuestion] = useState(question.quiz)
  const [showSubmitText, setShowSubmitText] = useState(false)

  useEffect(() => {
    if(showSubmitText) {
      setTimeout(() => {
        setShowSubmitText(false)
      }, 7000)
    }
  }, [showSubmitText])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (answer.trim()) {
      if (question.id !== null) {
        onAddAnswer(question.id, answer)
        setShowSubmitText(true)
      }
      setAnswer('')
    }
  }

  const handleQuestionEdit = () => {
    if (editedQuestion.trim() && editedQuestion !== question.quiz) {
      if (question.id !== null) {
        onEditQuestion(question.id, editedQuestion)
      }
      setIsEditing(false)
    }
  }

  const handleAnswerEdit = async (answerId: number | null, newText: string) => {
    if (answerId !== null && question.id !== null) {
      await onEditAnswer(answerId, newText)
    }
  }

  const handleAnswerDelete = async (answerId: number | null) => {
    if (answerId !== null && question.id !== null) {
      await onDeleteAnswer(answerId)
    }
  }

  return (
    <Card>
      <CardHeader>
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={editedQuestion}
              onChange={(e) => setEditedQuestion(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={handleQuestionEdit}>Save</Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <CardTitle>{question.quiz}</CardTitle>
              
              {user?.id === question.contributorId && (
                <div>
                  <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => question.id !== null && onDeleteQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              <span>{question.contributor}</span>
              <span> • </span>
              <span>{question.timestamp && formatDate(question.timestamp)}</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <h3 className="mb-2 font-semibold">Answers:</h3>
        {question.answers && question.answers.filter((a) => a.approved !== false).length > 0 ? (
          <ul className="space-y-4">
            {question.answers
              .filter((a) => a.approved !== false)
              .map((answer, index, filteredAnswers) => (
                <li key={answer.id}>
                  <AnswerItem
                    answer={answer}
                    onEditAnswer={(newText) => handleAnswerEdit(answer.id, newText)}
                    onDeleteAnswer={() => handleAnswerDelete(answer.id)}
                  />
                  {index < filteredAnswers.length - 1 && <Separator className="my-2" />}
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-gray-500">No answers yet.</p>
        )}
      </CardContent>

      <CardFooter>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex gap-2">
            <div className="flex-grow">
              <Input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Add an answer..."
              />

              <div className="text-green-500 text-sm transition-all h-4">
                {showSubmitText ? "Your answer has been submitted for review." : ""}
              </div>
            </div>
            <Button type="submit">Answer</Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  )
}