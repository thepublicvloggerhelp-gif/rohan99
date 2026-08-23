import { describe, it, expect, vi, afterEach } from 'vitest'
import React from 'react'
import {
  cn,
  formatMessageTime,
  formatRelativeTime,
  formatFileSize,
  getInitials,
  getStreamColor,
  getStreamBg,
  getSubjectIcon,
  calculateAccuracy,
  CHANNEL_ICONS,
} from '@/lib/utils'

afterEach(() => {
  vi.useRealTimers()
})

describe('cn', () => {
  it('joins class names and drops falsy values', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c')
  })

  it('lets later tailwind classes win over conflicting earlier ones', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})

describe('formatMessageTime', () => {
  it('shows only the time for today', () => {
    vi.setSystemTime(new Date('2024-05-10T12:00:00Z'))
    expect(formatMessageTime('2024-05-10T09:05:00Z')).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/)
  })

  it('prefixes yesterday with "Yesterday"', () => {
    vi.setSystemTime(new Date('2024-05-10T12:00:00Z'))
    expect(formatMessageTime('2024-05-09T09:05:00Z')).toMatch(/^Yesterday \d{1,2}:\d{2} (AM|PM)$/)
  })

  it('includes the date for older messages', () => {
    vi.setSystemTime(new Date('2024-05-10T12:00:00Z'))
    expect(formatMessageTime('2024-03-02T09:05:00Z')).toMatch(/^Mar 2, \d{1,2}:\d{2} (AM|PM)$/)
  })
})

describe('formatRelativeTime', () => {
  it('adds a suffix relative to now', () => {
    vi.setSystemTime(new Date('2024-05-10T12:00:00Z'))
    expect(formatRelativeTime('2024-05-10T11:00:00Z')).toBe('about 1 hour ago')
  })

  it('describes future dates', () => {
    vi.setSystemTime(new Date('2024-05-10T12:00:00Z'))
    expect(formatRelativeTime('2024-05-10T14:00:00Z')).toBe('in about 2 hours')
  })
})

describe('formatFileSize', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1023, '1023 B'],
    [1024, '1.0 KB'],
    [1536, '1.5 KB'],
    [1024 * 1024 - 1, '1024.0 KB'],
    [1024 * 1024, '1.0 MB'],
    [5 * 1024 * 1024 + 512 * 1024, '5.5 MB'],
  ])('formats %i bytes as %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected)
  })
})

describe('getInitials', () => {
  it('returns "?" for an empty name', () => {
    expect(getInitials('')).toBe('?')
  })

  it('uses the first letter of each word, uppercased', () => {
    expect(getInitials('rohan sharma')).toBe('RS')
  })

  it('caps the result at two characters', () => {
    expect(getInitials('Jean Luc Picard')).toBe('JL')
  })

  it('handles a single word', () => {
    expect(getInitials('Rohan')).toBe('R')
  })
})

describe('stream styling helpers', () => {
  it('uses indigo for JEE and green otherwise', () => {
    expect(getStreamColor('JEE')).toBe('text-indigo-400')
    expect(getStreamColor('NEET')).toBe('text-green-400')
    expect(getStreamBg('JEE')).toContain('indigo')
    expect(getStreamBg('NEET')).toContain('green')
  })
})

describe('getSubjectIcon', () => {
  it.each(['Physics', 'Chemistry', 'Mathematics', 'Biology'])(
    'returns a distinct icon for %s',
    subject => {
      const icon = getSubjectIcon(subject) as React.ReactElement
      expect(React.isValidElement(icon)).toBe(true)
    }
  )

  it('returns different icons for different subjects', () => {
    const physics = getSubjectIcon('Physics') as React.ReactElement
    const biology = getSubjectIcon('Biology') as React.ReactElement
    expect(physics.type).not.toBe(biology.type)
  })

  it('falls back to a generic icon for unknown subjects', () => {
    const fallback = getSubjectIcon('Astrology') as React.ReactElement
    const known = getSubjectIcon('Physics') as React.ReactElement
    expect(React.isValidElement(fallback)).toBe(true)
    expect(fallback.type).not.toBe(known.type)
    expect(fallback.props.className).toContain('text-slate-400')
  })
})

describe('calculateAccuracy', () => {
  it('returns 0 when nothing was attempted', () => {
    expect(calculateAccuracy(0, 0)).toBe(0)
  })

  it('returns a rounded percentage', () => {
    expect(calculateAccuracy(1, 3)).toBe(33)
    expect(calculateAccuracy(2, 3)).toBe(67)
    expect(calculateAccuracy(5, 10)).toBe(50)
    expect(calculateAccuracy(10, 10)).toBe(100)
  })
})

describe('CHANNEL_ICONS', () => {
  it('provides a React element for every known channel', () => {
    const channels = [
      'general',
      'jee-discussion',
      'neet-discussion',
      'physics',
      'chemistry',
      'mathematics',
      'biology',
      'announcements',
      'doubts',
    ]
    for (const channel of channels) {
      expect(React.isValidElement(CHANNEL_ICONS[channel])).toBe(true)
    }
  })

  it('has no entry for unknown channels', () => {
    expect(CHANNEL_ICONS['random']).toBeUndefined()
  })
})
