import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

const { getUser, upload, getPublicUrl } = vi.hoisted(() => ({
  getUser: vi.fn(),
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: () => ({ get: () => undefined }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser } }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: { from: () => ({ upload, getPublicUrl }) },
  }),
}))

import { POST } from '@/app/api/upload/route'

const USER_ID = 'user-1'

function request(form: FormData): NextRequest {
  return { formData: async () => form } as unknown as NextRequest
}

function form(fields: { file?: File | null; bucket?: string; path?: string }) {
  const fd = new FormData()
  if (fields.file) fd.append('file', fields.file)
  if (fields.bucket !== undefined) fd.append('bucket', fields.bucket)
  if (fields.path !== undefined) fd.append('path', fields.path)
  return fd
}

function imageFile(name = 'photo.png', size = 1024, type = 'image/png') {
  const file = new File([new Uint8Array(size)], name, { type })
  return file
}

beforeEach(() => {
  getUser.mockReset()
  upload.mockReset()
  getPublicUrl.mockReset()
  getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null })
  upload.mockImplementation(async (path: string) => ({ data: { path }, error: null }))
  getPublicUrl.mockImplementation((path: string) => ({
    data: { publicUrl: `https://cdn.test/${path}` },
  }))
})

describe('POST /api/upload authentication', () => {
  it('rejects unauthenticated requests', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await POST(request(form({ file: imageFile(), bucket: 'avatars' })))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Not authenticated' })
    expect(upload).not.toHaveBeenCalled()
  })

  it('rejects requests when the auth lookup errors', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('boom') })

    const res = await POST(request(form({ file: imageFile(), bucket: 'avatars' })))

    expect(res.status).toBe(401)
  })
})

describe('POST /api/upload validation', () => {
  it('requires a file', async () => {
    const res = await POST(request(form({ bucket: 'avatars' })))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'No file provided' })
  })

  it('rejects unknown buckets', async () => {
    const res = await POST(request(form({ file: imageFile(), bucket: 'secrets' })))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid bucket' })
  })

  it('rejects a missing bucket', async () => {
    const res = await POST(request(form({ file: imageFile() })))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid bucket' })
  })

  it('enforces the per-bucket size limit', async () => {
    const tooBig = imageFile('big.png', 3 * 1024 * 1024)

    const res = await POST(request(form({ file: tooBig, bucket: 'avatars' })))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'File too large. Max 2MB' })
  })

  it('accepts a file just under the bucket limit', async () => {
    const file = imageFile('ok.png', 2 * 1024 * 1024)

    const res = await POST(request(form({ file, bucket: 'avatars' })))

    expect(res.status).toBe(200)
  })

  it('rejects disallowed mime types for the bucket', async () => {
    const pdf = new File([new Uint8Array(10)], 'doc.pdf', { type: 'application/pdf' })

    const res = await POST(request(form({ file: pdf, bucket: 'avatars' })))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'File type not allowed: application/pdf' })
  })

  it('allows pdfs in the notes bucket', async () => {
    const pdf = new File([new Uint8Array(10)], 'doc.pdf', { type: 'application/pdf' })

    const res = await POST(request(form({ file: pdf, bucket: 'notes' })))

    expect(res.status).toBe(200)
  })

  it('refuses paths outside the authenticated user\'s folder', async () => {
    const res = await POST(
      request(form({ file: imageFile(), bucket: 'avatars', path: 'user-2/photo.png' }))
    )

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Cannot upload to another user's folder" })
    expect(upload).not.toHaveBeenCalled()
  })

  it('strips path traversal segments from the requested path', async () => {
    const res = await POST(
      request(form({ file: imageFile(), bucket: 'avatars', path: `${USER_ID}/../../etc/passwd.png` }))
    )

    expect(res.status).toBe(200)
    expect(upload.mock.calls[0][0]).toBe(`${USER_ID}/etc/passwd.png`)
  })
})

describe('POST /api/upload storage path handling', () => {
  it('defaults to a timestamped path inside the user folder', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-05-10T12:00:00Z'))

    const res = await POST(request(form({ file: imageFile('holiday.png'), bucket: 'chat-images' })))
    vi.useRealTimers()

    expect(res.status).toBe(200)
    const [uploadPath, buffer, options] = upload.mock.calls[0]
    expect(uploadPath).toBe(`${USER_ID}/${new Date('2024-05-10T12:00:00Z').getTime()}.png`)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(options).toMatchObject({ contentType: 'image/png', upsert: true })
    expect(await res.json()).toEqual({
      path: uploadPath,
      publicUrl: `https://cdn.test/${uploadPath}`,
    })
  })

  it('sanitizes spaces and unicode out of the requested path but keeps the extension', async () => {
    await POST(
      request(form({ file: imageFile(), bucket: 'memories', path: `${USER_ID}/héllo wörld!.PNG` }))
    )

    expect(upload.mock.calls[0][0]).toBe(`${USER_ID}/hello_world.PNG`)
  })

  it('drops empty path segments', async () => {
    await POST(
      request(form({ file: imageFile(), bucket: 'memories', path: `${USER_ID}//nested///a.png` }))
    )

    expect(upload.mock.calls[0][0]).toBe(`${USER_ID}/nested/a.png`)
  })

  it('truncates overly long base names and extensions', async () => {
    const longBase = 'a'.repeat(200)
    await POST(
      request(
        form({
          file: imageFile(),
          bucket: 'memories',
          path: `${USER_ID}/${longBase}.${'e'.repeat(30)}`,
        })
      )
    )

    const [segment] = upload.mock.calls[0][0].split('/').slice(1)
    const [base, ext] = segment.split('.')
    expect(base).toHaveLength(80)
    expect(ext).toHaveLength(10)
  })
})

describe('POST /api/upload error handling', () => {
  it('surfaces storage errors as 500s', async () => {
    upload.mockResolvedValue({ data: null, error: { message: 'bucket offline' } })

    const res = await POST(request(form({ file: imageFile(), bucket: 'avatars' })))

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'bucket offline' })
  })

  it('returns 500 when parsing the form fails', async () => {
    const bad = {
      formData: async () => {
        throw new Error('malformed body')
      },
    } as unknown as NextRequest

    const res = await POST(bad)

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'malformed body' })
  })
})
