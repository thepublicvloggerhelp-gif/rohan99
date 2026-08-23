import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getAuthenticatedUser } from '@/lib/supabase/route'

const adminSupabase = createAdminClient()

export async function POST(req: NextRequest) {
  try {
    const { conversationId, content, imageUrl } = await req.json()

    if (!conversationId || (!content?.trim() && !imageUrl)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { user, error: authError } = await getAuthenticatedUser()
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
