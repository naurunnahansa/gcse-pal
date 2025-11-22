import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth'
import { PricingTable } from '@clerk/nextjs'
import { MessageSquare, Sparkles } from 'lucide-react'
import { Chat } from '@/components/chat/Chat'
import { DataStreamProvider } from '@/components/chat/data-stream-provider'
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models'
import { nanoid } from 'nanoid'

export default async function ChatPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const role = await getUserRole()
  const isPro = role === 'pro_student' || role === 'admin' || role === 'teacher'

  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">AI Chat Assistant</h1>
          <p className="text-muted-foreground mb-6">
            Get instant help with your studies using our AI-powered chat assistant.
            This feature is available exclusively for Pro members.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Upgrade to Pro to unlock
          </div>
        </div>

        <PricingTable />
      </div>
    )
  }

  const id = nanoid()

  return (
    <DataStreamProvider>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={DEFAULT_CHAT_MODEL}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
    </DataStreamProvider>
  )
}
