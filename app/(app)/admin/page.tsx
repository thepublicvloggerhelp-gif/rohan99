'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, BookOpen, FileText, ShieldCheck, Bell, TrendingUp, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { formatRelativeTime } from '@/lib/utils'

export default function AdminDashboard() {
  const supabase = createClient()
  const [stats,    setStats]    = useState({ pending: 0, total: 0, tests: 0, notes: 0, messages: 0 })
  const [pending,  setPending]  = useState<Profile[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const load = async () => {
      const [
        { count: pendingCount },
        { count: totalUsers },
        { count: tests },
        { count: notes },
        { count: messages },
        { data: pendingUsers },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('tests').select('*', { count: 'exact', head: true }),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      ])

      setStats({
        pending:  pendingCount ?? 0,
        total:    totalUsers   ?? 0,
        tests:    tests        ?? 0,
        notes:    notes        ?? 0,
        messages: messages     ?? 0,
      })
      if (pendingUsers) setPending(pendingUsers)
      setLoading(false)
    }
    load()
  }, [])

  const approveUser = async (userId: string) => {
    await supabase.from('profiles').update({ status: 'approved' }).eq('id', userId)
    setPending(prev => prev.filter(p => p.id !== userId))
    setStats(s => ({ ...s, pending: s.pending - 1 }))
  }

  const rejectUser = async (userId: string) => {
    await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId)
    setPending(prev => prev.filter(p => p.id !== userId))
    setStats(s => ({ ...s, pending: s.pending - 1 }))
  }

  const ADMIN_LINKS = [
    { href: '/admin/users',   icon: Users,     label: 'Manage Users',   desc: 'Approve, ban, delete', color: 'from-brand-500/20 to-brand-600/10', iconColor: 'text-brand-400' },
    { href: '/admin/tests',   icon: BookOpen,  label: 'Manage Tests',   desc: 'Create, edit, delete',  color: 'from-green-500/20 to-green-600/10', iconColor: 'text-green-400' },
    { href: '/admin/content', icon: FileText,  label: 'Content',        desc: 'Messages, notes',       color: 'from-purple-500/20 to-purple-600/10', iconColor: 'text-purple-400' },
  ]

  return (
    <div className="overflow-y-auto scroll-area h-full p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">Manage YPSdudes platform</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Pending',  value: stats.pending,  icon: '⏳', alert: stats.pending > 0 },
            { label: 'Users',    value: stats.total,    icon: '👥', alert: false },
            { label: 'Tests',    value: stats.tests,    icon: '📝', alert: false },
            { label: 'Notes',    value: stats.notes,    icon: '📄', alert: false },
            { label: 'Messages', value: stats.messages, icon: '💬', alert: false },
          ].map(s => (
            <div key={s.label} className={`stat-card relative ${s.alert ? 'border border-yellow-500/30 bg-yellow-500/5' : ''}`}>
              <span className="text-2xl">{s.icon}</span>
              <p className="text-2xl font-bold text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
              {s.alert && s.value > 0 && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              )}
            </div>
          ))}
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {ADMIN_LINKS.map(l => (
            <Link key={l.href} href={l.href} id={`admin-link-${l.label}`}
              className={`glass-card-hover rounded-2xl p-5 bg-gradient-to-br ${l.color}`}>
              <l.icon className={`w-8 h-8 mb-3 ${l.iconColor}`} />
              <p className="font-semibold text-slate-200">{l.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{l.desc}</p>
            </Link>
          ))}
        </div>

        {/* Pending approvals */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" /> Pending Approvals
              {stats.pending > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">{stats.pending}</span>
              )}
            </h3>
            <Link href="/admin/users?filter=pending" className="text-xs text-brand-400 hover:text-brand-300">View all</Link>
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}</div>
          ) : pending.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <ShieldCheck className="w-6 h-6 mx-auto mb-2 opacity-50" />
              No pending approvals
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
                  <div className="w-9 h-9 rounded-full bg-surface-4 flex items-center justify-center text-sm font-bold text-brand-400 flex-shrink-0">
                    {u.username?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{u.full_name}</p>
                    <p className="text-xs text-slate-500">@{u.username} · {u.stream} · {formatRelativeTime(u.created_at)}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button id={`approve-${u.id}`} onClick={() => approveUser(u.id)} className="px-3 py-1 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500/30 transition-colors">
                      Approve
                    </button>
                    <button id={`reject-${u.id}`} onClick={() => rejectUser(u.id)} className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
