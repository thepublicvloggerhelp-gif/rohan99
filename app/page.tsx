'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  MessageSquare, BookOpen, Trophy, FileText, ArrowRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { CountdownHero } from '@/components/CountdownHero'

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
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-600'
    },
    {
      icon: BookOpen,
      title: 'Chapter MCQ Tests',
      desc: 'Take timed tests, get instant score analysis, view correct explanations, and review your history.',
      color: 'from-purple-500/10 to-pink-500/10 text-purple-600'
    },
    {
      icon: Trophy,
      title: 'Rank Leaderboards',
      desc: 'Compete in friendly rankings. View JEE vs NEET subject performance and highlight your current rank.',
      color: 'from-orange-500/10 to-red-500/10 text-orange-600'
    },
    {
      icon: FileText,
      title: 'Peer Notes Sharing',
      desc: 'Upload and download JEE/NEET hand-written notes, study materials, and cheat sheets with classmates.',
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600'
    }
  ]

  const stats = [
    { label: 'Community Stream', value: 'JEE & NEET' },
    { label: 'Note Bank Downloads', value: 'Unlimited' },
    { label: 'Community Status', value: 'Invite Only' },
    { label: 'School Chapter', value: 'YPS Rajnandgaon' }
  ]

  return (
    <div className="min-h-screen bg-[#08090E] text-slate-100 flex flex-col selection:bg-brand-500/10 overflow-x-hidden relative">
      {/* Background Image with opacity fade */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-90">
        <Image
          src="/bg-group.png"
          alt="Community Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Blend gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090E] via-[#08090E]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090E] via-transparent to-[#08090E]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08090E] via-transparent to-[#08090E]" />
      </div>

      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[90px] pointer-events-none z-0" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#08090E]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-blue-600/30 flex items-center justify-center bg-white/[0.04] transition-all">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover object-top scale-[1.1] animate-logo" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-50 group-hover:text-brand-600 transition-colors">YPSdudes</span>
          </Link>

          <nav className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-8 rounded-xl bg-slate-100 shimmer" />
            ) : profile ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline">Logged in as <span className="text-brand-500 font-semibold">{profile.username}</span></span>
                <Link href="/chat" className="btn-primary py-1.5 px-4 text-xs font-semibold">
                  Enter App
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-slate-400 hover:text-slate-100 text-sm font-semibold transition-colors px-3 py-1.5">
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

      {/* Premium Countdown Hero Section */}
      <CountdownHero profile={profile} loading={loading} />

      {/* Features Section */}
      <section className="py-24 bg-[#08090E]/90 border-t border-b border-slate-200/30 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-50 mb-4">Everything You Need to Excel</h2>
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
                className="glass-card p-6 rounded-2xl border border-slate-200/50 hover:border-brand-500/20 hover:bg-slate-50/50 transition-all duration-300 flex gap-5"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center flex-shrink-0 border border-slate-200/10`}>
                  <feat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-50 text-lg mb-2">{feat.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-20 relative z-10 bg-[#08090E]/90">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass-card rounded-3xl p-8 sm:p-12 border border-slate-200/50 bg-gradient-to-br from-surface-2 to-surface-3 relative overflow-hidden">
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
      <section className="py-16 max-w-4xl mx-auto px-6 relative z-10 bg-[#08090E]/90">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-50">How to Join YPSdudes</h2>
          <p className="text-slate-400 text-sm mt-2">Access is strictly moderated for school peers.</p>
        </div>

        <div className="space-y-4">
          {[
            { step: '1', title: 'Submit Request', desc: 'Go to the signup page, input your stream (JEE/NEET), school credentials, and contact info.' },
            { step: '2', title: 'Admin Verification', desc: 'Our school community admins verify your student identity to prevent unauthorized sign-ups.' },
            { step: '3', title: 'Get Approved', desc: 'Upon verification, you receive approval. You can now login, access chat, notes, and tests!' }
          ].map((s) => (
            <div key={s.step} className="flex gap-4 p-5 rounded-2xl bg-slate-50/50 border border-slate-200/50 items-start">
              <span className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {s.step}
              </span>
              <div>
                <h4 className="font-semibold text-slate-50 text-sm sm:text-base">{s.title}</h4>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/50 bg-[#08090E]/90 py-8 text-center text-slate-500 text-xs px-6 relative z-10">
        <p className="mb-2">YPSdudes Community © {new Date().getFullYear()} · Class of 2026 JEE & NEET</p>
        <p className="text-slate-400">Protected by Row Level Security (RLS) & Student Identity Verification</p>
      </footer>
    </div>
  )
}
