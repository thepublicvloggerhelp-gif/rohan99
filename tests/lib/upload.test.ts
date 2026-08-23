import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { uploadFile } from '@/lib/upload'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function file(name = 'pic.png') {
  return new File(['data'], name, { type: 'image/png' })
}

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body }
}

describe('uploadFile', () => {
  it('posts the file and bucket to /api/upload and returns the public URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ publicUrl: 'https://cdn.test/pic.png' }))

    const url = await uploadFile(file(), 'avatars')

    expect(url).toBe('https://cdn.test/pic.png')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [endpoint, init] = fetchMock.mock.calls[0]
    expect(endpoint).toBe('/api/upload')
    expect(init.method).toBe('POST')
    const body = init.body as FormData
    expect((body.get('file') as File).name).toBe('pic.png')
    expect(body.get('bucket')).toBe('avatars')
    expect(body.get('path')).toBeNull()
  })

  it('includes the path when one is provided', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ publicUrl: 'https://cdn.test/u/1.png' }))

    await uploadFile(file(), 'notes', 'user-1/1.png')

    const body = fetchMock.mock.calls[0][1].body as FormData
    expect(body.get('path')).toBe('user-1/1.png')
  })

  it('throws the server-provided error message on failure', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'File too large. Max 2MB' }, false))

    await expect(uploadFile(file(), 'avatars')).rejects.toThrow('File too large. Max 2MB')
  })

  it('throws a generic error when the server sends no message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false))

    await expect(uploadFile(file(), 'chat-images')).rejects.toThrow('Upload failed')
  })
})
