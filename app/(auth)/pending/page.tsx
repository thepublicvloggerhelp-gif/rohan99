'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, Zap, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PendingPage() {
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single()
      if (profile?.status === 'approved') {
        router.replace('/chat')
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center"
    >
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/30 shadow-brand">
          <Zap className="w-7 h-7 text-brand-400" />
        </div>
        <span className="text-2xl font-bold gradient-text">YPSdudes</span>
      </div>

      <div className="glass-card rounded-2xl p-10">
        {/* Animated clock */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center animate-pulse-slow">
              <Clock className="w-12 h-12 text-yellow-400" />
            </div>
            <div className="absolute inset-0 rounded-full bg-yellow-500/5 animate-ping" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-100 mb-3">Awaiting Admin Approval</h2>
        <p className="text-slate-400 leading-relaxed mb-8 max-w-xs mx-auto">
          Your request to join <span className="text-brand-400 font-medium">YPSdudes</span> has been submitted.
          An admin will review and approve your account shortly.
        </p>

        {/* Steps */}
        <div className="space-y-3 text-left mb-8">
          {[
            { label: 'Account created',      done: true },
            { label: 'Admin review pending', done: false, active: true },
            { label: 'Get full access',      done: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.done   ? 'bg-green-500/20 border border-green-500/40' :
                item.active ? 'bg-yellow-500/20 border border-yellow-500/40 animate-pulse' :
                              'bg-white/[0.05] border border-white/10'
              }`}>
                {item.done ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${item.active ? 'bg-yellow-400' : 'bg-slate-600'}`} />
                )}
              </div>
              <span className={`text-sm ${item.done ? 'text-green-400' : item.active ? 'text-yellow-300' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-slate-500 text-xs mb-6">
          This usually takes a few hours. You&apos;ll be able to access the platform once approved.
        </p>

        <button onClick={handleSignOut} className="btn-ghost text-slate-400 hover:text-slate-200 mx-auto">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </motion.div>
  )
}
