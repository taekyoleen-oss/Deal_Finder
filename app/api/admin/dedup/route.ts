import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkDuplicate } from '@/lib/pipeline/dedup-sweep'
import { embedText, buildEmbeddingInput } from '@/lib/ai/embeddings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

type EventRow = {
  id: string
  title: string
  brand_raw: string | null
  starts_at: string | null
  ends_at: string | null
  is_ongoing: boolean
  regions: string[] | null
  category_id: string | null
  created_at: string
  category: { name: string } | null
  subcategory: { name: string } | null
}

type MergedPair = {
  kept: string
  keptTitle: string
  rejected: string
  rejectedTitle: string
  reason: string
}

export async function POST(req: NextRequest) {
  const adminToken = req.cookies.get('admin_token')?.value
  if (!adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const dryRun = (body as { dryRun?: boolean })?.dryRun !== false  // default true

  const db = createAdminClient()

  // 1. Fetch all published/pending events, oldest first
  const { data: rawEvents, error: evErr } = await db
    .from('events')
    .select(`
      id, title, brand_raw, starts_at, ends_at, is_ongoing, regions,
      category_id, created_at,
      category:categories!category_id(name),
      subcategory:categories!subcategory_id(name)
    `)
    .in('status', ['published', 'pending'])
    .order('created_at', { ascending: true })

  if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 })
  const events = (rawEvents ?? []) as unknown as EventRow[]

  if (events.length === 0) {
    return NextResponse.json({ ok: true, events: 0, checkedPairs: 0, merged: 0, pairs: [] })
  }

  // 2. Load existing embeddings
  const { data: existingEmbs } = await db
    .from('event_embeddings')
    .select('event_id, embedding')
    .in('event_id', events.map(e => e.id))

  const embeddingMap = new Map<string, number[]>()
  for (const row of existingEmbs ?? []) {
    if (row.embedding && !embeddingMap.has(row.event_id)) {
      embeddingMap.set(row.event_id, row.embedding as number[])
    }
  }

  // 3. Generate embeddings for events that lack one
  const missingEvents = events.filter(e => !embeddingMap.has(e.id))
  for (const event of missingEvents) {
    try {
      const inputText = buildEmbeddingInput({
        brand_raw: event.brand_raw,
        category: event.category,
        subcategory: event.subcategory,
        tags: [],
        title: event.title,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        regions: event.regions ?? [],
      })
      const embedding = await embedText(inputText)
      embeddingMap.set(event.id, embedding)
      if (!dryRun) {
        await db.from('event_embeddings').insert({
          event_id: event.id,
          embedding,
          input_text: inputText,
          model: 'text-embedding-3-small',
        })
      }
    } catch {
      // Skip if embedding generation fails — just won't be compared
    }
  }

  // 4. Group by category, then pairwise compare within each group
  const byCategory = new Map<string, EventRow[]>()
  for (const event of events) {
    const key = event.category_id ?? '__none__'
    if (!byCategory.has(key)) byCategory.set(key, [])
    byCategory.get(key)!.push(event)
  }

  const mergedPairs: MergedPair[] = []
  const rejectedIds = new Set<string>()
  let checkedPairs = 0

  for (const [, group] of byCategory) {
    for (let i = 0; i < group.length; i++) {
      if (rejectedIds.has(group[i].id)) continue
      const embA = embeddingMap.get(group[i].id)
      if (!embA) continue

      for (let j = i + 1; j < group.length; j++) {
        if (rejectedIds.has(group[j].id)) continue
        const embB = embeddingMap.get(group[j].id)
        if (!embB) continue

        checkedPairs++

        const dupResult = await checkDuplicate({
          embeddingA: embA,
          embeddingB: embB,
          eventA: group[i],
          eventB: group[j],
        })

        if (dupResult.result === 'same') {
          // group[i] is always older (list sorted by created_at asc, i < j)
          if (!dryRun) {
            // Move all sources from newer → older event
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await db
              .from('event_sources')
              .update({ event_id: group[i].id } as any)
              .eq('event_id', group[j].id)

            // Mark newer event as rejected
            await db
              .from('events')
              .update({ status: 'rejected' })
              .eq('id', group[j].id)
          }

          rejectedIds.add(group[j].id)
          mergedPairs.push({
            kept: group[i].id,
            keptTitle: group[i].title,
            rejected: group[j].id,
            rejectedTitle: group[j].title,
            reason: dupResult.reason,
          })
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    events: events.length,
    checkedPairs,
    merged: mergedPairs.length,
    pairs: mergedPairs,
  })
}
