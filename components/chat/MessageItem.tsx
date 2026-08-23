'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Reply, Trash2, SmilePlus, Pin } from 'lucide-react'
import { Message } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { formatMessageTime, getInitials, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getErrorMessage, logError } from '@/lib/errors'

interface Props {
  message:          Message
  currentUserId:    string
  currentUserRole:  string
  channelId:        string
  isContinuation:   boolean
  onReply:          (msg: Message) => void
  onDelete:         (id: string) => void
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '😮']

export function MessageItem({
  message, currentUserId, currentUserRole, channelId, isContinuation, onReply, onDelete
}: Props) {
  const supabase   = createClient()
  const [showEmoji, setShowEmoji] = useState(false)
  const isOwn  = message.sender_id === currentUserId
  const isAdmin = currentUserRole === 'admin'
  const sender  = message.sender as any

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return
    const { error } = await supabase.from('messages').update({ is_deleted: true }).eq('id', message.id)
    if (error) { toast.error('Failed to delete'); return }
    onDelete(message.id)
    toast.success('Deleted')
  }

  const handleReact = async (emoji: string) => {
    setShowEmoji(false)
    const existing = message.reactions?.find((r: any) => r.user_id === currentUserId && r.emoji === emoji)
    if (existing) {
      const { error } = await supabase.from('message_reactions').delete().eq('id', existing.id)
      if (error) {
        logError('remove message reaction', error)
        toast.error(getErrorMessage(error))
      }
    } else {
      const { error } = await supabase.from('message_reactions').insert({ message_id: message.id, user_id: currentUserId, emoji })
      if (error) {
        logError('add message reaction', error)
        toast.error(getErrorMessage(error))
      }
    }
  }

  const handlePin = async () => {
    const { error } = await supabase.from('pinned_messages').insert({ channel_id: channelId, message_id: message.id, pinned_by: currentUserId })
    if (error) {
      logError('pin message', error)
      toast.error(getErrorMessage(error))
      return
    }
    toast.success('Pinned')
  }

  // Group reactions by emoji
  const reactionGroups: Record<string, { count: number; mine: boolean }> = {}
  message.reactions?.forEach((r: any) => {
    if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = { count: 0, mine: false }
    reactionGroups[r.emoji].count++
    if (r.user_id === currentUserId) reactionGroups[r.emoji].mine = true
  })

  return (
    <div className={cn('group message-item', isContinuation ? 'pt-0.5 pb-0.5' : 'pt-2.5')}>

      {/* Avatar or spacer */}
      <div className="flex-shrink-0 w-10">
        {!isContinuation ? (
          <Link href={`/profile/${message.sender_id}`}>
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center text-xs font-black text-blue-400 hover:ring-2 ring-blue-500/40 transition-all">
              {sender?.avatar_url
                ? <Image src={sender.avatar_url} alt={sender.username} width={36} height={36} className="object-cover" />
                : getInitials(sender?.full_name ?? 'U')}
            </div>
          </Link>
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        {!isContinuation && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <Link
              href={`/profile/${message.sender_id}`}
              className="font-black text-white hover:text-blue-400 text-sm transition-colors tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {sender?.username ?? 'Unknown'}
            </Link>

            {/* Stream badge */}
            {sender?.stream && (
              <span className={cn(
                'text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded',
                sender.stream === 'JEE'
                  ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30'
                  : 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/30'
              )}>
                {sender.stream}
              </span>
            )}

            {/* Admin badge */}
            {sender?.role === 'admin' && (
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-600/25 text-red-400 border border-red-500/30">
                ADMIN
              </span>
            )}

            <span className="text-slate-600 text-[11px] font-medium">
              {formatMessageTime(message.created_at)}
            </span>
          </div>
        )}

        {/* Reply reference */}
        {message.reply_to && (
          <div className="flex items-center gap-2 mb-1.5 pl-3 border-l-2 border-blue-600/50 py-0.5">
            <span className="text-xs font-bold text-blue-400">
              {(message.reply_to as any).sender?.username}
            </span>
            <span className="text-xs text-slate-600 truncate max-w-xs">
              {message.reply_to.content}
            </span>
          </div>
        )}

        {/* Content */}
        <p className="text-slate-300 text-sm leading-relaxed break-words font-medium">
          {message.content}
        </p>

        {/* Image */}
        {message.image_url && (
          <div className="mt-2">
            <Image
              src={message.image_url}
              alt="Shared image"
              width={300}
              height={200}
              className="rounded-xl object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity border border-white/[0.06]"
              onClick={() => window.open(message.image_url!, '_blank')}
            />
          </div>
        )}

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {Object.entries(reactionGroups).map(([emoji, { count, mine }]) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className={cn('reaction-chip', mine && 'active')}
              >
                <span>{emoji}</span>
                <span className={cn('font-black text-xs', mine ? 'text-blue-300' : 'text-slate-500')}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-start mt-1">
        {/* Quick emojis */}
        <div className="relative">
          <button className="msg-action" title="React" onClick={() => setShowEmoji(!showEmoji)}>
            <SmilePlus className="w-4 h-4" />
          </button>
          {showEmoji && (
            <div className="absolute right-0 bottom-9 z-50 flex gap-1 px-2 py-1.5 rounded-xl border border-white/[0.08] shadow-2xl"
              style={{ background: 'var(--bg-card)' }}>
              {QUICK_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => handleReact(e)}
                  className="text-lg hover:scale-125 transition-transform p-0.5"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="msg-action" title="Reply" onClick={() => onReply(message)}>
          <Reply className="w-4 h-4" />
        </button>

        {isAdmin && (
          <button className="msg-action" title="Pin" onClick={handlePin}>
            <Pin className="w-4 h-4" />
          </button>
        )}

        {(isOwn || isAdmin) && (
          <button className="msg-action hover:text-red-400" title="Delete" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
