import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

const { getUser, signOut, profileSingle } = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(),
  profileSingle: vi.fn(),
}))

let cookieHandlers: {
  get: (name: string) => string | undefined
  set: (name: string, value: string, options: unknown) => void
  remove: (name: string, options: unknown) => void
}

vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: typeof cookieHandlers }) => {
    cookieHandlers = options.cookies
    return {
      auth: { getUser, signOut },
      from: () => {
        const chain = {
          select: () => chain,
          eq: () => chain,
          single: profileSingle,
        }
        return chain
      },
    }
  },
}))

import { middleware } from '@/middleware'

const USER = { id: 'user-1' }

function request(pathname: string, cookies: { name: string; value: string }[] = []): NextRequest {
  const url = new URL(`https://app.test${pathname}`)
  const store = new Map(cookies.map(c => [c.name, c.value]))
  return {
    nextUrl: Object.assign(url, { clone: () => new URL(url.toString()) }),
    headers: new Headers(),
    cookies: {
      get: (name: string) =>
        store.has(name) ? { name, value: store.get(name) as string } : undefined,
      set: (cookie: { name: string; value: string }) => store.set(cookie.name, cookie.value),
      getAll: () => Array.from(store, ([name, value]) => ({ name, value })),
    },
  } as unknown as NextRequest
}

function locationOf(res: Response) {
  const location = res.headers.get('location')
  return location ? new URL(location) : null
}

beforeEach(() => {
  getUser.mockReset()
  signOut.mockReset()
  profileSingle.mockReset()
  getUser.mockResolvedValue({ data: { user: null } })
  profileSingle.mockResolvedValue({ data: { status: 'approved', role: 'user' } })
})

describe('middleware for api routes', () => {
  it('passes API requests through without checking auth', async () => {
    const res = await middleware(request('/api/upload'))

    expect(res.status).toBe(200)
    expect(locationOf(res)).toBeNull()
    expect(getUser).not.toHaveBeenCalled()
  })
})

describe('middleware cookie adapter', () => {
  it('reads request cookies for supabase', async () => {
    await middleware(request('/', [{ name: 'sb-token', value: 'abc' }]))

    expect(cookieHandlers.get('sb-token')).toBe('abc')
    expect(cookieHandlers.get('missing')).toBeUndefined()
  })

  it('writes refreshed session cookies onto the response', async () => {
    const req = request('/')
    const promise = middleware(req)
    cookieHandlers.set('sb-token', 'refreshed', { path: '/' })
    const res = await promise

    expect(req.cookies.get('sb-token')?.value).toBe('refreshed')
    expect(res.cookies.get('sb-token')?.value).toBe('refreshed')
  })

  it('clears cookies on remove', async () => {
    const req = request('/', [{ name: 'sb-token', value: 'abc' }])
    const promise = middleware(req)
    cookieHandlers.remove('sb-token', { path: '/' })
    const res = await promise

    expect(req.cookies.get('sb-token')?.value).toBe('')
    expect(res.cookies.get('sb-token')?.value).toBe('')
  })

  it('carries refreshed session cookies over to redirect responses', async () => {
    getUser.mockImplementation(async () => {
      cookieHandlers.set('sb-token', 'refreshed', { path: '/' })
      return { data: { user: USER } }
    })

    const res = await middleware(request('/login'))

    expect(locationOf(res)?.pathname).toBe('/chat')
    expect(res.cookies.get('sb-token')?.value).toBe('refreshed')
  })
})

describe('middleware for anonymous visitors', () => {
  it.each(['/login', '/signup', '/pending', '/'])('allows %s', async pathname => {
    const res = await middleware(request(pathname))

    expect(locationOf(res)).toBeNull()
  })

  it.each(['/chat', '/admin', '/memories'])('redirects %s to /login', async pathname => {
    const res = await middleware(request(pathname))

    expect(locationOf(res)?.pathname).toBe('/login')
  })
})

describe('middleware for authenticated users', () => {
  beforeEach(() => {
    getUser.mockResolvedValue({ data: { user: USER } })
  })

  it.each(['/login', '/signup'])('redirects %s to /chat', async pathname => {
    const res = await middleware(request(pathname))

    expect(locationOf(res)?.pathname).toBe('/chat')
  })

  it('redirects approved users away from /pending', async () => {
    const res = await middleware(request('/pending'))

    expect(locationOf(res)?.pathname).toBe('/chat')
  })

  it('keeps pending users on /pending', async () => {
    profileSingle.mockResolvedValue({ data: { status: 'pending', role: 'user' } })

    const res = await middleware(request('/pending'))

    expect(locationOf(res)).toBeNull()
  })

  it('redirects pending users from protected pages to /pending', async () => {
    profileSingle.mockResolvedValue({ data: { status: 'pending', role: 'user' } })

    const res = await middleware(request('/chat'))

    expect(locationOf(res)?.pathname).toBe('/pending')
  })

  it('signs out banned users and flags the reason on /login', async () => {
    profileSingle.mockResolvedValue({ data: { status: 'banned', role: 'user' } })

    const res = await middleware(request('/chat'))

    const location = locationOf(res)
    expect(location?.pathname).toBe('/login')
    expect(location?.searchParams.get('error')).toBe('banned')
    expect(signOut).toHaveBeenCalled()
  })

  it('signs out rejected users and flags the reason on /login', async () => {
    profileSingle.mockResolvedValue({ data: { status: 'rejected', role: 'user' } })

    const res = await middleware(request('/chat'))

    const location = locationOf(res)
    expect(location?.pathname).toBe('/login')
    expect(location?.searchParams.get('error')).toBe('rejected')
    expect(signOut).toHaveBeenCalled()
  })

  it('lets approved users reach protected pages', async () => {
    const res = await middleware(request('/chat'))

    expect(locationOf(res)).toBeNull()
  })

  it('keeps non-admins out of /admin', async () => {
    const res = await middleware(request('/admin/users'))

    expect(locationOf(res)?.pathname).toBe('/chat')
  })

  it('lets admins into /admin', async () => {
    profileSingle.mockResolvedValue({ data: { status: 'approved', role: 'admin' } })

    const res = await middleware(request('/admin/users'))

    expect(locationOf(res)).toBeNull()
  })

  it('does not require a profile lookup for the landing page', async () => {
    const res = await middleware(request('/'))

    expect(locationOf(res)).toBeNull()
    expect(profileSingle).not.toHaveBeenCalled()
  })
})
