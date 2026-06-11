'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Upload, FileText, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatFileSize } from '@/lib/utils'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'] as const

const schema = z.object({
  title:       z.string().min(3, 'Title required (min 3 chars)').max(100),
  description: z.string().max(500).optional(),
  subject:     z.enum(SUBJECTS, { required_error: 'Select a subject' }),
})
type FormData = z.infer<typeof schema>

export default function UploadNotePage() {
  const router   = useRouter()
  const supabase = createClient()
  const [file,    setFile]    = useState<File | null>(null)
  const [sending, setSending] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    if (f.size > 20 * 1024 * 1024) { toast.error('File must be under 20MB'); return }
    setFile(f)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  const onSubmit = async (data: FormData) => {
    if (!file) { toast.error('Please select a file'); return }
    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Not authenticated'); return }

      const ext      = file.name.split('.').pop()
      const fileType = file.type === 'application/pdf' ? 'pdf' : 'image'
      const path     = `${data.subject}/${Date.now()}_${file.name}`

      const { data: up, error: upErr } = await supabase.storage.from('notes').upload(path, file)
      if (upErr) { toast.error('Upload failed: ' + upErr.message); return }

      const { data: urlData } = supabase.storage.from('notes').getPublicUrl(up.path)

      const { error: dbErr } = await supabase.from('notes').insert({
        title:       data.title,
        description: data.description ?? null,
        subject:     data.subject,
        file_url:    urlData.publicUrl,
        file_type:   fileType,
        file_size:   file.size,
        uploaded_by: user.id,
      })

      if (dbErr) { toast.error(dbErr.message); return }

      toast.success('Notes uploaded successfully!')
      router.push('/notes')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="overflow-y-auto scroll-area h-full p-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/notes" className="btn-ghost p-1.5"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Upload Notes</h1>
            <p className="text-slate-400 text-sm">Share PDF or image notes with the community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive ? 'border-brand-500 bg-brand-500/10' :
              file          ? 'border-green-500/50 bg-green-500/5' :
                              'border-white/15 hover:border-white/25 bg-white/[0.02]'
            }`}
          >
            <input {...getInputProps()} id="note-file-input" />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                {file.type === 'application/pdf'
                  ? <FileText className="w-8 h-8 text-red-400" />
                  : <ImageIcon className="w-8 h-8 text-brand-400" />}
                <div className="text-left">
                  <p className="font-medium text-slate-200 text-sm truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFile(null) }}
                  className="ml-2 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-300 font-medium mb-1">
                  {isDragActive ? 'Drop here!' : 'Drag & drop or click to browse'}
                </p>
                <p className="text-xs text-slate-500">PDF or Image files · Max 20MB</p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label>
            <input type="text" placeholder="e.g. Thermodynamics Chapter Notes" className="input-base" {...register('title')} />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea rows={3} placeholder="Brief description of the notes..." className="input-base resize-none" {...register('description')} />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Subject *</label>
            <div className="grid grid-cols-2 gap-2">
              {SUBJECTS.map(s => (
                <label key={s} className="flex items-center gap-2 p-3 rounded-xl border border-white/[0.08] hover:border-white/20 cursor-pointer transition-all has-[:checked]:border-brand-500/50 has-[:checked]:bg-brand-500/10">
                  <input type="radio" value={s} className="sr-only" {...register('subject')} />
                  <span className="text-lg">{s === 'Physics' ? '⚛️' : s === 'Chemistry' ? '🧪' : s === 'Mathematics' ? '📐' : '🧬'}</span>
                  <span className="text-sm font-medium text-slate-300">{s}</span>
                </label>
              ))}
            </div>
            {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject.message}</p>}
          </div>

          <button type="submit" disabled={sending || !file} className="btn-primary w-full">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {sending ? 'Uploading...' : 'Upload Notes'}
          </button>
        </form>
      </div>
    </div>
  )
}
