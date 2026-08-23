import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { GET } from '@/app/api/tmdb/route'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({ json: async () => ({ results: [] }) })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function request(query: string): NextRequest {
  return { nextUrl: new URL(`https://app.test/api/tmdb${query}`) } as unknown as NextRequest
}

function calledUrl() {
  return new URL(fetchMock.mock.calls[0][0] as string)
}

describe('GET /api/tmdb', () => {
  it('proxies the endpoint to TMDB with an api key attached', async () => {
    const res = await GET(request('?endpoint=/movie/popular'))

    expect(res.status).toBe(200)
    const url = calledUrl()
    expect(url.origin).toBe('https://api.themoviedb.org')
    expect(url.pathname).toBe('/3/movie/popular')
    expect(url.searchParams.get('api_key')).toBeTruthy()
    expect(await res.json()).toEqual({ results: [] })
  })

  it('forwards extra query params but not the endpoint param', async () => {
    await GET(request('?endpoint=/search/movie&query=matrix&page=2'))

    const url = calledUrl()
    expect(url.searchParams.get('query')).toBe('matrix')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('endpoint')).toBeNull()
  })

  it('treats a missing endpoint as the TMDB root', async () => {
    await GET(request(''))

    expect(calledUrl().pathname).toBe('/3')
  })

  it('sets caching headers on the response', async () => {
    const res = await GET(request('?endpoint=/movie/top_rated'))

    expect(res.headers.get('Cache-Control')).toBe('s-maxage=60, stale-while-revalidate=120')
  })

  it('returns 500 with details when the upstream fetch throws', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))

    const res = await GET(request('?endpoint=/movie/popular'))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('TMDB fetch failed')
    expect(body.details).toContain('network down')
  })

  it('returns 500 when the upstream body is not json', async () => {
    fetchMock.mockResolvedValue({
      json: async () => {
        throw new Error('invalid json')
      },
    })

    const res = await GET(request('?endpoint=/movie/popular'))

    expect(res.status).toBe(500)
  })
})
