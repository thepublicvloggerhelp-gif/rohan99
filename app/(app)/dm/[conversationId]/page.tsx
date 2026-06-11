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
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [content,  setContent]  = useState('')
  const [imageFile,setImage]    = useState<File | null>(null)
  const [preview,  setPreview]  = useState<string | null>(null)
  const [sending,  setSending]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (prof) setMe(prof)

      const { data: parts } = await supabase.from('dm_participants').select('*, user:profiles(*)').eq('conversation_id', conversationId)
      const otherPart = parts?.find((p: any) => p.user_id !== user.id)
      if (otherPart) setOther(otherPart.user)

      const { data: msgs } = await supabase.from('direct_messages')
        .select('*, sender:profiles!sender_id(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100)
      if (msgs) setMessages(msgs)
      setTimeout(() => bottomRef.current?.scrollIntoView(), 100)
    }
    load()
  }, [conversationId])

  useEffect(() => {
    const sub = supabase.channel(`dm:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` },
        async payload => {
          const { data: msg } = await supabase.from('direct_messages').select('*, sender:profiles!sender_id(*)').eq('id', payload.new.id).single()
          if (msg) { setMessages(prev => [...prev, msg]); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50) }
        })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [conversationId])

  const send = async () => {
    if (!content.trim() && !imageFile || !me) return
    setSending(true)
    try {
      let imageUrl: string | null = null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const { data: up } = await supabase.storage.from('chat-images').upload(`dm/${conversationId}/${Date.now()}.${ext}`, imageFile)
        if (up) { const { data: u } = supabase.storage.from('chat-images').getPublicUrl(up.path); imageUrl = u.publicUrl }
      }
      await supabase.from('direct_messages').insert({ conversation_id: conversationId, sender_id: me.id, content: content.trim() || ' ', image_url: imageUrl })
      setContent(''); setImage(null); setPreview(null)
    } finally { setSending(false) }
  }

  return (
    <div className="flex flex-col h-full bg-surface-3">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.06] bg-surface-2 flex-shrink-0">
        <Link href="/dm" className="btn-ghost p-1.5"><ArrowLeft className="w-4 h-4" /></Link>
        {other && (
          <Link href={`/profile/${other.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-4 flex items-center justify-center text-xs font-bold text-brand-400">
              {other.avatar_url ? <Image src={other.avatar_url} alt="" width={32} height={32} className="object-cover" /> : getInitials(other.full_name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">{other.username}</p>
              <p className="text-xs text-slate-500">{other.stream}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-area p-4 space-y-3">
        {messages.filter(m => !m.is_deleted).map(m => {
          const isMe = m.sender_id === me?.id
          return (
            <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-4 flex-shrink-0 flex items-center justify-center text-xs font-bold text-brand-400">
                {(m.sender as any)?.avatar_url ? <Image src={(m.sender as any).avatar_url} alt="" width={32} height={32} className="object-cover" /> : getInitials((m.sender as any)?.full_name ?? 'U')}
              </div>
              <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-brand-500 text-white rounded-tr-sm' : 'bg-surface-4 text-slate-200 rounded-tl-sm'}`}>
                  {m.content.trim()}
                </div>
                {m.image_url && <Image src={m.image_url} alt="" width={200} height={150} className="rounded-xl object-cover" />}
                <span className="text-[10px] text-slate-600">{formatMessageTime(m.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-surface-2 border-t border-white/[0.06] flex-shrink-0">
        {preview && (
          <div className="relative inline-block mb-2">
            <Image src={preview} alt="" width={100} height={70} className="rounded-lg object-cover" />
            <button onClick={() => { setImage(null); setPreview(null) }} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-end gap-2 bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-2.5 focus-within:border-brand-500/40 transition-all">
            <input type="text" value={content} onChange={e => setContent(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={`Message ${other?.username ?? ''}...`} className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 text-sm outline-none" />
            <button onClick={() => fileRef.current?.click()} className="text-slate-500 hover:text-slate-300 transition-colors"><ImageIcon className="w-4 h-4" /></button>
          </div>
          <button onClick={send} disabled={sending || (!content.trim() && !imageFile)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-all disabled:opacity-40 active:scale-95">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setImage(f); setPreview(URL.createObjectURL(f)) } }} />
      </div>
    </div>
  )
}
