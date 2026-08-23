'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Send, Image as ImageIcon, X, Lock, Hash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadFile } from '@/lib/upload'
import { Profile, Message } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BUCKET_LIMITS } from '@/lib/upload-constraints'

interface Props {
  channelId:      string
  profile:        Profile
  replyTo:        Message | null
  onCancelReply:  () => void
  channelName:    string
  isAnnouncement: boolean
}

export function MessageInput({
  channelId, profile, replyTo, onCancelReply, channelName, isAnnouncement
}: Props) {
  const supabase = createClient()
  const [content,   setContent]  = useState('')
  const [imageFile, setImage]    = useState<File | null>(null)
  const [preview,   setPreview]  = useState<string | null>(null)
  const [sending,   setSending]  = useState(false)
  const [focused,   setFocused]  = useState(false)
  const fileRef  = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const typingChannel = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const stopTyping    = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    typingChannel.current = supabase.channel(`typing:${channelId}`)
    typingChannel.current.subscribe()
    return () => { if (typingChannel.current) supabase.removeChannel(typingChannel.current) }
  }, [channelId])

  const broadcastTyping = useCallback(() => {
    typingChannel.current?.send({
      type: 'broadcast', event: 'typing',
      payload: { user_id: profile.id, username: profile.username },
    })
    if (stopTyping.current) clearTimeout(stopTyping.current)
    stopTyping.current = setTimeout(() => {
      typingChannel.current?.send({
        type: 'broadcast', event: 'stop_typing',
        payload: { user_id: profile.id },
      })
    }, 2000)
  }, [channelId, profile])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > BUCKET_LIMITS['chat-images']) { toast.error('Image must be under 5MB'); return }
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const send = async () => {
    if (!content.trim() && !imageFile) return
    setSending(true)
    try {
      let imageUrl: string | null = null
      if (imageFile) {
        try {
          imageUrl = await uploadFile(imageFile, 'chat-images', `${channelId}/${Date.now()}.${imageFile.name.split('.').pop()}`)
        } catch (err: any) {
          toast.error('Image upload failed: ' + err.message)
          setSending(false)
          return
        }
      }

      const { error } = await supabase.from('messages').insert({
        channel_id:  channelId,
        sender_id:   profile.id,
        content:     content.trim() || ' ',
        image_url:   imageUrl,
        reply_to_id: replyTo?.id ?? null,
      })
      if (error) { toast.error(error.message); return }

      setContent('')
      setImage(null)
      setPreview(null)
      onCancelReply()
      inputRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (isAnnouncement) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 border-t border-white/[0.06] flex-shrink-0"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center">
          <Lock className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-white text-sm font-bold">Announcements Channel</p>
          <p className="text-slate-600 text-xs font-medium">Only admins can post here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 border-t border-white/[0.06] flex-shrink-0"
      style={{ background: 'var(--bg-secondary)' }}>

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-3 mb-2 px-3 py-2 rounded-xl border-l-2 border-blue-600 border border-white/[0.06]"
          style={{ background: 'var(--bg-elevated)' }}>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-black text-blue-400">{(replyTo.sender as any)?.username}</span>
            <p className="text-xs text-slate-500 truncate font-medium">{replyTo.content}</p>
          </div>
          <button onClick={onCancelReply} className="text-slate-600 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Image preview */}
      {preview && (
        <div className="relative inline-block mb-2">
          <Image src={preview} alt="Upload preview" width={120} height={80} className="rounded-xl object-cover border border-white/[0.08]" />
          <button
            onClick={() => { setImage(null); setPreview(null) }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <div className={cn(
          'flex-1 flex items-end gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 border',
          focused
            ? 'border-blue-600/60 bg-white/[0.07]'
            : 'border-white/[0.07] bg-white/[0.04]'
        )}>
          {/* Channel indicator */}
          <Hash className="w-3.5 h-3.5 text-slate-700 mb-0.5 flex-shrink-0" />

          <textarea
            ref={inputRef}
            id="message-input"
            value={content}
            onChange={e => { setContent(e.target.value); broadcastTyping() }}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={`Message in ${channelName}...`}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder:text-slate-600 text-sm outline-none resize-none max-h-32 overflow-y-auto leading-relaxed font-medium"
            style={{ height: 'auto' }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 128) + 'px'
            }}
          />

          {/* Image upload */}
          <button
            id="upload-image-btn"
            onClick={() => fileRef.current?.click()}
            className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0 mb-0.5 p-1 rounded-lg hover:bg-white/[0.06]"
            title="Upload image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Send button */}
        <button
          id="send-message-btn"
          onClick={send}
          disabled={sending || (!content.trim() && !imageFile)}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
          style={{
            background: content.trim() || imageFile ? '#2563EB' : 'rgba(255,255,255,0.05)',
            boxShadow: content.trim() || imageFile ? '0 4px 16px rgba(37,99,235,0.4)' : 'none',
          }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
    </div>
  )
}
