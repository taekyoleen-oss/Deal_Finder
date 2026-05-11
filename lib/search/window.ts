import { createAdminClient } from '@/lib/supabase/admin'
import { toKSTDateString } from '@/lib/utils/date'

const MAX_LOOKBACK_DAYS = 14

export interface SearchWindow {
  start: string  // YYYY-MM-DD
  end: string    // YYYY-MM-DD
}

export async function calculateSearchWindow(): Promise<SearchWindow> {
  const db = createAdminClient()
  const today = toKSTDateString()

  const { data: lastRun } = await db
    .from('search_runs')
    .select('window_end')
    .eq('status', 'finished')
    .order('window_end', { ascending: false })
    .limit(1)
    .single()

  let start: string
  if (lastRun?.window_end) {
    // Start day after last window end
    const next = new Date(lastRun.window_end)
    next.setDate(next.getDate() + 1)
    start = next.toISOString().split('T')[0]
  } else {
    // First run or gap > 14 days — look back 14 days
    const lookback = new Date(today)
    lookback.setDate(lookback.getDate() - MAX_LOOKBACK_DAYS)
    start = lookback.toISOString().split('T')[0]
  }

  // Clamp: don't go further back than MAX_LOOKBACK_DAYS
  const minStart = new Date(today)
  minStart.setDate(minStart.getDate() - MAX_LOOKBACK_DAYS)
  if (new Date(start) < minStart) {
    start = minStart.toISOString().split('T')[0]
  }

  return { start, end: today }
}
