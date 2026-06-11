import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

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
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getStreamColor(stream: string): string {
  return stream === 'JEE' ? 'text-indigo-400' : 'text-green-400'
}

export function getStreamBg(stream: string): string {
  return stream === 'JEE' ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-green-500/20 border-green-500/30'
}

export function getSubjectIcon(subject: string): string {
  const icons: Record<string, string> = {
    Physics:     '⚛️',
    Chemistry:   '🧪',
    Mathematics: '📐',
    Biology:     '🧬',
  }
  return icons[subject] ?? '📚'
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

export const CHANNEL_ICONS: Record<string, string> = {
  general:         '💬',
  'jee-discussion':'🎯',
  'neet-discussion':'🩺',
  physics:         '⚛️',
  chemistry:       '🧪',
  mathematics:     '📐',
  biology:         '🧬',
  announcements:   '📢',
}
