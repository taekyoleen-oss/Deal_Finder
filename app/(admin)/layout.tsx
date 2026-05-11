import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: '관리자', template: '%s | 딜레이더 관리자' },
  robots: 'noindex, nofollow',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
      {children}
    </div>
  )
}
