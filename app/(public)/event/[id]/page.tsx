import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import type { EventWithRelations } from '@/types/domain'
import { StatusBadge } from '@/components/event/StatusBadge'
import { DateRangeText } from '@/components/event/DateRangeText'
import { EventCardImage } from '@/components/event/EventCardImage'
import { ReportButton } from '@/components/event/ReportButton'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const db = createServerClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dealradar.kr'

  const { data } = await db
    .from('events')
    .select('title, summary, cover_image_url')
    .eq('id', id)
    .single()

  if (!data) return { title: '이벤트를 찾을 수 없습니다' }

  const ogImage = data.cover_image_url ?? `${siteUrl}/api/og/${id}`

  return {
    title: data.title,
    description: data.summary ?? undefined,
    openGraph: {
      title: data.title,
      description: data.summary ?? undefined,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'article',
    },
    twitter: { card: 'summary_large_image', images: [ogImage] },
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const db = createServerClient()

  const { data } = await db
    .from('events')
    .select(`
      *,
      category:categories!category_id(*),
      subcategory:categories!subcategory_id(*),
      brand:brands(*),
      tags:event_tags(tag:tags(*)),
      sources:event_sources(*)
    `)
    .eq('id', id)
    .in('status', ['published', 'completed'])
    .single()

  if (!data) notFound()

  const event = data as EventWithRelations
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dealradar.kr'

  // Schema.org Event JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.summary ?? undefined,
    startDate: event.starts_at ?? undefined,
    endDate: event.ends_at ?? undefined,
    eventStatus: event.status === 'completed'
      ? 'https://schema.org/EventScheduled'
      : 'https://schema.org/EventScheduled',
    location: event.regions.length > 0
      ? { '@type': 'Place', name: event.regions.join(', ') }
      : undefined,
    organizer: event.brand
      ? { '@type': 'Organization', name: (event.brand as { name: string }).name }
      : undefined,
    offers: event.discount_value
      ? { '@type': 'Offer', description: event.discount_value }
      : undefined,
    url: `${siteUrl}/event/${event.id}`,
  }

  const category = event.category as { id: string; slug: string; name: string } | null
  const brand = event.brand as { name: string } | null
  const tags = event.tags as { tag?: { id: string; slug: string; name: string } }[] | null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Cover image */}
        <EventCardImage
          src={event.cover_image_url}
          source={event.cover_image_source}
          categorySlug={category?.slug}
          categoryName={category?.name}
          alt={event.title}
          eventId={event.id}
        />

        <div
          className="rounded-b-[var(--radius)] border border-t-0 p-6"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {category && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--muted)', color: 'var(--muted-fg)' }}
              >
                {category.name}
              </span>
            )}
            {tags?.slice(0, 3).map(t =>
              t.tag ? (
                <span
                  key={t.tag.id}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--muted)', color: 'var(--accent)' }}
                >
                  #{t.tag.name}
                </span>
              ) : null
            )}
            <StatusBadge event={event} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold leading-snug mb-3">{event.title}</h1>

          {/* Brand + Date */}
          <div className="flex items-center gap-4 mb-4" style={{ color: 'var(--muted-fg)' }}>
            {brand && <span className="text-sm font-medium">{brand.name}</span>}
            <DateRangeText
              startsAt={event.starts_at}
              endsAt={event.ends_at}
              isOngoing={event.is_ongoing}
            />
          </div>

          {/* Discount */}
          {event.discount_value && (
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg mb-4 font-semibold"
              style={{ background: 'rgba(255,106,61,0.1)', color: 'var(--primary)' }}
            >
              {event.discount_value}
            </div>
          )}

          {/* Summary */}
          {event.summary && (
            <p className="text-sm leading-relaxed mb-4">{event.summary}</p>
          )}

          {/* Key points */}
          {event.key_points && event.key_points.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold mb-2">주요 내용</h2>
              <ul className="space-y-1.5">
                {event.key_points.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span style={{ color: 'var(--primary)' }}>•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Affiliate CTA */}
          {event.affiliate_url && (
            <a
              href={event.affiliate_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block w-full text-center py-3 rounded-lg font-medium mb-4"
              style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
            >
              혜택 받으러 가기 →
            </a>
          )}

          {/* Sources */}
          {event.sources && event.sources.length > 0 && (
            <div
              className="border-t pt-4 mt-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <h2 className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-fg)' }}>
                출처
              </h2>
              <ul className="space-y-1">
                {event.sources.map((src: { id: string; source_name: string | null; source_url: string | null }) => (
                  <li key={src.id} className="text-xs flex items-center gap-2">
                    <span style={{ color: 'var(--muted-fg)' }}>{src.source_name}</span>
                    {src.source_url && (
                      <a
                        href={src.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        원문 →
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Report button */}
          <div
            className="border-t pt-4 mt-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <ReportButton eventId={event.id} />
          </div>
        </div>
      </div>
    </>
  )
}
