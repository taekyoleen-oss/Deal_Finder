import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const metadata: Metadata = { title: '검토 큐' }
export const dynamic = 'force-dynamic'

export default async function AdminQueuePage() {
  const db = createAdminClient()

  const { data: pending } = await db
    .from('events')
    .select(`
      id, title, brand_raw, discount_type, discount_value,
      starts_at, ends_at, confidence, created_at,
      category:categories!category_id(name),
      sources:event_sources(source_name, source_url, media_tier)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">검토 큐 ({pending?.length ?? 0}건)</h1>
        <Link href="/admin" className="text-sm" style={{ color: 'var(--muted-fg)' }}>← 대시보드</Link>
      </div>

      {!pending?.length ? (
        <p style={{ color: 'var(--muted-fg)' }}>대기 중인 이벤트가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {pending.map(ev => {
            const cat = ev.category as { name: string } | null
            const sources = ev.sources as { source_name: string | null; source_url: string | null; media_tier: string | null }[]
            return (
              <div
                key={ev.id}
                className="rounded-[var(--radius)] border p-4"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{ev.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-fg)' }}>
                      {cat?.name ?? '미분류'} •{' '}
                      {ev.brand_raw} •{' '}
                      {ev.discount_value ?? ev.discount_type ?? '할인 정보 없음'} •{' '}
                      신뢰도 {ev.confidence ?? '?'}
                    </p>
                    {sources[0] && (
                      <a
                        href={sources[0].source_url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        {sources[0].source_name} ({sources[0].media_tier}) →
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <PublishButton id={ev.id} />
                    <RejectButton id={ev.id} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PublishButton({ id }: { id: string }) {
  return (
    <form
      action={async () => {
        'use server'
        const { createAdminClient } = await import('@/lib/supabase/admin')
        await createAdminClient()
          .from('events')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', id)
      }}
    >
      <button
        type="submit"
        className="px-3 py-1 rounded text-xs font-medium"
        style={{ background: 'var(--success)', color: 'white' }}
      >
        게시
      </button>
    </form>
  )
}

function RejectButton({ id }: { id: string }) {
  return (
    <form
      action={async () => {
        'use server'
        const { createAdminClient } = await import('@/lib/supabase/admin')
        await createAdminClient()
          .from('events')
          .update({ status: 'rejected' })
          .eq('id', id)
      }}
    >
      <button
        type="submit"
        className="px-3 py-1 rounded text-xs font-medium"
        style={{ background: 'var(--muted)', color: 'var(--muted-fg)' }}
      >
        반려
      </button>
    </form>
  )
}
