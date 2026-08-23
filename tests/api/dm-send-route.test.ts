import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

const { getUser, maybeSingle, single, insert } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
  insert: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: () => ({ get: () => undefined }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser } }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'dm_participants') {
        const chain = {
          select: () => chain,
          eq: () => chain,
          maybeSingle,
        }
        return chain
      }
      return {
        insert: (values: unknown) => {
          insert(values)
          return { select: () => ({ single }) }
        },
      }
    },
  }),
}))

import { POST } from '@/app/api/dm/send/route'

const USER_ID = 'user-1'
const CONVERSATION_ID = 'conv-1'

function request(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

beforeEach(() => {
  getUser.mockReset()
  maybeSingle.mockReset()
  single.mockReset()
  insert.mockReset()
  getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null })
  maybeSingle.mockResolvedValue({ data: { user_id: USER_ID }, error: null })
  single.mockResolvedValue({ data: { id: 'msg-1' }, error: null })
})

describe('POST /api/dm/send validation', () => {
  it('rejects a request without a conversation id', async () => {
    const res = await POST(request({ content: 'hi' }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Missing required fields' })
  })

  it('rejects a message with neither text nor image', async () => {
    const res = await POST(request({ conversationId: CONVERSATION_ID, content: '   ' }))

    expect(res.status).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })

  it('accepts an image-only message', async () => {
    const res = await POST(
      request({ conversationId: CONVERSATION_ID, imageUrl: 'https://cdn.test/a.png' })
    )

    expect(res.status).toBe(200)
    expect(insert).toHaveBeenCalledWith({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_ID,
      content: ' ',
      image_url: 'https://cdn.test/a.png',
    })
  })
})

describe('POST /api/dm/send authorization', () => {
  it('returns 401 when the caller is not authenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await POST(request({ conversationId: CONVERSATION_ID, content: 'hi' }))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Not authenticated' })
  })

  it('returns 403 when the caller is not a conversation participant', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })

    const res = await POST(request({ conversationId: CONVERSATION_ID, content: 'hi' }))

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Not a participant in this conversation' })
    expect(insert).not.toHaveBeenCalled()
  })

  it('returns 403 when the participant lookup fails', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'db down' } })

    const res = await POST(request({ conversationId: CONVERSATION_ID, content: 'hi' }))

    expect(res.status).toBe(403)
  })
})

describe('POST /api/dm/send happy path', () => {
  it('trims content, sets the sender from the session, and returns the message', async () => {
    single.mockResolvedValue({ data: { id: 'msg-1', content: 'hello' }, error: null })

    const res = await POST(request({ conversationId: CONVERSATION_ID, content: '  hello  ' }))

    expect(res.status).toBe(200)
    expect(insert).toHaveBeenCalledWith({
      conversation_id: CONVERSATION_ID,
      sender_id: USER_ID,
      content: 'hello',
      image_url: null,
    })
    expect(await res.json()).toEqual({ message: { id: 'msg-1', content: 'hello' } })
  })

  it('ignores a sender id supplied by the client', async () => {
    await POST(
      request({ conversationId: CONVERSATION_ID, content: 'hi', sender_id: 'someone-else' })
    )

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ sender_id: USER_ID }))
  })
})

describe('POST /api/dm/send error handling', () => {
  it('surfaces insert errors as 500s', async () => {
    single.mockResolvedValue({ data: null, error: { message: 'insert failed' } })

    const res = await POST(request({ conversationId: CONVERSATION_ID, content: 'hi' }))

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'insert failed' })
  })

  it('returns 500 when the request body is not valid json', async () => {
    const bad = {
      json: async () => {
        throw new Error('bad json')
      },
    } as unknown as NextRequest

    const res = await POST(bad)

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'bad json' })
  })
})
