import Groq from 'groq-sdk'

const OCR_PROMPT = `Você receberá a foto de uma redação manuscrita.
Extraia o texto exatamente como escrito: preserve parágrafos e quebras de linha.
Não corrija erros de português, não reformate, não acrescente texto.
Retorne APENAS o texto da redação — nada mais.`

export async function extractTextFromImage(
  base64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY não configurada')

  const model =
    process.env.GROQ_VISION_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct'
  const groq = new Groq({ apiKey })

  const completion = await groq.chat.completions.create({
    model,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
          {
            type: 'text',
            text: OCR_PROMPT,
          },
        ],
      },
    ],
  })

  const text = completion.choices[0]?.message?.content ?? ''
  if (!text.trim()) throw new Error('O modelo não retornou texto da imagem')
  return text.trim()
}
