import type { DateQuality } from '@/types/database'
import { toKSTDateString } from '@/lib/utils/date'

const MAX_FUTURE_YEARS = 3

export function validateDates(startsAt: string | null, endsAt: string | null): DateQuality {
  if (!startsAt && !endsAt) return 'missing'

  const today = new Date(toKSTDateString())
  const maxFuture = new Date(today)
  maxFuture.setFullYear(maxFuture.getFullYear() + MAX_FUTURE_YEARS)

  const start = startsAt ? new Date(startsAt) : null
  const end = endsAt ? new Date(endsAt) : null

  if (start && (start < new Date('2000-01-01') || start > maxFuture)) return 'unrealistic'
  if (end && (end < new Date('2000-01-01') || end > maxFuture)) return 'unrealistic'
  if (start && end && start > end) return 'reversed'

  if (start || end) return 'confirmed'
  return 'estimated'
}

export function isDateValid(quality: DateQuality): boolean {
  return quality === 'confirmed' || quality === 'estimated'
}
