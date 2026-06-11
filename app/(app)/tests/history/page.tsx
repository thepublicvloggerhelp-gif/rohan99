'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart3, Clock, Target, TrendingUp, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TestAttempt } from '@/types'
import { formatRelativeTime, getSubjectIcon, cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function TestHistoryPage() {
  const supabase = createClient()
  const [attempts, setAttempts] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('test_attempts')
        .select('*, test:tests(title, subject, stream, chapter)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(50)
      if (data) setAttempts(data)
      setLoading(false)
    }
    load()
  }, [])

  const avgAccuracy = attempts.length ? Math.round(attempts.reduce((a, b) => a + b.accuracy, 0) / attempts.length) : 0
  const totalScore  = attempts.reduce((a, b) => a + b.score, 0)
  const chartData   = attempts.slice(0, 10).reverse().map((a, i) => ({ name: `T${i + 1}`, score: a.score, accuracy: a.accuracy }))

  // Subject stats
  const subjectMap: Record<string, { count: number; totalScore: number; totalAcc: number }> = {}
  attempts.forEach(a => {
    const s = a.test?.subject ?? 'Other'
    if (!subjectMap[s]) subjectMap[s] = { count: 0, totalScore: 0, totalAcc: 0 }
    subjectMap[s].count++; subjectMap[s].totalScore += a.score; subjectMap[s].totalAcc += a.accuracy
  })

  return (
    <div className="overflow-y-auto scroll-area h-full p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">Attempt History</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Attempts', value: attempts.length,     icon: '📝' },
            { label: 'Avg Accuracy',   value: `${avgAccuracy}%`,   icon: '🎯' },
            { label: 'Total Score',    value: totalScore,           icon: '⭐' },
          ].map(s => <div key={s.label} className="stat-card"><span className="text-2xl">{s.icon}</span><p className="text-2xl font-bold text-slate-100">{s.value}</p><p className="text-xs text-slate-500">{s.label}</p></div>)}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="glass-card rounded-2xl p-5 mb-8">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-400" /> Score Trend (last 10)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1c1c28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Subject Stats */}
        {Object.keys(subjectMap).length > 0 && (
          <div className="glass-card rounded-2xl p-5 mb-8">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Subject Performance</h3>
            <div className="space-y-3">
              {Object.entries(subjectMap).map(([subject, data]) => (
                <div key={subject} className="flex items-center gap-3">
                  <span className="text-lg w-7">{getSubjectIcon(subject)}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">{subject}</span>
                      <span className="text-slate-500">{data.count} attempts · {Math.round(data.totalAcc / data.count)}% acc</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${Math.round(data.totalAcc / data.count)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attempt list */}
        <h3 className="text-sm font-semibold text-slate-300 mb-3">All Attempts</h3>
        {loading ? <div className="text-center py-8 text-slate-500">Loading...</div> :
        attempts.length === 0 ? (
          <div className="text-center py-12 text-slate-500"><BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No attempts yet. Take a test!</p><Link href="/tests" className="btn-primary mt-4 inline-flex">Browse Tests</Link></div>
        ) : (
          <div className="space-y-3">
            {attempts.map(a => (
              <Link key={a.id} href={`/tests/${a.test_id}/result?attempt=${a.id}`}
                className="glass-card-hover rounded-xl p-4 flex items-center gap-4 block">
                <span className="text-2xl">{getSubjectIcon(a.test?.subject ?? '')}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 text-sm truncate">{a.test?.title ?? 'Unknown Test'}</p>
                  <p className="text-xs text-slate-500">{a.test?.subject} · {a.test?.chapter}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-200">{a.score}/{a.total_marks}</p>
                  <p className="text-xs text-brand-400">{a.accuracy}% accuracy</p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs text-slate-500">{formatRelativeTime(a.completed_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
