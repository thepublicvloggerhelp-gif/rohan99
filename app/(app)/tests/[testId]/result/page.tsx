'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import Link from 'next/link'
import { Trophy, CheckCircle, XCircle, Minus, RotateCcw, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TestAttempt, Question, AttemptAnswer, Test } from '@/types'
import { cn } from '@/lib/utils'

export default function TestResultPage() {
  const params      = useParams()
  const searchParams = useSearchParams()
  const attemptId   = searchParams.get('attempt')
  const testId      = params.testId as string
  const supabase    = createClient()

  const [attempt,   setAttempt]   = useState<TestAttempt | null>(null)
  const [test,      setTest]      = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers,   setAnswers]   = useState<AttemptAnswer[]>([])
  const [showReview, setShowReview] = useState(false)

  useEffect(() => {
    if (!attemptId) return
    const load = async () => {
      const [{ data: att }, { data: t }, { data: qs }, { data: ans }] = await Promise.all([
        supabase.from('test_attempts').select('*').eq('id', attemptId).single(),
        supabase.from('tests').select('*').eq('id', testId).single(),
        supabase.from('questions').select('*').eq('test_id', testId).order('order_index'),
        supabase.from('attempt_answers').select('*').eq('attempt_id', attemptId),
      ])
      if (att) setAttempt(att)
      if (t)   setTest(t)
      if (qs)  setQuestions(qs)
      if (ans) setAnswers(ans)
    }
    load()
  }, [attemptId, testId])

  if (!attempt || !test) return <div className="flex items-center justify-center h-full"><div className="text-slate-400">Loading results...</div></div>

  const correct   = answers.filter(a => a.is_correct).length
  const incorrect = answers.filter(a => !a.is_correct && a.selected_option).length
  const skipped   = questions.length - answers.filter(a => a.selected_option).length
  const pct       = Math.round((attempt.score / (attempt.total_marks || 1)) * 100)
  const mins      = Math.floor(attempt.time_taken / 60)
  const secs      = attempt.time_taken % 60

  const grade = pct >= 90 ? { label: 'Outstanding! 🏆', color: 'text-yellow-400' }
    : pct >= 75 ? { label: 'Excellent! 🌟',     color: 'text-green-400' }
    : pct >= 60 ? { label: 'Good Job! 👍',       color: 'text-brand-400' }
    : pct >= 40 ? { label: 'Keep Practicing 💪', color: 'text-orange-400' }
    :             { label: 'Needs More Work 📚',  color: 'text-red-400' }

  return (
    <div className="overflow-y-auto scroll-area h-full p-6">
      <div className="max-w-2xl mx-auto">
        {/* Score card */}
        <div className="glass-card rounded-2xl p-8 text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"
            style={{ background: `conic-gradient(#6366f1 ${pct * 3.6}deg, rgba(255,255,255,0.05) 0)` }}>
            <div className="w-20 h-20 rounded-full bg-surface-3 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-100">{pct}%</span>
            </div>
          </div>
          <h2 className={cn('text-xl font-bold mb-1', grade.color)}>{grade.label}</h2>
          <p className="text-slate-400 text-sm mb-6">{test.title}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Score',    value: `${attempt.score}/${attempt.total_marks}`, color: 'text-brand-400' },
              { label: 'Accuracy', value: `${attempt.accuracy}%`,                    color: 'text-green-400' },
              { label: 'Time',     value: `${mins}m ${secs}s`,                        color: 'text-yellow-400' },
              { label: 'Correct',  value: `${correct}/${questions.length}`,           color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.04] rounded-xl p-3">
                <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Correct',   count: correct,   icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
            { label: 'Incorrect', count: incorrect, icon: <XCircle className="w-5 h-5" />,     color: 'text-red-400 bg-red-500/10 border-red-500/20' },
            { label: 'Skipped',   count: skipped,   icon: <Minus className="w-5 h-5" />,       color: 'text-slate-400 bg-white/[0.05] border-white/10' },
          ].map(s => (
            <div key={s.label} className={cn('flex flex-col items-center gap-2 p-4 rounded-2xl border', s.color)}>
              {s.icon}<span className="text-2xl font-bold">{s.count}</span><span className="text-xs opacity-70">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Link href={`/tests/${testId}`} className="btn-secondary flex-1 justify-center">
            <RotateCcw className="w-4 h-4" /> Retry
          </Link>
          <button onClick={() => setShowReview(!showReview)} className="btn-primary flex-1">
            <BarChart3 className="w-4 h-4" /> {showReview ? 'Hide' : 'Review Answers'}
          </button>
        </div>

        {/* Question review */}
        {showReview && (
          <div className="space-y-4">
            {questions.map((q, i) => {
              const ans = answers.find(a => a.question_id === q.id)
              const isCorrect  = ans?.is_correct
              const isSkipped  = !ans?.selected_option
              return (
                <div key={q.id} className={cn('glass-card rounded-2xl p-5', isCorrect ? 'border border-green-500/20' : isSkipped ? 'border border-white/[0.08]' : 'border border-red-500/20')}>
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-xs text-slate-500 font-medium mt-0.5">Q{i + 1}.</span>
                    <p className="text-sm text-slate-200 leading-relaxed">{q.question_text}</p>
                  </div>
                  <div className="space-y-2">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => {
                      const optText = q[`option_${opt.toLowerCase()}` as keyof Question] as string
                      const isSelected = ans?.selected_option === opt
                      const isRight    = q.correct_option   === opt
                      return (
                        <div key={opt} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                          isRight    ? 'bg-green-500/10 border border-green-500/30 text-green-300' :
                          isSelected ? 'bg-red-500/10 border border-red-500/30 text-red-300' :
                          'text-slate-500')}>
                          <span className="font-bold">{opt}.</span> {optText}
                          {isRight    && <CheckCircle className="w-3.5 h-3.5 ml-auto" />}
                          {isSelected && !isRight && <XCircle className="w-3.5 h-3.5 ml-auto text-red-400" />}
                        </div>
                      )
                    })}
                  </div>
                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-lg bg-brand-500/10 border border-brand-500/20">
                      <p className="text-xs text-brand-300"><span className="font-semibold">Explanation: </span>{q.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Link href="/tests" className="btn-secondary flex-1 justify-center">Back to Tests</Link>
          <Link href="/tests/history" className="btn-ghost"><BarChart3 className="w-4 h-4" /> History</Link>
        </div>
      </div>
    </div>
  )
}
