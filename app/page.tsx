'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Zap, MessageSquare, BookOpen, Trophy, FileText, ArrowRight,
  ShieldCheck, Lock, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

export default function LandingPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
          if (data) setProfile(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [])

  const features = [
    {
      icon: MessageSquare,
      title: 'Discord-style Channels',
      desc: 'Dedicated streams for JEE & NEET chat, doubts, resources, announcements, and casual chatter.',
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400'
    },
    {
      icon: BookOpen,
      title: 'Chapter MCQ Tests',
      desc: 'Take timed tests, get instant score analysis, view correct explanations, and review your history.',
      color: 'from-violet-500/20 to-purple-500/20 text-violet-400'
    },
    {
      icon: Trophy,
      title: 'Rank Leaderboards',
      desc: 'Compete in friendly rankings. View JEE vs NEET subject performance and highlight your current rank.',
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400'
    },
    {
      icon: FileText,
      title: 'Peer Notes Sharing',
      desc: 'Upload and download JEE/NEET hand-written notes, study materials, and cheat sheets with classmates.',
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400'
    }
  ]

  const stats = [
    { label: 'Community Stream', value: 'JEE & NEET' },
    { label: 'Note Bank Downloads', value: 'Unlimited' },
    { label: 'Community Status', value: 'Invite Only' },
    { label: 'School Chapter', value: 'YPS Rajnandgaon' }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col selection:bg-brand-500/30 overflow-x-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[90px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass-card border-b border-white/[0.04] bg-[#0a0a0f]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center group-hover:bg-brand-500/30 transition-colors">
              <Zap className="w-5 h-5 text-brand-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-brand-300 transition-colors">YPSdudes</span>
          </Link>

          <nav className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-8 rounded-xl bg-white/[0.04] shimmer" />
            ) : profile ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline">Logged in as <span className="text-brand-400 font-semibold">{profile.username}</span></span>
                <Link href="/chat" className="btn-primary py-1.5 px-4 text-xs font-semibold">
                  Enter App
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors px-3 py-1.5">
                  Sign In
                </Link>
                <Link href="/signup" className="btn-primary py-1.5 px-4 text-xs font-semibold">
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col justify-center items-center px-6 pt-16 pb-20 text-center max-w-5xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-400 text-xs font-semibold mb-8 backdrop-blur-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Exclusive Community for Yugantar Public School</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl leading-[1.1] mb-6"
        >
          Ace Your JEE & NEET Prep <br />
          <span className="gradient-text">Together with Classmates</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-slate-400 text-base sm:text-xl max-w-2xl leading-relaxed mb-10"
        >
          Join YPSdudes, the private student-only hub to share high-quality notes, take timed chapter-wise MCQ tests, compare rankings, and clear doubts in real-time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto"
        >
          {loading ? (
            <div className="w-48 h-12 rounded-xl bg-white/[0.04] shimmer" />
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

        {/* Security / Info Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-slate-500 text-xs flex items-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5 text-brand-500" />
          <span>Invite-Only Access · Administrator Approval Required</span>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-surface-2/40 border-t border-b border-white/[0.03] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">Everything You Need to Excel</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              A comprehensive student-centric ecosystem designed to boost collaborative study and track JEE/NEET prep metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feat, idx) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-card p-6 rounded-2xl border border-white/[0.04] hover:border-brand-500/20 hover:bg-white/[0.02] transition-all duration-300 flex gap-5"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center flex-shrink-0 border border-white/10`}>
                  <feat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 text-lg mb-2">{feat.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass-card rounded-3xl p-8 sm:p-12 border border-white/[0.05] bg-gradient-to-br from-surface-2 to-surface-3 relative overflow-hidden">
            <div className="absolute top-[-50%] right-[-30%] w-[60%] h-[150%] rounded-full bg-brand-500/5 blur-[100px] pointer-events-none" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center relative z-10">
              {stats.map((s) => (
                <div key={s.label} className="space-y-2">
                  <p className="text-slate-400 text-xs sm:text-sm uppercase tracking-wider font-semibold">{s.label}</p>
                  <p className="text-2xl sm:text-4xl font-black gradient-text">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Verification / Sign up Guide */}
      <section className="py-16 max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">How to Join YPSdudes</h2>
          <p className="text-slate-400 text-sm mt-2">Access is strictly moderated for school peers.</p>
        </div>

        <div className="space-y-4">
          {[
            { step: '1', title: 'Submit Request', desc: 'Go to the signup page, input your stream (JEE/NEET), school credentials, and contact info.' },
            { step: '2', title: 'Admin Verification', desc: 'Our school community admins verify your student identity to prevent unauthorized sign-ups.' },
            { step: '3', title: 'Get Approved', desc: 'Upon verification, you receive approval. You can now login, access chat, notes, and tests!' }
          ].map((s) => (
            <div key={s.step} className="flex gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] items-start">
              <span className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {s.step}
              </span>
              <div>
                <h4 className="font-semibold text-slate-200 text-sm sm:text-base">{s.title}</h4>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.04] bg-[#0a0a0f] py-8 text-center text-slate-600 text-xs px-6">
        <p className="mb-2">YPSdudes Community © {new Date().getFullYear()} · Class of 2026 JEE & NEET</p>
        <p className="text-slate-700">Protected by Row Level Security (RLS) & Student Identity Verification</p>
      </footer>
    </div>
  )
}
