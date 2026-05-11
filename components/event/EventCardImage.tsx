'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { CoverImageSource } from '@/types/database'

const CATEGORY_COLORS: Record<string, string> = {
  lodging: '#6366f1', travel: '#0891b2', sports: '#16a34a',
  fashion: '#db2777', beauty: '#e11d48', electronics: '#2563eb',
  food: '#f59e0b', kids: '#f97316', public: '#7c3aed',
  finance: '#0d9488', subscription: '#8b5cf6', culture: '#ec4899',
  education: '#3b82f6', mobility: '#64748b', pet: '#84cc16',
  home: '#a16207', shopping: '#ef4444', health: '#10b981',
}

interface Props {
  src: string | null
  source: CoverImageSource | null
  categorySlug?: string | null
  categoryName?: string | null
  alt: string
  eventId: string
}

export function EventCardImage({ src, source, categorySlug, categoryName, alt, eventId }: Props) {
  const [failed, setFailed] = useState(false)

  const bgColor = CATEGORY_COLORS[categorySlug ?? ''] ?? '#6366f1'

  if (!src || failed) {
    return (
      <div
        className="w-full h-24 flex items-center justify-center text-white text-xs font-medium rounded-t-[var(--radius)]"
        style={{ backgroundColor: bgColor }}
        aria-hidden
      >
        {categoryName ?? '이벤트'}
      </div>
    )
  }

  return (
    <div className="relative w-full h-24 overflow-hidden rounded-t-[var(--radius)]">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        placeholder="blur"
        blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
