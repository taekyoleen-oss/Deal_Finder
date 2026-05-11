import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { EventFeed } from '@/components/feed/EventFeed'
import { CategoryNav } from '@/components/feed/CategoryNav'
import type { EventWithRelations, SortOption } from '@/types/domain'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string; sub?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const db = createServerClient()
  const { data } = await db.from('categories').select('name').eq('slug', slug).is('parent_id', null).single()
  if (!data) return { title: '카테고리' }
  return { title: data.name }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const sort = (sp.sort ?? 'newest') as SortOption

  const db = createServerClient()

  const { data: category } = await db
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .is('parent_id', null)
    .single()

  if (!category) notFound()

  const { data: subcategories } = await db
    .from('categories')
    .select('*')
    .eq('parent_id', category.id)
    .eq('is_active', true)
    .order('display_order')

  const { data: allCats } = await db
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('display_order')

  const today = new Date().toISOString().split('T')[0]

  const { data: activeRows } = await db
    .from('events')
    .select('category_id')
    .eq('status', 'published')
    .or(`ends_at.is.null,ends_at.gte.${today},is_ongoing.eq.true`)

  const categoryCounts = new Map<string, number>()
  for (const row of (activeRows ?? []) as { category_id: string | null }[]) {
    if (!row.category_id) continue
    categoryCounts.set(row.category_id, (categoryCounts.get(row.category_id) ?? 0) + 1)
  }
  const allCatsWithCount = (allCats ?? []).map(c => ({ ...c, count: categoryCounts.get(c.id) ?? 0 }))

  const { data: regionRows } = await db
    .from('events')
    .select('regions')
    .eq('status', 'published')
    .eq('category_id', category.id)
    .or(`ends_at.is.null,ends_at.gte.${today},is_ongoing.eq.true`)

  const regionSet = new Set<string>()
  for (const row of (regionRows ?? []) as { regions: string[] | null }[]) {
    for (const r of row.regions ?? []) {
      const trimmed = r?.trim()
      if (trimmed) regionSet.add(trimmed)
    }
  }
  const categoryRegions = Array.from(regionSet)

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
    .in('status', ['published'])
    .eq('category_id', category.id)
    .or(`ends_at.is.null,ends_at.gte.${today},is_ongoing.eq.true`)

  if (sp.sub) {
    const { data: sub } = await db.from('categories').select('id').eq('slug', sp.sub).single()
    if (sub) query = query.eq('subcategory_id', sub.id)
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
  query = query.limit(20)

  const { data: events } = await query
  const initialEvents = (events ?? []) as EventWithRelations[]
  const nextCursor = initialEvents.length === 20
    ? (initialEvents[initialEvents.length - 1].published_at ?? null)
    : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <CategoryNav categories={allCatsWithCount} activeCategorySlug={slug} />

      <div className="flex items-center justify-between mt-6 mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">{category.name}</h1>
          {categoryRegions.length > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--muted-fg)' }}>
              지역: {categoryRegions.join(', ')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {(['newest', 'deadline', 'upcoming'] as SortOption[]).map(s => (
            <a
              key={s}
              href={`?sort=${s}${sp.sub ? `&sub=${sp.sub}` : ''}`}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{
                background: sort === s ? 'var(--primary)' : 'var(--muted)',
                color: sort === s ? 'var(--primary-fg)' : 'var(--foreground)',
              }}
            >
              {{ newest: '최신', deadline: '마감임박', upcoming: '예정' }[s]}
            </a>
          ))}
        </div>
      </div>

      {/* Subcategory filter */}
      {(subcategories ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <a
            href={`/category/${slug}?sort=${sort}`}
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: !sp.sub ? 'var(--primary)' : 'var(--muted)',
              color: !sp.sub ? 'var(--primary-fg)' : 'var(--foreground)',
            }}
          >
            전체
          </a>
          {(subcategories ?? []).map(sub => (
            <a
              key={sub.id}
              href={`/category/${slug}?sort=${sort}&sub=${sub.slug}`}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: sp.sub === sub.slug ? 'var(--primary)' : 'var(--muted)',
                color: sp.sub === sub.slug ? 'var(--primary-fg)' : 'var(--foreground)',
              }}
            >
              {sub.name}
            </a>
          ))}
        </div>
      )}

      <EventFeed
        initialEvents={initialEvents}
        initialCursor={nextCursor}
        filters={{ sort, categorySlug: slug, subcategorySlug: sp.sub }}
      />
    </div>
  )
}
