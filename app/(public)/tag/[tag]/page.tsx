import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/event/EventCard'
import type { EventWithRelations } from '@/types/domain'

interface Props {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  return { title: `#${tag}` }
}

export default async function TagPage({ params }: Props) {
  const { tag: tagSlug } = await params
  const db = createServerClient()

  const { data: tag } = await db.from('tags').select('*').eq('slug', tagSlug).single()
  if (!tag) notFound()

  const today = new Date().toISOString().split('T')[0]

  const { data: taggedEvents } = await db
    .from('event_tags')
    .select(`
      event:events(
        *,
        category:categories!category_id(id, slug, name),
        brand:brands(id, name),
        sources:event_sources(id, source_name, source_url, media_tier)
      )
    `)
    .eq('tag_id', tag.id)

  const events: EventWithRelations[] = ((taggedEvents ?? [])
    .map(row => {
      const ev = row.event as EventWithRelations | null
      return ev
    })
    .filter((ev): ev is EventWithRelations =>
      ev !== null &&
      ev.status === 'published' &&
      (ev.is_ongoing || !ev.ends_at || ev.ends_at >= today)
    )
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">#{tag.name}</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted-fg)' }}>
        {events.length}개 이벤트
      </p>

      {events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(ev => <EventCard key={ev.id} event={ev} />)}
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
          현재 진행 중인 이벤트가 없습니다.
        </p>
      )}
    </div>
  )
}
