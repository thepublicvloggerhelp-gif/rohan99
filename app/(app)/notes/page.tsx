'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Download, Upload, Search, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Note, Profile } from '@/types'
import { formatRelativeTime, formatFileSize, getSubjectIcon, cn } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'

const SUBJECTS = ['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology']

export default function NotesPage() {
  const supabase = createClient()
  const [notes,   setNotes]   = useState<Note[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subject, setSubject] = useState('All')
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: ns }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('notes').select('*, uploader:profiles!uploaded_by(username, avatar_url)').order('created_at', { ascending: false }),
      ])
      if (prof) setProfile(prof)
      if (ns)   setNotes(ns)
      setLoading(false)
    }
    load()
  }, [])

  const handleDownload = async (note: Note) => {
    // Increment download count
    await supabase.from('notes').update({ download_count: note.download_count + 1 }).eq('id', note.id)
    window.open(note.file_url, '_blank')
    toast.success('Download started!')
  }

  const filtered = notes.filter(n => {
    if (subject !== 'All' && n.subject !== subject) return false
    if (query && !n.title.toLowerCase().includes(query.toLowerCase()) && !(n.description ?? '').toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <div className="overflow-y-auto scroll-area h-full p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-3xl p-6 shadow-md mb-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute right-32 top-1/2 -translate-y-1/2 opacity-10 text-8xl pointer-events-none select-none">📚</div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Study Notes Library</h1>
            <p className="text-emerald-50 text-sm max-w-md">Upload and download community-curated prep material. Filter by subject to find exactly what you need.</p>
          </div>
          <Link href="/notes/upload" id="upload-notes-btn" className="btn-premium px-5 py-3 rounded-2xl bg-white text-emerald-600 font-bold text-sm hover:bg-emerald-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 self-start md:self-center shadow-lg shadow-emerald-950/10">
            <Upload className="w-4 h-4 text-emerald-600" /> Upload Notes
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search notes..."
              className="input-base pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                id={`notes-filter-${s}`}
                className={cn('px-4 py-2 rounded-2xl text-xs font-bold transition-all border shadow-sm',
                  subject === s
                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-emerald-500/20 shadow-md'
                    : 'bg-surface-2 border-slate-200 text-slate-700 hover:bg-slate-50'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Notes grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="glass-card rounded-2xl h-44 shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notes found</p>
            <Link href="/notes/upload" className="btn-primary mt-4 inline-flex text-sm">Upload First Note</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(note => (
              <div key={note.id} id={`note-${note.id}`} className="glass-card-hover rounded-2xl overflow-hidden group">
                {/* Preview */}
                <div className="h-28 bg-surface-4 flex items-center justify-center relative overflow-hidden">
                  {note.file_type === 'image' ? (
                    <Image src={note.file_url} alt={note.title} fill className="object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <FileText className="w-10 h-10 text-red-400" />
                      <span className="text-xs text-slate-500 font-medium">PDF</span>
                    </div>
                  )}
                  {/* Subject badge */}
                  <div className="absolute top-2 left-2">
                    <span className="text-lg">{getSubjectIcon(note.subject)}</span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-slate-200 text-sm leading-tight mb-1 truncate">{note.title}</h3>
                  {note.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{note.description}</p>}
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                    <span>{note.subject}</span>
                    <span>{formatFileSize(note.file_size)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-surface-4 overflow-hidden">
                        {(note.uploader as any)?.avatar_url
                          ? <Image src={(note.uploader as any).avatar_url} alt="" width={20} height={20} className="object-cover" />
                          : <div className="w-full h-full bg-brand-500/30 flex items-center justify-center text-[8px] font-bold text-brand-400">U</div>}
                      </div>
                      <span className="text-xs text-slate-500">{(note.uploader as any)?.username}</span>
                    </div>
                    <button
                      id={`download-${note.id}`}
                      onClick={() => handleDownload(note)}
                      className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> {note.download_count}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
