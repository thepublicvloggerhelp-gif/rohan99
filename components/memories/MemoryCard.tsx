'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Trash2, Calendar, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Memory, MemoryReaction } from '@/types'
import { getInitials, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

const EMOJIS = ['❤️', '😂', '😮', '😢']

interface Props {
  memory: Memory
  currentUserId: string
  onDelete: (id: string) => void
}

export function MemoryCard({ memory, currentUserId, onDelete }: Props) {
  const supabase = createClient()
  const [reactions, setReactions] = useState<MemoryReaction[]>(memory.reactions ?? [])
  const [deleting, setDeleting] = useState(false)

  // Count reactions per emoji
  const counts = EMOJIS.reduce<Record<string, number>>((acc, e) => {
    acc[e] = reactions.filter(r => r.emoji === e).length
    return acc
  }, {})

  // Check if current user has reacted with each emoji
  const myReaction = reactions.find(r => r.user_id === currentUserId)

  const handleReact = async (emoji: string) => {
    const alreadyReacted = myReaction?.emoji === emoji

    if (alreadyReacted) {
      // Remove reaction
      const { error } = await supabase
        .from('memory_reactions')
        .delete()
        .eq('memory_id', memory.id)
        .eq('user_id', currentUserId)

      if (!error) {
        setReactions(prev => prev.filter(r => r.user_id !== currentUserId))
      }
    } else {
      // Upsert reaction (replace any existing one)
      const { error } = await supabase
        .from('memory_reactions')
        .upsert({ memory_id: memory.id, user_id: currentUserId, emoji }, { onConflict: 'memory_id,user_id' })

      if (!error) {
        setReactions(prev => {
          const without = prev.filter(r => r.user_id !== currentUserId)
          return [...without, { memory_id: memory.id, user_id: currentUserId, emoji }]
        })
      }
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this memory? This cannot be undone.')) return
    setDeleting(true)
    const { error } = await supabase.from('memories').delete().eq('id', memory.id)
    if (error) {
      toast.error('Failed to delete memory')
      setDeleting(false)
    } else {
      toast.success('Memory deleted')
      onDelete(memory.id)
    }
  }

  const uploader = memory.uploader as any
  const tags = memory.tags ?? []

  return (
    <div className="memory-card rounded-2xl group" id={`memory-${memory.id}`}>
      {/* Photo */}
      <div className="relative w-full overflow-hidden bg-slate-100">
        <img
          src={memory.photo_url}
          alt={memory.caption ?? 'Memory'}
          className="w-full h-auto object-cover block"
          loading="lazy"
        />

        {/* Delete button — only for uploader */}
        {memory.uploaded_by === currentUserId && (
          <button
            id={`delete-memory-${memory.id}`}
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                       w-8 h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center
                       hover:bg-red-600 shadow-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2.5">
        {/* Caption */}
        {memory.caption && (
          <p className="text-slate-700 text-sm leading-snug line-clamp-3 font-medium">
            {memory.caption}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag: any) => (
              <span key={tag.user_id} className="memory-tag">
                <span className="w-3 h-3 rounded-full bg-pink-400 inline-block" />
                {tag.user?.username ?? 'friend'}
              </span>
            ))}
          </div>
        )}

        {/* Emoji reactions */}
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              id={`react-${memory.id}-${encodeURIComponent(emoji)}`}
              onClick={() => handleReact(emoji)}
              className={cn(
                'reaction-btn text-base',
                myReaction?.emoji === emoji && 'active'
              )}
            >
              <span>{emoji}</span>
              {counts[emoji] > 0 && (
                <span className="text-xs font-bold text-slate-600 ml-0.5">{counts[emoji]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Footer: uploader + date */}
        <div className="flex items-center justify-between pt-0.5">
          {/* Uploader */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-brand-500/20 flex items-center justify-center flex-shrink-0">
              {uploader?.avatar_url ? (
                <Image
                  src={uploader.avatar_url}
                  alt={uploader.username ?? ''}
                  width={24}
                  height={24}
                  className="object-cover"
                />
              ) : (
                <span className="text-[9px] font-bold text-brand-500">
                  {getInitials(uploader?.full_name ?? uploader?.username ?? 'U')}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 font-semibold truncate">
              {uploader?.username ?? 'someone'}
            </span>
          </div>

          {/* Date taken */}
          {memory.taken_at && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium flex-shrink-0">
              <Calendar className="w-3 h-3" />
              {format(new Date(memory.taken_at), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
