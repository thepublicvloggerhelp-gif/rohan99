'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { AppCtx } from '@/lib/context'

export interface PresenceInfo {
  status: 'online' | 'away'
  lastActive: number
  user: Profile
}

interface PresenceContextType {
  presenceMap: Record<string, PresenceInfo>
  myStatus: 'online' | 'away'
}

const PresenceContext = createContext<PresenceContextType>({
  presenceMap: {},
  myStatus: 'online',
})

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useContext(AppCtx)
  const supabase = createClient()
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceInfo>>({})
  const [myStatus, setMyStatus] = useState<'online' | 'away'>('online')
  const channelRef = useRef<any>(null)

  // 1. Inactivity tracking (Away state)
  useEffect(() => {
    if (!profile) return

    let timer: any

    const handleActivity = () => {
      setMyStatus('online')
      clearTimeout(timer)
      timer = setTimeout(() => {
        setMyStatus('away')
      }, 5 * 60 * 1000) // 5 minutes threshold
    }

    // Set up listeners for activity
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('scroll', handleActivity)

    // Initial trigger
    handleActivity()

    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('scroll', handleActivity)
    }
  }, [profile])

  // 2. Supabase Realtime Presence Channel
  useEffect(() => {
    if (!profile) {
      // Clean up if logged out
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      setPresenceMap({})
      return
    }

    // Join the global presence channel
    const channel = supabase.channel('presence:global', {
      config: {
        presence: {
          key: profile.id,
        },
      },
    })

    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const parsedMap: Record<string, PresenceInfo> = {}

        Object.keys(state).forEach((userId) => {
          const userPresences = state[userId] as any[]
          if (!userPresences || userPresences.length === 0) return

          // Multi-tab support: if any tab is 'online', status is 'online'.
          const isOnline = userPresences.some((p) => p.status === 'online')
          const status = isOnline ? 'online' : 'away'

          // Get latest active timestamp across all tabs
          const lastActive = Math.max(
            ...userPresences.map((p) => new Date(p.online_at || 0).getTime())
          )

          // Grab the user details
          const firstPresence = userPresences[0]
          if (firstPresence?.user) {
            parsedMap[userId] = {
              status,
              lastActive,
              user: firstPresence.user,
            }
          }
        })

        setPresenceMap(parsedMap)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            status: myStatus,
            user: profile,
          })
        }
      })

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [profile])

  // 3. Keep presence state in sync when status or profile updates
  useEffect(() => {
    if (!profile || !channelRef.current) return

    channelRef.current.track({
      online_at: new Date().toISOString(),
      status: myStatus,
      user: profile,
    })
  }, [myStatus, profile])

  return (
    <PresenceContext.Provider value={{ presenceMap, myStatus }}>
      {children}
    </PresenceContext.Provider>
  )
}

export function usePresence() {
  return useContext(PresenceContext)
}
