import { createAdminClient } from '@/lib/supabase/admin'
import type { EventWithRelations } from '@/types/domain'

const MIN_SIMILARITY = 0.6
const MIN_SUBCATEGORY_COUNT = 6

export async function getRelatedEvents(
  eventId: string,
  categoryId: string | null,
  subcategoryId: string | null,
  limit = 4
): Promise<EventWithRelations[]> {
  const db = createAdminClient()

  // Get embedding for the target event
  const { data: embRow } = await db
    .from('event_embeddings')
    .select('embedding')
    .eq('event_id', eventId)
    .single()

  if (!embRow?.embedding) {
    // Fallback: same subcategory
    return getRelatedByCategory(db, eventId, subcategoryId, categoryId, limit)
  }

  // First try: embedding similarity ≥ 0.6 + same subcategory
  const { data: related } = await db.rpc('match_related_events', {
    target_event_id: eventId,
    query_embedding: embRow.embedding,
    match_threshold: MIN_SIMILARITY,
    match_count: limit,
    filter_subcategory_id: subcategoryId,
  })

  if (related && related.length >= 2) return related as EventWithRelations[]

  // If subcategory has < 6 results, expand to category
  return getRelatedByCategory(db, eventId, subcategoryId, categoryId, limit)
}

async function getRelatedByCategory(
  db: ReturnType<typeof createAdminClient>,
  eventId: string,
  subcategoryId: string | null,
  categoryId: string | null,
  limit: number
): Promise<EventWithRelations[]> {
  let query = db
    .from('events')
    .select('*, category:categories!category_id(*), brand:brands(*)')
    .eq('status', 'published')
    .neq('id', eventId)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (subcategoryId) {
    // Check count first
    const { count } = await db
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('subcategory_id', subcategoryId)
      .neq('id', eventId)

    if ((count ?? 0) >= MIN_SUBCATEGORY_COUNT) {
      query = query.eq('subcategory_id', subcategoryId)
    } else if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
  } else if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data } = await query
  return (data ?? []) as EventWithRelations[]
}
