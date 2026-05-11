import type { EventStatus, MediaTier } from '@/types/database'

const AUTO_PUBLISH_CONFIDENCE_SINGLE = 0.85  // 단일 출처 자동게시 임계치
const AUTO_PUBLISH_CONFIDENCE_MULTI  = 0.75  // 복수 출처 자동게시 임계치
const MAJOR_BONUS = 0.05

export function shouldAutoPublish(params: {
  confidence: number
  sourcesCount: number
  mediaTiers: MediaTier[]
  isPromotional: boolean
}): boolean {
  const { confidence, sourcesCount, mediaTiers, isPromotional } = params

  // 협찬·광고성 단일 출처 → 항상 검토 큐
  if (isPromotional && sourcesCount === 1) return false

  const hasMajor = mediaTiers.some(t => t === 'major')
  const effectiveConfidence = confidence + (hasMajor ? MAJOR_BONUS : 0)

  if (sourcesCount >= 2) return effectiveConfidence >= AUTO_PUBLISH_CONFIDENCE_MULTI
  return effectiveConfidence >= AUTO_PUBLISH_CONFIDENCE_SINGLE
}

// Priority queue ordering for Sonnet processing when under quota pressure
// Returns lower number = higher priority
export function getProcessingPriority(params: {
  isAutoPublishCandidate: boolean
  hasMajorSource: boolean
  daysUntilDeadline: number | null
}): number {
  if (params.isAutoPublishCandidate) return 1
  if (params.hasMajorSource) return 2
  if (params.daysUntilDeadline !== null && params.daysUntilDeadline <= 7) return 3
  return 4
}
