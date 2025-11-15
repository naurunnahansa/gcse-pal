import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

// Mock AI SDK
vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(),
}))

vi.mock('ai', () => ({
  streamText: vi.fn(),
  convertToModelMessages: vi.fn(),
  type: {},
}))

import { auth } from '@clerk/nextjs/server'
import { anthropic } from '@ai-sdk/anthropic'
import { streamText, convertToModelMessages } from 'ai'

const mockAuth = vi.mocked(auth)
const mockAnthropic = vi.mocked(anthropic)
const mockStreamText = vi.mocked(streamText)
const mockConvertToModelMessages = vi.mocked(convertToModelMessages)

describe('Chat API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/chat', () => {
    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(await response.text()).toBe('Unauthorized')
    })

    it('should handle chat request with default model', async () => {
      mockAuth.mockResolvedValue({ userId: 'test_user_id' })

      const mockModel = { mock: 'claude-model' }
      const mockResult = {
        toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('stream')),
      }

      mockAnthropic.mockReturnValue(mockModel)
      mockConvertToModelMessages.mockReturnValue([{ role: 'user', content: 'converted' }])
      mockStreamText.mockReturnValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(mockAnthropic).toHaveBeenCalledWith('claude-3-haiku-20240307')
      expect(mockConvertToModelMessages).toHaveBeenCalledWith([{ role: 'user', content: 'Hello' }])
      expect(mockStreamText).toHaveBeenCalledWith({
        model: mockModel,
        system: expect.stringContaining('helpful GCSE study assistant'),
        messages: [{ role: 'user', content: 'converted' }],
      })
      expect(response).toBeInstanceOf(Response)
    })

    it('should handle chat request with custom model', async () => {
      mockAuth.mockResolvedValue({ userId: 'test_user_id' })

      const mockModel = { mock: 'claude-sonnet' }
      const mockResult = {
        toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('stream')),
      }

      mockAnthropic.mockReturnValue(mockModel)
      mockConvertToModelMessages.mockReturnValue([{ role: 'user', content: 'converted' }])
      mockStreamText.mockReturnValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'anthropic/claude-3-sonnet-20240229',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      await POST(request)

      expect(mockAnthropic).toHaveBeenCalledWith('claude-3-sonnet-20240229')
    })

    it('should include course context in system prompt', async () => {
      mockAuth.mockResolvedValue({ userId: 'test_user_id' })

      const mockModel = { mock: 'claude-model' }
      const mockResult = {
        toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('stream')),
      }

      mockAnthropic.mockReturnValue(mockModel)
      mockConvertToModelMessages.mockReturnValue([{ role: 'user', content: 'converted' }])
      mockStreamText.mockReturnValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          courseContext: 'This is a Mathematics GCSE course focusing on algebra.',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      await POST(request)

      expect(mockStreamText).toHaveBeenCalledWith({
        model: mockModel,
        system: expect.stringContaining('This is a Mathematics GCSE course focusing on algebra.'),
        messages: [{ role: 'user', content: 'converted' }],
      })
    })

    it('should return 500 for malformed JSON', async () => {
      mockAuth.mockResolvedValue({ userId: 'test_user_id' })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(await response.text()).toBe('Internal Server Error')
    })
  })
})