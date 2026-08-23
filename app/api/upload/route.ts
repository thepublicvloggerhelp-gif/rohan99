import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getAuthenticatedUser } from '@/lib/supabase/route'
import { ALLOWED_BUCKETS, ALLOWED_TYPES, BUCKET_LIMITS, type Bucket } from '@/lib/upload-constraints'
import { sanitizeKey } from '@/lib/sanitize'

const adminSupabase = createAdminClient()

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser()
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

    // Build & sanitize storage path
    const ext = file.name.split('.').pop() ?? 'bin'
    const rawPath = path ?? `${user.id}/${Date.now()}.${ext}`

    // Security: ensure path is scoped to the authenticated user's folder
    if (path && !rawPath.startsWith(user.id)) {
      return NextResponse.json({ error: 'Cannot upload to another user\'s folder' }, { status: 403 })
    }

    const uploadPath = sanitizeKey(rawPath)

    if (!uploadPath) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 })
    }

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
