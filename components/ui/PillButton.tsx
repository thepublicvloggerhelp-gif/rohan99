import React from 'react'
import { cn } from '@/lib/utils'

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean
}

export function PillButton({ active, className, children, ...props }: PillButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm',
        active
          ? 'bg-blue-600 border-blue-700 text-white shadow-brand'
          : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:text-white',
        className
      )}
    >
      {children}
    </button>
  )
}
