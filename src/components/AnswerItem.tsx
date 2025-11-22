import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'

type Props = {
  answer: Answer
  onEditAnswer: (newText: string) => void
  onDeleteAnswer: () => void
}

function AnswerItem({ answer, onEditAnswer, onDeleteAnswer }: Props) {
  const { user } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [editedAnswer, setEditedAnswer] = useState(answer.ans)

  const handleEdit = () => {
    if (editedAnswer.trim() && editedAnswer !== answer.ans) {
      onEditAnswer(editedAnswer)
      setIsEditing(false)
    }
  }

  return (
    <div>
      {isEditing ? (
        <div className="flex w-full gap-2">
          <Input
            value={editedAnswer}
            onChange={(e) => setEditedAnswer(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={handleEdit}>Save</Button>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <p>{answer.ans}</p>
            {user?.id === answer.contributorId && (
              <div>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDeleteAnswer}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500">
            <span>{answer.contributor}</span>
            <span> • </span>
            <span>{answer.timestamp && formatDate(answer.timestamp)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnswerItem