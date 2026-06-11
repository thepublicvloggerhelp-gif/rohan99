'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Upload, Loader2, Save, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'

const schema = z.object({
  full_name: z.string().min(2, 'Required'),
  username:  z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  bio:       z.string().max(200).optional(),
  stream:    z.enum(['JEE', 'NEET']),
})
type FormData = z.infer<typeof schema>

export default function ProfileSettingsPage() {
  const router   = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [avatar,   setAvatar]   = useState<File | null>(null)
  const [preview,  setPreview]  = useState<string | null>(null)
  const [pwMode,   setPwMode]   = useState(false)
  const [newPw,    setNewPw]    = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (prof) {
        setProfile(prof)
        reset({ full_name: prof.full_name, username: prof.username, bio: prof.bio ?? '', stream: prof.stream })
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return }
    setAvatar(f); setPreview(URL.createObjectURL(f))
  }

  const onSubmit = async (data: FormData) => {
    if (!profile) return
    setSaving(true)
    try {
      let avatarUrl = profile.avatar_url

      if (avatar) {
        const ext = avatar.name.split('.').pop()
        const { data: up, error } = await supabase.storage.from('avatars').upload(`${profile.id}/avatar.${ext}`, avatar, { upsert: true })
        if (!error && up) {
          const { data: u } = supabase.storage.from('avatars').getPublicUrl(up.path)
          avatarUrl = u.publicUrl
        }
      }

      const { error } = await supabase.from('profiles').update({
        full_name:  data.full_name,
        username:   data.username,
        bio:        data.bio ?? null,
        stream:     data.stream,
        avatar_url: avatarUrl,
      }).eq('id', profile.id)

      if (error) { toast.error(error.message); return }
      toast.success('Profile updated!')
    } finally {
      setSaving(false)
    }
  }

  const updatePassword = async () => {
    if (newPw.length < 8) { toast.error('Min 8 characters'); return }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) { toast.error(error.message); return }
    toast.success('Password updated!'); setNewPw(''); setPwMode(false)
  }

  if (loading) return <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>

  return (
    <div className="overflow-y-auto scroll-area h-full p-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/profile/${profile?.id}`} className="btn-ghost p-1.5"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold text-slate-100">Edit Profile</h1>
        </div>

        {/* Avatar */}
        <div className="glass-card rounded-2xl p-6 mb-5 flex items-center gap-5">
          <button type="button" onClick={() => fileRef.current?.click()} className="relative group flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-brand-500/50 transition-colors bg-surface-4 flex items-center justify-center text-xl font-bold text-brand-400">
              {(preview || profile?.avatar_url) ? (
                <Image src={preview ?? profile?.avatar_url!} alt="Avatar" width={80} height={80} className="object-cover" />
              ) : getInitials(profile?.full_name ?? 'U')}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
          </button>
          <div>
            <p className="text-sm font-medium text-slate-300 mb-1">Profile Picture</p>
            <p className="text-xs text-slate-500 mb-2">JPG, PNG · Max 2MB</p>
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-xs py-1.5 px-3">Change Photo</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="glass-card rounded-2xl p-6 space-y-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
            <input type="text" className="input-base" {...register('full_name')} />
            {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
            <input type="text" className="input-base" {...register('username')} />
            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label>
            <textarea rows={3} placeholder="Tell us about yourself..." className="input-base resize-none" {...register('bio')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Stream</label>
            <div className="flex gap-3">
              {['JEE', 'NEET'].map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={s} className="sr-only" {...register('stream')} />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all has-checked:border-brand-500/50 has-checked:bg-brand-500/10">
                    <span className="text-sm font-semibold text-slate-300">{s}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Password section */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-slate-200 mb-4">Change Password</h3>
          {!pwMode ? (
            <button onClick={() => setPwMode(true)} className="btn-secondary text-sm">Change Password</button>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  className="input-base pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPwMode(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={updatePassword} className="btn-primary flex-1">Update Password</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
