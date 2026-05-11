import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const db = createAdminClient()

  const { data: reports } = await db
    .from('event_reports')
    .select('*, event:events(id, title)')
    .eq('reviewed', false)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">사용자 제보 큐</h1>

      {!reports?.length ? (
        <p style={{ color: 'var(--muted-fg)' }}>미처리 제보가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div
              key={r.id}
              className="rounded-[var(--radius)] border p-4"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {(r.event as { title: string } | null)?.title ?? '삭제된 이벤트'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-fg)' }}>
                    {REASON_LABELS[r.reason_type as keyof typeof REASON_LABELS]} •{' '}
                    {new Date(r.created_at).toLocaleString('ko-KR')}
                  </p>
                  {r.message && (
                    <p className="text-xs mt-1">{r.message}</p>
                  )}
                </div>
                <MarkReviewedButton id={r.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const REASON_LABELS = {
  ended: '종료됨',
  promotional: '광고/협찬',
  wrong_period: '기간 오류',
  wrong_category: '카테고리 오류',
  other: '기타',
}

function MarkReviewedButton({ id }: { id: string }) {
  return (
    <form
      action={async () => {
        'use server'
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const db = createAdminClient()
        await db
          .from('event_reports')
          .update({ reviewed: true, reviewed_at: new Date().toISOString() })
          .eq('id', id)
      }}
    >
      <button
        type="submit"
        className="px-3 py-1 rounded text-xs whitespace-nowrap"
        style={{ background: 'var(--muted)', color: 'var(--muted-fg)' }}
      >
        처리 완료
      </button>
    </form>
  )
}
