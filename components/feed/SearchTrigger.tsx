'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'

export function SearchTrigger() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
        style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
      >
        <Search size={14} style={{ color: 'var(--muted-fg)' }} />
        <input
          ref={inputRef}
          type="search"
          placeholder="검색"
          className="bg-transparent text-sm outline-none w-32 sm:w-48"
          style={{ color: 'var(--foreground)' }}
          aria-label="이벤트 검색"
        />
      </div>
    </form>
  )
}
