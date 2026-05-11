import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const db = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Event status distribution
  const { data: statusCounts } = await db
    .from('events')
    .select('status')

  const counts = { pending: 0, published: 0, completed: 0, rejected: 0 }
  for (const row of statusCounts ?? []) {
    counts[row.status as keyof typeof counts]++
  }

  // Pending reports
  const { count: pendingReports } = await db
    .from('event_reports')
    .select('*', { count: 'exact', head: true })
    .eq('reviewed', false)

  // Recent search run
  const { data: lastRun } = await db
    .from('search_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  // is_ongoing review queue
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const { count: ongoingReview } = await db
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('is_ongoing', true)
    .lt('published_at', cutoff.toISOString())

  // Failed login attempts (24h)
  const dayAgo = new Date(Date.now() - 86400000).toISOString()
  const { count: failedLogins } = await db
    .from('admin_login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('success', false)
    .gte('attempted_at', dayAgo)

  const stats = [
    { label: '대기 중', value: counts.pending, href: '/admin/queue', color: 'var(--warning)' },
    { label: '게시됨', value: counts.published, href: '/admin/events', color: 'var(--success)' },
    { label: '완료됨', value: counts.completed, href: '/admin/events?status=completed', color: 'var(--muted-fg)' },
    { label: '반려됨', value: counts.rejected, href: '/admin/events?status=rejected', color: 'var(--destructive)' },
    { label: '미처리 제보', value: pendingReports ?? 0, href: '/admin/reports', color: 'var(--accent)' },
    { label: 'is_ongoing 재검토', value: ongoingReview ?? 0, href: '/admin/events?ongoing_review=1', color: 'var(--warning)' },
    { label: '로그인 실패(24h)', value: failedLogins ?? 0, href: '#', color: 'var(--destructive)' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <LogoutButton />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-[var(--radius)] border p-4 hover:shadow transition-shadow"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="text-2xl font-bold" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted-fg)' }}>
              {s.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Last sweep */}
      {lastRun && (
        <div
          className="rounded-[var(--radius)] border p-4 mb-6"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <h2 className="font-semibold mb-2">최근 Sweep</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            {[
              ['상태', lastRun.status],
              ['윈도우', `${lastRun.window_start} ~ ${lastRun.window_end}`],
              ['기사 수', lastRun.articles_count],
              ['이벤트 수', lastRun.events_count],
              ['AI 비용', `$${Number(lastRun.ai_cost_usd).toFixed(4)}`],
              ['시작', new Date(lastRun.started_at).toLocaleString('ko-KR')],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <dt className="text-xs" style={{ color: 'var(--muted-fg)' }}>{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: '/admin/queue', label: '검토 큐' },
          { href: '/admin/events', label: '이벤트 목록' },
          { href: '/admin/sources', label: '수집 소스·키워드' },
          { href: '/admin/categories', label: '카테고리 편집' },
          { href: '/admin/runs', label: 'Sweep 실행' },
          { href: '/admin/reports', label: '사용자 제보' },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="py-3 text-center rounded-lg border text-sm font-medium hover:shadow transition-shadow"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function LogoutButton() {
  return (
    <form action="/api/admin/logout" method="POST">
      <button
        type="submit"
        className="px-4 py-2 rounded-lg text-sm border"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-fg)' }}
      >
        로그아웃
      </button>
    </form>
  )
}
