import OpenAI from 'openai'
import type { EventWithRelations } from '@/types/domain'

let client: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return client
}

const MODEL = 'text-embedding-3-small'

export async function embedText(text: string): Promise<number[]> {
  const openai = getOpenAIClient()
  const res = await openai.embeddings.create({
    model: MODEL,
    input: text,
    dimensions: 1536,
  })
  return res.data[0].embedding
}

export function buildEmbeddingInput(event: {
  brand_raw?: string | null
  category?: { name: string } | null
  subcategory?: { name: string } | null
  tags?: { slug: string }[]
  title: string
  summary?: string | null
  starts_at?: string | null
  ends_at?: string | null
  regions?: string[]
}): string {
  return [
    `[브랜드] ${event.brand_raw ?? ''}`,
    `[대분류] ${event.category?.name ?? ''}`,
    `[소분류] ${event.subcategory?.name ?? ''}`,
    `[태그] ${(event.tags ?? []).map(t => t.slug).join(',')}`,
    `[제목] ${event.title}`,
    `[요약] ${event.summary ?? ''}`,
    `[기간] ${event.starts_at ?? ''} ~ ${event.ends_at ?? ''}`,
    `[지역] ${(event.regions ?? []).join(',')}`,
  ].join('\n')
}

// Two-tier cosine similarity thresholds
export const SIMILARITY_AUTO_SAME = 0.92   // ≥ this → same, skip LLM
export const SIMILARITY_JUDGE = 0.78       // 0.78~0.92 → Haiku judge
// < 0.78 → different

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
