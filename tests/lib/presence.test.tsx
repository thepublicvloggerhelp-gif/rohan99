// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { act, render, cleanup } from '@testing-library/react'
import { AppCtx } from '@/lib/context'
import type { Profile } from '@/types'

type PresenceHandler = () => void

const { presenceState, track, unsubscribe } = vi.hoisted(() => ({
  presenceState: vi.fn(),
  track: vi.fn(),
  unsubscribe: vi.fn(),
}))
let presenceHandler: PresenceHandler | null = null
let subscribeCallback: ((status: string) => void | Promise<void>) | null = null
let channelConfig: unknown = null

const channel: Record<string, unknown> = {
  on: (_type: string, _filter: unknown, handler: PresenceHandler) => {
    presenceHandler = handler
    return channel
  },
  subscribe: (cb: (status: string) => void | Promise<void>) => {
    subscribeCallback = cb
    return channel
  },
  presenceState,
  track,
  unsubscribe,
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: (_name: string, config: unknown) => {
      channelConfig = config
      return channel
    },
  }),
}))

import { PresenceProvider, usePresence } from '@/lib/presence'

const PROFILE = { id: 'user-1', username: 'rohan' } as Profile
const OTHER = { id: 'user-2', username: 'aman' } as Profile

let latest: ReturnType<typeof usePresence>

function Probe() {
  latest = usePresence()
  return null
}

function renderProvider(profile: Profile | null) {
  return render(
    <AppCtx.Provider value={{ profile, channels: [] }}>
      <PresenceProvider>
        <Probe />
      </PresenceProvider>
    </AppCtx.Provider>
  )
}

async function syncPresence(state: Record<string, unknown[]>) {
  presenceState.mockReturnValue(state)
  await act(async () => {
    presenceHandler?.()
  })
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  presenceState.mockReset()
  presenceState.mockReturnValue({})
  track.mockReset()
  unsubscribe.mockReset()
  presenceHandler = null
  subscribeCallback = null
  channelConfig = null
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('usePresence outside a provider', () => {
  it('returns an empty map and an online status', () => {
    render(<Probe />)

    expect(latest).toEqual({ presenceMap: {}, myStatus: 'online' })
  })
})

describe('PresenceProvider without a signed-in profile', () => {
  it('does not join the presence channel', () => {
    renderProvider(null)

    expect(channelConfig).toBeNull()
    expect(latest.presenceMap).toEqual({})
  })
})

describe('PresenceProvider channel lifecycle', () => {
  it('joins the global channel keyed by the profile id', () => {
    renderProvider(PROFILE)

    expect(channelConfig).toEqual({ config: { presence: { key: PROFILE.id } } })
  })

  it('tracks its own presence once subscribed', async () => {
    renderProvider(PROFILE)

    await act(async () => {
      await subscribeCallback?.('SUBSCRIBED')
    })

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'online', user: PROFILE })
    )
  })

  it('does not track before the subscription is confirmed', async () => {
    renderProvider(PROFILE)
    track.mockClear()

    await act(async () => {
      await subscribeCallback?.('TIMED_OUT')
    })

    expect(track).not.toHaveBeenCalled()
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderProvider(PROFILE)

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
})

describe('PresenceProvider presence sync', () => {
  it('maps each user to their status, last active time and profile', async () => {
    renderProvider(PROFILE)

    await syncPresence({
      [OTHER.id]: [{ status: 'online', online_at: '2024-05-10T12:00:00Z', user: OTHER }],
    })

    expect(latest.presenceMap[OTHER.id]).toEqual({
      status: 'online',
      lastActive: new Date('2024-05-10T12:00:00Z').getTime(),
      user: OTHER,
    })
  })

  it('treats a user as online when any of their tabs is online', async () => {
    renderProvider(PROFILE)

    await syncPresence({
      [OTHER.id]: [
        { status: 'away', online_at: '2024-05-10T11:00:00Z', user: OTHER },
        { status: 'online', online_at: '2024-05-10T12:00:00Z', user: OTHER },
      ],
    })

    expect(latest.presenceMap[OTHER.id].status).toBe('online')
  })

  it('reports away only when every tab is away, using the newest timestamp', async () => {
    renderProvider(PROFILE)

    await syncPresence({
      [OTHER.id]: [
        { status: 'away', online_at: '2024-05-10T11:00:00Z', user: OTHER },
        { status: 'away', online_at: '2024-05-10T12:00:00Z', user: OTHER },
      ],
    })

    expect(latest.presenceMap[OTHER.id]).toMatchObject({
      status: 'away',
      lastActive: new Date('2024-05-10T12:00:00Z').getTime(),
    })
  })

  it('skips entries with no presences and entries with no user payload', async () => {
    renderProvider(PROFILE)

    await syncPresence({
      'empty-user': [],
      'no-profile': [{ status: 'online', online_at: '2024-05-10T12:00:00Z' }],
      [OTHER.id]: [{ status: 'online', online_at: '2024-05-10T12:00:00Z', user: OTHER }],
    })

    expect(Object.keys(latest.presenceMap)).toEqual([OTHER.id])
  })

  it('replaces the map on each sync so departed users disappear', async () => {
    renderProvider(PROFILE)

    await syncPresence({
      [OTHER.id]: [{ status: 'online', online_at: '2024-05-10T12:00:00Z', user: OTHER }],
    })
    await syncPresence({})

    expect(latest.presenceMap).toEqual({})
  })
})

describe('PresenceProvider inactivity tracking', () => {
  it('starts online', () => {
    renderProvider(PROFILE)

    expect(latest.myStatus).toBe('online')
  })

  it('goes away after five minutes of inactivity and re-tracks the new status', async () => {
    renderProvider(PROFILE)
    track.mockClear()

    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000)
    })

    expect(latest.myStatus).toBe('away')
    expect(track).toHaveBeenCalledWith(expect.objectContaining({ status: 'away' }))
  })

  it('stays online while the user keeps interacting', async () => {
    renderProvider(PROFILE)

    await act(async () => {
      vi.advanceTimersByTime(4 * 60 * 1000)
      window.dispatchEvent(new Event('mousemove'))
      vi.advanceTimersByTime(4 * 60 * 1000)
    })

    expect(latest.myStatus).toBe('online')
  })

  it('returns to online when the user comes back', async () => {
    renderProvider(PROFILE)

    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000)
    })
    expect(latest.myStatus).toBe('away')

    await act(async () => {
      window.dispatchEvent(new Event('keydown'))
    })

    expect(latest.myStatus).toBe('online')
  })

  it('stops the inactivity timer after unmount', async () => {
    const { unmount } = renderProvider(PROFILE)
    unmount()
    track.mockClear()

    await act(async () => {
      vi.advanceTimersByTime(10 * 60 * 1000)
    })

    expect(track).not.toHaveBeenCalled()
  })
})
