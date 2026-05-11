import { callHaiku, parseJsonResponse } from '@/lib/ai/claude'
import { DEDUP_SYSTEM, buildDedupPrompt } from '@/lib/ai/prompts/dedup'
import { cosineSimilarity, SIMILARITY_AUTO_SAME, SIMILARITY_JUDGE } from '@/lib/ai/embeddings'
import type { DedupJudgeOutput } from '@/types/domain'

export type DedupResult = 'same' | 'different' | 'pending_judge'

export async function checkDuplicate(params: {
  embeddingA: number[]
  embeddingB: number[]
  eventA: object
  eventB: object
}): Promise<{ result: 'same' | 'different'; reason: string }> {
  const sim = cosineSimilarity(params.embeddingA, params.embeddingB)

  if (sim >= SIMILARITY_AUTO_SAME) {
    return { result: 'same', reason: `임베딩 유사도 ${sim.toFixed(3)} ≥ 0.92 자동 same` }
  }

  if (sim < SIMILARITY_JUDGE) {
    return { result: 'different', reason: `임베딩 유사도 ${sim.toFixed(3)} < 0.78` }
  }

  // 0.78 ~ 0.92 → Haiku judge
  const prompt = buildDedupPrompt(params.eventA, params.eventB)
  const raw = await callHaiku(prompt, DEDUP_SYSTEM)
  const judgment = parseJsonResponse<DedupJudgeOutput>(raw)

  return {
    result: judgment.same ? 'same' : 'different',
    reason: `Haiku(${sim.toFixed(3)}): ${judgment.reason}`,
  }
}
