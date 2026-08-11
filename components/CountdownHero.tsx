'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Profile } from '@/types'

const MOTIVATIONAL_MESSAGES = [
  "Welcome to a new academic year!",
  "Let's make this year your best one yet.",
  "Ready to conquer the new syllabus?",
  "JEE & NEET prep never stops, keep the momentum going.",
  "Stay focused, stay dedicated, achieve your goals.",
  "New year, new opportunities to shine."
]

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

export function CountdownHero({ profile, loading }: { profile: Profile | null; loading: boolean }) {
  const [isMounted, setIsMounted] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    setIsMounted(true)

    // Generate random background particles on mount
    const newParticles = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 4,
      duration: Math.random() * 10 + 12,
      delay: Math.random() * -20
    }))
    setParticles(newParticles)

    // Interval to cycle motivational messages every 6 seconds
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length)
    }, 6000)

    return () => {
      clearInterval(messageTimer)
    }
  }, [])

  if (!isMounted) {
    // Return skeleton shell to prevent Layout Shift (CLS)
    return (
      <div className="relative w-full max-w-5xl mx-auto px-6 py-16 text-center select-none min-h-[500px] flex flex-col justify-center items-center">
        {/* Glow placeholder */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-200/20 blur-[100px] pointer-events-none" />
        
        <div className="animate-pulse space-y-8 w-full flex flex-col items-center">
          <div className="h-6 w-72 bg-slate-800 rounded-full" />
          <div className="h-14 w-96 bg-slate-800 rounded-2xl" />
          <div className="h-4 w-64 bg-slate-800 rounded-full" />
        </div>
      </div>
    )
  }

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

      {/* Pulsing glow background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-brand-300/20 via-purple-300/15 to-cyan-300/20 blur-[100px] pointer-events-none animate-pulse-slow z-0" />

      {/* Greeting Tag */}
      {profile && (
        <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/5 border border-brand-500/15 text-brand-500 text-sm font-semibold mb-6 backdrop-blur-sm z-10">
          <Zap className="w-4 h-4" />
          <span>Hey {profile.username}!</span>
        </div>
      )}

      {/* Main Heading */}
      <h1 className="relative text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-slate-50 max-w-4xl leading-[1.15] mb-12 z-10">
        Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-400">Class of 2026!</span>
      </h1>

      {/* Motivational / Dynamic Messages */}
      <div className="relative min-h-[32px] flex items-center justify-center mb-12 z-10">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.85, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="text-base md:text-lg font-semibold text-slate-400 tracking-wide text-center"
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
