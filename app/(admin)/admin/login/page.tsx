'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (res.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        setError(data.error ?? '로그인에 실패했습니다.')
      }
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <div
        className="w-full max-w-sm rounded-[var(--radius)] border p-8"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h1 className="text-xl font-bold mb-6 text-center">딜레이더 관리자</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{
                background: 'var(--muted)',
                borderColor: error ? 'var(--destructive)' : 'var(--border)',
                color: 'var(--foreground)',
              }}
              placeholder="관리자 비밀번호"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p className="text-sm" style={{ color: 'var(--destructive)' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-medium text-sm disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-xs text-center mt-4" style={{ color: 'var(--muted-fg)' }}>
          5회 실패 시 10분간 잠금됩니다
        </p>
      </div>
    </div>
  )
}
