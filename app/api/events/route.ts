import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { SortOption } from '@/types/domain'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const categorySlug = searchParams.get('category')
  const subcategorySlug = searchParams.get('subcategory')
  const tagSlug = searchParams.get('tag')
  const sort = (searchParams.get('sort') ?? 'newest') as SortOption
  const includeCompleted = searchParams.get('include_completed') === '1'
  const cursor = searchParams.get('cursor')
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50)

  const db = createServerClient()

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

  // Date filter for active events (when not including completed)
  if (!includeCompleted) {
    const today = new Date().toISOString().split('T')[0]
    query = query.or(`ends_at.is.null,ends_at.gte.${today},is_ongoing.eq.true`)
  }

  // Category filter
  if (categorySlug) {
    const { data: cat } = await db
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  // Subcategory filter
  if (subcategorySlug) {
    const { data: sub } = await db
      .from('categories')
      .select('id')
      .eq('slug', subcategorySlug)
      .single()
    if (sub) query = query.eq('subcategory_id', sub.id)
  }

  // Tag filter
  if (tagSlug) {
    const { data: tag } = await db.from('tags').select('id').eq('slug', tagSlug).single()
    if (tag) {
      const { data: taggedIds } = await db
        .from('event_tags')
        .select('event_id')
        .eq('tag_id', tag.id)
      if (taggedIds) {
        query = query.in('id', taggedIds.map(r => r.event_id))
      }
    }
  }

  // Sort
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

  // Cursor pagination
  if (cursor) {
    query = query.lt('published_at', cursor)
  }

  query = query.limit(limit)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const nextCursor =
    data && data.length === limit
      ? (data[data.length - 1] as { published_at: string | null }).published_at
      : null

  return NextResponse.json({ events: data ?? [], nextCursor })
}
