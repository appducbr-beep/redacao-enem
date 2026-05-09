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

## Variáveis de ambiente

### Onde configurar

Vercel Dashboard → Project → Settings → Environment Variables.

Cada variável pode ser definida para:
- **Development** — não usada (local usa `.env.local`)
- **Preview** — branches de feature, PRs
- **Production** — branch `main`

### Quais variáveis são necessárias

Ver tabela completa em `docs/launch/env-vars.md`.

### Diferença Preview vs Production

| Variável | Preview | Production |
|---|---|---|
| `ASAAS_ENV` | `sandbox` | `production` |
| `ASAAS_API_KEY` | chave sandbox | chave produção |
| `ASAAS_BASE_URL` | `https://sandbox.asaas.com/api/v3` | `https://api.asaas.com/v3` |
| `NEXT_PUBLIC_APP_URL` | URL do preview (gerada pelo Vercel) | `https://reda1000.com.br` |
| `ASAAS_WEBHOOK_TOKEN` | token de teste | token de produção |

---

## Quando fazer redeploy

| Situação | Ação |
|---|---|
| Mudança de variável de ambiente | Vercel Dashboard → Deployments → Redeploy |
| Push para `main` | Redeploy automático (se CI configurado) |
| Mudança de migration no Supabase | Aplicar migration + redeploy |
| Rotação de segredos (tokens, chaves) | Atualizar var + redeploy |

---

## Configurar Vercel Cron Job

> Não configurado ainda. Fazer antes do lançamento.

1. Vercel Dashboard → Project → Settings → Cron Jobs → Add Cron Job
2. Path: `/api/cron/subscriptions`
3. Schedule: `0 3 * * *` (03:00 UTC diário)
4. Adicionar header: `x-cron-secret: <valor de CRON_SECRET>`

Alternativa: usar serviço externo (cron-job.org, EasyCron) para chamar a rota com o header correto.

---

## URL atual (sandbox)

O projeto está em desenvolvimento. URL de produção a ser definida no go-live.

Para testes locais com ngrok:
```bash
ngrok http 3000
# Usar https://<id>.ngrok.io como base para webhook Asaas
```

---

## Checklist de deploy para produção

- [ ] `ASAAS_ENV=production` configurado
- [ ] `ASAAS_API_KEY` (produção) configurado
- [ ] `ASAAS_BASE_URL=https://api.asaas.com/v3` configurado
- [ ] `NEXT_PUBLIC_APP_URL` = domínio real
- [ ] Supabase Auth URL atualizada para domínio de produção
- [ ] Migrations aplicadas ao banco de produção
- [ ] Webhook Asaas configurado com URL de produção
- [ ] `npm run qa` passando localmente antes do deploy
