'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LeaderboardEntry, Stream } from '@/types'
import { getInitials, cn } from '@/lib/utils'

const TABS: { label: string; value: string }[] = [
  { label: 'Overall', value: 'All' },
  { label: 'JEE',     value: 'JEE' },
  { label: 'NEET',    value: 'NEET' },
]

export default function LeaderboardPage() {
  const supabase = createClient()
  const [entries,  setEntries]  = useState<LeaderboardEntry[]>([])
  const [tab,      setTab]      = useState('All')
  const [loading,  setLoading]  = useState(true)
  const [myId,     setMyId]     = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMyId(user.id)

      const { data } = await supabase.from('leaderboard').select('*')
      if (data) setEntries(data as LeaderboardEntry[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = tab === 'All' ? entries : entries.filter(e => e.stream === tab)
  const ranked   = filtered.map((e, i) => ({ ...e, rank: i + 1 }))

  const rankBadge = (rank: number) => {
    if (rank === 1) return <Crown  className="w-5 h-5 text-yellow-400" />
    if (rank === 2) return <Medal  className="w-5 h-5 text-slate-400"  />
    if (rank === 3) return <Medal  className="w-5 h-5 text-amber-600"  />
    return <span className="text-sm font-bold text-slate-500">#{rank}</span>
  }

  return (
    <div className="overflow-y-auto scroll-area h-full p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Leaderboard</h1>
          <p className="text-slate-400 text-sm mt-1">Ranked by total test score</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 justify-center mb-6">
          {TABS.map(t => (
            <button
              key={t.value}
              id={`leaderboard-tab-${t.value}`}
              onClick={() => setTab(t.value)}
              className={cn(
                'px-5 py-2 rounded-xl text-sm font-semibold border transition-all',
                tab === t.value
                  ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                  : 'border-white/10 text-slate-400 hover:border-white/20'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Top 3 podium */}
        {!loading && ranked.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {[ranked[1], ranked[0], ranked[2]].map((e, i) => (
              <div key={e.user_id} className={cn('flex flex-col items-center gap-2', i === 1 ? 'order-first' : i === 0 ? 'order-2' : 'order-last')}>
                <div className={cn('relative', i === 0 ? 'scale-110' : '')}>
                  <div className={cn('w-14 h-14 rounded-full overflow-hidden border-2 flex items-center justify-center font-bold',
                    i === 0 ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300' :
                    i === 1 ? 'border-slate-400 bg-surface-4 text-slate-300' :
                              'border-amber-600 bg-amber-500/10 text-amber-400'
                  )}>
                    {e.avatar_url
                      ? <Image src={e.avatar_url} alt="" width={56} height={56} className="object-cover" />
                      : <span>{getInitials(e.full_name)}</span>}
                  </div>
                  {i === 0 && <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 text-yellow-400" />}
                </div>
                <p className="text-xs font-semibold text-slate-300 truncate max-w-[80px] text-center">{e.username}</p>
                <p className="text-sm font-bold text-slate-200">{e.total_score}</p>
                <div className={cn('w-full h-12 rounded-t-lg flex items-center justify-center text-lg font-black',
                  i === 0 ? 'bg-yellow-500/20 text-yellow-400 h-16' :
                  i === 1 ? 'bg-slate-500/20 text-slate-300' :
                            'bg-amber-600/20 text-amber-400 h-10'
                )}>
                  #{i === 0 ? 1 : i === 1 ? 2 : 3}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="glass-card rounded-xl h-16 shimmer" />)}
          </div>
        ) : ranked.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No data yet. Take tests to appear here!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ranked.map(e => (
              <Link
                key={e.user_id}
                href={`/profile/${e.user_id}`}
                id={`leaderboard-entry-${e.user_id}`}
                className={cn(
                  'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group',
                  e.user_id === myId
                    ? 'glass-card border border-brand-500/30 bg-brand-500/5'
                    : 'glass-card-hover'
                )}
              >
                <div className="w-8 flex items-center justify-center flex-shrink-0">
                  {rankBadge(e.rank)}
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-4 flex-shrink-0 flex items-center justify-center text-sm font-bold text-brand-400">
                  {e.avatar_url
                    ? <Image src={e.avatar_url} alt="" width={40} height={40} className="object-cover" />
                    : getInitials(e.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-200 text-sm truncate">{e.username}</p>
                    {e.user_id === myId && <span className="text-[10px] text-brand-400 font-bold">YOU</span>}
                  </div>
                  <p className="text-xs text-slate-500">{e.full_name}</p>
                </div>
                <span className={cn('badge', e.stream === 'JEE' ? 'badge-jee' : 'badge-neet')}>{e.stream}</span>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-200 text-sm">{e.total_score}</p>
                  <p className="text-xs text-slate-500">{Math.round(Number(e.avg_accuracy))}% acc</p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs text-slate-500">{e.attempts_count} tests</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
