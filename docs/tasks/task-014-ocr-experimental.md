# Task 014 — OCR Experimental (Redação Manuscrita)

**Status:** concluída  
**Data:** 2026-04-27  
**Responsável:** Claude Code (operador técnico)  
**Referências:** task-013.2, apps/web/lib/groqOcr.ts, apps/web/app/actions/ocr.ts

---

## Objetivo

Permitir que alunos com redações manuscritas tirem uma foto e extraiam o texto automaticamente, preenchendo o textarea antes de enviar para correção.

Restrições:
- OCR NÃO consome crédito — crédito só é debitado na correção
- Sem armazenamento de imagens
- Sem PDF, sem múltiplas imagens
- Chave de API não exposta ao cliente (`GROQ_VISION_MODEL` sem `NEXT_PUBLIC_`)

---

## Solução implementada

### 1. `lib/groqOcr.ts` — serviço Vision

- Função: `extractTextFromImage(base64, mimeType)`
- Modelo via `GROQ_VISION_MODEL` (fallback: `meta-llama/llama-4-scout-17b-16e-instruct`)
- Prompt instrui o modelo a extrair o texto exatamente como escrito, sem corrigir ou reformatar
- Lança exceção se o modelo retornar string vazia

### 2. `app/actions/ocr.ts` — Server Action

- Função: `extractEssayTextFromImage(formData): Promise<OcrResult>`
- Auth check via `createClient()` — retorna erro se não autenticado
- Validação de tipo: aceita apenas `image/jpeg`, `image/png`, `image/webp`
- Limite de tamanho: 8 MB
- Conversão: `Buffer.from(arrayBuffer).toString('base64')`
- Em caso de falha: retorna `{ error: string }` (não lança — o cliente mostra o erro)

```typescript
type OcrResult = { text: string; error?: never } | { text?: never; error: string }
```

### 3. `components/EssayForm.tsx` — UI de upload + textarea controlado

**Textarea controlado:**
- `useState('')` para `content`
- `charCount` derivado de `content.trim().length` (sem estado separado)
- OCR injeta texto via `setContent(result.text)`

**Área de OCR:**
- Input `file` (accept: jpeg/png/webp) com `ref` para reset após extração
- Botão "Extrair texto da imagem" — `useTransition` para chamar a Server Action
- Estado de loading: "Extraindo..." durante `isPendingOcr`
- Em caso de erro: mensagem em vermelho abaixo do input
- Em caso de sucesso: aviso âmbar "Revise o texto antes de enviar"
- Aviso desaparece quando o usuário edita o textarea (confirmação implícita de revisão)

### 4. `.env.example`

```
GROQ_VISION_MODEL=
```

---

## Fluxo completo

```
Usuário seleciona foto → clica "Extrair texto"
  → extractEssayTextFromImage(formData) [Server Action]
    → auth check
    → validação tipo/tamanho
    → base64
    → extractTextFromImage(base64, mimeType) [groqOcr]
      → Groq Vision API (llama-4-scout)
      → retorna texto extraído
    → { text }
  → setContent(text) — preenche textarea
  → aviso âmbar aparece
Usuário revisa → edita se necessário → "Enviar redação"
```

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `apps/web/lib/groqOcr.ts` | criado — serviço Groq Vision |
| `apps/web/app/actions/ocr.ts` | criado — Server Action com auth + validação |
| `apps/web/components/EssayForm.tsx` | textarea controlado + área OCR |
| `apps/web/.env.example` | `GROQ_VISION_MODEL=` adicionado |

---

## Como testar

1. `npm run dev` → acessar `/redacao/nova`
2. Selecionar uma foto de redação manuscrita (JPEG/PNG/WebP, < 8 MB)
3. Clicar "Extrair texto da imagem"
4. Verificar: textarea preenchido com o texto extraído
5. Verificar: aviso âmbar aparece
6. Editar uma palavra → aviso desaparece
7. Enviar a redação normalmente

**Testes de erro:**
- Arquivo > 8 MB → mensagem "Imagem muito grande"
- Arquivo PDF → mensagem "Formato não suportado"
- Clicar "Extrair" sem selecionar arquivo → nada acontece (guarda sem ação)

---

## Limitações conhecidas

1. **Qualidade do OCR depende da foto** — iluminação ruim, texto inclinado ou ilegível produzem resultados ruins. O aviso de revisão é a principal salvaguarda.
2. **O modelo pode "melhorar" o texto** — apesar do prompt proibir, LLMs podem corrigir ortografia implicitamente.
3. **Sem feedback de progresso granular** — o estado é binário (extraindo / concluído); imagens grandes podem demorar sem indicação de progresso.
4. **Sem retry automático** — falha de rede ou timeout retorna erro; o usuário precisa tentar novamente.
