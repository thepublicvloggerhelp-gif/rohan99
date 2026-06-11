'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Hash, Pin, Search, ChevronRight, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Message, Channel, Profile } from '@/types'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { ChannelSidebar } from '@/components/chat/ChannelSidebar'
import { CHANNEL_ICONS } from '@/lib/utils'

export default function ChannelChatPage() {
  const params    = useParams()
  const channelId = params.channelId as string
  const supabase  = createClient()

  const [channel,  setChannel]  = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [replyTo,  setReplyTo]  = useState<Message | null>(null)
  const [pinned,   setPinned]   = useState<Message[]>([])
  const [showPins, setShowPins] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(channelId)
      if (!isUUID) {
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      try {
        const [{ data: prof }, { data: ch }, { data: msgs }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('channels').select('*').eq('id', channelId).single(),
          supabase.from('messages')
            .select(`*, sender:profiles!sender_id(*), reply_to:messages!reply_to_id(*, sender:profiles!sender_id(*)), reactions:message_reactions(*, user:profiles!user_id(username))`)
            .eq('channel_id', channelId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })
            .limit(100),
        ])

        if (prof)  setProfile(prof)
        if (ch)    setChannel(ch)
        if (msgs)  setMessages(msgs)

        // Pinned messages
        const { data: pins } = await supabase
          .from('pinned_messages')
          .select('*, message:messages(*, sender:profiles!sender_id(username))')
          .eq('channel_id', channelId)
        if (pins) setPinned(pins.map((p: any) => p.message).filter(Boolean))
      } catch (err) {
        console.error('Error loading channel:', err)
      } finally {
        setLoading(false)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    }
    load()
  }, [channelId])

  // Realtime subscription
  useEffect(() => {
    const sub = supabase
      .channel(`chat:${channelId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      }, async payload => {
        if (payload.eventType === 'INSERT') {
          const { data: msg } = await supabase
            .from('messages')
            .select(`*, sender:profiles!sender_id(*), reply_to:messages!reply_to_id(*, sender:profiles!sender_id(*)), reactions:message_reactions(*, user:profiles!user_id(username))`)
            .eq('id', payload.new.id)
            .single()
          if (msg) {
            setMessages(prev => [...prev, msg])
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
          }
        }
        if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m))
        }
        if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id))
        }
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'message_reactions',
      }, async () => {
        // Reload reactions
        const { data: msgs } = await supabase
          .from('messages')
          .select(`*, sender:profiles!sender_id(*), reply_to:messages!reply_to_id(*, sender:profiles!sender_id(*)), reactions:message_reactions(*, user:profiles!user_id(username))`)
          .eq('channel_id', channelId).eq('is_deleted', false)
          .order('created_at', { ascending: true }).limit(100)
        if (msgs) setMessages(msgs)
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [channelId])

  const icon = channel ? (CHANNEL_ICONS[channel.name] ?? '#') : '#'

  if (!loading && !channel) {
    return (
      <div className="flex h-full overflow-hidden">
        <ChannelSidebar currentChannelId={channelId} />
        <div className="flex-1 flex flex-col bg-surface-3 items-center justify-center p-6 text-center">
          <span className="text-4xl mb-4">💬</span>
          <h3 className="text-slate-200 font-semibold text-lg">Channel Not Found</h3>
          <p className="text-slate-500 text-sm max-w-sm mt-1">
            This channel does not exist or you do not have permission to view it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Channel list sidebar */}
      <ChannelSidebar currentChannelId={channelId} />

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-surface-3">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.06] bg-surface-2 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{icon}</span>
            <h2 className="font-semibold text-slate-100 truncate">
              {channel?.name ?? '...'}
            </h2>
            {channel?.is_announcement && (
              <span className="badge bg-orange-500/20 text-orange-300 border-orange-500/30 text-[10px]">Announcements</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {pinned.length > 0 && (
              <button
                id="show-pins-btn"
                onClick={() => setShowPins(!showPins)}
                className="btn-ghost gap-1 text-xs text-slate-400"
              >
                <Pin className="w-3.5 h-3.5" />
                {pinned.length} pinned
              </button>
            )}
          </div>
        </div>

        {/* Pinned messages panel */}
        {showPins && pinned.length > 0 && (
          <div className="border-b border-white/[0.06] bg-surface-2 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Pin className="w-3 h-3" /> Pinned Messages
              </h3>
              <button onClick={() => setShowPins(false)} className="text-slate-500 hover:text-slate-300 text-xs">Hide</button>
            </div>
            {pinned.slice(0, 3).map(m => (
              <div key={m.id} className="text-sm text-slate-300 bg-white/[0.04] rounded-lg px-3 py-2">
                <span className="text-brand-400 font-medium text-xs">{(m as any).sender?.username}: </span>
                {m.content}
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce-dot" />
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce-dot-2" />
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce-dot-3" />
              </div>
            </div>
          ) : (
            <MessageList
              messages={messages}
              currentUserId={profile?.id ?? ''}
              currentUserRole={profile?.role ?? 'student'}
              channelId={channelId}
              onReply={setReplyTo}
              onDelete={(id) => setMessages(prev => prev.filter(m => m.id !== id))}
            />
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {profile && (
          <MessageInput
            channelId={channelId}
            profile={profile}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            channelName={channel?.name ?? 'channel'}
            isAnnouncement={channel?.is_announcement && profile.role !== 'admin' ? true : false}
          />
        )}
      </div>
    </div>
  )
}
