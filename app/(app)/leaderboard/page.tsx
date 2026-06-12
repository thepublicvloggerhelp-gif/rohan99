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

      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_score', { ascending: false })
      if (data) setEntries(data as LeaderboardEntry[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = tab === 'All' ? entries : entries.filter(e => e.stream === tab)
  const sorted   = [...filtered].sort((a, b) => b.total_score - a.total_score)
  const ranked   = sorted.map((e, i) => ({ ...e, rank: i + 1 }))

  const rankBadge = (rank: number) => {
    if (rank === 1) return <Crown  className="w-5 h-5 text-yellow-400" />
    if (rank === 2) return <Medal  className="w-5 h-5 text-slate-400"  />
    if (rank === 3) return <Medal  className="w-5 h-5 text-amber-600"  />
    return <span className="text-sm font-bold text-slate-500">#{rank}</span>
  }

  return (
    <div className="overflow-y-auto scroll-area h-full p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header Banner */}
        <div className="bg-red-600 text-white rounded-2xl p-6 shadow-red mb-8 relative overflow-hidden text-center border border-red-500/20">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none select-none">
            <Trophy className="w-24 h-24" />
          </div>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none select-none">
            <Crown className="w-24 h-24" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-1 uppercase">Weekly Leaderboard</h1>
          <p className="text-red-100 text-sm max-w-md mx-auto font-medium">Ranked by total practice test scores. Participate in more tests to climb the community rank and lock in your JEE/NEET prep podium!</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 justify-center mb-6">
          {TABS.map(t => (
            <button
              key={t.value}
              id={`leaderboard-tab-${t.value}`}
              onClick={() => setTab(t.value)}
              className={cn(
                'px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm',
                tab === t.value
                  ? 'bg-blue-600 border-blue-700 text-white shadow-brand'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:text-white'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Top 3 podium */}
        {!loading && ranked.length >= 1 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {[
              { e: ranked[1], place: 2, scale: 'scale-95', color: 'text-slate-300', border: 'border-slate-400/20', bg: 'bg-white/[0.02]', height: 'h-16' },
              { e: ranked[0], place: 1, scale: 'scale-110', color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5', height: 'h-24' },
              { e: ranked[2], place: 3, scale: 'scale-90', color: 'text-amber-600', border: 'border-amber-700/20', bg: 'bg-amber-600/5', height: 'h-12' },
            ].filter(item => item.e !== undefined).map(({ e, place, scale, color, border, bg, height }) => (
              <div key={e.user_id} className="flex flex-col items-center gap-2">
                <div className={cn('relative', scale)}>
                  <div className={cn('w-14 h-14 rounded-xl overflow-hidden border-2 flex items-center justify-center font-bold shadow-md bg-surface-4', border)}>
                    {e.avatar_url
                      ? <Image src={e.avatar_url} alt="" width={56} height={56} className="object-cover" />
                      : <span className="text-brand-400">{getInitials(e.full_name)}</span>}
                  </div>
                  {place === 1 && <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 text-yellow-500 drop-shadow-md" />}
                </div>
                <p className="text-xs font-black text-slate-200 truncate max-w-[80px] text-center">@{e.username}</p>
                <p className="text-sm font-black text-white">{e.total_score}</p>
                <div className={cn('w-20 rounded-t-xl flex flex-col items-center justify-center text-xs font-black border-t shadow-inner', height, bg, border, color)}>
                  <span className="text-[9px] uppercase tracking-wider opacity-60">Rank</span>
                  <span>#{place}</span>
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
