export function formatDateRange(
  startsAt: string | null,
  endsAt: string | null,
  isOngoing: boolean
): string {
  if (isOngoing) return '상시'
  if (!startsAt && !endsAt) return '기간 미정'

  const fmt = (d: string) => {
    const date = new Date(d)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  if (startsAt && endsAt) return `${fmt(startsAt)} ~ ${fmt(endsAt)}`
  if (endsAt) return `~ ${fmt(endsAt)}`
  if (startsAt) return `${fmt(startsAt)} ~`
  return '기간 미정'
}

export function getDaysUntil(date: string | null): number | null {
  if (!date) return null
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

export function isExpired(endsAt: string | null, isOngoing: boolean): boolean {
  if (isOngoing) return false
  if (!endsAt) return false
  return getDaysUntil(endsAt)! < 0
}

export function toKSTDateString(date: Date = new Date()): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().split('T')[0]
}
