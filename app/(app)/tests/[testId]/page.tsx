'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Clock, ChevronLeft, ChevronRight, Flag, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Test, Question, Profile } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Answers = Record<string, 'A' | 'B' | 'C' | 'D'>

export default function TakeTestPage() {
  const params  = useParams()
  const router  = useRouter()
  const testId  = params.testId as string
  const supabase = createClient()

  const [test,      setTest]      = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [answers,   setAnswers]   = useState<Answers>({})
  const [current,   setCurrent]   = useState(0)
  const [timeLeft,  setTimeLeft]  = useState(0)
  const [started,   setStarted]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: t }, { data: qs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('tests').select('*').eq('id', testId).single(),
        supabase.from('questions').select('*').eq('test_id', testId).order('order_index'),
      ])
      if (prof) setProfile(prof)
      if (t)    { setTest(t); setTimeLeft(t.duration_minutes * 60) }
      if (qs)   setQuestions(qs)
      setLoading(false)
    }
    load()
  }, [testId])

  useEffect(() => {
    if (!started || submitted || timeLeft <= 0) return
    if (timeLeft === 0) { handleSubmit(); return }
    const timer = setInterval(() => setTimeLeft(t => { if (t <= 1) { handleSubmit(); return 0 } return t - 1 }), 1000)
    return () => clearInterval(timer)
  }, [started, submitted, timeLeft])

  const handleSubmit = useCallback(async () => {
    if (submitted || !profile || !test) return
    setSubmitted(true)

    const correct   = questions.filter(q => answers[q.id] === q.correct_option).length
    const attempted = Object.keys(answers).length
    const score     = questions.reduce((acc, q) => answers[q.id] === q.correct_option ? acc + q.marks : acc, 0)
    const accuracy  = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
    const timeTaken = test.duration_minutes * 60 - timeLeft

    const { data: attempt, error } = await supabase.from('test_attempts').insert({
      test_id:     testId,
      user_id:     profile.id,
      score,
      total_marks: test.total_marks,
      accuracy,
      time_taken:  timeTaken,
    }).select().single()

    if (error || !attempt) { toast.error('Failed to save results'); return }

    // Save answers
    const answerRows = questions.map(q => ({
      attempt_id:      attempt.id,
      question_id:     q.id,
      selected_option: answers[q.id] ?? null,
      is_correct:      answers[q.id] === q.correct_option,
    }))
    await supabase.from('attempt_answers').insert(answerRows)

    router.push(`/tests/${testId}/result?attempt=${attempt.id}`)
  }, [answers, questions, profile, test, testId, submitted, timeLeft])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const pct = timeLeft / ((test?.duration_minutes ?? 1) * 60) * 100

  if (loading) return <div className="flex items-center justify-center h-full"><div className="text-slate-400">Loading test...</div></div>
  if (!test || questions.length === 0) return <div className="flex items-center justify-center h-full"><div className="text-slate-400">Test not found or has no questions</div></div>

  if (!started) return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
        <span className="text-5xl block mb-4">📝</span>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">{test.title}</h1>
        <p className="text-slate-400 text-sm mb-6">{test.subject} · {test.chapter}</p>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[{ label: 'Questions', value: questions.length }, { label: 'Duration', value: `${test.duration_minutes} min` }, { label: 'Marks', value: test.total_marks }].map(s => (
            <div key={s.label} className="bg-white/[0.04] rounded-xl p-3">
              <p className="text-lg font-bold text-slate-200">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-left mb-6">
          <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-yellow-400" /><span className="text-yellow-400 font-medium text-sm">Instructions</span></div>
          <ul className="text-slate-400 text-xs space-y-1">
            <li>• Each question carries {questions[0]?.marks} marks</li>
            <li>• No negative marking</li>
            <li>• Timer starts when you click Start</li>
            <li>• Submit before time runs out</li>
          </ul>
        </div>
        <button onClick={() => setStarted(true)} className="btn-primary w-full">Start Test</button>
      </div>
    </div>
  )

  const q = questions[current]
  const answered = Object.keys(answers).length

  return (
    <div className="flex flex-col h-full bg-surface-3">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-surface-2 border-b border-white/[0.06] flex-shrink-0">
        <div>
          <h2 className="font-semibold text-slate-200 text-sm">{test.title}</h2>
          <p className="text-xs text-slate-500">{answered}/{questions.length} answered</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold', pct > 30 ? 'bg-surface-4 border-white/10 text-slate-200' : 'bg-red-500/20 border-red-500/40 text-red-400')}>
            <Clock className="w-4 h-4" />{formatTime(timeLeft)}
          </div>
          <button onClick={() => { if (confirm('Submit test now?')) handleSubmit() }} className="btn-danger text-sm">Submit</button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/[0.05]">
        <div className="h-full bg-brand-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <div className="flex-1 overflow-y-auto scroll-area p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-slate-500 font-medium">Q {current + 1} of {questions.length}</span>
              <span className="text-xs text-brand-400 font-medium">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
            </div>
            <h3 className="text-slate-100 text-base font-medium leading-relaxed mb-6">{q.question_text}</h3>
            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as const).map(opt => (
                <button key={opt} id={`option-${opt}`}
                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                  className={cn('test-option w-full text-left flex items-start gap-3', answers[q.id] === opt && 'selected')}>
                  <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all',
                    answers[q.id] === opt ? 'bg-brand-500 text-white' : 'bg-white/[0.05] text-slate-400')}>{opt}</span>
                  <span className={cn('text-sm leading-relaxed pt-0.5', answers[q.id] === opt ? 'text-slate-100' : 'text-slate-300')}>
                    {q[`option_${opt.toLowerCase()}` as keyof Question] as string}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Question navigator */}
        <div className="w-48 border-l border-white/[0.06] bg-surface-2 p-3 overflow-y-auto scroll-area">
          <p className="text-xs text-slate-500 font-medium mb-2">Questions</p>
          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={cn('w-8 h-8 rounded-lg text-xs font-semibold transition-all',
                  i === current ? 'bg-brand-500 text-white' :
                  answers[questions[i].id] ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]')}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-3 bg-surface-2 border-t border-white/[0.06] flex-shrink-0">
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} className="btn-secondary text-sm"><ChevronLeft className="w-4 h-4" /> Previous</button>
        <span className="text-slate-500 text-sm">{current + 1} / {questions.length}</span>
        {current < questions.length - 1
          ? <button onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))} className="btn-primary text-sm">Next <ChevronRight className="w-4 h-4" /></button>
          : <button onClick={() => { if (confirm('Submit test?')) handleSubmit() }} className="btn-primary text-sm"><Flag className="w-4 h-4" /> Submit</button>}
      </div>
    </div>
  )
}
