import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/event/EventCard'
import { searchEventsFTS } from '@/lib/search/full-text'
import { embedText } from '@/lib/ai/embeddings'
import type { EventWithRelations } from '@/types/domain'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" 검색결과` : '검색',
    robots: 'noindex',
  }
}

export const dynamic = 'force-dynamic'

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim()

  let events: EventWithRelations[] = []
  let usedFallback = false

  if (query) {
    events = await searchEventsFTS(query)
    if (events.length === 0) {
      try {
        const db = createServerClient()
        const embedding = await embedText(query)
        const { data } = await db.rpc('match_events_by_embedding', {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 20,
        })
        events = (data ?? []) as EventWithRelations[]
        usedFallback = true
      } catch {
        // embedding fallback failed — stay with empty
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <form method="GET" action="/search">
          <div className="flex gap-2">
            <input
              name="q"
              defaultValue={query}
              placeholder="이벤트, 브랜드, 카테고리 검색..."
              autoFocus
              className="flex-1 px-4 py-2 rounded-lg border text-sm outline-none focus:ring-2"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
            >
              검색
            </button>
          </div>
        </form>
      </div>

      {query && (
        <p className="text-sm mb-4" style={{ color: 'var(--muted-fg)' }}>
          &quot;{query}&quot; 검색결과 {events.length}건
          {usedFallback && ' (의미 검색 사용)'}
        </p>
      )}

      {events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(ev => <EventCard key={ev.id} event={ev} />)}
        </div>
      ) : query ? (
        <div className="text-center py-16" style={{ color: 'var(--muted-fg)' }}>
          <p className="text-sm">검색 결과가 없습니다.</p>
          <p className="text-xs mt-1">다른 키워드로 시도해보세요.</p>
        </div>
      ) : null}
    </div>
  )
}
