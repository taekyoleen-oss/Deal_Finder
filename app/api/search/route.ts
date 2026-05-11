import { NextRequest, NextResponse } from 'next/server'
import { searchEventsFTS } from '@/lib/search/full-text'
import { embedText } from '@/lib/ai/embeddings'
import { createServerClient } from '@/lib/supabase/server'
import type { EventWithRelations } from '@/types/domain'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ events: [], usedFallback: false })

  // Try FTS first
  let events: EventWithRelations[] = await searchEventsFTS(q)
  let usedFallback = false

  if (events.length === 0) {
    // Embedding fallback
    try {
      const embedding = await embedText(q)
      const db = createServerClient()

      const { data } = await db.rpc('match_events_by_embedding', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 20,
      })
      events = (data ?? []) as EventWithRelations[]
      usedFallback = true
    } catch {
      // Fallback also failed — return empty
    }
  }

  return NextResponse.json({ events, usedFallback })
}
