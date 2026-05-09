# Vercel — Guia de Deploy

## Configuração do projeto

| Parâmetro | Valor |
|---|---|
| **Root Directory** | `apps/web` |
| **Framework** | Next.js (detectado automaticamente) |
| **Build Command** | `next build` (padrão) |
| **Output Directory** | `.next` (padrão) |
| **Node Version** | 20.x ou superior |

> ⚠️ O Root Directory **deve** ser `apps/web` — o repositório é um monorepo.
> Configurar em: Vercel Dashboard → Project → Settings → General → Root Directory.

---

## Passo a passo: configurar variáveis de ambiente

1. Vercel Dashboard → selecionar o projeto `reda1000`
2. Ir em **Settings → Environment Variables**
3. Para cada variável:
   - Clicar em **Add New**
   - Preencher **Key** e **Value**
   - Selecionar os ambientes (Preview, Production ou ambos)
   - Clicar em **Save**
4. Após adicionar todas as variáveis: **Deployments → Redeploy** (o último deployment)

---

## Variáveis obrigatórias

### Compartilhadas (Preview + Production — mesmo valor)

| Variável | Exemplo / Onde obter |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (**sensível**) |
| `OPENAI_API_KEY` | platform.openai.com → API Keys (**sensível**) |
| `OPENAI_MODEL` | `gpt-4o` |
| `GROQ_API_KEY` | console.groq.com (**sensível**) |
| `GROQ_VISION_MODEL` | `meta-llama/llama-4-scout-17b-16e-instruct` |
| `CRON_SECRET` | `openssl rand -hex 32` (**sensível**) |

### Específicas por ambiente

| Variável | Preview | Production |
|---|---|---|
| `ASAAS_ENV` | `sandbox` | `production` |
| `ASAAS_API_KEY` | chave sandbox (`$aact_...`) | chave de produção (**sensível**) |
| `ASAAS_BASE_URL` | `https://sandbox.asaas.com/api/v3` | `https://api.asaas.com/v3` |
| `ASAAS_WEBHOOK_TOKEN` | token sandbox | token produção (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | `https://redacao-enem-green.vercel.app` | `https://reda1000.app.br` |

---

## URL atual (sandbox / preview)

```
https://redacao-enem-green.vercel.app
```

Webhook Asaas configurado para:
```
https://redacao-enem-green.vercel.app/api/asaas/webhook
```

---

## Quando usar sandbox vs produção

| Situação | `ASAAS_ENV` | `ASAAS_BASE_URL` |
|---|---|---|
| Desenvolvimento local | `sandbox` | sandbox URL |
| Vercel Preview (testes) | `sandbox` | sandbox URL |
| Vercel Production (go-live) | `production` | produção URL |

> Nunca colocar `ASAAS_ENV=production` em Preview — pode criar cobranças reais acidentais.

---

## Como forçar redeploy após alterar variável

Após salvar uma variável no Vercel:

1. Ir em **Deployments**
2. Clicar nos três pontos (`...`) do deployment mais recente
3. Clicar em **Redeploy**
4. Confirmar com **Redeploy**

O novo deployment já vai usar os valores atualizados.

---

## Cron Job (vercel.json)

O arquivo `apps/web/vercel.json` define o cron diário:

```json
{
  "crons": [
    {
      "path": "/api/cron/subscriptions",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule:** `0 9 * * *` = 09:00 UTC diário (06:00 BRT).

> ✅ O endpoint aceita `Authorization: Bearer <CRON_SECRET>` (Vercel) e `x-cron-secret` (manual). Ambos os métodos funcionam.

---

## Checklist de deploy para produção

- [ ] Root Directory = `apps/web` confirmado
- [ ] Todas as variáveis configuradas em **Production**
- [ ] `ASAAS_ENV=production` em Production
- [ ] `ASAAS_BASE_URL=https://api.asaas.com/v3` em Production
- [ ] `NEXT_PUBLIC_APP_URL` = domínio real em Production
- [ ] Supabase Auth URL atualizada para domínio de produção
- [ ] Webhook Asaas configurado com URL de produção
- [ ] `npm run qa` passando localmente antes do deploy
- [ ] Redeploy feito após configurar variáveis
