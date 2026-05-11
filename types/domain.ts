import type { Database, EventStatus, MediaTier } from './database'

// ---- Base row types ----
export type Event = Database['public']['Tables']['events']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type Brand = Database['public']['Tables']['brands']['Row']
export type EventSource = Database['public']['Tables']['event_sources']['Row']
export type RawArticle = Database['public']['Tables']['raw_articles']['Row']
export type SearchRun = Database['public']['Tables']['search_runs']['Row']
export type EventReport = Database['public']['Tables']['event_reports']['Row']

// ---- Enriched types (with joined relations) ----

// tags shape reflects the junction table join: event_tags(tag:tags(*))
export interface EventWithRelations extends Event {
  category?: Category | null
  subcategory?: Category | null
  brand?: Brand | null
  sources?: EventSource[]
  tags?: Array<{ tag?: Tag | null }>
}

// ---- Feed types ----

export type SortOption = 'newest' | 'deadline' | 'upcoming'

export interface FeedFilters {
  categorySlug?: string
  subcategorySlug?: string
  tagSlug?: string
  sort?: SortOption
  includeCompleted?: boolean
  q?: string
}

// ---- AI pipeline types ----

export interface ExtractorOutput {
  is_event: boolean
  confidence: number
  category: string
  subcategory: string | null
  tags: string[]
  brand: string | null
  brand_id: string | null
  title: string
  summary_raw: string
  discount_type: string | null
  discount_value: string | null
  starts_at: string | null
  ends_at: string | null
  is_ongoing: boolean
  regions: string[]
  is_promotional_content: boolean
  promotional_reason: string | null
  exclusion_reason: string | null
}

export interface SummarizerOutput {
  title: string
  summary: string
  key_points: string[]
}

export interface DedupJudgeOutput {
  same: boolean
  reason: string
}

// ---- Admin types ----

export interface AdminQueueItem extends Event {
  sources_count: number
  category?: Category | null
  brand?: Brand | null
}

// ---- Naver News API ----

export interface NaverNewsItem {
  title: string
  originallink: string
  link: string
  description: string
  pubDate: string
}

export interface NaverNewsResponse {
  lastBuildDate: string
  total: number
  start: number
  display: number
  items: NaverNewsItem[]
}

// ---- Score ----

export interface FeedScore {
  event_id: string
  score: number
  recency_decay: number
  urgency_bonus: number
  media_bonus: number
  category_repeat_penalty: number
}

// ---- Report ----

export interface ReportFormData {
  reason_type: EventReport['reason_type']
  message?: string
}

// ---- Status badge ----

export type BadgeVariant = 'upcoming' | 'active' | 'deadline' | 'completed'

export function getEventBadge(event: Event): { variant: BadgeVariant; label: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (event.status === 'completed') return { variant: 'completed', label: '완료' }

  const starts = event.starts_at ? new Date(event.starts_at) : null
  const ends = event.ends_at ? new Date(event.ends_at) : null

  if (starts && starts > today) {
    const diff = Math.ceil((starts.getTime() - today.getTime()) / 86400000)
    return { variant: 'upcoming', label: `예정 D-${diff}` }
  }

  if (ends) {
    const diff = Math.ceil((ends.getTime() - today.getTime()) / 86400000)
    if (diff <= 7) return { variant: 'deadline', label: `마감 D-${diff}` }
  }

  return { variant: 'active', label: '진행 중' }
}

export { EventStatus, MediaTier }
