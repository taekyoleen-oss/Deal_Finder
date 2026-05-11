import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateSearchWindow } from '@/lib/search/window'
import { searchNaverNews, detectMediaTier, stripHtml } from '@/lib/search/naver-news'
import { extractAndFilter } from '@/lib/pipeline/filter'
import { generateCardContent } from '@/lib/pipeline/summarize'
import { validateDates } from '@/lib/pipeline/validate-dates'
import { shouldAutoPublish } from '@/lib/pipeline/publish'
import { checkDuplicate } from '@/lib/pipeline/dedup-sweep'
import { embedText, buildEmbeddingInput } from '@/lib/ai/embeddings'
import { fetchAndCacheOgImage } from '@/lib/og-image/fetcher'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const CRON_SECRET = process.env.CRON_SECRET
// Rough token cost estimates
const HAIKU_COST_PER_1K_TOKENS = 0.00025
const SONNET_COST_PER_1K_TOKENS = 0.003

export async function GET(req: NextRequest) {
  return runSweep(req)
}

export async function POST(req: NextRequest) {
  return runSweep(req)
}

async function runSweep(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const querySecret = req.nextUrl.searchParams.get('secret')
  // admin 패널에서 직접 호출 시 admin_token 쿠키로도 허용
  const adminToken = req.cookies.get('admin_token')?.value
  const isAdminCookie = !!adminToken

  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}` && !isAdminCookie && querySecret !== 'inline') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient()
  const { start, end } = await calculateSearchWindow()

  const { data: runRow, error: runErr } = await db
    .from('search_runs')
    .insert({ window_start: start, window_end: end, status: 'running' })
    .select('id')
    .single()

  if (runErr || !runRow) {
    return NextResponse.json({ error: 'Failed to create run record' }, { status: 500 })
  }

  const runId = runRow.id
  let articlesCount = 0
  let eventsCount = 0
  let aiCostUsd = 0

  try {
    // Fetch keywords from active sources
    const { data: sources } = await db.from('sources').select('*').eq('is_active', true)
    const keywords: string[] = []
    for (const src of sources ?? []) {
      const cfg = src.config as { keywords?: string[] } | null
      if (cfg?.keywords) keywords.push(...cfg.keywords)
    }
    const uniqueKeywords = [...new Set(keywords)]

    // Get brand candidates for AI prompts
    const { data: brands } = await db
      .from('brands')
      .select('id, name, aliases, category_id')
      .limit(100)

    // Get category slug→id mapping
    const { data: categories } = await db
      .from('categories')
      .select('id, slug, name, parent_id')
      .eq('is_active', true)

    const catBySlug = new Map((categories ?? []).map(c => [c.slug, c]))

    // Fetch articles from Naver
    const seenUrls = new Set<string>()
    const articles = []
    for (const kw of uniqueKeywords.slice(0, 20)) {
      try {
        const items = await searchNaverNews({
          query: kw,
          dateFrom: start.replace(/-/g, ''),
          dateTo: end.replace(/-/g, ''),
          display: 20,
        })
        for (const item of items) {
          if (!seenUrls.has(item.originallink)) {
            seenUrls.add(item.originallink)
            articles.push(item)
          }
        }
      } catch (err) {
        console.error(`Naver search failed for keyword "${kw}":`, err)
      }
    }
    articlesCount = articles.length

    for (const article of articles) {
      try {
        const title = stripHtml(article.title)
        const body = stripHtml(article.description ?? '')
        const url = article.originallink

        // Determine source name from URL
        const hostname = new URL(url).hostname.replace(/^www\./, '')
        const mediaTier = detectMediaTier(hostname)

        // Store raw article
        const { data: rawRow } = await db
          .from('raw_articles')
          .upsert({
            original_url: url,
            title,
            body_excerpt: body.slice(0, 500),
            original_published_at: new Date(article.pubDate).toISOString(),
            search_run_id: runId,
            processing_status: 'pending',
          }, { onConflict: 'original_url' })
          .select('id')
          .single()

        if (!rawRow) continue

        // 1. Extract & filter (Haiku)
        const extracted = await extractAndFilter({
          title,
          body,
          url,
          sourceName: hostname,
          mediaTier,
          brandCandidates: (brands ?? []).map(b => ({ id: b.id, name: b.name, aliases: b.aliases })),
        })
        aiCostUsd += 800 / 1000 * HAIKU_COST_PER_1K_TOKENS // ~800 input tokens estimate

        if (!extracted.is_event || extracted.is_promotional_content) {
          await db.from('raw_articles').update({ processing_status: 'filtered_out' }).eq('id', rawRow.id)
          continue
        }

        // 2. Resolve category IDs
        const cat = extracted.category ? catBySlug.get(extracted.category) : null
        const sub = extracted.subcategory ? catBySlug.get(extracted.subcategory) : null
        const categoryId = cat?.id ?? null
        const subcategoryId = sub?.id ?? null

        // 3. Validate dates
        const dateQuality = validateDates(extracted.starts_at, extracted.ends_at)

        // 4. Generate embedding for dedup (comprehensive input for better similarity)
        const inputText = buildEmbeddingInput({
          brand_raw: extracted.brand,
          category: cat ? { name: cat.name } : null,
          subcategory: sub ? { name: sub.name } : null,
          tags: (extracted.tags ?? []).map(slug => ({ slug })),
          title: extracted.title,
          summary: extracted.summary_raw,
          starts_at: extracted.starts_at,
          ends_at: extracted.ends_at,
          regions: extracted.regions ?? [],
        })
        let embedding: number[] | null = null
        try {
          embedding = await embedText(inputText)
        } catch {
          console.warn('Embedding generation failed for article:', url)
        }

        // 5. Dedup check: same-category events first, fallback to recent events
        let existingEventId: string | null = null
        if (embedding) {
          let candidateEventIds: string[] = []

          if (categoryId) {
            const { data: sameCatIds } = await db
              .from('events')
              .select('id')
              .eq('category_id', categoryId)
              .in('status', ['published', 'pending'])
              .limit(100)
            candidateEventIds = (sameCatIds ?? []).map(e => e.id)
          }

          if (candidateEventIds.length === 0) {
            const { data: recentIds } = await db
              .from('events')
              .select('id')
              .in('status', ['published', 'pending'])
              .order('published_at', { ascending: false, nullsFirst: false })
              .limit(50)
            candidateEventIds = (recentIds ?? []).map(e => e.id)
          }

          if (candidateEventIds.length > 0) {
            const { data: rawCandidates } = await db
              .from('event_embeddings')
              .select(`
                event_id,
                embedding,
                event:events!inner(id, title, brand_raw, starts_at, ends_at, is_ongoing, regions)
              `)
              .in('event_id', candidateEventIds)

            type CandRow = { event_id: string; embedding: number[] | null; event: object | null }
            const candidates = (rawCandidates ?? []) as unknown as CandRow[]

            for (const cand of candidates) {
              if (!cand.embedding) continue
              const dupResult = await checkDuplicate({
                embeddingA: embedding,
                embeddingB: cand.embedding,
                eventA: extracted,
                eventB: cand.event ?? {},
              })
              if (dupResult.result === 'same') {
                existingEventId = cand.event_id
                break
              }
            }
          }
        }

        if (existingEventId) {
          await db.from('event_sources').insert({
            event_id: existingEventId,
            raw_article_id: rawRow.id,
            source_url: url,
            source_name: hostname,
            media_tier: mediaTier,
            published_at: new Date(article.pubDate).toISOString(),
          })
          await db.from('raw_articles').update({ processing_status: 'dedup_merged' }).eq('id', rawRow.id)
          continue
        }

        // 6. Summarize (Sonnet)
        const summary = await generateCardContent(extracted)
        aiCostUsd += 2000 / 1000 * SONNET_COST_PER_1K_TOKENS // ~2000 tokens estimate

        // 7. Insert event as pending
        const { data: newEvent } = await db
          .from('events')
          .insert({
            title: summary.title,
            summary: summary.summary,
            key_points: summary.key_points,
            brand_raw: extracted.brand,
            brand_id: extracted.brand_id,
            category_id: categoryId,
            subcategory_id: subcategoryId,
            discount_type: extracted.discount_type,
            discount_value: extracted.discount_value,
            starts_at: extracted.starts_at,
            ends_at: extracted.ends_at,
            is_ongoing: extracted.is_ongoing,
            regions: extracted.regions,
            confidence: extracted.confidence,
            date_quality: dateQuality,
            status: 'pending',
          })
          .select('id')
          .single()

        if (!newEvent) continue

        // Add source
        await db.from('event_sources').insert({
          event_id: newEvent.id,
          raw_article_id: rawRow.id,
          source_url: url,
          source_name: hostname,
          media_tier: mediaTier,
          published_at: new Date(article.pubDate).toISOString(),
        })

        // Store embedding
        if (embedding) {
          await db.from('event_embeddings').insert({
            event_id: newEvent.id,
            embedding,
            input_text: inputText,
            model: 'text-embedding-3-small',
          })
        }

        // 8. Auto-publish check
        const autoPublish = shouldAutoPublish({
          confidence: extracted.confidence,
          sourcesCount: 1,
          mediaTiers: [mediaTier],
          isPromotional: extracted.is_promotional_content,
        })

        if (autoPublish) {
          await db.from('events').update({
            status: 'published',
            auto_published: true,
            published_at: new Date().toISOString(),
          }).eq('id', newEvent.id)

          // Fetch OG image async (don't block)
          try {
            const imageUrl = await fetchAndCacheOgImage(newEvent.id, url)
            if (imageUrl) {
              await db.from('events').update({
                cover_image_url: imageUrl,
                cover_image_source: 'og_extracted',
                cover_image_checked_at: new Date().toISOString(),
              }).eq('id', newEvent.id)
            }
          } catch {
            // OG image fetch failure is non-critical
          }
        }

        await db.from('raw_articles').update({ processing_status: 'processed' }).eq('id', rawRow.id)
        eventsCount++
      } catch (articleErr) {
        console.error('Error processing article:', articleErr)
      }
    }

    await db.from('search_runs').update({
      status: 'finished',
      articles_count: articlesCount,
      events_count: eventsCount,
      ai_cost_usd: aiCostUsd,
      finished_at: new Date().toISOString(),
    }).eq('id', runId)

    return NextResponse.json({ ok: true, articles: articlesCount, events: eventsCount, cost: aiCostUsd })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db.from('search_runs').update({
      status: 'failed',
      error_message: message,
      finished_at: new Date().toISOString(),
    }).eq('id', runId)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
