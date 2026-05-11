import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword, createSessionCookie } from '@/lib/auth/admin-session'
import { checkLoginRateLimit, recordLoginAttempt } from '@/lib/auth/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? '0.0.0.0'

  // Rate limit check
  const { allowed, remaining } = await checkLoginRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: '로그인 시도 횟수를 초과했습니다. 10분 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const password = body?.password as string | undefined

  if (!password) {
    return NextResponse.json({ error: '비밀번호를 입력해주세요.' }, { status: 400 })
  }

  const valid = await verifyAdminPassword(password)
  await recordLoginAttempt(ip, valid)

  if (!valid) {
    return NextResponse.json(
      { error: `비밀번호가 올바르지 않습니다. (남은 시도: ${remaining - 1}회)` },
      { status: 401 }
    )
  }

  // Audit log
  const db = createAdminClient()
  await db.from('admin_audit_log').insert({ action: 'login', ip })

  const { cookieValue } = await createSessionCookie()

  return NextResponse.json(
    { ok: true },
    {
      headers: { 'Set-Cookie': cookieValue },
    }
  )
}
