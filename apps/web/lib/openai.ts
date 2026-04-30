import OpenAI from 'openai'

const DEFAULT_MODEL = 'gpt-4o'
const TIMEOUT_MS = 60_000

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL ?? DEFAULT_MODEL
}

export async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<{ parsed: unknown; tokens: number }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada')

  const client = new OpenAI({ apiKey, maxRetries: 2, timeout: TIMEOUT_MS })

  const completion = await client.chat.completions.create({
    model: getOpenAIModel(),
    temperature: 0.3,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const tokens =
    (completion.usage?.prompt_tokens ?? 0) + (completion.usage?.completion_tokens ?? 0)

  try {
    return { parsed: JSON.parse(raw), tokens }
  } catch {
    throw new Error(`JSON inválido da API OpenAI: ${raw.slice(0, 300)}`)
  }
}
