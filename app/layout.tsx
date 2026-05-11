import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/theme/provider'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dealradar.kr'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '딜레이더 — 오늘의 할인·혜택·공공지원',
    template: '%s — 딜레이더',
  },
  description: 'AI가 뉴스에서 행사·할인·공공지원금을 찾아 카드로 정리해주는 읽기 전용 공개 게시판',
  openGraph: {
    type: 'website',
    siteName: '딜레이더',
    locale: 'ko_KR',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head />
      <body className="min-h-screen flex flex-col antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
