import type { ReactNode } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { SearchTrigger } from '@/components/feed/SearchTrigger'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="font-bold text-lg"
            style={{ color: 'var(--primary)' }}
          >
            딜레이더
          </Link>
          <span
            className="hidden sm:block text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--muted)', color: 'var(--muted-fg)' }}
          >
            AI 할인·혜택 게시판
          </span>
          <div className="flex-1" />
          <SearchTrigger />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer
        className="border-t py-6 text-center text-sm"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-fg)' }}
      >
        <p>© 2025 딜레이더 — AI가 뉴스에서 찾아드리는 할인·혜택 정보</p>
        <p className="mt-1">
          <Link href="/about" className="hover:underline">
            서비스 소개 및 수집 범위
          </Link>
        </p>
      </footer>
    </>
  )
}
