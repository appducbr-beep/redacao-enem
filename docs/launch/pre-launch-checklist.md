# Checklist pré-lançamento — Reda1000

**Legenda:** ✅ pronto | ⚠️ pendente | 🔲 não iniciado

---

## Ambiente

| Item | Status | Notas |
|---|---|---|
| `.env.local` configurado localmente | ✅ | Ver `docs/launch/env-vars.md` |
| Todas as vars obrigatórias documentadas | ✅ | Ver `docs/launch/env-vars.md` |
| Nenhuma variável sensível com `NEXT_PUBLIC_` | ✅ | Validado por inspeção |
| `lib/env.ts` criado para validação centralizada | ✅ | — |

---

## Vercel

| Item | Status | Notas |
|---|---|---|
| Root Directory = `apps/web` | ✅ | Configurado no projeto |
| Variáveis de ambiente configuradas em Production | ⚠️ | Fazer antes do go-live |
| `ASAAS_ENV=production` em Production | ⚠️ | Sandbox ok para testes |
| `ASAAS_BASE_URL=https://api.asaas.com/v3` em Production | ⚠️ | Sandbox ok para testes |
| Deploy automático no push para `main` | 🔲 | Verificar configuração |
| Ver `docs/launch/vercel.md` para guia completo | — | — |

---

## Supabase

| Item | Status | Notas |
|---|---|---|
| Migrations aplicadas ao banco (`supabase db push`) | ✅ | Confirmado: `supabase migration list` mostrou todas aplicadas até `20260507000015` |
| RLS habilitado nas tabelas críticas | ✅ | Verificado nas migrations |
| `service_role key` nunca exposta no client | ✅ | Usado apenas em Server Actions e API Routes |
| Auth redirect URL configurado para domínio de produção | ⚠️ | Supabase Dashboard → Auth → URL Configuration |
| Verificar tabelas: `subscriptions`, `credit_wallets`, `webhook_logs`, `asaas_payments` | ⚠️ | Rodar query de verificação |

---

## Asaas

| Item | Status | Notas |
|---|---|---|
| Webhook URL configurada no Asaas | ⚠️ | `POST /api/asaas/webhook` |
| `ASAAS_WEBHOOK_TOKEN` configurado e validado | ✅ | Header `asaas-access-token` |
| Eventos do webhook: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `SUBSCRIPTION_CANCELLED`, `SUBSCRIPTION_DELETED` | ✅ | Implementados |
| Pagamento de teste via sandbox funciona | ⚠️ | Testar com cartão sandbox |
| Webhook de teste recebido e processado | ⚠️ | Testar com ngrok |
| Ver `docs/launch/asaas.md` para guia completo | — | — |

---

## OpenAI

| Item | Status | Notas |
|---|---|---|
| `OPENAI_API_KEY` configurada | ✅ | Obrigatória |
| `OPENAI_MODEL` configurado (padrão: `gpt-4o`) | ✅ | — |
| Chave nunca exposta no client (`NEXT_PUBLIC_`) | ✅ | — |
| Limites de uso/cobrança configurados no painel OpenAI | ⚠️ | Definir spending limit antes do lançamento |

---

## Groq

| Item | Status | Notas |
|---|---|---|
| `GROQ_API_KEY` configurada | ✅ | Obrigatória para OCR |
| `GROQ_VISION_MODEL` configurado | ✅ | — |
| Chave nunca exposta no client | ✅ | — |

---

## Segurança

| Item | Status | Notas |
|---|---|---|
| Nenhuma chave de API no client-side | ✅ | Auditado |
| `console.log` com dados sensíveis removidos | ✅ | Removido `console.log("ASAAS_ENV")` em `planos/page.tsx` |
| Webhook valida token antes de processar | ✅ | Header `asaas-access-token` |
| Cron valida `CRON_SECRET` antes de processar | ✅ | Header `x-cron-secret` |
| Server Actions validam sessão antes de mutações | ✅ | `createClient().auth.getUser()` |
| `supabaseAdmin` (service_role) usado apenas server-side | ✅ | Nunca importado em componentes client |

---

## Testes

| Item | Status | Notas |
|---|---|---|
| `npm test` passa | ✅ | 68 testes, 5 arquivos |
| `npm run build` passa | ✅ | 0 erros TypeScript |
| `npm run lint` sem erros | ✅ | 2 warnings conhecidos (params `_prev`/`_formData`) |
| `npm run qa` passa end-to-end | ✅ | — |
| Testes unitários: `billingRules`, `cpfUtils` | ✅ | Task 023 |
| Testes de integração: webhook, cancelamento, cron | ✅ | Task 024 |
| QA manual executado | ⚠️ | Ver `docs/launch/manual-qa.md` |

---

## UX mínima

| Item | Status | Notas |
|---|---|---|
| Cadastro com nome + email + senha | ✅ | — |
| Login funcional | ✅ | — |
| Dashboard com saudação e créditos | ✅ | — |
| Nova redação (digitada e OCR) | ✅ | — |
| Correção por IA (C1–C5) | ✅ | — |
| Histórico de redações | ✅ | — |
| Evolução por competência | ✅ | — |
| Página de planos com preços | ✅ | — |
| Assinatura Pro via Asaas | ✅ | — |
| Cancelamento de assinatura | ✅ | — |
| Banner "renovação cancelada" no dashboard | ✅ | — |
| Banner "créditos esgotados" → upgrade CTA | ✅ | — |
| Temas exclusivos Pro bloqueados para free | ✅ | — |

---

## Logs

| Item | Status | Notas |
|---|---|---|
| Webhook loga eventos e erros | ✅ | `[webhook/asaas]` prefix |
| Cron loga resultados | ✅ | `[cron/subscriptions]` prefix |
| Billing loga cancelamentos | ✅ | `[billing]` prefix |
| Nenhum token/chave logado | ✅ | Token logado apenas como `Boolean` |
| Logs de produção acessíveis no Vercel | ⚠️ | Verificar após deploy |

---

## Pendências antes do lançamento

### Obrigatórias

1. ✅ **Migrations aplicadas** — `supabase migration list` confirmou todas aplicadas até `20260507000015`.

2. **Configurar variáveis de ambiente no Vercel (Production):**
   - `ASAAS_ENV=production`
   - `ASAAS_API_KEY` (chave de produção)
   - `ASAAS_BASE_URL=https://api.asaas.com/v3`
   - `ASAAS_WEBHOOK_TOKEN` (novo token para produção)
   - `CRON_SECRET`
   - Todas as demais vars

3. **Configurar webhook no Asaas (produção):**
   - URL: `https://reda1000.com.br/api/asaas/webhook` (ou domínio real)
   - Eventos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `SUBSCRIPTION_CANCELLED`, `SUBSCRIPTION_DELETED`

4. **Configurar Supabase Auth URL:**
   - Site URL: domínio de produção
   - Redirect URLs: `https://dominio.com/auth/callback`

5. **Executar QA manual completo** — ver `docs/launch/manual-qa.md`

### Recomendadas

6. ✅ **Vercel Cron Job:** `vercel.json` criado com schedule `0 9 * * *`. Endpoint aceita `Authorization: Bearer` (Vercel) e `x-cron-secret` (manual).

7. **Definir spending limits** na OpenAI e Groq antes de abrir para usuários.

8. **Cancelamento programado — Asaas DELETE:**
   - O cron não chama Asaas DELETE para cancelamentos após 7 dias ainda.
   - Monitorar manualmente no painel Asaas até implementação.

9. **Reembolso manual:**
   - `refund_required = true` sinaliza a necessidade, mas não processa automaticamente.
   - Verificar painel Asaas periodicamente.
