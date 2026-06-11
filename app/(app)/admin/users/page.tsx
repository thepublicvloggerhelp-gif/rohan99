'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Search, ShieldBan, Trash2, UserCheck, Filter, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { formatRelativeTime, getInitials, cn } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_FILTERS = ['all', 'pending', 'approved', 'banned', 'rejected'] as const

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users,   setUsers]   = useState<Profile[]>([])
  const [query,   setQuery]   = useState('')
  const [filter,  setFilter]  = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    let q = supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    if (data) setUsers(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const updateStatus = async (userId: string, status: string) => {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', userId)
    if (error) { toast.error(error.message); return }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: status as any } : u))
    toast.success(`User ${status}`)
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Permanently delete this user?')) return
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (error) { toast.error(error.message); return }
    setUsers(prev => prev.filter(u => u.id !== userId))
    toast.success('User deleted')
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(query.toLowerCase()) ||
    u.full_name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  )

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      approved: 'bg-green-500/20 text-green-300 border-green-500/30',
      banned:   'bg-red-500/20 text-red-300 border-red-500/30',
      rejected: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    }
    return map[status] ?? ''
  }

  const sendNotification = async (userId: string, title: string, message: string) => {
    await supabase.from('notifications').insert({ user_id: userId, title, message, type: 'admin' })
    toast.success('Notification sent')
  }

  return (
    <div className="overflow-y-auto scroll-area h-full p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="btn-ghost p-1.5"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold text-slate-100">User Management</h1>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users..." className="input-base pl-9" />
          </div>
          <div className="flex gap-2">
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => setFilter(s)} id={`user-filter-${s}`}
                className={cn('px-3 py-2 rounded-xl text-xs font-semibold border capitalize transition-all',
                  filter === s ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' : 'border-white/10 text-slate-400 hover:border-white/20')}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Users table */}
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="glass-card rounded-xl h-16 shimmer" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No users found</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => (
              <div key={u.id} className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-4 flex-shrink-0 flex items-center justify-center text-sm font-bold text-brand-400">
                  {u.avatar_url ? <Image src={u.avatar_url} alt="" width={40} height={40} className="object-cover" /> : getInitials(u.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-200 text-sm">{u.full_name}</p>
                    <span className={cn('badge text-[10px]', u.stream === 'JEE' ? 'badge-jee' : 'badge-neet')}>{u.stream}</span>
                    {u.role === 'admin' && <span className="badge badge-admin text-[10px]">ADMIN</span>}
                  </div>
                  <p className="text-xs text-slate-500">@{u.username} · {u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('badge text-[10px]', statusBadge(u.status))}>{u.status}</span>
                  <span className="text-xs text-slate-600 hidden md:block">{formatRelativeTime(u.created_at)}</span>

                  {/* Actions */}
                  {u.status === 'pending' && (
                    <button id={`approve-user-${u.id}`} onClick={() => updateStatus(u.id, 'approved')} title="Approve"
                      className="w-7 h-7 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 flex items-center justify-center transition-colors">
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {u.status === 'approved' && (
                    <button id={`ban-user-${u.id}`} onClick={() => updateStatus(u.id, 'banned')} title="Ban"
                      className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 flex items-center justify-center transition-colors">
                      <ShieldBan className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {u.status === 'banned' && (
                    <button id={`unban-user-${u.id}`} onClick={() => updateStatus(u.id, 'approved')} title="Unban"
                      className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 flex items-center justify-center transition-colors">
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {u.role !== 'admin' && (
                    <button id={`delete-user-${u.id}`} onClick={() => deleteUser(u.id)} title="Delete"
                      className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
