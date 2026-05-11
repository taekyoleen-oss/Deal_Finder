import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient()

  // Find is_ongoing=true events published more than 90 days ago
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)

  const { data, error } = await db
    .from('events')
    .select('id, title, published_at')
    .eq('status', 'published')
    .eq('is_ongoing', true)
    .lt('published_at', cutoff.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // These are surfaced in the admin dashboard "재검토 대기" section
  // We don't change status — admin must manually confirm/update
  return NextResponse.json({
    review_queue: data ?? [],
    count: data?.length ?? 0,
    cutoff_date: cutoff.toISOString().split('T')[0],
  })
}
