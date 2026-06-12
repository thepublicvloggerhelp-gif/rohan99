'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Hash, Megaphone, ChevronDown, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Channel } from '@/types'
import { cn } from '@/lib/utils'

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

  const groups: CategoryGroup[] = []
  const seen = new Set<string>()
  for (const ch of channels) {
    if (!seen.has(ch.category)) {
      seen.add(ch.category)
      groups.push({ name: ch.category, channels: channels.filter(c => c.category === ch.category) })
    }
  }

  return (
    <div className="hidden lg:flex flex-col w-56 border-r border-white/[0.06] overflow-y-auto flex-shrink-0 scroll-area"
      style={{ background: 'var(--bg-secondary)' }}>

      {/* Header */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Community</p>
      </div>

      <div className="p-2 flex-1">
        {groups.map(group => (
          <div key={group.name} className="mb-4">
            {/* Category header */}
            <button
              className="flex items-center gap-1.5 w-full px-2 py-1 mb-1 text-[10px] font-black text-slate-600 uppercase tracking-[0.18em] hover:text-slate-400 transition-colors"
              onClick={() => setCollapsed(c => ({ ...c, [group.name]: !c[group.name] }))}
            >
              {collapsed[group.name]
                ? <ChevronRight className="w-3 h-3" />
                : <ChevronDown className="w-3 h-3" />}
              {group.name}
            </button>

            {!collapsed[group.name] && group.channels.map(ch => {
              const isActive = ch.id === currentChannelId
              return (
                <Link
                  key={ch.id}
                  href={`/chat/${ch.id}`}
                  id={`channel-${ch.name}`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer select-none group',
                    isActive
                      ? 'text-white bg-blue-600'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]'
                  )}
                >
                  {ch.is_announcement
                    ? <Megaphone className={cn('w-3.5 h-3.5 flex-shrink-0', isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-400')} />
                    : <Hash className={cn('w-3.5 h-3.5 flex-shrink-0', isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-400')} />}
                  <span className="truncate">{ch.name}</span>
                  {ch.is_announcement && !isActive && (
                    <span className="ml-auto text-[9px] font-black text-red-500 uppercase tracking-wider">LIVE</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
