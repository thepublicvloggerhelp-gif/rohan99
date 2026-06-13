import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#08090E] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with opacity fade */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]">
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

      {/* Background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
