'use client'

import { useState, useEffect, useMemo } from 'react'
import { Images, Plus, Camera, Star, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Memory, Profile } from '@/types'
import { MemoryCard } from '@/components/memories/MemoryCard'
import { UploadMemoryModal } from '@/components/memories/UploadMemoryModal'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { getErrorMessage, logError } from '@/lib/errors'
import { toast } from 'sonner'

export default function MemoriesPage() {
  const supabase = createClient()

  const [memories, setMemories]   = useState<Memory[]>([])
  const [profile,  setProfile]    = useState<Profile | null>(null)
  const [loading,  setLoading]    = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [motd, setMotd]           = useState<Memory | null>(null)

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!user) { toast.error('Your session expired. Please sign in again.'); return }

        const [{ data: prof, error: profileError }, { data: mems, error: memoriesError }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase
          .from('memories')
          .select(`
            *,
            uploader:profiles(id, username, full_name, avatar_url),
            reactions:memory_reactions(memory_id, user_id, emoji),
            tags:memory_tags(memory_id, user_id, user:profiles(id, username, avatar_url))
          `)
          .order('created_at', { ascending: false }),
        ])

        if (profileError) throw profileError
        if (memoriesError) throw memoriesError
        if (prof) setProfile(prof)
        if (mems) {
        setMemories(mems)

        // Pick "Memory of the Day" — random pick, seeded per calendar day
        // so the same card shows all day but changes next day
        if (mems.length > 0) {
          const today = format(new Date(), 'yyyy-MM-dd')
          const sessionKey = `motd-${today}`
          const cachedId = sessionStorage.getItem(sessionKey)
          const found = cachedId ? mems.find(m => m.id === cachedId) : null
          if (found) {
            setMotd(found)
          } else {
            // Pick random
            const pick = mems[Math.floor(Math.random() * mems.length)]
            sessionStorage.setItem(sessionKey, pick.id)
            setMotd(pick)
          }
        }
        }
      } catch (err) {
        logError('memories load', err)
        toast.error(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Optimistic add ─────────────────────────────────────────────────────────
  const handleUploaded = (mem: Memory) => {
    setMemories(prev => [mem, ...prev])
    if (!motd) setMotd(mem)
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id))
    if (motd?.id === id) setMotd(null)
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  const Skeleton = () => (
    <div className="masonry-grid">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="masonry-item"
          style={{ height: `${180 + (i % 3) * 80}px` }}
        >
          <div className="w-full h-full bg-slate-200 rounded-2xl shimmer" />
        </div>
      ))}
    </div>
  )

  // ── Empty state ────────────────────────────────────────────────────────────
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shadow-inner">
          <Camera className="w-12 h-12 text-slate-500" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>
      <h2 className="text-2xl font-black text-slate-200 uppercase tracking-tight mb-2">No memories yet!</h2>
      <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-6">
        Be the first to add a memory and start building your squad's photo wall. Every moment counts.
      </p>
      <button
        id="empty-add-memory-btn"
        onClick={() => setShowUpload(true)}
        className="btn-primary px-6 py-3 text-sm gap-2"
      >
        <Plus className="w-4 h-4" />
        Be the first to add a memory!
      </button>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto scroll-area">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Images className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight uppercase">Memory Wall</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                {loading ? 'Loading…' : `${memories.length} memories shared`}
              </p>
            </div>
          </div>

          <button
            id="add-memory-btn"
            onClick={() => setShowUpload(true)}
            className="btn-primary gap-2 text-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Memory</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* ── Memory of the Day ──────────────────────────────────────────── */}
        {motd && !loading && (
          <div className="motd-card rounded-2xl p-4 mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Badge */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-md shadow-red-500/25">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Memory of the Day</p>
                <p className="text-xs text-slate-400 font-medium">A special pick just for today</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-12 bg-white/[0.08] flex-shrink-0" />

            {/* Thumbnail + caption */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                <img
                  src={motd.photo_url}
                  alt={motd.caption ?? 'Memory of the Day'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                {motd.caption && (
                  <p className="text-sm font-semibold text-slate-200 line-clamp-2 mb-1">
                    "{motd.caption}"
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  by <span className="font-bold text-blue-500">@{(motd.uploader as any)?.username ?? 'someone'}</span>
                  {motd.taken_at && ` · ${format(new Date(motd.taken_at), 'MMMM d, yyyy')}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Content ────────────────────────────────────────────────────── */}
        {loading ? (
          <Skeleton />
        ) : memories.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="masonry-grid">
            {memories.map(memory => (
              <div key={memory.id} className="masonry-item">
                <MemoryCard
                  memory={memory}
                  currentUserId={profile?.id ?? ''}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && profile && (
        <UploadMemoryModal
          currentUser={profile}
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
        />
      )}
    </div>
  )
}
