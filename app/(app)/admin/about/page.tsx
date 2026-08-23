'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Loader2, Save, Search, ToggleLeft, ToggleRight, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import { SkeletonList } from '@/components/ui/SkeletonList'

export default function AdminAboutPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  
  // Track local edits
  const [edits, setEdits] = useState<Record<string, { show_on_about: boolean; bio: string }>>({})

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('status', 'approved')
          .order('role', { ascending: true }) // admins first
          .order('full_name', { ascending: true })
          
        if (error) throw error
        
        if (data) {
          setUsers(data)
          // Initialize edits map
          const initialEdits: Record<string, { show_on_about: boolean; bio: string }> = {}
          data.forEach(u => {
            initialEdits[u.id] = {
              show_on_about: (u as any).show_on_about ?? false,
              bio: u.bio ?? ''
            }
          })
          setEdits(initialEdits)
        }
      } catch (err: any) {
        toast.error('Failed to load users: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleToggleVisibility = (userId: string) => {
    setEdits(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        show_on_about: !prev[userId].show_on_about
      }
    }))
  }

  const handleBioChange = (userId: string, val: string) => {
    setEdits(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        bio: val
      }
    }))
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      // Find all items that have been modified compared to their original user values
      const updates = Object.entries(edits).filter(([id, current]) => {
        const original = users.find(u => u.id === id)
        if (!original) return false
        return (
          current.show_on_about !== ((original as any).show_on_about ?? false) ||
          current.bio !== (original.bio ?? '')
        )
      })

      if (updates.length === 0) {
        toast.info('No changes to save.')
        return
      }

      const promises = updates.map(async ([id, current]) => {
        const { error } = await supabase
          .from('profiles')
          .update({
            show_on_about: current.show_on_about,
            bio: current.bio || null // save empty as null
          })
          .eq('id', id)
          
        if (error) throw error
      })

      await Promise.all(promises)
      toast.success(`Successfully saved ${updates.length} profile updates!`)
      
      // Update original state to match saved edits
      setUsers(prev =>
        prev.map(u => {
          const edit = edits[u.id]
          if (edit) {
            return {
              ...u,
              show_on_about: edit.show_on_about,
              bio: edit.bio
            }
          }
          return u
        })
      )
    } catch (err: any) {
      toast.error('Failed to save changes: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  const hasUnsavedChanges = Object.entries(edits).some(([id, current]) => {
    const original = users.find(u => u.id === id)
    if (!original) return false
    return (
      current.show_on_about !== ((original as any).show_on_about ?? false) ||
      current.bio !== (original.bio ?? '')
    )
  })

  return (
    <div className="overflow-y-auto scroll-area h-full p-6 bg-surface-3">
      <div className="max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="btn-ghost p-1.5"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-yellow-400" /> Manage About Page
              </h1>
              <p className="text-slate-400 text-sm">Control who is featured on the public About page and write their bios</p>
            </div>
          </div>
          <button
            onClick={saveChanges}
            disabled={saving || !hasUnsavedChanges}
            className="btn-primary flex items-center gap-2 text-xs font-semibold py-2 px-4 shadow-brand"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search approved users by name or username..."
            className="input-base pl-9 py-2.5 text-sm"
          />
        </div>

        {/* Users Configuration List */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonList count={4} itemClassName="h-24 rounded-2xl shimmer" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm glass-card rounded-2xl">
            No approved users found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map(u => {
              const currentEdit = edits[u.id] || { show_on_about: false, bio: '' }
              const isModified = 
                currentEdit.show_on_about !== ((u as any).show_on_about ?? false) ||
                currentEdit.bio !== (u.bio ?? '')

              return (
                <div 
                  key={u.id} 
                  className={`glass-card rounded-2xl p-4 border transition-all ${
                    isModified 
                      ? 'border-brand-500/40 bg-brand-500/[0.02]' 
                      : 'border-white/[0.06] bg-white/[0.01]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* User profile details */}
                    <div className="flex gap-3 items-start min-w-[200px]">
                      <Avatar
                        url={u.avatar_url}
                        name={u.full_name}
                        size={40}
                        containerClassName="w-10 h-10 rounded-full overflow-hidden bg-surface-4 flex-shrink-0 flex items-center justify-center font-bold text-brand-400 border border-white/10"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-slate-200 text-sm truncate">{u.full_name}</h3>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                            u.role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">@{u.username} · {u.stream}</p>
                      </div>
                    </div>

                    {/* Visibility Toggle Switch */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400">Show on About page</span>
                      <button
                        type="button"
                        id={`toggle-about-${u.id}`}
                        onClick={() => handleToggleVisibility(u.id)}
                        className={`transition-colors focus:outline-none`}
                      >
                        {currentEdit.show_on_about ? (
                          <ToggleRight className="w-10 h-10 text-brand-400 hover:text-brand-300" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-slate-600 hover:text-slate-500" />
                        )}
                      </button>
                    </div>

                    {/* Bio Textarea */}
                    <div className="flex-1 min-w-[250px]">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Biography
                      </label>
                      <textarea
                        rows={2}
                        value={currentEdit.bio}
                        onChange={e => handleBioChange(u.id, e.target.value)}
                        placeholder={`Introduce this ${u.role === 'admin' ? 'administrator' : 'member'}...`}
                        className="input-base text-xs py-2 resize-none"
                      />
                    </div>
                  </div>
                  
                  {isModified && (
                    <div className="flex items-center gap-1 mt-3 justify-end text-[10px] font-semibold text-brand-400">
                      <Check className="w-3 h-3" /> Unsaved changes
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions Bar if changes exist */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-2/80 backdrop-blur-md border-t border-white/[0.06] p-4 flex justify-between items-center max-w-4xl mx-auto rounded-t-3xl shadow-2xl">
          <p className="text-xs text-slate-400">
            You have unsaved changes to profile visibilities or bios.
          </p>
          <div className="flex gap-2">
            <button
              onClick={saveChanges}
              disabled={saving}
              className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Updates
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
