'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export function CountdownBanner() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="mx-4 mt-3 h-16 bg-slate-900/[0.02] border border-slate-200/60 rounded-2xl animate-pulse" />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-3 p-3.5 bg-gradient-to-r from-brand-50/20 via-white to-purple-50/20 border border-slate-200/60 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-sm relative overflow-hidden flex-shrink-0"
    >
      {/* Background decorations */}
      <div className="absolute -right-6 -top-6 w-16 h-16 bg-brand-500/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Info Tag */}
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Zap className="w-4 h-4 text-brand-500" />
          <span>Welcome Back! The new school year has begun.</span>
        </div>
        <p className="text-xs text-slate-500">
          Let's make this year productive and achieve your goals together.
        </p>
      </div>
    </motion.div>
  )
}
