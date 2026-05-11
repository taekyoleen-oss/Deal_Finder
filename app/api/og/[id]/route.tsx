import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createServerClient()

  const { data } = await db
    .from('events')
    .select('title, summary, category:categories!category_id(name)')
    .eq('id', id)
    .single()

  const title = data?.title ?? '딜레이더'
  const categoryName = (data?.category as { name: string } | null)?.name ?? '이벤트'

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #FF6A3D 0%, #FF9A3D 100%)',
          padding: '48px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '6px 14px',
            color: 'white',
            fontSize: '18px',
            marginBottom: '16px',
            width: 'fit-content',
          }}
        >
          {categoryName}
        </div>
        <div
          style={{
            color: 'white',
            fontSize: title.length > 30 ? '32px' : '40px',
            fontWeight: 'bold',
            lineHeight: 1.3,
            marginBottom: '24px',
          }}
        >
          {title}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '24px' }}>
          딜레이더 — 오늘의 할인·혜택
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
