import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Admin client — bypasses RLS entirely (server-side only, never exposed to client)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { conversationId, content, imageUrl } = await req.json()

    if (!conversationId || typeof conversationId !== 'string' || (!content?.trim() && !imageUrl)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (content != null && (typeof content !== 'string' || content.length > 4000)) {
      return NextResponse.json({ error: 'Invalid message content' }, { status: 400 })
    }

    // Only accept image URLs served from this project's Supabase public storage
    const storagePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`
    if (imageUrl != null && (typeof imageUrl !== 'string' || !imageUrl.startsWith(storagePrefix))) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 })
    }

    // Step 1: Get the authenticated user from the request cookies
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

    // Step 2: Verify the user is actually a participant in this conversation
    // (using admin client to bypass the broken RLS policy)
    const { data: participant, error: partErr } = await adminSupabase
      .from('dm_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (partErr || !participant) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 })
    }

    // Step 3: Insert the message using the admin client (bypasses broken RLS)
    const { data: message, error: insertErr } = await adminSupabase
      .from('direct_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content?.trim() || ' ',
        image_url: imageUrl ?? null,
      })
      .select('id, conversation_id, sender_id, content, image_url, is_deleted, created_at')
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ message })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
