# Checklist de Ambientes — Reda1000

Estado esperado de cada ambiente antes e após o lançamento.

---

## A) Local (desenvolvimento)

| Item | Valor esperado |
|---|---|
| URL base | `http://localhost:3000` |
| `ASAAS_ENV` | `sandbox` |
| `ASAAS_BASE_URL` | `https://sandbox.asaas.com/api/v3` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| Webhook ativo | Via ngrok: `https://<id>.ngrok.io/api/asaas/webhook` |
| Supabase Auth redirect | `http://localhost:3000/auth/callback` |
| Banco | Supabase remoto (shared com preview) |

**Variáveis obrigatórias em `.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
GROQ_API_KEY
ASAAS_ENV=sandbox
ASAAS_API_KEY         # chave sandbox
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN
CRON_SECRET
```

---

## B) Vercel Preview

| Item | Valor esperado |
|---|---|
| URL base | `https://redacao-enem-green.vercel.app` (ou preview gerado) |
| `ASAAS_ENV` | `sandbox` |
| `ASAAS_BASE_URL` | `https://sandbox.asaas.com/api/v3` |
| Webhook ativo | `https://redacao-enem-green.vercel.app/api/asaas/webhook` |
| Supabase Auth redirect | `https://redacao-enem-green.vercel.app/auth/callback` |
| Banco | Supabase remoto (shared com local) |

**Status atual:** ⚠️ Verificar se todas as variáveis estão configuradas no Vercel para o ambiente Preview.

---

## C) Vercel Production

| Item | Valor esperado |
|---|---|
| URL base | `https://reda1000.app.br` (domínio futuro) |
| `ASAAS_ENV` | `production` |
| `ASAAS_BASE_URL` | `https://api.asaas.com/v3` |
| `ASAAS_API_KEY` | Chave de produção (diferente da sandbox) |
| Webhook ativo | `https://reda1000.app.br/api/asaas/webhook` |
| Supabase Auth redirect | `https://reda1000.app.br/auth/callback` |
| Banco | Supabase remoto (produção) |
| Cron | `vercel.json` → `0 9 * * *` |

**Status atual:** 🔲 Não configurado — fazer antes do go-live.

**Variáveis que DIFEREM do Preview:**
```
ASAAS_ENV=production
ASAAS_API_KEY         # chave de produção
ASAAS_BASE_URL=https://api.asaas.com/v3
ASAAS_WEBHOOK_TOKEN   # novo token para produção
NEXT_PUBLIC_APP_URL=https://reda1000.app.br
```

---

## D) Asaas Sandbox

| Item | Valor esperado |
|---|---|
| Dashboard | `https://sandbox.asaas.com` |
| API URL | `https://sandbox.asaas.com/api/v3` |
| Webhook configurado | `https://redacao-enem-green.vercel.app/api/asaas/webhook` |
| Eventos selecionados | `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `SUBSCRIPTION_CANCELLED`, `SUBSCRIPTION_DELETED` |
| Token webhook | Valor de `ASAAS_WEBHOOK_TOKEN` (sandbox) |
| Cobranças reais | Não |

**Status atual:** ⚠️ Verificar se webhook está configurado com a URL do preview.

---

## E) Asaas Production

| Item | Valor esperado |
|---|---|
| Dashboard | `https://www.asaas.com` |
| API URL | `https://api.asaas.com/v3` |
| Webhook configurado | `https://reda1000.app.br/api/asaas/webhook` |
| Eventos selecionados | `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `SUBSCRIPTION_CANCELLED`, `SUBSCRIPTION_DELETED` |
| Token webhook | Valor de `ASAAS_WEBHOOK_TOKEN` (produção, diferente do sandbox) |
| Cobranças reais | Sim |

**Status atual:** 🔲 Não configurado — fazer antes do go-live.

---

## F) Supabase Auth

| Item | Valor esperado |
|---|---|
| Site URL (preview/sandbox) | `https://redacao-enem-green.vercel.app` |
| Site URL (produção) | `https://reda1000.app.br` |
| Redirect URLs | `http://localhost:3000/auth/callback` |
| | `https://redacao-enem-green.vercel.app/auth/callback` |
| | `https://*.vercel.app/auth/callback` |
| | `https://reda1000.app.br/auth/callback` (adicionar antes do go-live) |
| | `https://www.reda1000.app.br/auth/callback` (adicionar antes do go-live) |

**Status atual:** ⚠️ Verificar se redirect URLs incluem o domínio do preview.

Ver guia completo em `docs/launch/supabase-auth.md`.

---

## Resumo de status

| Ambiente | Status |
|---|---|
| Local | ✅ Funcional com `.env.local` |
| Vercel Preview | ⚠️ Verificar variáveis e webhook |
| Vercel Production | 🔲 Não configurado |
| Asaas Sandbox | ⚠️ Verificar webhook URL |
| Asaas Production | 🔲 Não configurado |
| Supabase Auth | ⚠️ Verificar redirect URLs |
