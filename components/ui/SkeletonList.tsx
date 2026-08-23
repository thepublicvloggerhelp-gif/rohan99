import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonListProps {
  count: number
  itemClassName: string
  wrapperClassName?: string
  itemStyle?: (index: number) => React.CSSProperties
  itemContent?: React.ReactNode | ((index: number) => React.ReactNode)
}

export function SkeletonList({
  count,
  itemClassName,
  wrapperClassName,
  itemStyle,
  itemContent,
}: SkeletonListProps) {
  const items = Array.from({ length: count }, (_, i) => (
    <div key={i} className={itemClassName} style={itemStyle?.(i)}>
      {typeof itemContent === 'function' ? itemContent(i) : itemContent}
    </div>
  ))

  return wrapperClassName ? <div className={cn(wrapperClassName)}>{items}</div> : <>{items}</>
}
