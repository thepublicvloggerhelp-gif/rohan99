'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'

// Target date: 14 June 2026 at 00:00:00 India Standard Time (IST)
// 14 June 2026 00:00:00 IST is 13 June 2026 18:30:00 UTC
const TARGET_TIME = new Date('2026-06-13T18:30:00Z').getTime()
const START_TIME = new Date('2026-05-09T18:30:00Z').getTime()

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownBanner() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [progress, setProgress] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  const calculateTimeLeft = (): TimeLeft => {
    const difference = TARGET_TIME - Date.now()
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())

      const totalVacation = TARGET_TIME - START_TIME
      const elapsed = Date.now() - START_TIME
      const currentProgress = Math.max(0, Math.min(100, (elapsed / totalVacation) * 100))
      setProgress(parseFloat(currentProgress.toFixed(2)))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!isMounted || !timeLeft) {
    return (
      <div className="mx-4 mt-3 h-16 bg-slate-900/[0.02] border border-slate-200/60 rounded-2xl animate-pulse" />
    )
  }

  const formatNum = (num: number) => String(num).padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-3 p-3.5 bg-gradient-to-r from-brand-50/20 via-white to-purple-50/20 border border-slate-200/60 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-sm relative overflow-hidden flex-shrink-0"
    >
      {/* Background decorations */}
      <div className="absolute -right-6 -top-6 w-16 h-16 bg-brand-500/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Info Tag & Progress */}
      <div className="flex flex-col gap-1 w-full sm:w-auto">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-brand-500" />
          <span>School Reopens: 14 June 2026</span>
          <span className="text-slate-300 font-normal">|</span>
          <span className="text-brand-600 font-semibold">{progress}% Completed</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full sm:w-60 h-1.5 bg-slate-900/[0.04] rounded-full overflow-hidden border border-slate-200/30">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Live Countdown Clock */}
      <div className="flex items-center gap-2">
        {[
          { label: 'd', value: formatNum(timeLeft.days) },
          { label: 'h', value: formatNum(timeLeft.hours) },
          { label: 'm', value: formatNum(timeLeft.minutes) },
          { label: 's', value: formatNum(timeLeft.seconds) }
        ].map((unit) => (
          <div key={unit.label} className="flex items-baseline gap-0.5">
            <span className="text-sm font-bold font-mono text-slate-800 tracking-tight bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/50 shadow-sm min-w-[28px] text-center">
              {unit.value}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{unit.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
