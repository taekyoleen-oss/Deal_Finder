'use client'

import { useState, useEffect, useCallback } from 'react'
import type { EventWithRelations, FeedFilters } from '@/types/domain'
import { EventCard } from '@/components/event/EventCard'

interface Props {
  initialEvents: EventWithRelations[]
  initialCursor: string | null
  filters: FeedFilters
}

export function EventFeed({ initialEvents, initialCursor, filters }: Props) {
  const [events, setEvents] = useState(initialEvents)
  const [cursor, setCursor] = useState(initialCursor)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(!!initialCursor)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const params = new URLSearchParams()
      if (filters.categorySlug) params.set('category', filters.categorySlug)
      if (filters.subcategorySlug) params.set('subcategory', filters.subcategorySlug)
      if (filters.tagSlug) params.set('tag', filters.tagSlug)
      if (filters.sort) params.set('sort', filters.sort)
      if (filters.includeCompleted) params.set('include_completed', '1')
      if (cursor) params.set('cursor', cursor)

      const res = await fetch(`/api/events?${params}`)
      const data = await res.json()

      setEvents(prev => [...prev, ...data.events])
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, cursor, filters])

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    const sentinel = document.getElementById('feed-sentinel')
    if (sentinel) observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  if (events.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--muted-fg)' }}>
        <p className="text-lg">등록된 이벤트가 없습니다.</p>
        <p className="text-sm mt-2">다른 카테고리를 선택해보세요.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {/* Skeleton placeholders while loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius)] border animate-pulse"
              style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', height: 280 }}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && <div id="feed-sentinel" className="h-4 mt-4" />}

      {!hasMore && events.length > 0 && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-fg)' }}>
          모든 이벤트를 불러왔습니다.
        </p>
      )}
    </>
  )
}
