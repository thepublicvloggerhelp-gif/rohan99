'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Plus, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, DMConversation } from '@/types'
import { formatRelativeTime, getInitials, cn } from '@/lib/utils'
import { NewDMModal } from '@/components/chat/NewDMModal'

export default function DMIndexPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState<any[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [query, setQuery] = useState('')
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (prof) setProfile(prof)

      const { data: parts } = await supabase
        .from('dm_participants')
        .select(`conversation_id, dm_conversations(id, created_at)`)
        .eq('user_id', user.id)

      if (!parts) return
      const convIds = parts.map((p: any) => p.conversation_id)

      const convData = await Promise.all(convIds.map(async (cid: string) => {
        const [{ data: participants }, { data: lastMsg }] = await Promise.all([
          supabase.from('dm_participants').select('*, user:profiles(*)').eq('conversation_id', cid),
          supabase.from('direct_messages').select('*, sender:profiles!sender_id(username)').eq('conversation_id', cid).order('created_at', { ascending: false }).limit(1).single(),
        ])
        const other = participants?.find((p: any) => p.user_id !== user.id)
        return { id: cid, other: other?.user, lastMsg }
      }))

      setConversations(convData.filter(c => c.other))
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
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No conversations yet
            </div>
          ) : (
            filtered.map(conv => (
              <Link key={conv.id} href={`/dm/${conv.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-4 flex-shrink-0 flex items-center justify-center text-sm font-bold text-brand-400">
                  {conv.other?.avatar_url
                    ? <Image src={conv.other.avatar_url} alt="" width={40} height={40} className="object-cover" />
                    : getInitials(conv.other?.full_name ?? 'U')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-200 text-sm truncate">{conv.other?.username}</p>
                  <p className="text-xs text-slate-500 truncate">{conv.lastMsg?.content ?? 'No messages yet'}</p>
                </div>
                {conv.lastMsg && (
                  <span className="text-[10px] text-slate-600 flex-shrink-0">
                    {formatRelativeTime(conv.lastMsg.created_at)}
                  </span>
                )}
              </Link>
            ))
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
