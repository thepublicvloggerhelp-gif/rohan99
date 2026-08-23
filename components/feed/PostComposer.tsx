'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Send, Smile, X } from 'lucide-react'
import { Post, Profile } from '@/types'
import {
  MAX_POST_LENGTH, MOODS, canPublish, createPost, uploadPostImage,
} from '@/lib/feed'
import { cn, getInitials } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  currentUser: Profile
  onPosted: (post: Post) => void
}

export function PostComposer({ currentUser, onPosted }: Props) {
  const [content, setContent]   = useState('')
  const [mood, setMood]         = useState<string | null>(null)
  const [file, setFile]         = useState<File | null>(null)
  const [preview, setPreview]   = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy]         = useState(false)
  const [moodOpen, setMoodOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type.startsWith('image/')) setFile(dropped)
  }, [])

  const remaining = MAX_POST_LENGTH - content.length
  const ready = canPublish(content, file ? 'pending' : null) && !busy

  const publish = async () => {
    if (!ready) return
    setBusy(true)
    try {
      const imageUrl = file ? await uploadPostImage(file, currentUser.id) : null
      const post = await createPost({
        authorId: currentUser.id,
        content,
        imageUrl,
        mood,
      })
      onPosted(post)
      setContent('')
      setMood(null)
      setFile(null)
      toast.success('Posted to the feed')
    } catch (err: any) {
      toast.error(err.message ?? 'Could not publish your post')
    } finally {
      setBusy(false)
    }
  }

  const activeMood = MOODS.find(m => m.value === mood)

  return (
    <div
      id="post-composer"
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'glass-card rounded-2xl p-4 transition-all duration-200',
        dragging && 'border-blue-500/60 bg-blue-500/[0.04]'
      )}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-blue-600/20 flex items-center justify-center">
          {currentUser.avatar_url ? (
            <Image src={currentUser.avatar_url} alt={currentUser.username} width={40} height={40} className="object-cover w-full h-full" />
          ) : (
            <span className="text-sm font-black text-blue-400">{getInitials(currentUser.full_name || currentUser.username)}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <textarea
            id="composer-input"
            value={content}
            onChange={e => setContent(e.target.value.slice(0, MAX_POST_LENGTH))}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') publish()
            }}
            rows={content.length > 90 ? 4 : 2}
            placeholder={`What's up, ${currentUser.username}? Share something with the squad…`}
            className="w-full bg-transparent text-[15px] leading-relaxed text-slate-100 placeholder:text-slate-500 outline-none resize-none"
          />

          {/* Image preview */}
          {preview && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-white/[0.07]">
              <img src={preview} alt="Preview" className="w-full max-h-80 object-contain bg-black/40" />
              <button
                id="composer-remove-image"
                onClick={() => setFile(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mood chip */}
          {activeMood && (
            <button
              onClick={() => setMood(null)}
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25 hover:bg-blue-500/25 transition-colors"
            >
              <span>{activeMood.emoji}</span>
              Feeling {activeMood.label}
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-1 relative">
              <button
                id="composer-image-btn"
                onClick={() => fileRef.current?.click()}
                title="Add a photo"
                className="btn-ghost px-2.5 py-2 text-slate-400 hover:text-blue-400"
              >
                <ImagePlus className="w-[18px] h-[18px]" />
              </button>
              <button
                id="composer-mood-btn"
                onClick={() => setMoodOpen(v => !v)}
                title="Set a mood"
                className="btn-ghost px-2.5 py-2 text-slate-400 hover:text-amber-400"
              >
                <Smile className="w-[18px] h-[18px]" />
              </button>

              {moodOpen && (
                <div className="absolute left-0 bottom-full mb-2 z-20 w-52 p-1.5 rounded-xl border border-white/[0.08] shadow-2xl"
                  style={{ background: 'var(--bg-elevated)' }}>
                  {MOODS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => { setMood(m.value); setMoodOpen(false) }}
                      className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-sm font-semibold text-slate-300 hover:bg-white/[0.06] transition-colors"
                    >
                      <span className="text-base">{m.emoji}</span> {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <span className={cn(
                  'text-[11px] font-bold tabular-nums',
                  remaining < 60 ? 'text-red-400' : 'text-slate-600'
                )}>
                  {remaining}
                </span>
              )}
              <button
                id="composer-post-btn"
                onClick={publish}
                disabled={!ready}
                className="btn-primary px-4 py-2 text-sm"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {busy ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }}
      />
    </div>
  )
}
