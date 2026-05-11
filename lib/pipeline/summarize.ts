import { callSonnet, parseJsonResponse } from '@/lib/ai/claude'
import { SUMMARIZER_SYSTEM, buildSummarizerPrompt } from '@/lib/ai/prompts/summarizer'
import type { ExtractorOutput, SummarizerOutput } from '@/types/domain'
import { toKSTDateString } from '@/lib/utils/date'

export async function generateCardContent(extracted: ExtractorOutput): Promise<SummarizerOutput> {
  const today = toKSTDateString()
  const prompt = buildSummarizerPrompt(extracted, today)

  let raw: string
  try {
    raw = await callSonnet(prompt, SUMMARIZER_SYSTEM)
  } catch (err) {
    throw new Error(`Sonnet summarizer failed: ${err}`)
  }

  let result: SummarizerOutput
  try {
    result = parseJsonResponse<SummarizerOutput>(raw)
  } catch {
    const retry = await callSonnet(prompt, SUMMARIZER_SYSTEM)
    result = parseJsonResponse<SummarizerOutput>(retry)
  }

  // Clamp key_points
  result.key_points = result.key_points.slice(0, 5)

  return result
}
