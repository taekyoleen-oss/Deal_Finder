import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const metadata: Metadata = { title: '카테고리 관리' }
export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const db = createAdminClient()

  const { data: cats } = await db
    .from('categories')
    .select('*')
    .order('display_order')

  const parents = (cats ?? []).filter(c => c.parent_id === null)
  const children = (cats ?? []).filter(c => c.parent_id !== null)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">카테고리 관리</h1>
        <Link href="/admin" className="text-sm" style={{ color: 'var(--muted-fg)' }}>← 대시보드</Link>
      </div>

      <div className="space-y-4">
        {parents.map(parent => {
          const subs = children.filter(c => c.parent_id === parent.id)
          return (
            <div
              key={parent.id}
              className="rounded-[var(--radius)] border p-4"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{parent.name}</span>
                  <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>/{parent.slug}</span>
                  <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>순서: {parent.display_order}</span>
                </div>
                <ToggleCategoryButton id={parent.id} isActive={parent.is_active} />
              </div>
              {subs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {subs.map(sub => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs"
                      style={{
                        background: sub.is_active ? 'var(--muted)' : 'rgba(220,38,38,0.05)',
                        color: sub.is_active ? 'var(--foreground)' : 'var(--muted-fg)',
                      }}
                    >
                      {sub.name}
                      <ToggleCategoryButton id={sub.id} isActive={sub.is_active} compact />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ToggleCategoryButton({ id, isActive, compact }: { id: string; isActive: boolean; compact?: boolean }) {
  return (
    <form
      action={async () => {
        'use server'
        const { createAdminClient } = await import('@/lib/supabase/admin')
        await createAdminClient().from('categories').update({ is_active: !isActive }).eq('id', id)
      }}
    >
      <button
        type="submit"
        className={`rounded text-xs ${compact ? 'px-1' : 'px-2 py-0.5'}`}
        style={{
          background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(220,38,38,0.1)',
          color: isActive ? 'var(--success)' : 'var(--destructive)',
        }}
      >
        {isActive ? (compact ? '✓' : '활성') : (compact ? '✗' : '비활성')}
      </button>
    </form>
  )
}
