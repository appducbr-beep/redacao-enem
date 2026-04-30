'use client'

import { useActionState, useState, useTransition, useRef } from 'react'
import { submitEssay } from '@/app/actions/essays'
import { extractEssayTextFromImage } from '@/app/actions/ocr'

const MIN_CHARS = 800
const MAX_CHARS = 4500

type Props = { temaId: string; temaTitle: string }

export default function EssayForm({ temaId, temaTitle }: Props) {
  const [state, formAction, pending] = useActionState(submitEssay, undefined)
  const [content, setContent] = useState('')
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [ocrDone, setOcrDone] = useState(false)
  const [isPendingOcr, startOcrTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const charCount = content.trim().length
  const tooShort = charCount > 0 && charCount < MIN_CHARS
  const tooLong = charCount > MAX_CHARS
  const countColor = tooLong
    ? 'text-red-500'
    : tooShort
    ? 'text-orange-500'
    : charCount >= MIN_CHARS
    ? 'text-green-600'
    : 'text-gray-400'

  function handleExtract() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    setOcrError(null)
    setOcrDone(false)

    const formData = new FormData()
    formData.set('image', file)

    startOcrTransition(async () => {
      const result = await extractEssayTextFromImage(formData)
      if (result.error) {
        setOcrError(result.error)
      } else if (result.text) {
        setContent(result.text)
        setOcrDone(true)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    })
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="tema_id" value={temaId} />

      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">
          Redação manuscrita?{' '}
          <span className="font-normal text-gray-500">
            Envie uma foto para extrair o texto automaticamente.
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={isPendingOcr || pending}
            className="flex-1 text-sm text-gray-500 file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleExtract}
            disabled={isPendingOcr || pending}
            className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPendingOcr ? 'Extraindo...' : 'Extrair texto da imagem'}
          </button>
        </div>
        {ocrError && <p className="text-xs text-red-600">{ocrError}</p>}
        {ocrDone && (
          <div className="rounded bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-xs text-amber-800">
              <strong>Revise o texto antes de enviar.</strong> O OCR pode cometer erros — leia e
              corrija se necessário.
            </p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          Sua redação &mdash;{' '}
          <span className="font-normal text-gray-500">{temaTitle}</span>
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={20}
          maxLength={MAX_CHARS}
          disabled={pending}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (ocrDone) setOcrDone(false)
          }}
          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none disabled:opacity-60"
          placeholder={`Escreva sua redação aqui ou extraia o texto de uma foto. Mínimo de ${MIN_CHARS} caracteres.`}
        />
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-400">
            Mínimo {MIN_CHARS} &middot; máximo {MAX_CHARS} caracteres
          </span>
          <span className={countColor}>
            {charCount} / {MAX_CHARS}
          </span>
        </div>
      </div>

      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={pending || tooLong || charCount < MIN_CHARS}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {pending ? 'Enviando...' : 'Enviar redação'}
      </button>

      {charCount > 0 && charCount < MIN_CHARS && (
        <p className="text-center text-xs text-orange-500">
          Faltam {MIN_CHARS - charCount} caracteres para o mínimo
        </p>
      )}
    </form>
  )
}
