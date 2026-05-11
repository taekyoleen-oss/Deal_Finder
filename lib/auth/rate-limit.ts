import { createAdminClient } from '@/lib/supabase/admin'

const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 10

export async function checkLoginRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const db = createAdminClient()
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

  const { count } = await db
    .from('admin_login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('success', false)
    .gte('attempted_at', windowStart)

  const attempts = count ?? 0
  const remaining = Math.max(0, MAX_ATTEMPTS - attempts)
  return { allowed: remaining > 0, remaining }
}

export async function recordLoginAttempt(ip: string, success: boolean): Promise<void> {
  const db = createAdminClient()
  await db.from('admin_login_attempts').insert({ ip, success })
}

export async function cleanOldAttempts(): Promise<void> {
  const db = createAdminClient()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  await db.from('admin_login_attempts').delete().lt('attempted_at', cutoff)
}
