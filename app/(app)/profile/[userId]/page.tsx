'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Trophy, Target, BookOpen, MessageSquare, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { formatRelativeTime, getInitials, cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ProfilePage() {
  const params   = useParams()
  const userId   = params.userId as string
  const supabase = createClient()

  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [myId,     setMyId]     = useState<string | null>(null)
  const [stats,    setStats]    = useState({ attempts: 0, avgAccuracy: 0, totalScore: 0, rank: 0 })
  const [attempts, setAttempts] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMyId(user.id)

      const [{ data: prof }, { data: atts }, { data: lb }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('test_attempts').select('*, test:tests(title, subject)').eq('user_id', userId).order('completed_at', { ascending: false }).limit(10),
        supabase.from('leaderboard').select('rank').eq('user_id', userId).single(),
      ])

      if (prof) setProfile(prof)
      if (atts) {
        setAttempts(atts)
        const total = atts.length
        const avgAcc = total > 0 ? Math.round(atts.reduce((a: number, b: any) => a + b.accuracy, 0) / total) : 0
        const totalScore = atts.reduce((a: number, b: any) => a + b.score, 0)
        setStats({ attempts: total, avgAccuracy: avgAcc, totalScore, rank: (lb as any)?.rank ?? 0 })
      }
      setLoading(false)
    }
    load()
  }, [userId])

  const chartData = attempts.slice(0, 8).reverse().map((a, i) => ({
    name: `T${i + 1}`, accuracy: a.accuracy, score: a.score
  }))

  if (loading) return <div className="flex items-center justify-center h-full text-slate-400">Loading profile...</div>
  if (!profile) return <div className="flex items-center justify-center h-full text-slate-400">User not found</div>

  return (
    <div className="overflow-y-auto scroll-area h-full p-6">
      <div className="max-w-2xl mx-auto">
        {/* Profile card */}
        <div className="glass-card rounded-3xl p-8 mb-6 relative overflow-hidden">
          {/* Background pattern */}
          <div className={cn('absolute inset-0 opacity-30 bg-gradient-radial from-brand-500/20 to-transparent')} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />

          <div className="relative z-10 flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/10 bg-surface-4">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.username} width={96} height={96} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-brand-400">
                    {getInitials(profile.full_name)}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-100">{profile.full_name}</h1>
                  <p className="text-brand-400 font-medium">@{profile.username}</p>
                </div>
                {myId === userId && (
                  <Link href="/profile/settings" id="edit-profile-btn" className="btn-secondary text-sm gap-1.5">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={cn('badge', profile.stream === 'JEE' ? 'badge-jee' : 'badge-neet')}>
                  {profile.stream}
                </span>
                {profile.role === 'admin' && <span className="badge badge-admin">ADMIN</span>}
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  Joined {formatRelativeTime(profile.created_at)}
                </span>
              </div>

              {profile.bio && (
                <p className="text-slate-400 text-sm mt-3 leading-relaxed">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: '🏆', label: 'Rank',         value: stats.rank > 0 ? `#${stats.rank}` : '—' },
            { icon: '📝', label: 'Tests',         value: stats.attempts },
            { icon: '🎯', label: 'Avg Accuracy', value: `${stats.avgAccuracy}%` },
            { icon: '⭐', label: 'Total Score',   value: stats.totalScore },
          ].map(s => (
            <div key={s.label} className="stat-card text-center">
              <span className="text-xl">{s.icon}</span>
              <p className="text-xl font-bold text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        {myId && myId !== userId && (
          <div className="flex gap-3 mb-6">
            <Link
              href={`/dm?user=${userId}`}
              id="send-dm-btn"
              className="btn-primary flex-1 justify-center"
            >
              <MessageSquare className="w-4 h-4" /> Send Message
            </Link>
          </div>
        )}

        {/* Performance chart */}
        {chartData.length > 0 && (
          <div className="glass-card rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-400" /> Recent Performance
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1c1c28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                />
                <Bar dataKey="accuracy" fill="#22c55e" radius={[4, 4, 0, 0]} name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent attempts */}
        {attempts.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-400" /> Recent Tests
            </h3>
            <div className="space-y-3">
              {attempts.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 font-medium truncate">{a.test?.title ?? 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{a.test?.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-200">{a.score}/{a.total_marks}</p>
                    <p className="text-xs text-brand-400">{a.accuracy}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
