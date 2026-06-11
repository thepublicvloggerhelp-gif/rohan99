'use client'

import { useRef, useEffect } from 'react'
import { Message } from '@/types'
import { MessageItem } from './MessageItem'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'

interface Props {
  messages:          Message[]
  currentUserId:     string
  currentUserRole:   string
  channelId:         string
  onReply:           (msg: Message) => void
  onDelete:          (id: string) => void
}

function DateSeparator({ date }: { date: Date }) {
  const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMMM d, yyyy')
  return (
    <div className="flex items-center gap-3 py-4 px-4">
      <div className="flex-1 h-px bg-white/[0.06]" />
      <span className="text-xs text-slate-500 font-medium px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  )
}

export function MessageList({ messages, currentUserId, currentUserRole, channelId, onReply, onDelete }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="text-5xl mb-4">💬</div>
        <h3 className="text-slate-300 font-semibold text-lg mb-1">No messages yet</h3>
        <p className="text-slate-500 text-sm">Be the first to say something!</p>
      </div>
    )
  }

  const items: React.ReactNode[] = []
  let lastDate: Date | null = null
  let lastSenderId: string | null = null
  let lastTime: number = 0

  messages.forEach((msg, idx) => {
    const msgDate = new Date(msg.created_at)
    const msgTime = msgDate.getTime()

    // Date separator
    if (!lastDate || !isSameDay(lastDate, msgDate)) {
      items.push(<DateSeparator key={`sep-${msg.id}`} date={msgDate} />)
      lastDate = msgDate
      lastSenderId = null
    }

    // Group consecutive messages from same sender within 5 minutes
    const isContinuation = (
      lastSenderId === msg.sender_id &&
      (msgTime - lastTime) < 5 * 60 * 1000 &&
      !msg.reply_to_id
    )

    items.push(
      <MessageItem
        key={msg.id}
        message={msg}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        channelId={channelId}
        isContinuation={isContinuation}
        onReply={onReply}
        onDelete={onDelete}
      />
    )

    lastSenderId = msg.sender_id
    lastTime     = msgTime
  })

  return (
    <div className="overflow-y-auto h-full scroll-area py-2">
      {items}
      <div ref={endRef} className="h-4" />
    </div>
  )
}
