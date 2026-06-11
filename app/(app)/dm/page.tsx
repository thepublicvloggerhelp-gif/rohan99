'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Plus, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { formatRelativeTime, getInitials, cn } from '@/lib/utils'
import { NewDMModal } from '@/components/chat/NewDMModal'
import { usePresence } from '@/lib/presence'

export default function DMIndexPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState<any[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [query, setQuery] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { presenceMap } = usePresence()

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (prof) setProfile(prof)

        // Step 1: Get conversation IDs for this user (simple query, no joins)
        const { data: myParts, error: partsErr } = await supabase
          .from('dm_participants')
          .select('conversation_id')
          .eq('user_id', user.id)

        if (partsErr) { setError(partsErr.message); return }
        if (!myParts || myParts.length === 0) { setLoading(false); return }

        const convIds = myParts.map((p: any) => p.conversation_id)

        // Step 2: For each conversation, get the other participant's user_id (simple query)
        const convData = await Promise.all(convIds.map(async (cid: string) => {
          // Get all participant user_ids for this conversation
          const { data: allParts } = await supabase
            .from('dm_participants')
            .select('user_id')
            .eq('conversation_id', cid)

          const otherUserId = allParts?.find((p: any) => p.user_id !== user.id)?.user_id
          if (!otherUserId) return null

          // Step 3: Fetch the other user's profile separately
          const { data: otherProfile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, stream')
            .eq('id', otherUserId)
            .single()

          // Step 4: Fetch the last message for this conversation
          const { data: lastMsg } = await supabase
            .from('direct_messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', cid)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          return { id: cid, other: otherProfile, lastMsg }
        }))

        setConversations(convData.filter(Boolean))
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = conversations.filter(c =>
    c.other?.username?.toLowerCase().includes(query.toLowerCase()) ||
    c.other?.full_name?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-full lg:w-72 bg-surface-2 border-r border-white/[0.06] flex flex-col">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-200">Direct Messages</h2>
            <button id="new-dm-btn" onClick={() => setShowNew(true)} className="btn-ghost p-1.5">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search conversations..."
              className="input-base pl-9 py-2 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-area p-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400 text-sm px-4">
              <p className="font-medium">Error loading messages</p>
              <p className="text-xs mt-1 text-slate-500">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <button onClick={() => setShowNew(true)} className="btn-primary mt-4 text-xs">Start a conversation</button>
            </div>
          ) : (
            filtered.map(conv => {
              const presence = presenceMap[conv.other?.id ?? '']
              const status = presence ? presence.status : 'offline'

              return (
                <Link key={conv.id} href={`/dm/${conv.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer">
                  {/* Avatar wrapper */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-4 flex items-center justify-center text-sm font-bold text-brand-400 border border-slate-200/60 shadow-sm animate-fade-in">
                      {conv.other?.avatar_url
                        ? <Image src={conv.other.avatar_url} alt="" width={40} height={40} className="object-cover" />
                        : getInitials(conv.other?.full_name ?? 'U')}
                    </div>
                    {/* Status Dot */}
                    <div className={`absolute bottom-[-1.5px] right-[-1.5px] w-3 h-3 status-dot ${status}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0 mb-0.5">
                      <p className="font-semibold text-slate-50 text-sm truncate">{conv.other?.username}</p>
                      <span className={cn(
                        'text-[9px] font-bold flex items-center gap-0.5 flex-shrink-0 capitalize',
                        status === 'online' ? 'text-green-500' : status === 'away' ? 'text-amber-500' : 'text-slate-400'
                      )}>
                        <span className="text-[6px]">●</span> {status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{conv.lastMsg?.content?.trim() || 'No messages yet'}</p>
                  </div>
                  {conv.lastMsg && (
                    <span className="text-[10px] text-slate-600 flex-shrink-0">
                      {formatRelativeTime(conv.lastMsg.created_at)}
                    </span>
                  )}
                </Link>
              )
            })
          )}
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center bg-surface-3">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-400 font-medium">Select a conversation</h3>
          <p className="text-slate-600 text-sm mt-1">or start a new one</p>
          <button onClick={() => setShowNew(true)} className="btn-primary mt-4 text-sm">New Message</button>
        </div>
      </div>

      {showNew && profile && (
        <NewDMModal currentUser={profile} onClose={() => setShowNew(false)} />
      )}
    </div>
  )
}
