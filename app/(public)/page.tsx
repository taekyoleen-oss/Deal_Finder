import { createServerClient } from '@/lib/supabase/server'
import { CategoryNav } from '@/components/feed/CategoryNav'
import { EventFeed } from '@/components/feed/EventFeed'
import type { EventWithRelations, SortOption } from '@/types/domain'
import type { Category } from '@/types/domain'

interface SearchParams {
  sort?: string
  include_completed?: string
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const sort = (sp.sort ?? 'newest') as SortOption
  const includeCompleted = sp.include_completed === '1'

  const today = new Date().toISOString().split('T')[0]

  let allCats: Category[] = []
  let initialEvents: EventWithRelations[] = []

  try {
    const db = createServerClient()

    const { data: cats } = await db
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('display_order')
    allCats = (cats ?? []) as Category[]

    let query = db
      .from('events')
      .select(`
        *,
        category:categories!category_id(id, slug, name),
        subcategory:categories!subcategory_id(id, slug, name),
        brand:brands(id, name),
        tags:event_tags(tag:tags(id, slug, name)),
        sources:event_sources(id, source_name, source_url, media_tier)
      `)
      .in('status', includeCompleted ? ['published', 'completed'] : ['published'])

    if (!includeCompleted) {
      query = query.or(`ends_at.is.null,ends_at.gte.${today},is_ongoing.eq.true`)
    }

    switch (sort) {
      case 'deadline':
        query = query.order('ends_at', { ascending: true, nullsFirst: false })
        break
      case 'upcoming':
        query = query.order('starts_at', { ascending: true, nullsFirst: false })
        break
      default:
        query = query.order('published_at', { ascending: false })
    }

    const { data: events } = await query.limit(20)
    initialEvents = (events ?? []) as EventWithRelations[]
  } catch {
    // Supabase not configured or unreachable — show empty state
  }

  const nextCursor =
    initialEvents.length === 20
      ? (initialEvents[initialEvents.length - 1].published_at ?? null)
      : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <section className="mb-6">
        <CategoryNav categories={allCats} activeCategorySlug={undefined} />
      </section>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2">
          {(['newest', 'deadline', 'upcoming'] as SortOption[]).map(s => (
            <a
              key={s}
              href={`?sort=${s}${includeCompleted ? '&include_completed=1' : ''}`}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                background: sort === s ? 'var(--primary)' : 'var(--muted)',
                color: sort === s ? 'var(--primary-fg)' : 'var(--foreground)',
              }}
            >
              {{ newest: '최신', deadline: '마감임박', upcoming: '예정' }[s]}
            </a>
          ))}
        </div>
        <a
          href={`?sort=${sort}${includeCompleted ? '' : '&include_completed=1'}`}
          className="text-sm flex items-center gap-1.5"
          style={{ color: 'var(--muted-fg)' }}
        >
          <span
            className="w-4 h-4 rounded border flex items-center justify-center"
            style={{ borderColor: 'var(--border)', background: includeCompleted ? 'var(--accent)' : 'transparent' }}
          >
            {includeCompleted && <span className="text-white text-xs">✓</span>}
          </span>
          완료된 행사 포함
        </a>
      </div>

      <EventFeed
        initialEvents={initialEvents}
        initialCursor={nextCursor}
        filters={{ sort, includeCompleted }}
      />
    </div>
  )
}
