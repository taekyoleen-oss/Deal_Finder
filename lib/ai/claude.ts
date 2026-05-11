import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

export function getClaudeClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return client
}

export const MODELS = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
} as const

export async function callHaiku(prompt: string, systemPrompt: string): Promise<string> {
  const claude = getClaudeClient()
  const msg = await claude.messages.create({
    model: MODELS.haiku,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Haiku')
  return block.text
}

export async function callSonnet(prompt: string, systemPrompt: string): Promise<string> {
  const claude = getClaudeClient()
  const msg = await claude.messages.create({
    model: MODELS.sonnet,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Sonnet')
  return block.text
}

export function parseJsonResponse<T>(raw: string): T {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(cleaned) as T
}
