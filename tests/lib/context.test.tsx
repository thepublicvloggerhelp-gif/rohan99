import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AppCtx, useApp, type AppContextType } from '@/lib/context'
import type { Channel, Profile } from '@/types'

function Probe() {
  const { profile, channels } = useApp()
  return <span>{`${profile?.username ?? 'anonymous'}:${channels.length}`}</span>
}

function render(value?: AppContextType) {
  if (!value) return renderToStaticMarkup(<Probe />)
  return renderToStaticMarkup(
    <AppCtx.Provider value={value}>
      <Probe />
    </AppCtx.Provider>
  )
}

describe('useApp', () => {
  it('falls back to an empty app context outside a provider', () => {
    expect(render()).toContain('anonymous:0')
  })

  it('exposes the profile and channels from the nearest provider', () => {
    const profile = { id: 'user-1', username: 'rohan' } as Profile
    const channels = [{ id: 'c1' }, { id: 'c2' }] as Channel[]

    expect(render({ profile, channels })).toContain('rohan:2')
  })
})
