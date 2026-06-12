'use client'

import { useRef, useEffect } from 'react'
import { Message } from '@/types'
import { MessageItem } from './MessageItem'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { MessageSquare } from 'lucide-react'

interface Props {
  messages:          Message[]
  currentUserId:     string
  currentUserRole:   string
  channelId:         string
  onReply:           (msg: Message) => void
  onDelete:          (id: string) => void
}

function DateSeparator({ date }: { date: Date }) {
  const label = isToday(date) ? 'TODAY' : isYesterday(date) ? 'YESTERDAY' : format(date, 'MMMM d, yyyy').toUpperCase()
  return (
    <div className="flex items-center gap-3 py-4 px-4">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <span className="text-[10px] font-black text-slate-700 tracking-[0.15em] px-3 py-1 rounded border border-white/[0.06]"
        style={{ background: 'var(--bg-secondary)' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

export function MessageList({
  messages, currentUserId, currentUserRole, channelId, onReply, onDelete
}: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-white/[0.08]"
          style={{ background: 'var(--bg-elevated)' }}>
          <MessageSquare className="w-8 h-8 text-slate-700" />
        </div>
        <h3 className="font-black text-white text-lg mb-1 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          No messages yet
        </h3>
        <p className="text-slate-600 text-sm font-medium">Be the first to say something.</p>
      </div>
    )
  }

  const items: React.ReactNode[] = []
  let lastDate: Date | null = null
  let lastSenderId: string | null = null
  let lastTime = 0

  messages.forEach(msg => {
    const msgDate = new Date(msg.created_at)
    const msgTime = msgDate.getTime()

    if (!lastDate || !isSameDay(lastDate, msgDate)) {
      items.push(<DateSeparator key={`sep-${msg.id}`} date={msgDate} />)
      lastDate     = msgDate
      lastSenderId = null
    }

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
