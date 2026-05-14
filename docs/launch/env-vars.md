# Variáveis de Ambiente — Reda1000

Referência completa para configurar `apps/web/.env.local` (dev) e Vercel Environment Variables (produção).

---

## Tabela de referência

| Variável | Obrigatória | Sensível | `NEXT_PUBLIC_`? | Ambientes | Descrição |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | Não | Sim | todos | URL pública do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Não | Sim | todos | Chave anônima do Supabase (segura para client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | **Sim** | **Nunca** | server-only | Bypassa RLS — apenas Server Actions e API Routes |
| `NEXT_PUBLIC_APP_URL` | Sim | Não | Sim | todos | URL base da aplicação. Dev: `http://localhost:3000`. Produção: `https://reda1000.app.br` |
| `OPENAI_API_KEY` | Sim | **Sim** | **Nunca** | server-only | Correção de redações por IA |
| `OPENAI_MODEL` | Não | Não | Não | server-only | Modelo OpenAI. Padrão: `gpt-4o` |
| `GROQ_API_KEY` | Sim | **Sim** | **Nunca** | server-only | OCR de redações manuscritas (Llama Vision) |
| `GROQ_VISION_MODEL` | Não | Não | Não | server-only | Modelo Groq Vision. Padrão: `meta-llama/llama-4-scout-17b-16e-instruct` |
| `ASAAS_ENV` | Sim | Não | Não | server-only | `sandbox` (dev/preview) ou `production` |
| `ASAAS_API_KEY` | Sim | **Sim** | **Nunca** | server-only | Chave de API do Asaas (sandbox começa com `$aact_`) |
| `ASAAS_BASE_URL` | Sim | Não | Não | server-only | `https://sandbox.asaas.com/api/v3` ou `https://api.asaas.com/v3` |
| `ASAAS_WEBHOOK_TOKEN` | Sim | **Sim** | **Nunca** | server-only | Token para validar chamadas do webhook Asaas |
| `CRON_SECRET` | Sim | **Sim** | **Nunca** | server-only | Token para autenticar `/api/cron/subscriptions` |

---

## Detalhes por variável

### Supabase

**`NEXT_PUBLIC_SUPABASE_URL`**
- Onde encontrar: Supabase Dashboard → Settings → API → Project URL
- Formato: `https://<project-id>.supabase.co`
- Seguro para expor: sim (identifica o projeto, não autentica)

**`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
- Onde encontrar: Supabase Dashboard → Settings → API → `anon public`
- Seguro para expor: sim (RLS protege os dados mesmo com a chave pública)

**`SUPABASE_SERVICE_ROLE_KEY`**
- Onde encontrar: Supabase Dashboard → Settings → API → `service_role`
- **Nunca usar em componentes React ou Client Components**
- Bypassa completamente o RLS — usar apenas em `supabaseAdmin` (server-side)

### OpenAI

**`OPENAI_API_KEY`**
- Gerar em: platform.openai.com → API Keys
- Usar em: Server Actions de correção
- Risco: chave exposta = cobranças não autorizadas

**`OPENAI_MODEL`**
- Default: `gpt-4o`
- Alternativas: `gpt-4o-mini` (mais barato), `gpt-4-turbo`

### Groq

**`GROQ_API_KEY`**
- Gerar em: console.groq.com
- Usar em: API Route de OCR

**`GROQ_VISION_MODEL`**
- Default: `meta-llama/llama-4-scout-17b-16e-instruct`

### Asaas

**`ASAAS_ENV`**
- `sandbox` — ambiente de testes (sem cobrança real)
- `production` — ambiente real (cobranças reais)
- Mudar para `production` SOMENTE após testes completos

**`ASAAS_API_KEY`**
- Sandbox: começa com `$aact_`
- Produção: chave separada, gerada no painel Asaas produção
- Usar em: `lib/asaas.ts` somente

**`ASAAS_BASE_URL`**
- Sandbox: `https://sandbox.asaas.com/api/v3`
- Produção: `https://api.asaas.com/v3`

**`ASAAS_WEBHOOK_TOKEN`**
- Gerar: `openssl rand -hex 32`
- Configurar no Asaas Dashboard ao criar o webhook
- Asaas envia no header `asaas-access-token` de cada evento

### Cron

**`CRON_SECRET`**
- Gerar: `openssl rand -hex 32`
- Configurar como header `x-cron-secret` no Vercel Cron ou chamadas manuais
- Nunca expor publicamente

---

## Configuração por ambiente

| Variável | Local (dev) | Preview (Vercel) | Production (Vercel) |
|---|---|---|---|
| `ASAAS_ENV` | `sandbox` | `sandbox` | `production` |
| `ASAAS_API_KEY` | chave sandbox | chave sandbox | chave produção |
| `ASAAS_BASE_URL` | sandbox URL | sandbox URL | produção URL |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://redacao-enem-green.vercel.app` | `https://reda1000.app.br` |
| Demais | `.env.local` | Vercel vars | Vercel vars |

---

## Gerar segredos

```bash
# ASAAS_WEBHOOK_TOKEN
openssl rand -hex 32

# CRON_SECRET
openssl rand -hex 32
```

---

## Verificação rápida

Para checar se todas as vars obrigatórias estão configuradas:

```bash
# Localmente
cat apps/web/.env.local | grep -v "^#" | grep "=$"
# Linhas com valor vazio serão listadas
```

No Vercel, verificar em: Settings → Environment Variables.
