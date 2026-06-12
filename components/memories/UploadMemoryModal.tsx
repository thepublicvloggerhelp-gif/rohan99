'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X, Upload, ImageIcon, Tag, Calendar, FileText, Loader2, CheckCircle, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Memory } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  currentUser: Profile
  onClose: () => void
  onUploaded: (memory: Memory) => void
}

export function UploadMemoryModal({ currentUser, onClose, onUploaded }: Props) {
  const supabase = createClient()

  // Form state
  const [file, setFile]           = useState<File | null>(null)
  const [preview, setPreview]     = useState<string | null>(null)
  const [caption, setCaption]     = useState('')
  const [takenAt, setTakenAt]     = useState('')
  const [allUsers, setAllUsers]   = useState<Profile[]>([])
  const [tagged, setTagged]       = useState<string[]>([])   // user IDs
  const [tagQuery, setTagQuery]   = useState('')
  const [showTagDD, setShowTagDD] = useState(false)

  // Upload state
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [done, setDone]             = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('status', 'approved')
      .neq('id', currentUser.id)
      .then(({ data }) => { if (data) setAllUsers(data) })
  }, [])

  // Generate preview when file is chosen
  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Drag and drop
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith('image/')) setFile(dropped)
  }, [])

  const toggleTag = (userId: string) => {
    setTagged(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const filteredUsers = allUsers.filter(u =>
    u.username.toLowerCase().includes(tagQuery.toLowerCase()) ||
    u.full_name.toLowerCase().includes(tagQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { toast.error('Please select a photo'); return }

    setUploading(true)
    setProgress(10)

    try {
      // 1. Upload image via API route
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'memories')
      formData.append('path', `${currentUser.id}/${Date.now()}-${file.name}`)

      setProgress(30)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')

      const photoUrl: string = json.publicUrl
      setProgress(60)

      // 2. Insert memory row
      const { data: memRow, error: memErr } = await supabase
        .from('memories')
        .insert({
          photo_url:   photoUrl,
          caption:     caption.trim() || null,
          uploaded_by: currentUser.id,
          taken_at:    takenAt || null,
        })
        .select('*, uploader:profiles!uploaded_by(id, username, full_name, avatar_url)')
        .single()

      if (memErr) throw memErr
      setProgress(80)

      // 3. Insert tags
      if (tagged.length > 0) {
        await supabase
          .from('memory_tags')
          .insert(tagged.map(uid => ({ memory_id: memRow.id, user_id: uid })))
      }
      setProgress(100)
      setDone(true)

      // Build full memory object to pass back
      const taggedUsers = allUsers
        .filter(u => tagged.includes(u.id))
        .map(u => ({ memory_id: memRow.id, user_id: u.id, user: { id: u.id, username: u.username, avatar_url: u.avatar_url } }))

      const fullMemory: Memory = {
        ...memRow,
        reactions: [],
        tags: taggedUsers,
      }

      toast.success('Memory added successfully')
      setTimeout(() => {
        onUploaded(fullMemory)
        onClose()
      }, 800)

    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong')
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full sm:max-w-lg bg-surface-2 border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[85vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-surface-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base uppercase tracking-tight">Add a Memory</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Share a moment with the squad</p>
            </div>
          </div>
          <button
            id="close-upload-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scroll-area">
          <form id="upload-memory-form" onSubmit={handleSubmit} className="p-5 space-y-4">

            {/* Drop zone / preview */}
            <div
              ref={dropRef}
              id="memory-dropzone"
              onClick={() => !file && fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={cn(
                'relative border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden',
                preview ? 'border-transparent' : 'cursor-pointer',
                isDragging ? 'border-blue-500 bg-blue-500/5 scale-[1.01]' : 'border-white/[0.08] hover:border-blue-500/50 hover:bg-white/[0.02]',
              )}
            >
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-72 object-contain bg-surface-1"
                  />
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setFile(null); setPreview(null) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/80 text-white flex items-center justify-center hover:bg-black transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                    className="absolute bottom-2 right-2 text-[10px] uppercase tracking-wider bg-black/80 text-white rounded-lg px-3 py-1.5 hover:bg-black transition-colors font-bold"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 px-4">
                  <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-300">
                      Drop a photo here, or <span className="text-blue-500 underline">browse</span>
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1.5">JPG, PNG, WebP, GIF up to 10MB</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }}
            />

            {/* Caption */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                <FileText className="w-3.5 h-3.5" /> Caption
              </label>
              <textarea
                id="memory-caption"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="What's the story behind this moment?"
                rows={2}
                className="input-base resize-none py-2.5 text-sm placeholder:text-slate-500"
              />
            </div>

            {/* Date taken */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date Taken
              </label>
              <input
                id="memory-date"
                type="date"
                value={takenAt}
                onChange={e => setTakenAt(e.target.value)}
                className="input-base py-2.5 text-sm text-slate-200"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Tag friends */}
            <div className="relative">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                <Tag className="w-3.5 h-3.5" /> Tag Friends
              </label>

              {/* Tagged chips */}
              {tagged.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tagged.map(uid => {
                    const u = allUsers.find(x => x.id === uid)
                    return (
                      <span
                        key={uid}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20 cursor-pointer hover:bg-blue-500/25 transition-colors"
                        onClick={() => toggleTag(uid)}
                      >
                        @{u?.username ?? uid.slice(0, 8)}
                        <X className="w-2.5 h-2.5 ml-0.5" />
                      </span>
                    )
                  })}
                </div>
              )}

              <div className="relative">
                <input
                  id="memory-tag-search"
                  type="text"
                  value={tagQuery}
                  onChange={e => { setTagQuery(e.target.value); setShowTagDD(true) }}
                  onFocus={() => setShowTagDD(true)}
                  placeholder="Search friends to tag…"
                  className="input-base py-2 text-sm text-slate-200"
                />

                {showTagDD && filteredUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-3 border border-white/[0.08] rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto scroll-area">
                    {filteredUsers.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { toggleTag(u.id); setTagQuery(''); setShowTagDD(false) }}
                        className={cn(
                          'flex items-center gap-2.5 w-full px-3 py-2 hover:bg-white/[0.05] transition-colors text-left',
                          tagged.includes(u.id) && 'bg-white/[0.03]'
                        )}
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center text-xs font-bold text-blue-400 overflow-hidden flex-shrink-0">
                          {u.avatar_url
                            ? <Image src={u.avatar_url} alt="" width={28} height={28} className="object-cover" />
                            : u.username[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">{u.username}</p>
                          <p className="text-[10px] text-slate-500 truncate">{u.full_name}</p>
                        </div>
                        {tagged.includes(u.id) && (
                          <CheckCircle className="w-4 h-4 text-blue-500 ml-auto flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {uploading && (
              <div className="space-y-1.5">
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 text-center">
                  {done ? 'Memory saved' : `Uploading… ${progress}%`}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-white/[0.06] bg-surface-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 py-2.5 text-sm"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="upload-memory-form"
            id="submit-memory-btn"
            disabled={!file || uploading}
            className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                Add Memory
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
