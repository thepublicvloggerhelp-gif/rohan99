'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Hash, MessageSquare, BookOpen, Trophy, FileText, User,
  ShieldCheck, LogOut, Menu, X, ChevronRight, Settings,
  Zap, Bell, Inbox
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Channel } from '@/types'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { cn, CHANNEL_ICONS } from '@/lib/utils'
import { AppCtx } from '@/lib/context'

// AppCtx is now imported from '@/lib/context'

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV = [
  { icon: Hash,         label: 'Chat',         href: '/chat',         id: 'nav-chat' },
  { icon: MessageSquare, label: 'Direct Messages', href: '/dm',        id: 'nav-dm' },
  { icon: BookOpen,     label: 'Tests',         href: '/tests',        id: 'nav-tests' },
  { icon: Trophy,       label: 'Leaderboard',   href: '/leaderboard',  id: 'nav-leaderboard' },
  { icon: FileText,     label: 'Notes',         href: '/notes',        id: 'nav-notes' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase  = createClient()
  const pathname  = usePathname()
  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [sideOpen, setSideOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
      const { data: ch } = await supabase.from('channels').select('*').order('category').order('name')
      if (ch) setChannels(ch)
    }
    load()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isActive = (href: string) => {
    if (href === '/chat') return pathname.startsWith('/chat')
    if (href === '/dm')   return pathname.startsWith('/dm')
    return pathname.startsWith(href)
  }

  // Group by category for mobile channel list
  const groups: { name: string; channels: Channel[] }[] = []
  const seen = new Set<string>()
  for (const ch of channels) {
    if (!seen.has(ch.category)) {
      seen.add(ch.category)
      groups.push({ name: ch.category, channels: channels.filter(c => c.category === ch.category) })
    }
  }

  return (
    <AppCtx.Provider value={{ profile, channels }}>
      <div className="flex h-screen overflow-hidden bg-surface-1 pb-[60px] lg:pb-0">

        {/* Mobile overlay */}
        {sideOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSideOpen(false)} />
        )}

        {/* ── SIDEBAR (Icon Rail + Mobile Channels) ── */}
        <aside className={cn(
          'fixed inset-y-0 left-0 z-50 flex bg-surface-2 border-r border-white/[0.06] transition-all duration-300 lg:relative lg:translate-x-0',
          sideOpen
            ? (pathname.startsWith('/chat') ? 'w-64 translate-x-0' : 'w-[72px] translate-x-0')
            : '-translate-x-full lg:w-[72px] lg:translate-x-0'
        )}>
          {/* Column 1: Icon Rail (72px wide) */}
          <div className="flex flex-col w-[72px] border-r border-white/[0.06] h-full flex-shrink-0">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 border-b border-white/[0.06]">
              <Link href="/chat" id="logo-link" className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 hover:bg-brand-500/30 transition-colors">
                <Zap className="w-5 h-5 text-brand-400" />
              </Link>
            </div>

            {/* Nav icons */}
            <nav className="flex flex-col items-center gap-1 p-2 flex-1">
              {NAV.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  id={item.id}
                  title={item.label}
                  onClick={() => setSideOpen(false)}
                  className={cn(
                    'group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200',
                    isActive(item.href)
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {/* Active indicator */}
                  {isActive(item.href) && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[2px] w-1 h-6 bg-brand-400 rounded-full" />
                  )}
                  {/* Tooltip */}
                  <div className="absolute left-14 px-2 py-1 bg-surface-4 border border-white/10 rounded-lg text-xs text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                    {item.label}
                  </div>
                </Link>
              ))}

              {/* Admin link */}
              {profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  id="nav-admin"
                  title="Admin"
                  onClick={() => setSideOpen(false)}
                  className={cn(
                    'group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 mt-1',
                    pathname.startsWith('/admin')
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200'
                  )}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <div className="absolute left-14 px-2 py-1 bg-surface-4 border border-white/10 rounded-lg text-xs text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                    Admin
                  </div>
                </Link>
              )}
            </nav>

            {/* Bottom: notifications + avatar */}
            <div className="flex flex-col items-center gap-2 p-3 border-t border-white/[0.06]">
              <NotificationBell />
              <Link
                href={`/profile/${profile?.id}`}
                id="nav-profile"
                title="My Profile"
                className="group relative flex items-center justify-center"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/10 hover:border-brand-500/50 transition-colors bg-surface-4">
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt="Avatar" width={36} height={36} className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-500/20 text-brand-400 text-sm font-bold">
                      {profile?.username?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                  )}
                </div>
              </Link>
              <button onClick={signOut} id="signout-btn" title="Sign out" className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Column 2: Channel list (only on mobile, when sideOpen is true and in chat routes) */}
          {sideOpen && pathname.startsWith('/chat') && (
            <div className="flex-1 flex flex-col bg-surface-3 lg:hidden overflow-y-auto scroll-area">
              <div className="px-4 py-4 border-b border-white/[0.06]">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Channels</h2>
              </div>
              <div className="p-2 flex-1">
                {groups.map(group => (
                  <div key={group.name} className="mb-3">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{group.name}</div>
                    {group.channels.map(ch => (
                      <Link
                        key={ch.id}
                        href={`/chat/${ch.id}`}
                        onClick={() => setSideOpen(false)}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors',
                          pathname.endsWith(ch.id) && 'text-white bg-brand-500/15'
                        )}
                      >
                        <span className="text-base">{CHANNEL_ICONS[ch.name] ?? '💬'}</span>
                        <span className="truncate">{ch.name}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.06] bg-surface-2 lg:hidden flex-shrink-0">
            <button id="mobile-menu-btn" onClick={() => setSideOpen(!sideOpen)} className="btn-ghost p-2">
              {sideOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-400" />
              <span className="font-bold text-slate-100">YPSdudes</span>
            </div>
            <div className="w-9" />
          </div>

          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav lg:hidden">
        {NAV.slice(0, 5).map(item => (
          <Link
            key={item.href}
            href={item.href}
            id={`mobile-${item.id}`}
            className={cn(
              'flex flex-col items-center gap-1 transition-colors',
              isActive(item.href) ? 'text-brand-400' : 'text-slate-500'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </AppCtx.Provider>
  )
}
