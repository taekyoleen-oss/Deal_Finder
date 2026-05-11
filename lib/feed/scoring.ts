import type { Event } from '@/types/domain'

// Hybrid feed score weights (adjustable via admin dashboard)
const W1 = 1.0  // recency_decay
const W2 = 0.6  // urgency_bonus
const W3 = 0.2  // media_bonus
const W4 = 0.3  // category_repeat_penalty

export function computeFeedScore(params: {
  event: Event
  hasMajorSource: boolean
  recentCategoryIds: string[]  // last 5 cards in current feed
}): number {
  const { event, hasMajorSource, recentCategoryIds } = params

  // Recency decay: 1 / log(age_hours + 2)
  const ageMs = event.published_at
    ? Date.now() - new Date(event.published_at).getTime()
    : 0
  const ageHours = ageMs / 3600000
  const recencyDecay = 1 / Math.log(ageHours + 2)

  // Urgency bonus
  let urgencyBonus = 0
  if (event.ends_at && !event.is_ongoing) {
    const daysLeft = Math.ceil(
      (new Date(event.ends_at).getTime() - Date.now()) / 86400000
    )
    if (daysLeft <= 1) urgencyBonus = 1.0
    else if (daysLeft <= 7) urgencyBonus = 0.5
  }

  // Media bonus
  const mediaBonus = hasMajorSource ? 0.2 : 0

  // Category repeat penalty
  const sameCount = recentCategoryIds.filter(id => id === event.category_id).length
  const categoryRepeatPenalty = recentCategoryIds.length > 0
    ? sameCount / recentCategoryIds.length
    : 0

  return (
    W1 * recencyDecay +
    W2 * urgencyBonus +
    W3 * mediaBonus -
    W4 * categoryRepeatPenalty
  )
}
