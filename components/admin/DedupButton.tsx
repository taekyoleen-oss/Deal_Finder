'use client'

import { useState } from 'react'

type DedupPair = {
  kept: string
  keptTitle: string
  rejected: string
  rejectedTitle: string
  reason: string
}

type DedupResult = {
  dryRun: boolean
  events: number
  checkedPairs: number
  merged: number
  pairs: DedupPair[]
}

export function DedupButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DedupResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dryRun, setDryRun] = useState(true)

  async function run() {
    if (!dryRun && !confirm(`실제로 중복 이벤트를 병합하고 rejected 처리합니다. 계속하시겠습니까?`)) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/dedup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '알 수 없는 오류')
      setResult(data as DedupResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류 발생')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-[var(--radius)] border p-4 mt-6"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <h2 className="font-semibold mb-3">기존 이벤트 중복 제거</h2>

      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={e => setDryRun(e.target.checked)}
          />
          <span style={{ color: 'var(--muted-fg)' }}>미리보기 (실제 변경 없음)</span>
        </label>

        <button
          onClick={run}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
          style={{
            background: dryRun ? 'var(--muted)' : 'var(--destructive)',
            color: dryRun ? 'var(--foreground)' : '#fff',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '검사 중…' : dryRun ? '미리보기 실행' : '중복 제거 실행'}
        </button>
      </div>

      {loading && (
        <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
          이벤트를 비교하는 중입니다. 시간이 걸릴 수 있습니다…
        </p>
      )}

      {error && (
        <p className="text-sm" style={{ color: 'var(--destructive)' }}>{error}</p>
      )}

      {result && (
        <div>
          <div className="flex flex-wrap gap-4 text-sm mb-4">
            {([
              ['전체 이벤트', result.events],
              ['비교 쌍', result.checkedPairs],
              ['중복 발견', result.merged],
            ] as const).map(([label, value]) => (
              <div key={label}>
                <span style={{ color: 'var(--muted-fg)' }}>{label}: </span>
                <strong>{value}</strong>
              </div>
            ))}
            <span
              className="px-1.5 py-0.5 rounded text-xs self-center"
              style={{
                background: result.dryRun
                  ? 'color-mix(in srgb, var(--warning) 15%, transparent)'
                  : 'color-mix(in srgb, var(--success) 15%, transparent)',
                color: result.dryRun ? 'var(--warning)' : 'var(--success)',
              }}
            >
              {result.dryRun ? '미리보기' : '적용 완료'}
            </span>
          </div>

          {result.pairs.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>중복 이벤트가 발견되지 않았습니다.</p>
          ) : (
            <div className="overflow-x-auto rounded border" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full text-xs">
                <thead style={{ background: 'var(--muted)' }}>
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">유지 (오래된 이벤트)</th>
                    <th className="text-left px-3 py-2 font-medium">제거 (신규 이벤트)</th>
                    <th className="text-left px-3 py-2 font-medium">판정 이유</th>
                  </tr>
                </thead>
                <tbody>
                  {result.pairs.map((pair, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-3 py-2 max-w-[220px]">
                        <a
                          href={`/event/${pair.kept}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline line-clamp-2 block"
                          style={{ color: 'var(--success)' }}
                        >
                          {pair.keptTitle}
                        </a>
                      </td>
                      <td className="px-3 py-2 max-w-[220px]">
                        <a
                          href={`/event/${pair.rejected}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline line-clamp-2 block"
                          style={{ color: 'var(--destructive)' }}
                        >
                          {pair.rejectedTitle}
                        </a>
                      </td>
                      <td className="px-3 py-2 max-w-[240px]" style={{ color: 'var(--muted-fg)' }}>
                        {pair.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
