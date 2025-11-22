import { openai } from '@ai-sdk/openai'
import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  streamText
} from 'ai'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { chats, chatMessages } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getUserRole } from '@/lib/auth'
import type { ChatMessage } from '@/lib/types'
import { generateUUID } from '@/lib/utils'

export const maxDuration = 60

const systemPrompt = `You are a helpful AI tutor assistant for GCSE students. You help students with their studies, answer questions, explain concepts, and provide guidance on various subjects.

Keep your responses:
- Clear and easy to understand
- Appropriate for GCSE-level students
- Helpful and encouraging
- Concise but thorough

You can help with subjects like:
- Mathematics
- Science (Physics, Chemistry, Biology)
- English Language and Literature
- History
- Geography
- And other GCSE subjects

When explaining concepts, use examples and break down complex ideas into simpler parts.`

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Check if user is pro
    const role = await getUserRole()
    const isPro = role === 'pro_student' || role === 'admin' || role === 'teacher'

    if (!isPro) {
      return new Response('Pro subscription required', { status: 403 })
    }

    const { id, message, selectedChatModel } = await req.json()

    // Verify chat belongs to user if chatId provided
    if (id) {
      const chat = await db.query.chats.findFirst({
        where: and(eq(chats.id, id), eq(chats.clerkId, userId)),
      })

      if (!chat) {
        // Create the chat if it doesn't exist
        await db.insert(chats).values({
          id,
          clerkId: userId,
          title: message.parts?.find((p: { type: string }) => p.type === 'text')?.text?.slice(0, 50) || 'New Chat',
        })
      }
    }

    // Get existing messages for context
    const existingMessages = id ? await db.query.chatMessages.findMany({
      where: eq(chatMessages.chatId, id),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    }) : []

    // Convert to ChatMessage format
    const uiMessages: ChatMessage[] = [
      ...existingMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        parts: msg.parts as ChatMessage['parts'],
        createdAt: msg.createdAt,
      })),
      message,
    ]

    // Save the user message
    if (id) {
      await db.insert(chatMessages).values({
        id: message.id,
        chatId: id,
        role: 'user',
        parts: message.parts,
      })
    }

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        const result = streamText({
          model: openai('gpt-4o-mini'),
          system: systemPrompt,
          messages: convertToModelMessages(uiMessages),
          tools: {
            getWeather: {
              description: 'Get the current weather at a location',
              inputSchema: z.object({
                latitude: z.number().describe('Latitude coordinate'),
                longitude: z.number().describe('Longitude coordinate'),
              }),
              execute: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
                const response = await fetch(
                  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
                )
                const weatherData = await response.json()
                return weatherData
              },
            },
            calculator: {
              description: 'Perform mathematical calculations',
              inputSchema: z.object({
                expression: z.string().describe('Mathematical expression to evaluate'),
              }),
              execute: async ({ expression }: { expression: string }) => {
                try {
                  const result = Function(`"use strict"; return (${expression})`)()
                  return { result: result.toString() }
                } catch {
                  return { error: 'Invalid expression' }
                }
              },
            },
          },
        })

        result.consumeStream()

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        )
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        // Save assistant messages
        if (id) {
          const assistantMessages = messages.filter((m) => m.role === 'assistant')
          if (assistantMessages.length > 0) {
            await db.insert(chatMessages).values(
              assistantMessages.map((msg) => ({
                id: msg.id,
                chatId: id,
                role: 'assistant',
                parts: msg.parts,
              }))
            )
          }
        }
      },
      onError: () => {
        return 'Oops, an error occurred!'
      },
    })

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()))
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
