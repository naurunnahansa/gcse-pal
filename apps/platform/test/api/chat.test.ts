import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'
import { testPrisma, createTestUser } from '../setup'

// Mock Clerk authentication
const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}))

// Mock AI SDK
const mockStreamText = vi.fn()
const mockConvertToModelMessages = vi.fn()
const mockAnthropic = vi.fn()

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: mockAnthropic,
}))

vi.mock('ai', () => ({
  streamText: mockStreamText,
  convertToModelMessages: mockConvertToModelMessages,
  type: {},
}))

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
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

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
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

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
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

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

    it('should handle web search parameter', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

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
          webSearch: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response).toBeInstanceOf(Response)
      // Note: webSearch parameter is currently accepted but not used in the implementation
    })

    it('should handle empty messages array', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const mockModel = { mock: 'claude-model' }
      const mockResult = {
        toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('stream')),
      }

      mockAnthropic.mockReturnValue(mockModel)
      mockConvertToModelMessages.mockReturnValue([])
      mockStreamText.mockReturnValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [],
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response).toBeInstanceOf(Response)
      expect(mockConvertToModelMessages).toHaveBeenCalledWith([])
    })

    it('should return 500 for malformed JSON', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(await response.text()).toBe('Internal Server Error')
    })

    it('should return 500 for missing messages field', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku-20240307',
          // Missing messages field
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should handle streaming response correctly', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const mockModel = { mock: 'claude-model' }
      const mockStreamResponse = new Response('streaming content')
      const mockResult = {
        toUIMessageStreamResponse: vi.fn().mockReturnValue(mockStreamResponse),
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

      expect(response).toBe(mockStreamResponse)
      expect(mockResult.toUIMessageStreamResponse).toHaveBeenCalled()
    })

    it('should include GCSE-specific context in default system prompt', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

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

      await POST(request)

      expect(mockStreamText).toHaveBeenCalledWith({
        model: mockModel,
        system: expect.stringContaining('GCSE study assistant'),
        messages: [{ role: 'user', content: 'converted' }],
      })
    })
  })
})