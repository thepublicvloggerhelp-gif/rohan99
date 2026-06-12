'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Hash, MessageSquare, BookOpen, Trophy, FileText, User,
  ShieldCheck, LogOut, Menu, X, ChevronRight, Settings,
  Zap, Bell, Inbox, Info, Images
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Channel } from '@/types'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { cn } from '@/lib/utils'
import { AppCtx } from '@/lib/context'
import { PresenceProvider } from '@/lib/presence'

// AppCtx is now imported from '@/lib/context'

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV = [
  { icon: Hash,           label: 'Chat',     subtitle: 'Channels',  href: '/chat',        id: 'nav-chat',        color: 'from-indigo-500 to-blue-500',    shadow: 'shadow-indigo-500/40' },
  { icon: MessageSquare,  label: 'DMs',      subtitle: 'Messages',  href: '/dm',          id: 'nav-dm',          color: 'from-purple-500 to-pink-500',    shadow: 'shadow-purple-500/40' },
  { icon: BookOpen,       label: 'Tests',    subtitle: 'Practice',  href: '/tests',       id: 'nav-tests',       color: 'from-cyan-500 to-teal-500',      shadow: 'shadow-cyan-500/40' },
  { icon: Trophy,         label: 'Ranks',    subtitle: 'Leaders',   href: '/leaderboard', id: 'nav-leaderboard', color: 'from-amber-500 to-orange-500',   shadow: 'shadow-amber-500/40' },
  { icon: FileText,       label: 'Notes',    subtitle: 'Study',     href: '/notes',       id: 'nav-notes',       color: 'from-emerald-500 to-green-500',  shadow: 'shadow-emerald-500/40' },
  { icon: Images,         label: 'Memories', subtitle: 'Wall',      href: '/memories',    id: 'nav-memories',    color: 'from-pink-500 to-rose-500',      shadow: 'shadow-pink-500/40' },
  { icon: Info,           label: 'About',    subtitle: 'Info',      href: '/about',       id: 'nav-about',       color: 'from-rose-500 to-red-500',       shadow: 'shadow-rose-500/40' },
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
      <PresenceProvider>
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
          {/* Column 1: Icon Rail */}
          <div className="flex flex-col w-[72px] border-r border-white/[0.05] h-full flex-shrink-0"
            style={{ background: '#08090E' }}>
            {/* Logo */}
            <div className="flex items-center justify-center h-16 border-b border-white/[0.05]">
              <Link href="/chat" id="logo-link" className="flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden border border-blue-600/30 hover:border-blue-500/60 bg-white/[0.04] transition-all hover:shadow-lg hover:shadow-blue-500/20">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover object-top scale-[1.1] animate-logo" />
              </Link>
            </div>

            {/* Nav icons */}
            <nav className="flex flex-col items-center gap-1.5 p-2 flex-1">
              {NAV.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  id={item.id}
                  title={item.label}
                  onClick={() => setSideOpen(false)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={cn(
                    'nav-icon-btn group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200',
                    isActive(item.href)
                      ? `bg-gradient-to-br ${item.color} text-white shadow-lg ${item.shadow}`
                      : 'text-slate-500 hover:bg-white/[0.08] hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {/* Active indicator bar */}
                  {isActive(item.href) && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-white/60 rounded-r-full nav-indicator" />
                  )}
                  {/* Tooltip */}
                  <div className="absolute left-14 px-2.5 py-1.5 bg-[#0F172A]/95 border border-slate-700/60 rounded-xl text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl">
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
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/35'
                      : 'text-slate-400 hover:bg-white/[0.08] hover:text-white'
                  )}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <div className="absolute left-16 px-2.5 py-1.5 bg-[#0F172A]/95 border border-slate-700/60 rounded-xl text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl">
                    Admin
                  </div>
                </Link>
              )}
            </nav>

            {/* Bottom: notifications + avatar */}
            <div className="flex flex-col items-center gap-2.5 p-3 border-t border-white/[0.05]">
              <NotificationBell />
              <Link
                href={`/profile/${profile?.id}`}
                id="nav-profile"
                title="My Profile"
                className="group relative flex items-center justify-center"
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/[0.1] hover:border-blue-500/50 transition-colors" style={{ background: 'var(--bg-elevated)' }}>
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt="Avatar" width={36} height={36} className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-600/20 text-blue-400 text-sm font-black">
                      {profile?.username?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                  )}
                </div>
              </Link>
              <button onClick={signOut} id="signout-btn" title="Sign out" className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/15 transition-all duration-150">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Column 2: Channel list (mobile) */}
          {sideOpen && pathname.startsWith('/chat') && (
            <div className="flex-1 flex flex-col lg:hidden overflow-y-auto scroll-area border-r border-white/[0.05]"
              style={{ background: 'var(--bg-secondary)' }}>
              <div className="px-4 py-4 border-b border-white/[0.05]">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Channels</p>
              </div>
              <div className="p-2 flex-1">
                {groups.map(group => (
                  <div key={group.name} className="mb-4">
                    <div className="px-2 py-1 text-[10px] font-black text-slate-700 uppercase tracking-[0.18em] mb-1">{group.name}</div>
                    {group.channels.map(ch => (
                      <Link
                        key={ch.id}
                        href={`/chat/${ch.id}`}
                        onClick={() => setSideOpen(false)}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
                          pathname.endsWith(ch.id)
                            ? 'text-white bg-blue-600'
                            : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]'
                        )}
                      >
                        <Hash className="w-3.5 h-3.5 flex-shrink-0" />
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
        <main className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
          {/* Mobile header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.06] lg:hidden flex-shrink-0"
            style={{ background: 'var(--bg-secondary)' }}>
            <button id="mobile-menu-btn" onClick={() => setSideOpen(!sideOpen)} className="btn-ghost p-2">
              {sideOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-blue-600/30">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover object-top animate-logo" />
              </div>
              <span className="font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: '15px' }}>YPSdudes</span>
            </div>
            <div className="w-9" />
          </div>

          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav — CINEMATIC */}
      <nav className="mobile-nav lg:hidden">
        {NAV.slice(0, 5).map((item, i) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`mobile-${item.id}`}
              style={{ animationDelay: `${i * 50}ms` }}
              className={cn(
                'mobile-nav-item flex flex-col items-center gap-0.5 relative px-1 py-0.5',
                active ? 'mobile-nav-active' : 'text-slate-500'
              )}
            >
              {/* Animated background blob */}
              {active && (
                <span className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.color} opacity-15 nav-blob`} />
              )}
              {/* Icon wrapper */}
              <span className={cn(
                'relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200',
                active
                  ? `bg-gradient-to-br ${item.color} text-white shadow-md ${item.shadow} nav-icon-pop`
                  : 'text-slate-500'
              )}>
                <item.icon className="w-4 h-4" />
              </span>
              {/* Label */}
              <span className={cn(
                'text-[9px] font-black uppercase tracking-widest transition-all duration-200',
                active ? 'text-white' : 'text-slate-600'
              )}>
                {item.label}
              </span>
              {/* Active dot */}
              {active && <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/80" />}
            </Link>
          )
        })}
      </nav>
      </PresenceProvider>
    </AppCtx.Provider>
  )
}
