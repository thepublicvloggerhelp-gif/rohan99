'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, Target, ChevronRight, Filter, FileText, CheckCircle2, Stethoscope, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Test, Profile } from '@/types'
import { getSubjectIcon, getStreamBadge } from '@/lib/utils'
import { getCurrentUser, getProfile } from '@/lib/supabase/queries'
import { PillButton } from '@/components/ui/PillButton'
import { SkeletonList } from '@/components/ui/SkeletonList'

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
      const user = await getCurrentUser(supabase)
      if (!user) return
      const [{ data: prof }, { data: ts }, { data: attempts }] = await Promise.all([
        getProfile(supabase, user.id),
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
    <div className="flex-1 overflow-y-auto scroll-area p-6 pb-28 sm:pb-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-brand mb-8 relative overflow-hidden border border-blue-500/20">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none select-none">
            <Target className="w-24 h-24" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">Chapter-wise Practice Tests</h1>
          <p className="text-blue-100 text-sm max-w-md font-medium">Mock tests styled for JEE and NEET prep with real-time feedback, detailed marking schemes, and performance analysis.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Available Tests', value: streamTests.length, icon: <FileText className="w-5 h-5 text-blue-500 mx-auto" /> },
            { label: 'Attempted',       value: Object.keys(attemptMap).length, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> },
            { label: 'Your Stream',     value: profile?.stream ?? '—', icon: profile?.stream === 'JEE' ? <Target className="w-5 h-5 text-indigo-500 mx-auto" /> : <Stethoscope className="w-5 h-5 text-emerald-500 mx-auto" /> },
          ].map(s => (
            <div key={s.label} className="stat-card flex flex-col justify-between py-4 text-center">
              <div className="mb-1">{s.icon}</div>
              <div>
                <p className="text-xl font-black text-slate-100">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center mb-6">
          {STREAMS.map(s => (
            <PillButton key={s} onClick={() => setStream(s)} id={`filter-stream-${s}`} active={stream === s}>
              {s}
            </PillButton>
          ))}
          <div className="h-6 w-px bg-white/10 mx-2" />
          {SUBJECTS.map(s => (
            <PillButton key={s} onClick={() => setSubject(s)} id={`filter-subject-${s}`} active={subject === s}>
              {s}
            </PillButton>
          ))}
        </div>

        {/* Test grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonList count={4} itemClassName="glass-card rounded-2xl h-40 shimmer" />
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
                      <span className={getStreamBadge(test.stream)}>{test.stream}</span>
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
