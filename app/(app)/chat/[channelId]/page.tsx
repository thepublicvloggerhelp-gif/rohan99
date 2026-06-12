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
import { CHANNEL_ICONS, getInitials } from '@/lib/utils'
import { CountdownBanner } from '@/components/chat/CountdownBanner'
import { usePresence } from '@/lib/presence'

export default function ChannelChatPage() {
  const params    = useParams()
  const channelId = params.channelId as string
  const supabase  = createClient()
  const { presenceMap } = usePresence()

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

  const onlineOthers = Object.values(presenceMap)
    .filter(({ user }) => user.id !== profile?.id)
    .sort((a, b) => b.lastActive - a.lastActive)

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

        {channel?.name === 'general' && <CountdownBanner />}

        {/* ── MOBILE ONLINE STRIP (only for #general, hidden on xl+) ── */}
        {channel?.name === 'general' && (
          <div className="xl:hidden flex-shrink-0 border-b border-white/[0.06] bg-[#0B0F19]/60 px-3 py-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {/* Count badge */}
              <div className="flex-shrink-0 flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 rounded-full px-3 py-1">
                <div className="w-2 h-2 rounded-full bg-green-500 status-dot online flex-shrink-0" />
                <span className="text-[11px] font-bold text-green-400 whitespace-nowrap">
                  {onlineOthers.length} online
                </span>
              </div>

              {onlineOthers.length === 0 ? (
                <span className="text-[11px] text-slate-500 italic whitespace-nowrap">Everyone is touching grass 🌿</span>
              ) : (
                onlineOthers.map(({ user, status }) => (
                  <div
                    key={user.id}
                    className="flex-shrink-0 flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full px-2.5 py-1 hover:bg-white/[0.07] transition-colors"
                  >
                    {/* Mini avatar */}
                    <div className="relative w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-[9px] font-bold text-brand-400 flex-shrink-0 overflow-hidden">
                      {user.avatar_url
                        ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        : getInitials(user.full_name)[0]}
                      <div className={`absolute -bottom-[1px] -right-[1px] w-2 h-2 status-dot ${status}`} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300 whitespace-nowrap">{user.username}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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

      {/* Online Now right sidebar (only for general channel, desktop only) */}
      {channel?.name === 'general' && (
        <div className="hidden xl:flex flex-col w-64 border-l border-slate-200/60 bg-surface-2 flex-shrink-0">
          <div className="p-4 border-b border-slate-200/60 h-14 flex items-center bg-surface-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 status-dot online" />
              <h3 className="font-bold text-slate-50 text-sm">
                Online Now ({onlineOthers.length})
              </h3>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scroll-area p-3 space-y-1 bg-surface-2/40">
            {onlineOthers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs italic px-4">
                Everyone is touching grass right now.
              </div>
            ) : (
              onlineOthers.map(({ user, status, lastActive }) => {
                const minutesAgo = Math.max(0, Math.floor((Date.now() - lastActive) / 60000))
                const lastActiveText = minutesAgo === 0 ? 'Active just now' : `Last active: ${minutesAgo}m ago`

                return (
                  <div
                    key={user.id}
                    className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-900/[0.03] transition-all relative cursor-pointer"
                  >
                    <div className="relative w-9 h-9 rounded-full bg-surface-4 flex-shrink-0 flex items-center justify-center text-sm font-bold text-brand-500 border border-slate-200/60 shadow-sm">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        getInitials(user.full_name)
                      )}
                      <div className={`absolute bottom-[-1.5px] right-[-1.5px] w-3 h-3 status-dot ${status}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-50 truncate">{user.username}</p>
                      <p className="text-[10px] text-slate-400 font-semibold truncate capitalize">
                        {status} · {user.stream}
                      </p>
                    </div>
                    <div className="absolute right-4 bottom-10 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 text-white text-[10px] font-semibold px-2 py-1.5 rounded-xl border border-slate-700/60 shadow-2xl whitespace-nowrap">
                      {lastActiveText}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
