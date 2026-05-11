import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchAndCacheOgImage } from '@/lib/og-image/fetcher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient()

  // Find events with og_extracted images not checked in 30 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  const { data: events } = await db
    .from('events')
    .select('id, cover_image_url, cover_image_source')
    .eq('status', 'published')
    .eq('cover_image_source', 'og_extracted')
    .or(`cover_image_checked_at.is.null,cover_image_checked_at.lt.${cutoff.toISOString()}`)
    .limit(100)

  let refreshed = 0
  let failed = 0

  for (const event of events ?? []) {
    if (!event.cover_image_url) continue

    try {
      // HEAD check — if URL is still valid, just update checked_at
      const res = await fetch(event.cover_image_url, { method: 'HEAD' })
      if (res.ok) {
        await db
          .from('events')
          .update({ cover_image_checked_at: new Date().toISOString() })
          .eq('id', event.id)
        refreshed++
      } else {
        // Image gone — clear it
        await db
          .from('events')
          .update({
            cover_image_url: null,
            cover_image_source: 'category_fallback',
            cover_image_checked_at: new Date().toISOString(),
          })
          .eq('id', event.id)
        failed++
      }
    } catch {
      failed++
    }
  }

  return NextResponse.json({ refreshed, failed, total: events?.length ?? 0 })
}
