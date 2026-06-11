'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Hash, ChevronDown, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Channel } from '@/types'
import { cn, CHANNEL_ICONS } from '@/lib/utils'

interface Props { currentChannelId: string }

type CategoryGroup = { name: string; channels: Channel[] }

export function ChannelSidebar({ currentChannelId }: Props) {
  const supabase  = createClient()
  const [channels, setChannels] = useState<Channel[]>([])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    supabase.from('channels').select('*').order('category').order('name').then(({ data }) => {
      if (data) setChannels(data)
    })
  }, [])

  // Group by category
  const groups: CategoryGroup[] = []
  const seen = new Set<string>()
  for (const ch of channels) {
    if (!seen.has(ch.category)) {
      seen.add(ch.category)
      groups.push({ name: ch.category, channels: channels.filter(c => c.category === ch.category) })
    }
  }

  return (
    <div className="hidden lg:flex flex-col w-56 bg-surface-2 border-r border-white/[0.06] overflow-y-auto flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Community</h2>
      </div>

      <div className="p-2 flex-1">
        {groups.map(group => (
          <div key={group.name} className="mb-3">
            <button
              className="flex items-center gap-1 w-full px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-400 transition-colors"
              onClick={() => setCollapsed(c => ({ ...c, [group.name]: !c[group.name] }))}
            >
              {collapsed[group.name] ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {group.name}
            </button>

            {!collapsed[group.name] && group.channels.map(ch => (
              <Link
                key={ch.id}
                href={`/chat/${ch.id}`}
                id={`channel-${ch.name}`}
                className={cn('channel-item', ch.id === currentChannelId && 'active')}
              >
                <span className="text-base">{CHANNEL_ICONS[ch.name] ?? '💬'}</span>
                <span className="truncate">{ch.name}</span>
                {ch.is_announcement && (
                  <span className="ml-auto text-[10px] text-orange-400 font-medium">📢</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
