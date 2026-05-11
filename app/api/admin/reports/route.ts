import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashIp, checkReportRateLimit, getClientIp } from '@/lib/reports/rate-limit'
import { createHash } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/admin/reports — submit a report (public endpoint, rate-limited)
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const ipHash = hashIp(ip)

  const allowed = await checkReportRateLimit(ipHash)
  if (!allowed) {
    return NextResponse.json(
      { error: '일일 제보 한도(5건)를 초과했습니다.' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body?.event_id || !body?.reason_type) {
    return NextResponse.json({ error: '필수 항목이 누락됐습니다.' }, { status: 400 })
  }

  const validReasons = ['ended', 'promotional', 'wrong_period', 'wrong_category', 'other']
  if (!validReasons.includes(body.reason_type)) {
    return NextResponse.json({ error: '유효하지 않은 신고 유형입니다.' }, { status: 400 })
  }

  const message = typeof body.message === 'string'
    ? body.message.slice(0, 200)
    : null

  const userAgent = req.headers.get('user-agent') ?? ''
  const userAgentHash = createHash('sha256').update(userAgent).digest('hex').slice(0, 16)

  const db = createAdminClient()
  const { error } = await db.from('event_reports').insert({
    event_id: body.event_id,
    reason_type: body.reason_type,
    message,
    ip_hash: ipHash,
    user_agent_hash: userAgentHash,
  })

  if (error) return NextResponse.json({ error: '제보 저장에 실패했습니다.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// GET /api/admin/reports — admin queue (protected by middleware)
export async function GET(req: NextRequest) {
  const db = createAdminClient()
  const reviewed = req.nextUrl.searchParams.get('reviewed') === 'true'
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 50), 100)

  const { data, error } = await db
    .from('event_reports')
    .select('*, event:events(id, title)')
    .eq('reviewed', reviewed)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reports: data ?? [] })
}

// PATCH /api/admin/reports — mark as reviewed (protected by middleware)
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const db = createAdminClient()
  const { error } = await db
    .from('event_reports')
    .update({ reviewed: true, reviewed_at: new Date().toISOString() })
    .eq('id', body.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
