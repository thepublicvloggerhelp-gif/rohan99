'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Zap, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { getErrorMessage, logError } from '@/lib/errors'

const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

function LoginForm() {
  const router   = useRouter()
  const params   = useSearchParams()
  const supabase = createClient()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const errorMsg = params.get('error')

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email:    data.email,
        password: data.password,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      window.location.href = '/chat'
    } catch (err) {
      logError('sign in', err)
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full overflow-hidden border border-brand-500/30 mb-4 shadow-brand bg-[#111111] transition-all">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover object-top scale-[1.1] animate-logo" />
        </div>
        <h1 className="text-3xl font-bold gradient-text">YPSdudes</h1>
        <p className="text-slate-400 text-sm mt-1">JEE & NEET Community · YPS Rajnandgaon</p>
      </div>

      {/* Error banners */}
      {errorMsg === 'banned' && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
          Your account has been banned. Contact admin.
        </div>
      )}
      {errorMsg === 'rejected' && (
        <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm text-center">
          Your signup request was rejected. Contact admin.
        </div>
      )}

      {/* Card */}
      <div className="glass-card rounded-2xl p-8">
        <h2 className="text-xl font-bold text-slate-100 mb-6">Welcome back</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="input-base"
              {...register('email')}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                className="input-base pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/[0.07] text-center">
          <p className="text-slate-400 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Request access
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-slate-600 text-xs mt-6 flex items-center justify-center gap-1">
        <BookOpen className="w-3 h-3" /> Private community · Invite only
      </p>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-center py-4">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
