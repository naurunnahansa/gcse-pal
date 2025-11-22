'use client'

import { useTransition } from 'react'

interface DeleteButtonProps {
  onDelete: () => Promise<void>
  confirmMessage?: string
  buttonText?: string
  className?: string
}

export default function DeleteButton({
  onDelete,
  confirmMessage = 'Are you sure you want to delete this?',
  buttonText = 'Delete',
  className = 'px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600',
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (confirm(confirmMessage)) {
      startTransition(async () => {
        await onDelete()
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`${className} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isPending ? 'Deleting...' : buttonText}
    </button>
  )
}