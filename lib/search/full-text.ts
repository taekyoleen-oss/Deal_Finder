import { createServerClient } from '@/lib/supabase/server'
import type { EventWithRelations } from '@/types/domain'

export async function searchEventsFTS(query: string, limit = 20): Promise<EventWithRelations[]> {
  const db = createServerClient()

  // Postgres FTS with Korean simple dictionary
  const { data, error } = await db
    .from('events')
    .select(`
      *,
      category:categories!category_id(*),
      subcategory:categories!subcategory_id(*),
      brand:brands(*)
    `)
    .eq('status', 'published')
    .textSearch('fts_doc', query, { type: 'plain', config: 'simple' })
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as EventWithRelations[]
}

// Fallback for 0 results — returns empty array, caller should use embedding search
export async function searchEventsFTSWithFallback(
  query: string,
  embeddingFallback: () => Promise<EventWithRelations[]>
): Promise<{ results: EventWithRelations[]; usedFallback: boolean }> {
  const results = await searchEventsFTS(query)
  if (results.length > 0) return { results, usedFallback: false }

  const fallback = await embeddingFallback()
  return { results: fallback, usedFallback: true }
}
