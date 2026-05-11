import type { NaverNewsItem, NaverNewsResponse } from '@/types/domain'
import type { MediaTier } from '@/types/database'

const NAVER_NEWS_URL = 'https://openapi.naver.com/v1/search/news.json'
const MAJOR_SOURCES = new Set([
  '조선일보', '중앙일보', '동아일보', '한국일보', '매일경제', '한국경제', '연합뉴스',
  '헤럴드경제', '아시아경제', '이데일리', '파이낸셜뉴스', 'MBC', 'KBS', 'SBS', 'JTBC',
])

export async function searchNaverNews(params: {
  query: string
  dateFrom: string  // YYYYMMDD
  dateTo: string    // YYYYMMDD
  display?: number
}): Promise<NaverNewsItem[]> {
  const url = new URL(NAVER_NEWS_URL)
  url.searchParams.set('query', params.query)
  url.searchParams.set('display', String(params.display ?? 20))
  url.searchParams.set('sort', 'date')
  url.searchParams.set('start', '1')

  const res = await fetch(url.toString(), {
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
    },
  })

  if (!res.ok) {
    throw new Error(`Naver News API error: ${res.status} ${res.statusText}`)
  }

  const data: NaverNewsResponse = await res.json()

  // Filter by publication date window
  return data.items.filter(item => {
    const pubDate = new Date(item.pubDate)
    const from = parseNaverDate(params.dateFrom)
    const to = parseNaverDate(params.dateTo)
    to.setHours(23, 59, 59, 999)
    return pubDate >= from && pubDate <= to
  })
}

export function detectMediaTier(sourceName: string): MediaTier {
  if (MAJOR_SOURCES.has(sourceName)) return 'major'
  if (sourceName.includes('블로그') || sourceName.includes('blog')) return 'blog'
  return 'minor'
}

function parseNaverDate(yyyymmdd: string): Date {
  return new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`)
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()
}
