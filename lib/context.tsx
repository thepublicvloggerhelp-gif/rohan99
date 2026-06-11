import { createContext, useContext } from 'react'
import { Profile, Channel } from '@/types'

export interface AppContextType {
  profile: Profile | null
  channels: Channel[]
}

export const AppCtx = createContext<AppContextType>({ profile: null, channels: [] })
export const useApp = () => useContext(AppCtx)
