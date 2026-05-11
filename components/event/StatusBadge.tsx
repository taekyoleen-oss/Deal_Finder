import type { Event } from '@/types/domain'
import { getEventBadge, type BadgeVariant } from '@/types/domain'
import { cn } from '@/lib/utils/cn'

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  upcoming:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  active:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  deadline:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

interface Props {
  event: Event
  className?: string
}

export function StatusBadge({ event, className }: Props) {
  const { variant, label } = getEventBadge(event)
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        VARIANT_STYLES[variant],
        className
      )}
      aria-label={`이벤트 상태: ${label}`}
    >
      {label}
    </span>
  )
}
