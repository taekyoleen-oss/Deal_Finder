import { callHaiku, parseJsonResponse } from '@/lib/ai/claude'
import { EXTRACTOR_SYSTEM, buildExtractorPrompt } from '@/lib/ai/prompts/extractor'
import type { ExtractorOutput } from '@/types/domain'
import type { Brand } from '@/types/domain'
import { toKSTDateString } from '@/lib/utils/date'

export async function extractAndFilter(params: {
  title: string
  body: string
  url: string
  sourceName: string
  mediaTier: string
  brandCandidates: Pick<Brand, 'id' | 'name' | 'aliases'>[]
}): Promise<ExtractorOutput> {
  const today = toKSTDateString()
  const prompt = buildExtractorPrompt({ ...params, today })

  let raw: string
  try {
    raw = await callHaiku(prompt, EXTRACTOR_SYSTEM)
  } catch (err) {
    throw new Error(`Haiku extractor failed: ${err}`)
  }

  let result: ExtractorOutput
  try {
    result = parseJsonResponse<ExtractorOutput>(raw)
  } catch {
    // Retry once on parse failure
    const retry = await callHaiku(prompt, EXTRACTOR_SYSTEM)
    result = parseJsonResponse<ExtractorOutput>(retry)
  }

  // Auto-reject clearly promotional single-source articles
  if (result.is_promotional_content && result.confidence < 0.5) {
    result.is_event = false
    result.exclusion_reason = '협찬/광고성 기사 + 낮은 신뢰도'
  }

  return result
}
