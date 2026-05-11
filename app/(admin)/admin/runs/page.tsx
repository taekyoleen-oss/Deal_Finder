import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { DedupButton } from '@/components/admin/DedupButton'

export const metadata: Metadata = { title: 'Sweep 실행 이력' }
export const dynamic = 'force-dynamic'

export default async function AdminRunsPage() {
  const db = createAdminClient()

  const { data: runs } = await db
    .from('search_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(30)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Sweep 실행 이력</h1>
        <div className="flex items-center gap-3">
          <TriggerSweepButton />
          <Link href="/admin" className="text-sm" style={{ color: 'var(--muted-fg)' }}>← 대시보드</Link>
        </div>
      </div>

      <DedupButton />

      <h2 className="font-semibold mt-8 mb-3">실행 이력</h2>
      <div className="overflow-x-auto rounded-[var(--radius)] border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--muted)' }}>
            <tr>
              <th className="text-left px-4 py-2 font-medium">시작</th>
              <th className="text-left px-4 py-2 font-medium">상태</th>
              <th className="text-right px-4 py-2 font-medium">기사</th>
              <th className="text-right px-4 py-2 font-medium">이벤트</th>
              <th className="text-right px-4 py-2 font-medium">AI 비용</th>
              <th className="text-left px-4 py-2 font-medium">윈도우</th>
            </tr>
          </thead>
          <tbody>
            {(runs ?? []).map(run => (
              <tr key={run.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-2 whitespace-nowrap text-xs">
                  {new Date(run.started_at).toLocaleString('ko-KR')}
                </td>
                <td className="px-4 py-2">
                  <StatusChip status={run.status} />
                </td>
                <td className="px-4 py-2 text-right">{run.articles_count}</td>
                <td className="px-4 py-2 text-right">{run.events_count}</td>
                <td className="px-4 py-2 text-right">${Number(run.ai_cost_usd).toFixed(4)}</td>
                <td className="px-4 py-2 text-xs" style={{ color: 'var(--muted-fg)' }}>
                  {run.window_start.slice(0, 10)} ~ {run.window_end.slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const color = status === 'completed' ? 'var(--success)' : status === 'failed' ? 'var(--destructive)' : 'var(--warning)'
  return (
    <span
      className="px-1.5 py-0.5 rounded text-xs"
      style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
    >
      {status}
    </span>
  )
}

function TriggerSweepButton() {
  return (
    <a
      href="/api/cron/sweep?secret=inline"
      className="px-4 py-2 rounded-lg text-sm font-medium inline-block"
      style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
    >
      수동 Sweep 실행
    </a>
  )
}
