'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { chats, chatMessages } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function createChat(title: string = 'New Chat') {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const [chat] = await db.insert(chats).values({
    clerkId: userId,
    title,
  }).returning()

  return chat
}

export async function getChatById(chatId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.clerkId, userId)),
    with: {
      messages: {
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
    },
  })

  return chat
}

export async function getChatHistory() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const history = await db.query.chats.findMany({
    where: eq(chats.clerkId, userId),
    orderBy: [desc(chats.updatedAt)],
    columns: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return history
}

export async function updateChatTitle(chatId: string, title: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  await db.update(chats)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.clerkId, userId)))
}

export async function deleteChat(chatId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  await db.delete(chats)
    .where(and(eq(chats.id, chatId), eq(chats.clerkId, userId)))
}

export async function saveMessages(
  chatId: string,
  messages: Array<{ id: string; role: string; parts: any }>
) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Verify chat belongs to user
  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.clerkId, userId)),
  })

  if (!chat) throw new Error('Chat not found')

  // Update chat timestamp
  await db.update(chats)
    .set({ updatedAt: new Date() })
    .where(eq(chats.id, chatId))

  // Insert messages
  if (messages.length > 0) {
    await db.insert(chatMessages).values(
      messages.map((msg) => ({
        id: msg.id,
        chatId,
        role: msg.role,
        parts: msg.parts,
      }))
    )
  }
}

export async function generateTitleFromMessage(message: string): Promise<string> {
  // Simple title generation - take first 50 chars
  const title = message.slice(0, 50).trim()
  return title.length < message.length ? `${title}...` : title
}
