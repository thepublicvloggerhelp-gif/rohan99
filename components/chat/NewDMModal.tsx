'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Search, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Avatar } from '@/components/ui/Avatar'

interface Props { currentUser: Profile; onClose: () => void }

export function NewDMModal({ currentUser, onClose }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const [users,  setUsers]  = useState<Profile[]>([])
  const [query,  setQuery]  = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('*').neq('id', currentUser.id).eq('status', 'approved').then(({ data }) => {
      if (data) setUsers(data)
    })
  }, [])

  const startDM = async (userId: string) => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_or_create_dm', { user_a: currentUser.id, user_b: userId })
    setLoading(false)
    if (error) return
    onClose()
    router.push(`/dm/${data}`)
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(query.toLowerCase()) ||
    u.full_name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 glass-card rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
          <h3 className="font-semibold text-slate-200">New Message</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users..." className="input-base pl-9 py-2 text-sm" />
          </div>
          <div className="max-h-64 overflow-y-auto scroll-area space-y-1">
            {filtered.map(u => (
              <button key={u.id} onClick={() => startDM(u.id)} disabled={loading}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-white/[0.06] transition-colors text-left">
                <Avatar
                  url={u.avatar_url}
                  name={u.full_name}
                  size={36}
                  containerClassName="w-9 h-9 rounded-full overflow-hidden bg-surface-4 flex-shrink-0 flex items-center justify-center text-sm font-bold text-brand-400"
                />
                <div>
                  <p className="text-sm font-medium text-slate-200">{u.username}</p>
                  <p className="text-xs text-slate-500">{u.full_name} · {u.stream}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
