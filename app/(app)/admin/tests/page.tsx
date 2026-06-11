'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Test, Question } from '@/types'
import { getSubjectIcon, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const testSchema = z.object({
  title:            z.string().min(3),
  description:      z.string().optional(),
  subject:          z.enum(['Physics', 'Chemistry', 'Mathematics', 'Biology']),
  stream:           z.enum(['JEE', 'NEET']),
  chapter:          z.string().min(2),
  duration_minutes: z.coerce.number().min(5).max(180),
})
type TestForm = z.infer<typeof testSchema>

const qSchema = z.object({
  question_text:  z.string().min(5),
  option_a:       z.string().min(1),
  option_b:       z.string().min(1),
  option_c:       z.string().min(1),
  option_d:       z.string().min(1),
  correct_option: z.enum(['A', 'B', 'C', 'D']),
  marks:          z.coerce.number().min(1).max(10),
  explanation:    z.string().optional(),
})
type QForm = z.infer<typeof qSchema>

export default function AdminTestsPage() {
  const supabase   = createClient()
  const [tests,    setTests]    = useState<Test[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [questions,setQuestions]= useState<Record<string, Question[]>>({})
  const [showForm, setShowForm] = useState(false)
  const [editTest, setEditTest] = useState<Test | null>(null)
  const [showQForm,setShowQForm]= useState<string | null>(null)
  const [myId,     setMyId]     = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)

  const testForm = useForm<TestForm>({ resolver: zodResolver(testSchema) })
  const qForm    = useForm<QForm>({ resolver: zodResolver(qSchema), defaultValues: { marks: 4 } })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMyId(user.id)
      const { data } = await supabase.from('tests').select('*').order('created_at', { ascending: false })
      if (data) setTests(data)
      setLoading(false)
    }
    load()
  }, [])

  const loadQuestions = async (testId: string) => {
    if (questions[testId]) return
    const { data } = await supabase.from('questions').select('*').eq('test_id', testId).order('order_index')
    if (data) setQuestions(prev => ({ ...prev, [testId]: data }))
  }

  const toggleExpand = async (testId: string) => {
    if (expanded === testId) { setExpanded(null); return }
    setExpanded(testId)
    await loadQuestions(testId)
  }

  const submitTest = async (data: TestForm) => {
    if (!myId) return
    if (editTest) {
      const { error } = await supabase.from('tests').update(data).eq('id', editTest.id)
      if (error) { toast.error(error.message); return }
      setTests(prev => prev.map(t => t.id === editTest.id ? { ...t, ...data } : t))
      toast.success('Test updated')
    } else {
      const { data: t, error } = await supabase.from('tests').insert({ ...data, created_by: myId }).select().single()
      if (error) { toast.error(error.message); return }
      setTests(prev => [t, ...prev])
      toast.success('Test created')
    }
    setShowForm(false); setEditTest(null); testForm.reset()
  }

  const togglePublish = async (test: Test) => {
    await supabase.from('tests').update({ is_published: !test.is_published }).eq('id', test.id)
    setTests(prev => prev.map(t => t.id === test.id ? { ...t, is_published: !test.is_published } : t))
    toast.success(test.is_published ? 'Test unpublished' : 'Test published')
  }

  const deleteTest = async (testId: string) => {
    if (!confirm('Delete this test and all its questions?')) return
    await supabase.from('tests').delete().eq('id', testId)
    setTests(prev => prev.filter(t => t.id !== testId))
    toast.success('Test deleted')
  }

  const addQuestion = async (data: QForm, testId: string) => {
    const qs = questions[testId] ?? []
    const { data: q, error } = await supabase.from('questions').insert({
      test_id: testId, ...data, order_index: qs.length
    }).select().single()
    if (error) { toast.error(error.message); return }
    setQuestions(prev => ({ ...prev, [testId]: [...(prev[testId] ?? []), q] }))
    qForm.reset({ marks: 4 })
    setShowQForm(null)
    toast.success('Question added')
  }

  const deleteQuestion = async (qId: string, testId: string) => {
    await supabase.from('questions').delete().eq('id', qId)
    setQuestions(prev => ({ ...prev, [testId]: (prev[testId] ?? []).filter(q => q.id !== qId) }))
    toast.success('Question deleted')
  }

  return (
    <div className="overflow-y-auto scroll-area h-full p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="btn-ghost p-1.5"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-xl font-bold text-slate-100">Test Management</h1>
          </div>
          <button id="create-test-btn" onClick={() => { setShowForm(true); setEditTest(null); testForm.reset() }} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> New Test
          </button>
        </div>

        {/* Create/Edit test form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-slate-200 mb-4">{editTest ? 'Edit Test' : 'Create Test'}</h3>
            <form onSubmit={testForm.handleSubmit(submitTest)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Title *</label>
                  <input className="input-base text-sm" {...testForm.register('title')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Chapter *</label>
                  <input className="input-base text-sm" {...testForm.register('chapter')} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Stream</label>
                  <select className="input-base text-sm" {...testForm.register('stream')}>
                    <option value="JEE">JEE</option><option value="NEET">NEET</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Subject</label>
                  <select className="input-base text-sm" {...testForm.register('subject')}>
                    {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Duration (min)</label>
                  <input type="number" className="input-base text-sm" {...testForm.register('duration_minutes')} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                <textarea rows={2} className="input-base text-sm resize-none" {...testForm.register('description')} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editTest ? 'Update' : 'Create'} Test</button>
              </div>
            </form>
          </div>
        )}

        {/* Tests list */}
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="glass-card rounded-2xl h-20 shimmer" />)}</div>
        ) : tests.length === 0 ? (
          <div className="text-center py-12 text-slate-500"><BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>No tests yet</p></div>
        ) : (
          <div className="space-y-3">
            {tests.map(test => (
              <div key={test.id} className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className="text-xl">{getSubjectIcon(test.subject)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-200 text-sm truncate">{test.title}</p>
                      <span className={cn('badge text-[10px]', test.stream === 'JEE' ? 'badge-jee' : 'badge-neet')}>{test.stream}</span>
                      {test.is_published
                        ? <span className="badge text-[10px] bg-green-500/20 text-green-400 border-green-500/30">Published</span>
                        : <span className="badge text-[10px] bg-slate-500/20 text-slate-400 border-slate-500/30">Draft</span>}
                    </div>
                    <p className="text-xs text-slate-500">{test.subject} · {test.chapter} · {test.duration_minutes} min</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button id={`publish-${test.id}`} onClick={() => togglePublish(test)} title={test.is_published ? 'Unpublish' : 'Publish'}
                      className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-colors', test.is_published ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30')}>
                      {test.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button id={`edit-test-${test.id}`} onClick={() => { setEditTest(test); testForm.reset(test as any); setShowForm(true) }}
                      className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 flex items-center justify-center transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button id={`delete-test-${test.id}`} onClick={() => deleteTest(test.id)}
                      className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toggleExpand(test.id)} className="w-7 h-7 rounded-lg bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] flex items-center justify-center transition-colors">
                      {expanded === test.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Questions panel */}
                {expanded === test.id && (
                  <div className="border-t border-white/[0.06] p-4 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Questions ({(questions[test.id] ?? []).length})</p>
                      <button id={`add-question-${test.id}`} onClick={() => setShowQForm(showQForm === test.id ? null : test.id)} className="btn-ghost text-xs gap-1">
                        <Plus className="w-3.5 h-3.5" /> Add Question
                      </button>
                    </div>

                    {/* Add question form */}
                    {showQForm === test.id && (
                      <form onSubmit={qForm.handleSubmit(d => addQuestion(d, test.id))} className="glass-card rounded-xl p-4 mb-4 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Question *</label>
                          <textarea rows={2} className="input-base text-sm resize-none" {...qForm.register('question_text')} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <div key={opt}>
                              <label className="block text-xs font-medium text-slate-400 mb-1">Option {opt}</label>
                              <input className="input-base text-sm" {...qForm.register(`option_${opt.toLowerCase()}` as any)} />
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Correct Option</label>
                            <select className="input-base text-sm" {...qForm.register('correct_option')}>
                              {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Marks</label>
                            <input type="number" className="input-base text-sm" {...qForm.register('marks')} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Explanation (optional)</label>
                          <input className="input-base text-sm" {...qForm.register('explanation')} />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setShowQForm(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
                          <button type="submit" className="btn-primary flex-1 text-sm">Add Question</button>
                        </div>
                      </form>
                    )}

                    {/* Question list */}
                    <div className="space-y-2">
                      {(questions[test.id] ?? []).map((q, idx) => (
                        <div key={q.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] group">
                          <span className="text-xs font-bold text-brand-400 mt-0.5 flex-shrink-0">Q{idx + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-300 leading-snug">{q.question_text}</p>
                            <div className="flex gap-2 mt-1">
                              {(['A', 'B', 'C', 'D'] as const).map(opt => (
                                <span key={opt} className={cn('text-xs px-1.5 py-0.5 rounded',
                                  q.correct_option === opt ? 'bg-green-500/20 text-green-400 font-bold' : 'text-slate-500')}>
                                  {opt}: {q[`option_${opt.toLowerCase()}` as keyof Question] as string}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button id={`delete-q-${q.id}`} onClick={() => deleteQuestion(q.id, test.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
