'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, Zap, Upload, CheckCircle, FlaskConical, Calculator } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { BUCKET_LIMITS } from '@/lib/upload-constraints'
import Image from 'next/image'

const schema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  username:  z.string().min(3, 'Min 3 chars').max(20, 'Max 20 chars')
                       .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
  email:     z.string().email('Invalid email'),
  password:  z.string().min(8, 'Min 8 characters'),
  stream:    z.enum(['JEE', 'NEET'], { required_error: 'Select your stream' }),
})

type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [step,    setStep]    = useState(1)
  const [showPw,  setShowPw]  = useState(false)
  const [avatar,  setAvatar]  = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, watch, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const stream = watch('stream')

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > BUCKET_LIMITS.avatars) { toast.error('Avatar must be under 2MB'); return }
    setAvatar(file)
    setPreview(URL.createObjectURL(file))
  }

  const nextStep = async () => {
    const fields: (keyof FormData)[] = step === 1
      ? ['full_name', 'username', 'email', 'password']
      : ['stream']
    const valid = await trigger(fields)
    if (valid) setStep(s => s + 1)
  }

  const onSubmit = async (data: FormData) => {
    try {
      // Sign up with user metadata so the database trigger creates the profile automatically
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    data.email,
        password: data.password,
        options: {
          data: {
            username:   data.username,
            full_name:  data.full_name,
            stream:     data.stream,
          }
        }
      })
      if (authError) { toast.error(authError.message); return }

      const userId = authData.user?.id
      if (!userId) { toast.error('Signup failed'); return }

      // Upload avatar and update profile if session is established (e.g. if email confirmation is disabled)
      if (avatar && authData.session) {
        const ext = avatar.name.split('.').pop()
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(`${userId}/avatar.${ext}`, avatar, { upsert: true })
        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)
          const avatarUrl = urlData.publicUrl
          await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId)
        }
      }

      router.push('/chat')
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  const slideVariants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full overflow-hidden border border-brand-500/30 mb-4 shadow-brand bg-[#111111] transition-all">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover object-top scale-[1.1] animate-logo" />
        </div>
        <h1 className="text-3xl font-bold gradient-text">YPSdudes</h1>
        <p className="text-slate-400 text-sm mt-1">Join the student community</p>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-brand-500' : 'bg-white/10'}`} />
        ))}
      </div>

      <div className="glass-card rounded-2xl p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <h2 className="text-xl font-bold text-slate-100 mb-6">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                  <input type="text" placeholder="Rahul Sharma" className="input-base" {...register('full_name')} />
                  {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
                  <input type="text" placeholder="rahul_sharma" className="input-base" {...register('username')} />
                  {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <input type="email" placeholder="you@example.com" className="input-base" {...register('email')} />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" className="input-base pr-10" {...register('password')} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                </div>
                <button type="button" onClick={nextStep} className="btn-primary w-full mt-2">Continue</button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Stream Selection */}
          {step === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <h2 className="text-xl font-bold text-slate-100 mb-2">Choose Your Stream</h2>
              <p className="text-slate-400 text-sm mb-6">This helps us tailor your experience</p>
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${stream === 'JEE' ? 'border-brand-500 bg-brand-500/10' : 'border-white/[0.08] hover:border-white/20 bg-white/[0.02]'}`}>
                  <input type="radio" value="JEE" className="sr-only" {...register('stream')} />
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stream === 'JEE' ? 'bg-brand-500/20' : 'bg-white/[0.05]'}`}>
                    <Calculator className={`w-6 h-6 ${stream === 'JEE' ? 'text-brand-400' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-slate-100">JEE</p>
                    <p className="text-slate-400 text-sm">Physics · Chemistry · Mathematics</p>
                  </div>
                  {stream === 'JEE' && <CheckCircle className="w-5 h-5 text-brand-400 ml-auto" />}
                </label>

                <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${stream === 'NEET' ? 'border-green-500 bg-green-500/10' : 'border-white/[0.08] hover:border-white/20 bg-white/[0.02]'}`}>
                  <input type="radio" value="NEET" className="sr-only" {...register('stream')} />
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stream === 'NEET' ? 'bg-green-500/20' : 'bg-white/[0.05]'}`}>
                    <FlaskConical className={`w-6 h-6 ${stream === 'NEET' ? 'text-green-400' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-slate-100">NEET</p>
                    <p className="text-slate-400 text-sm">Physics · Chemistry · Biology</p>
                  </div>
                  {stream === 'NEET' && <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />}
                </label>
              </div>
              {errors.stream && <p className="text-red-400 text-xs mt-2">{errors.stream.message}</p>}

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button type="button" onClick={nextStep} className="btn-primary flex-1">Continue</button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Avatar */}
          {step === 3 && (
            <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <h2 className="text-xl font-bold text-slate-100 mb-2">Profile Picture</h2>
              <p className="text-slate-400 text-sm mb-6">Optional — you can add one later</p>

              <div className="flex flex-col items-center gap-4">
                <button type="button" onClick={() => fileRef.current?.click()} className="relative group">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-white/20 group-hover:border-brand-500/50 transition-colors bg-white/[0.04] flex items-center justify-center">
                    {preview ? (
                      <Image src={preview} alt="Preview" fill className="object-cover" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-500 group-hover:text-brand-400 transition-colors" />
                    )}
                  </div>
                  {preview && (
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <p className="text-slate-500 text-xs">JPG, PNG, GIF · Max 2MB</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isSubmitting ? 'Signing up...' : 'Sign Up'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-5 border-t border-white/[0.07] text-center">
          <p className="text-slate-400 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </motion.div>
  )
}
