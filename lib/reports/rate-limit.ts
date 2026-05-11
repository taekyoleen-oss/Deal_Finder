import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_REPORTS_PER_DAY = 5

export function hashIp(ip: string): string {
  const salt = process.env.REPORT_HASH_SALT ?? 'default-salt'
  return createHash('sha256').update(ip + salt).digest('hex')
}

export async function checkReportRateLimit(ipHash: string): Promise<boolean> {
  const db = createAdminClient()
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count } = await db
    .from('event_reports')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', dayAgo)

  return (count ?? 0) < MAX_REPORTS_PER_DAY
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    '0.0.0.0'
  )
}
