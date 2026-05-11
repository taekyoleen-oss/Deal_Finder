import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { toKSTDateString } from '@/lib/utils/date'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Verify Vercel Cron secret
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient()
  const today = toKSTDateString()

  const { data, error } = await db
    .from('events')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('status', 'published')
    .eq('is_ongoing', false)
    .lt('ends_at', today)
    .select('id')

  if (error) {
    console.error('[expire cron]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ completed: data?.length ?? 0, date: today })
}
