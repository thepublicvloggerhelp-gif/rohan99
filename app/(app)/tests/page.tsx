'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, Target, ChevronRight, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Test, Profile } from '@/types'
import { getSubjectIcon, cn } from '@/lib/utils'

const STREAMS  = ['All', 'JEE', 'NEET']
const SUBJECTS = ['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology']

export default function TestsPage() {
  const supabase = createClient()
  const [tests,     setTests]     = useState<Test[]>([])
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [stream,    setStream]    = useState('All')
  const [subject,   setSubject]   = useState('All')
  const [loading,   setLoading]   = useState(true)
  const [attemptMap, setAttemptMap] = useState<Record<string, number>>({})

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: ts }, { data: attempts }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('tests').select('*, question_count:questions(count)').eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('test_attempts').select('test_id').eq('user_id', user.id),
      ])
      if (prof)     setProfile(prof)
      if (ts)       setTests(ts.map((t: any) => ({ ...t, question_count: t.question_count?.[0]?.count ?? 0 })))
      if (attempts) {
        const map: Record<string, number> = {}
        attempts.forEach((a: any) => { map[a.test_id] = (map[a.test_id] ?? 0) + 1 })
        setAttemptMap(map)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = tests.filter(t => {
    if (stream  !== 'All' && t.stream  !== stream)  return false
    if (subject !== 'All' && t.subject !== subject) return false
    if (profile?.stream && stream === 'All' && t.stream !== profile.stream) return false
    return true
  })

  const streamTests = profile?.stream === 'JEE'
    ? tests.filter(t => t.stream === 'JEE')
    : tests.filter(t => t.stream === 'NEET')

  const display = (stream !== 'All' || subject !== 'All') ? filtered : streamTests

  return (
    <div className="flex-1 overflow-y-auto scroll-area p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 shadow-brand/10 shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 text-8xl pointer-events-none select-none">🎯</div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Chapter-wise Practice Tests</h1>
          <p className="text-blue-100 text-sm max-w-md">Mock tests styled for JEE and NEET prep with real-time feedback, detailed marking schemes, and performance analysis.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Available Tests', value: streamTests.length, icon: '📝' },
            { label: 'Attempted',       value: Object.keys(attemptMap).length, icon: '✅' },
            { label: 'Your Stream',     value: profile?.stream ?? '—', icon: profile?.stream === 'JEE' ? '🎯' : '🩺' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <span className="text-2xl">{s.icon}</span>
              <p className="text-2xl font-bold text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center mb-6">
          {STREAMS.map(s => (
            <button key={s} onClick={() => setStream(s)} id={`filter-stream-${s}`}
              className={cn('px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm border',
                stream === s 
                  ? 'bg-brand-500 border-brand-600 text-white shadow-brand/20' 
                  : 'bg-surface-2 border-slate-200 text-slate-700 hover:bg-slate-50'
              )}>
              {s}
            </button>
          ))}
          <div className="h-6 w-px bg-slate-200 mx-2" />
          {SUBJECTS.map(s => (
            <button key={s} onClick={() => setSubject(s)} id={`filter-subject-${s}`}
              className={cn('px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm border',
                subject === s 
                  ? 'bg-brand-500 border-brand-600 text-white shadow-brand/20' 
                  : 'bg-surface-2 border-slate-200 text-slate-700 hover:bg-slate-50'
              )}>
              {s}
            </button>
          ))}
        </div>

        {/* Test grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="glass-card rounded-2xl h-40 shimmer" />)}
          </div>
        ) : display.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tests available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {display.map(test => (
              <Link key={test.id} href={`/tests/${test.id}`} id={`test-${test.id}`}
                className="glass-card-hover rounded-2xl p-5 block">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getSubjectIcon(test.subject)}</span>
                      <span className={cn('badge', test.stream === 'JEE' ? 'badge-jee' : 'badge-neet')}>{test.stream}</span>
                    </div>
                    <h3 className="font-semibold text-slate-200 text-sm leading-tight">{test.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{test.subject} · {test.chapter}</p>
                  </div>
                  {attemptMap[test.id] && (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full shadow-sm">
                      Done ×{attemptMap[test.id]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.duration_minutes} min</span>
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {test.total_marks} marks</span>
                  <span>{(test as any).question_count} Qs</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-slate-600">{test.description ?? ''}</p>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* History link */}
        <div className="mt-8 flex justify-center">
          <Link href="/tests/history" className="btn-secondary text-sm">View Attempt History</Link>
        </div>
      </div>
    </div>
  )
}
