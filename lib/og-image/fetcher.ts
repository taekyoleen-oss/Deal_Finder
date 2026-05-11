import { createAdminClient } from '@/lib/supabase/admin'

const MAX_SIZE_BYTES = 200 * 1024  // 200KB cap
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'events-covers'

export async function fetchAndCacheOgImage(
  eventId: string,
  sourceUrl: string
): Promise<string | null> {
  try {
    // Extract og:image from the source page
    const html = await fetchHtml(sourceUrl)
    const ogImageUrl = extractOgImage(html)
    if (!ogImageUrl) return null

    // Download the image
    const imgRes = await fetch(ogImageUrl)
    if (!imgRes.ok) return null

    const buffer = await imgRes.arrayBuffer()
    if (buffer.byteLength > MAX_SIZE_BYTES) return null  // Skip oversized images

    const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : 'jpg'
    const path = `${eventId}.${ext}`

    // Upload to Supabase Storage
    const db = createAdminClient()
    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true })

    if (error) return null

    const { data } = db.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  } catch {
    return null
  }
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'DealRadarBot/1.0' },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  return res.text()
}

function extractOgImage(html: string): string | null {
  const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
  return match ? match[1] : null
}
