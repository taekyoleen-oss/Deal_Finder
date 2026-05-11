import { formatDateRange } from '@/lib/utils/date'

interface Props {
  startsAt: string | null
  endsAt: string | null
  isOngoing: boolean
  className?: string
}

export function DateRangeText({ startsAt, endsAt, isOngoing, className }: Props) {
  const text = formatDateRange(startsAt, endsAt, isOngoing)
  return (
    <span className={className} style={{ color: 'var(--muted-fg)', fontSize: '0.8rem' }}>
      📅 {text}
    </span>
  )
}
