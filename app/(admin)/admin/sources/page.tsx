import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const metadata: Metadata = { title: '수집 소스 관리' }
export const dynamic = 'force-dynamic'

export default async function AdminSourcesPage() {
  const db = createAdminClient()

  const { data: sources } = await db
    .from('sources')
    .select('*')
    .order('tier')
    .order('name')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">수집 소스 관리</h1>
        <Link href="/admin" className="text-sm" style={{ color: 'var(--muted-fg)' }}>← 대시보드</Link>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius)] border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--muted)' }}>
            <tr>
              <th className="text-left px-4 py-2 font-medium">이름</th>
              <th className="text-left px-4 py-2 font-medium">티어</th>
              <th className="text-left px-4 py-2 font-medium">URL</th>
              <th className="text-center px-4 py-2 font-medium">활성</th>
            </tr>
          </thead>
          <tbody>
            {(sources ?? []).map(src => (
              <tr key={src.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-2 font-medium">{src.name}</td>
                <td className="px-4 py-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-xs"
                    style={{
                      background: src.tier === 'major' ? 'rgba(37,99,235,0.1)' : 'var(--muted)',
                      color: src.tier === 'major' ? 'var(--accent)' : 'var(--muted-fg)',
                    }}
                  >
                    {src.tier}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {src.url ? (
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-xs" style={{ color: 'var(--accent)' }}>
                      {src.url}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--muted-fg)' }}>-</span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  <ToggleSourceButton id={src.id} isActive={src.is_active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ToggleSourceButton({ id, isActive }: { id: string; isActive: boolean }) {
  return (
    <form
      action={async () => {
        'use server'
        const { createAdminClient } = await import('@/lib/supabase/admin')
        await createAdminClient().from('sources').update({ is_active: !isActive }).eq('id', id)
      }}
    >
      <button
        type="submit"
        className="px-2 py-0.5 rounded text-xs font-medium"
        style={{
          background: isActive ? 'rgba(34,197,94,0.1)' : 'var(--muted)',
          color: isActive ? 'var(--success)' : 'var(--muted-fg)',
        }}
      >
        {isActive ? '활성' : '비활성'}
      </button>
    </form>
  )
}
