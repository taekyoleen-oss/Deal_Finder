import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { EventStatus } from '@/types/database'

export const metadata: Metadata = { title: '이벤트 목록' }
export const dynamic = 'force-dynamic'

const STATUS_OPTIONS = ['published', 'completed', 'pending', 'rejected'] as const

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const sp = await searchParams
  const status = (sp.status ?? 'published') as EventStatus
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const pageSize = 30
  const offset = (page - 1) * pageSize

  const db = createAdminClient()

  const { data: events, count } = await db
    .from('events')
    .select('id, title, brand_raw, status, starts_at, ends_at, is_ongoing, published_at, auto_published', { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">이벤트 목록</h1>
        <Link href="/admin" className="text-sm" style={{ color: 'var(--muted-fg)' }}>← 대시보드</Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {STATUS_OPTIONS.map(s => (
          <a
            key={s}
            href={`?status=${s}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: status === s ? 'var(--primary)' : 'var(--muted)',
              color: status === s ? 'var(--primary-fg)' : 'var(--foreground)',
            }}
          >
            {s}
          </a>
        ))}
      </div>

      {/* Events table */}
      <div className="overflow-x-auto rounded-[var(--radius)] border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--muted)' }}>
            <tr>
              <th className="text-left px-4 py-2 font-medium">제목</th>
              <th className="text-left px-4 py-2 font-medium">브랜드</th>
              <th className="text-left px-4 py-2 font-medium">기간</th>
              <th className="text-left px-4 py-2 font-medium">자동</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map(ev => (
              <tr key={ev.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-2 max-w-xs">
                  <Link
                    href={`/event/${ev.id}`}
                    target="_blank"
                    className="hover:underline line-clamp-1"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {ev.title}
                  </Link>
                </td>
                <td className="px-4 py-2 whitespace-nowrap" style={{ color: 'var(--muted-fg)' }}>
                  {ev.brand_raw ?? '-'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs" style={{ color: 'var(--muted-fg)' }}>
                  {ev.is_ongoing ? '상시' : `${ev.starts_at?.slice(0, 10) ?? '?'} ~ ${ev.ends_at?.slice(0, 10) ?? '?'}`}
                </td>
                <td className="px-4 py-2 text-center">
                  {ev.auto_published ? <span style={{ color: 'var(--success)' }}>✓</span> : '-'}
                </td>
                <td className="px-4 py-2">
                  <CompleteButton id={ev.id} status={status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 justify-end">
          {page > 1 && (
            <a href={`?status=${status}&page=${page - 1}`} className="px-3 py-1 rounded text-sm" style={{ background: 'var(--muted)' }}>
              이전
            </a>
          )}
          <span className="px-3 py-1 text-sm" style={{ color: 'var(--muted-fg)' }}>
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a href={`?status=${status}&page=${page + 1}`} className="px-3 py-1 rounded text-sm" style={{ background: 'var(--muted)' }}>
              다음
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function CompleteButton({ id, status }: { id: string; status: string }) {
  if (status !== 'published') return null
  return (
    <form
      action={async () => {
        'use server'
        const { createAdminClient } = await import('@/lib/supabase/admin')
        await createAdminClient().from('events').update({ status: 'completed' }).eq('id', id)
      }}
    >
      <button
        type="submit"
        className="px-2 py-0.5 rounded text-xs"
        style={{ background: 'var(--muted)', color: 'var(--muted-fg)' }}
      >
        완료처리
      </button>
    </form>
  )
}
