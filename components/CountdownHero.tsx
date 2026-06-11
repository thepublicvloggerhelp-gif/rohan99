'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Compass, RefreshCw, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Profile } from '@/types'

// Target date: 14 June 2027 at 00:00:00 India Standard Time (IST)
// 14 June 2027 00:00:00 IST is 13 June 2027 18:30:00 UTC
const TARGET_TIME = new Date('2027-06-13T18:30:00Z').getTime()
// Start date of vacation: 10 May 2026 00:00:00 IST is 09 May 2026 18:30:00 UTC
const START_TIME = new Date('2026-05-09T18:30:00Z').getTime()

const MOTIVATIONAL_MESSAGES = [
  "Make every second of this break count!",
  "Connect with your peers on YPSdudes while you wait.",
  "Ready to conquer the next academic year?",
  "JEE & NEET prep never stops, but don't forget to recharge.",
  "Great things take time. Enjoy the journey!",
  "Use this time to build skills and explore new horizons."
]

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

export function CountdownHero({ profile, loading }: { profile: Profile | null; loading: boolean }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [progress, setProgress] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const [particles, setParticles] = useState<Particle[]>([])

  // Calculate countdown values
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

    // Generate random background particles on mount (client-side only to prevent hydration errors)
    const newParticles = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 4,
      duration: Math.random() * 10 + 12,
      delay: Math.random() * -20
    }))
    setParticles(newParticles)

    // Interval to update countdown every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())

      // Calculate progress
      const totalVacation = TARGET_TIME - START_TIME
      const elapsed = Date.now() - START_TIME
      const currentProgress = Math.max(0, Math.min(100, (elapsed / totalVacation) * 100))
      setProgress(parseFloat(currentProgress.toFixed(2)))
    }, 1000)

    // Interval to cycle motivational messages every 6 seconds
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length)
    }, 6000)

    return () => {
      clearInterval(timer)
      clearInterval(messageTimer)
    }
  }, [])

  if (!isMounted || !timeLeft) {
    // Return skeleton shell to prevent Layout Shift (CLS)
    return (
      <div className="relative w-full max-w-5xl mx-auto px-6 py-16 text-center select-none min-h-[500px] flex flex-col justify-center items-center">
        {/* Glow placeholder */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-200/20 blur-[100px] pointer-events-none" />
        
        <div className="animate-pulse space-y-8 w-full flex flex-col items-center">
          <div className="h-6 w-72 bg-slate-800 rounded-full" />
          <div className="h-14 w-96 bg-slate-800 rounded-2xl" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-3xl">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-3xl bg-slate-900/[0.03] border border-slate-200" />
            ))}
          </div>
          <div className="h-4 w-64 bg-slate-800 rounded-full" />
        </div>
      </div>
    )
  }

  // Format numbers to always display 2 digits
  const formatNum = (num: number) => String(num).padStart(2, '0')

  const timeUnits = [
    { label: 'Days', value: formatNum(timeLeft.days), color: 'from-blue-500/5 to-cyan-500/5 border-blue-500/10' },
    { label: 'Hours', value: formatNum(timeLeft.hours), color: 'from-purple-500/5 to-pink-500/5 border-purple-500/10' },
    { label: 'Minutes', value: formatNum(timeLeft.minutes), color: 'from-orange-500/5 to-red-500/5 border-orange-500/10' },
    { label: 'Seconds', value: formatNum(timeLeft.seconds), color: 'from-emerald-500/5 to-green-500/5 border-emerald-500/10' }
  ]

  return (
    <motion.section 
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-5xl mx-auto px-6 py-12 md:py-20 text-center select-none z-10 flex flex-col items-center"
    >
      {/* Floating particles background container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[32px]">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-gradient-to-tr from-brand-300/10 to-purple-400/10 border border-brand-200/5"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            animate={{
              y: [0, -120, 0],
              x: [0, 40, 0],
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Pulsing glow background decoration behind timer */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-brand-300/20 via-purple-300/15 to-cyan-300/20 blur-[100px] pointer-events-none animate-pulse-slow z-0" />

      {/* Target Reopening Date Tag */}
      <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/5 border border-brand-500/15 text-brand-500 text-xs font-semibold mb-6 backdrop-blur-sm z-10">
        <Calendar className="w-3.5 h-3.5" />
        <span>School Reopening – 14 June 2027</span>
      </div>

      {/* Main Heading */}
      <h1 className="relative text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-50 max-w-3xl leading-[1.15] mb-8 z-10">
        School Reopens In
      </h1>

      {/* Massive Timer Section */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-3xl mb-8 z-10">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            whileHover={{ y: -4, scale: 1.02, boxShadow: '0 20px 40px rgba(15, 23, 42, 0.05)' }}
            className={`flex flex-col items-center justify-center p-6 md:p-8 rounded-[24px] bg-gradient-to-b ${unit.color} border backdrop-blur-md shadow-card transition-shadow duration-300`}
          >
            {/* Monospace value for zero layout shifts */}
            <span className="text-4xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight text-slate-50">
              {unit.value}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-2">
              {unit.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Vacation Progress Bar Container */}
      <div className="relative w-full max-w-xl bg-slate-900/[0.03] border border-slate-200/60 rounded-2xl p-4 md:p-5 mb-8 backdrop-blur-sm z-10 shadow-sm flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-brand-500" />
            Vacation Progress
          </span>
          <span className="text-brand-500 font-mono bg-brand-500/10 px-2 py-0.5 rounded-md">
            {progress}% Completed
          </span>
        </div>
        
        {/* Progress rail */}
        <div className="w-full h-3 bg-slate-900/[0.04] rounded-full overflow-hidden border border-slate-200/30">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"
          />
        </div>

        <span className="text-[11px] font-medium text-slate-500 mt-1 italic">
          "Enjoy your remaining vacation while it lasts."
        </span>
      </div>

      {/* Motivational / Dynamic Messages */}
      <div className="relative min-h-[24px] flex items-center justify-center mb-8 z-10">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.85, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="text-sm font-semibold text-slate-600 tracking-wide text-center"
          >
            {MOTIVATIONAL_MESSAGES[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* CTA Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto z-10"
      >
        {loading ? (
          <div className="w-48 h-12 rounded-xl bg-slate-900/[0.04] shimmer" />
        ) : profile ? (
          <Link href="/chat" className="btn-primary text-sm px-8 py-3 w-full sm:w-auto flex items-center justify-center gap-2 shadow-brand group">
            Go to Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <>
            <Link href="/signup" className="btn-primary text-sm px-8 py-3 w-full sm:w-auto flex items-center justify-center gap-2 shadow-brand group">
              Request Invitation
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="btn-secondary text-sm px-8 py-3 w-full sm:w-auto flex items-center justify-center gap-2">
              Sign In to Account
            </Link>
          </>
        )}
      </motion.div>
    </motion.section>
  )
}
