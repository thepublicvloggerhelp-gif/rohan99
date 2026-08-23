import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import React from 'react'
import {
  Atom, FlaskConical, Ruler, Dna, BookOpen,
  MessageSquare, Megaphone, HelpCircle, FileText
} from 'lucide-react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date))     return format(date, 'h:mm a')
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`
  return format(date, 'MMM d, h:mm a')
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getInitials(name: string): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getStreamColor(stream: string): string {
  return stream === 'JEE' ? 'text-indigo-400' : 'text-green-400'
}

export function getStreamBg(stream: string): string {
  return stream === 'JEE' ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-green-500/20 border-green-500/30'
}

export function getStreamBadge(stream: string, extraClasses?: string): string {
  return cn('badge', stream === 'JEE' ? 'badge-jee' : 'badge-neet', extraClasses)
}

export function getSubjectIcon(subject: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    Physics:     <Atom className="w-4 h-4 inline-block text-purple-400" />,
    Chemistry:   <FlaskConical className="w-4 h-4 inline-block text-pink-400" />,
    Mathematics: <Ruler className="w-4 h-4 inline-block text-amber-400" />,
    Biology:     <Dna className="w-4 h-4 inline-block text-emerald-400" />,
  }
  return icons[subject] ?? <BookOpen className="w-4 h-4 inline-block text-slate-400" />
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

export const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  general:         <MessageSquare className="w-4 h-4 text-blue-500" />,
  'jee-discussion': <BookOpen className="w-4 h-4 text-indigo-500" />,
  'neet-discussion':<BookOpen className="w-4 h-4 text-emerald-500" />,
  physics:         <Atom className="w-4 h-4 text-purple-500" />,
  chemistry:       <FlaskConical className="w-4 h-4 text-pink-500" />,
  mathematics:     <Ruler className="w-4 h-4 text-amber-500" />,
  biology:         <Dna className="w-4 h-4 text-emerald-500" />,
  announcements:   <Megaphone className="w-4 h-4 text-red-500" />,
  doubts:          <HelpCircle className="w-4 h-4 text-slate-500" />,
}
