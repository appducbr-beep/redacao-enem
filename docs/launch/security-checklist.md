# Checklist de Segurança — Reda1000

Auditoria de segurança pré-lançamento. Itens marcados ✅ foram verificados por inspeção de código.

---

## Chaves e variáveis de ambiente

| Item | Status | Evidência |
|---|---|---|
| Nenhuma chave secreta com prefixo `NEXT_PUBLIC_` | ✅ | Auditado em `.env.example` e código |
| `SUPABASE_SERVICE_ROLE_KEY` apenas server-side | ✅ | Só importado em `lib/supabaseAdmin.ts` |
| `ASAAS_API_KEY` apenas server-side | ✅ | Só usado em `lib/asaas.ts` via Server Action |
| `OPENAI_API_KEY` apenas server-side | ✅ | Só usado em Server Actions de correção |
| `GROQ_API_KEY` apenas server-side | ✅ | Só usado em API Routes de OCR |
| `ASAAS_WEBHOOK_TOKEN` apenas server-side | ✅ | Validado no header, nunca exposto |
| `CRON_SECRET` apenas server-side | ✅ | Validado no header, nunca exposto |

---

## Supabase / Banco de dados

| Item | Status | Evidência |
|---|---|---|
| RLS habilitado nas tabelas críticas | ✅ | Verificado nas migrations |
| `supabaseAdmin` (service_role) nunca importado em Client Components | ✅ | Grep confirmou: só em `lib/supabaseAdmin.ts` e imports server-side |
| Server Actions validam sessão do usuário antes de mutações | ✅ | `createClient().auth.getUser()` em todas as actions |
| CPF não armazenado no banco | ✅ | CPF vai direto para Asaas via Server Action — nenhuma coluna no Supabase |
| Queries com `.eq('user_id', user.id)` em dados sensíveis | ✅ | Todos os fetches de subscription/wallet filtram por user_id |

---

## Webhook e Cron

| Item | Status | Evidência |
|---|---|---|
| Webhook valida `asaas-access-token` antes de processar | ✅ | `webhook/route.ts` retorna 401 se token inválido |
| Token logado apenas como `Boolean(token)`, nunca o valor real | ✅ | `console.log('[webhook] token received:', Boolean(receivedToken))` |
| Cron valida `x-cron-secret` antes de processar | ✅ | `cron/subscriptions/route.ts` retorna 401 se secret inválido |
| Webhook tem idempotência (`webhook_logs.asaas_event_id UNIQUE`) | ✅ | Eventos duplicados retornam `{ duplicate: true }` sem reprocessar |

---

## Dados sensíveis em logs

| Item | Status | Evidência |
|---|---|---|
| Nenhum `console.log` com chave de API | ✅ | Grep não encontrou ocorrências |
| `console.log("ASAAS_ENV:", ...)` removido | ✅ | Removido em Task 025 de `planos/page.tsx` |
| Logs de webhook sem payload de cartão | ✅ | Asaas não envia dados de cartão no webhook |

---

## Autenticação e sessões

| Item | Status | Evidência |
|---|---|---|
| Rotas protegidas redirecionam para `/login` se sem sessão | ✅ | `redirect('/login')` em Server Components |
| Logout limpa sessão Supabase | ✅ | `supabase.auth.signOut()` no `LogoutButton` |
| Tokens de sessão gerenciados pelo `@supabase/ssr` | ✅ | Cookies HTTPOnly via middleware |

---

## CPF (dado sensível de PF)

| Item | Status | Evidência |
|---|---|---|
| CPF não persistido no Supabase | ✅ | Nenhuma coluna `cpf` em `profiles` ou `subscriptions` |
| CPF transmitido apenas via HTTPS para Asaas | ✅ | Server Action → `lib/asaas.ts` → HTTPS Asaas API |
| Usuário informado no modal que CPF vai apenas para Asaas | ✅ | Texto no `CpfModal.tsx`: "ele é enviado apenas ao Asaas" |

---

## Pendências de segurança antes do lançamento

| Prioridade | Item |
|---|---|
| 🔴 Alta | Definir spending limits na OpenAI (evitar cobranças inesperadas) |
| 🔴 Alta | Definir rate limits na Groq |
| 🟡 Média | `ASAAS_WEBHOOK_TOKEN` de produção gerado com `openssl rand -hex 32` (mínimo 32 bytes) |
| 🟡 Média | `CRON_SECRET` de produção gerado com `openssl rand -hex 32` |
| 🟡 Média | Rotacionar chaves sandbox → produção antes do go-live |
| 🟢 Baixa | Adicionar rate limiting na rota `/api/asaas/webhook` (Vercel Edge ou middleware) |
| 🟢 Baixa | Adicionar CORS explícito nas API Routes públicas |
