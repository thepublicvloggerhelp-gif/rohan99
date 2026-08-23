'use client'

import Image from 'next/image'
import React from 'react'
import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  url?: string | null
  name: string
  size: number
  containerClassName: string
  containerStyle?: React.CSSProperties
  imageClassName?: string
  imageElement?: 'next' | 'img'
  alt?: string
  fallback?: React.ReactNode
  wrapperClassName?: string
  statusDot?: React.ReactNode
}

export function Avatar({
  url,
  name,
  size,
  containerClassName,
  containerStyle,
  imageClassName = 'object-cover',
  imageElement = 'next',
  alt = '',
  fallback,
  wrapperClassName,
  statusDot,
}: AvatarProps) {
  const avatar = (
      <div className={containerClassName} style={containerStyle}>
      {url ? (
        imageElement === 'img' ? (
          <img src={url} alt={alt} className={imageClassName} />
        ) : (
          <Image src={url} alt={alt} width={size} height={size} className={imageClassName} />
        )
      ) : (
        fallback ?? getInitials(name)
      )}
    </div>
  )

  if (!wrapperClassName && !statusDot) return avatar

  return (
    <div className={cn(wrapperClassName)}>
      {avatar}
      {statusDot}
    </div>
  )
}
