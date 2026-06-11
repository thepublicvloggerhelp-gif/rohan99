'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Send, Image as ImageIcon, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, DirectMessage } from '@/types'
import { formatMessageTime, getInitials } from '@/lib/utils'
import { toast } from 'sonner'

export default function DMConversationPage() {
  const params         = useParams()
  const conversationId = params.conversationId as string
  const supabase       = createClient()

  const [me,       setMe]       = useState<Profile | null>(null)
  const [other,    setOther]    = useState<Profile | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [content,  setContent]  = useState('')
  const [imageFile,setImage]    = useState<File | null>(null)
  const [preview,  setPreview]  = useState<string | null>(null)
  const [sending,  setSending]  = useState(false)
  const [loading,  setLoading]  = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch own profile
        const { data: prof } = await supabase
          .from('profiles').select('*').eq('id', user.id).single()
        if (prof) setMe(prof)

        // Step 1: Get all participant user_ids for this conversation (simple flat query)
        const { data: parts, error: partsErr } = await supabase
          .from('dm_participants')
          .select('user_id')
          .eq('conversation_id', conversationId)

        if (partsErr) { toast.error('Could not load conversation: ' + partsErr.message); return }

        // Step 2: Find the other participant's user_id
        const otherUserId = parts?.find((p: any) => p.user_id !== user.id)?.user_id
        if (otherUserId) {
          // Step 3: Fetch the other user's profile separately
          const { data: otherProf } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single()
          if (otherProf) setOther(otherProf as Profile)
        }

        // Step 4: Fetch messages (flat query, no joins)
        const { data: msgs, error: msgsErr } = await supabase
          .from('direct_messages')
          .select('id, conversation_id, sender_id, content, image_url, is_deleted, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(100)

        if (msgsErr) { toast.error('Could not load messages: ' + msgsErr.message); return }

        // Step 5: Enrich each message with sender profile
        const senderIds = Array.from(new Set((msgs || []).map((m: any) => m.sender_id as string)))
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', senderIds)

        const profileMap: Record<string, any> = {}
        senderProfiles?.forEach((p: any) => { profileMap[p.id] = p })

        const enriched = (msgs || []).map((m: any) => ({
          ...m,
          sender: profileMap[m.sender_id] ?? null,
        }))

        setMessages(enriched)
        setTimeout(() => bottomRef.current?.scrollIntoView(), 100)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [conversationId])

  // Realtime subscription for new messages
  useEffect(() => {
    const sub = supabase.channel(`dm:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async payload => {
        const newMsg = payload.new as any
        // Fetch sender profile separately
        const { data: senderProf } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', newMsg.sender_id)
          .single()
        setMessages(prev => [...prev, { ...newMsg, sender: senderProf }])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [conversationId])

  const send = async () => {
    if ((!content.trim() && !imageFile) || !me) return
    setSending(true)
    try {
      let imageUrl: string | null = null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const { data: up, error: upErr } = await supabase.storage
          .from('chat-images')
          .upload(`dm/${conversationId}/${Date.now()}.${ext}`, imageFile)
        if (upErr) { toast.error('Image upload failed'); setSending(false); return }
        const { data: u } = supabase.storage.from('chat-images').getPublicUrl(up.path)
        imageUrl = u.publicUrl
      }

      const { error } = await supabase.from('direct_messages').insert({
        conversation_id: conversationId,
        sender_id: me.id,
        content: content.trim() || ' ',
        image_url: imageUrl,
      })

      if (error) { toast.error(error.message); return }
      setContent('')
      setImage(null)
      setPreview(null)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-3" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.06] bg-surface-2 flex-shrink-0">
        <Link href="/dm" className="btn-ghost p-1.5"><ArrowLeft className="w-4 h-4" /></Link>
        {other && (
          <Link href={`/profile/${other.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-4 flex items-center justify-center text-xs font-bold text-brand-400">
              {other.avatar_url
                ? <Image src={other.avatar_url} alt="" width={32} height={32} className="object-cover" />
                : getInitials(other.full_name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">{other.username}</p>
              <p className="text-xs text-slate-500">{(other as any).stream}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-area p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-4xl mb-3">👋</span>
            <p className="text-slate-400 font-medium">Say hello to {other?.username}!</p>
            <p className="text-slate-600 text-sm mt-1">This is the start of your conversation.</p>
          </div>
        ) : (
          messages.filter(m => !m.is_deleted).map(m => {
            const isMe = m.sender_id === me?.id
            return (
              <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-4 flex-shrink-0 flex items-center justify-center text-xs font-bold text-brand-400">
                  {m.sender?.avatar_url
                    ? <Image src={m.sender.avatar_url} alt="" width={32} height={32} className="object-cover" />
                    : getInitials(m.sender?.full_name ?? 'U')}
                </div>
                <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {m.content?.trim() && (
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                      isMe
                        ? 'bg-brand-500 text-white rounded-tr-sm'
                        : 'bg-surface-4 text-slate-200 rounded-tl-sm'
                    }`}>
                      {m.content.trim()}
                    </div>
                  )}
                  {m.image_url && (
                    <Image src={m.image_url} alt="" width={200} height={150} className="rounded-xl object-cover" />
                  )}
                  <span className="text-[10px] text-slate-600">{formatMessageTime(m.created_at)}</span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-surface-2 border-t border-white/[0.06] flex-shrink-0">
        {preview && (
          <div className="relative inline-block mb-2">
            <Image src={preview} alt="" width={100} height={70} className="rounded-lg object-cover" />
            <button
              onClick={() => { setImage(null); setPreview(null) }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-end gap-2 bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-2.5 focus-within:border-brand-500/40 transition-all">
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={`Message ${other?.username ?? ''}...`}
              className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 text-sm outline-none"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={send}
            disabled={sending || (!content.trim() && !imageFile)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-all disabled:opacity-40 active:scale-95 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) { setImage(f); setPreview(URL.createObjectURL(f)) }
          }}
        />
      </div>
    </div>
  )
}
