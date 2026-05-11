'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { EventWithRelations } from '@/types/domain'
import { EventCardImage } from './EventCardImage'
import { StatusBadge } from './StatusBadge'
import { DateRangeText } from './DateRangeText'
import { isViewed, markAsViewed } from '@/lib/client/viewed-storage'

interface Props {
  event: EventWithRelations
}

export function EventCard({ event }: Props) {
  const [viewed, setViewed] = useState(false)

  useEffect(() => {
    setViewed(isViewed(event.id))
  }, [event.id])

  function handleClick() {
    markAsViewed(event.id)
    setViewed(true)
  }

  const category = event.category
  const tags = event.tags ?? []

  return (
    <article
      className="relative rounded-[var(--radius)] border overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        opacity: viewed ? 0.85 : 1,
      }}
    >
      {/* Viewed indicator */}
      {viewed && (
        <div
          className="absolute top-2 right-2 z-10 rounded-full p-0.5"
          style={{ backgroundColor: 'var(--success)', color: 'white' }}
          title="이미 본 이벤트"
        >
          <Check size={10} />
        </div>
      )}

      <EventCardImage
        src={event.cover_image_url}
        source={event.cover_image_source}
        categorySlug={category?.slug}
        categoryName={category?.name}
        alt={event.title}
        eventId={event.id}
      />

      <div className="p-4">
        {/* Category + Status */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {category && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--muted)', color: 'var(--muted-fg)' }}
            >
              {category.name}
            </span>
          )}
          {tags.slice(0, 2).map((t) =>
            t.tag ? (
              <span
                key={t.tag.id}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--muted)', color: 'var(--accent)' }}
              >
                #{t.tag.name}
              </span>
            ) : null
          )}
          <StatusBadge event={event} />
        </div>

        {/* Title */}
        <Link
          href={`/event/${event.id}`}
          onClick={handleClick}
          className="block font-semibold text-base leading-snug mb-2 hover:underline line-clamp-2"
          style={{ color: 'var(--foreground)' }}
        >
          {event.title}
        </Link>

        {/* Date */}
        <DateRangeText
          startsAt={event.starts_at}
          endsAt={event.ends_at}
          isOngoing={event.is_ongoing}
          className="block mb-2"
        />

        {/* Summary */}
        {event.summary && (
          <p
            className="text-sm line-clamp-2 mb-3"
            style={{ color: 'var(--muted-fg)' }}
          >
            {event.summary}
          </p>
        )}

        {/* Key points */}
        {event.key_points && event.key_points.length > 0 && (
          <ul className="space-y-1 mb-3">
            {event.key_points.slice(0, 3).map((point, i) => (
              <li
                key={i}
                className="text-sm flex gap-1.5"
                style={{ color: 'var(--foreground)' }}
              >
                <span style={{ color: 'var(--primary)' }}>•</span>
                <span className="line-clamp-1">{point}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Sources */}
        {event.sources && event.sources.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>
              출처: {event.sources[0].source_name}
              {event.sources.length > 1 && ` 외 ${event.sources.length - 1}곳`}
            </span>
            {event.sources[0].source_url && (
              <a
                href={event.sources[0].source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                원문 →
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
