'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const supabase = createClient()
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.is_read).length)
      }

      // Realtime
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, payload => {
          setNotifications(prev => [payload.new as Notification, ...prev])
          setUnreadCount(c => c + 1)
        })
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
    load()
  }, [])

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read: true })
      .eq('user_id', user.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const typeIcon = (type: string) => {
    const icons: Record<string, string> = {
      announcement: '📢', test: '📝', admin: '🛡️', general: '🔔'
    }
    return icons[type] ?? '🔔'
  }

  return (
    <div className="relative">
      <button
        id="notification-bell"
        onClick={() => setOpen(!open)}
        className={cn(
          'relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200',
          open ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/[0.08] hover:text-white'
        )}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-[10px] font-bold text-white flex items-center justify-center leading-none shadow-md shadow-red-500/20">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-14 bottom-0 z-50 w-80 glass-card rounded-2xl overflow-hidden shadow-xl animate-slide-in-up border border-white/[0.08]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto scroll-area">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">No notifications yet</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={cn('flex gap-3 px-4 py-3 border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]', !n.is_read && 'bg-brand-500/5')}>
                    <span className="text-lg flex-shrink-0">{typeIcon(n.type)}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-slate-600 mt-1">{formatRelativeTime(n.created_at)}</p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
