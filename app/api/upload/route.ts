import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Admin client — bypasses RLS (server-side only)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_BUCKETS = ['avatars', 'chat-images', 'notes'] as const
type Bucket = typeof ALLOWED_BUCKETS[number]

const BUCKET_LIMITS: Record<Bucket, number> = {
  'avatars':     2 * 1024 * 1024,   // 2MB
  'chat-images': 5 * 1024 * 1024,   // 5MB
  'notes':       20 * 1024 * 1024,  // 20MB
}

const ALLOWED_TYPES: Record<Bucket, string[]> = {
  'avatars':     ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  'chat-images': ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  'notes':       ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = cookies()
    const userSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set() {},
          remove() {},
        },
      }
    )
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse multipart form
    const formData = await req.formData()
    const file     = formData.get('file') as File | null
    const bucket   = formData.get('bucket') as string | null
    const path     = formData.get('path') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!bucket || !ALLOWED_BUCKETS.includes(bucket as Bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }

    const b = bucket as Bucket

    // Validate file size
    if (file.size > BUCKET_LIMITS[b]) {
      const maxMB = BUCKET_LIMITS[b] / 1024 / 1024
      return NextResponse.json({ error: `File too large. Max ${maxMB}MB` }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES[b].includes(file.type)) {
      return NextResponse.json({ error: `File type not allowed: ${file.type}` }, { status: 400 })
    }

    // Build storage path
    const ext = file.name.split('.').pop() ?? 'bin'
    const uploadPath = path ?? `${user.id}/${Date.now()}.${ext}`

    // Upload using admin key (bypasses storage RLS)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: up, error: upErr } = await adminSupabase.storage
      .from(b)
      .upload(uploadPath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    const { data: urlData } = adminSupabase.storage.from(b).getPublicUrl(up.path)

    return NextResponse.json({
      path: up.path,
      publicUrl: urlData.publicUrl,
    })

  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message ?? 'Upload failed' }, { status: 500 })
  }
}
