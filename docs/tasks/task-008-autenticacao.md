# Task 008 — Autenticação com Supabase Auth

**Status:** concluída  
**Data:** 2026-04-25  
**Responsável:** Claude Code (operador técnico)  
**Referências:** spec 02 v0.4, task-007

---

## Objetivo

Implementar autenticação básica com Supabase Auth no frontend Next.js: login, cadastro, recuperação de senha e logout. Exibir estado autenticado na página inicial.

---

## Arquivos criados / alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `apps/web/lib/supabaseServer.ts` | criado | Cliente Supabase server-side com `createServerClient` e cookies assíncronos |
| `apps/web/proxy.ts` | criado | Proxy Next.js 16 para refresh automático de sessão Supabase |
| `apps/web/app/auth/callback/route.ts` | criado | Route Handler para troca de código por sessão (confirmação de e-mail) |
| `apps/web/app/actions/auth.ts` | criado | Server Actions: `signIn`, `signUp`, `forgotPassword`, `signOut` |
| `apps/web/components/LogoutButton.tsx` | criado | Botão de logout (Client Component com `useTransition`) |
| `apps/web/app/login/page.tsx` | criado | Página de login com formulário email+senha |
| `apps/web/app/register/page.tsx` | criado | Página de cadastro com formulário email+senha |
| `apps/web/app/forgot-password/page.tsx` | criado | Página de recuperação de senha |
| `apps/web/app/page.tsx` | alterado | Convertido para Server Component; exibe estado autenticado e temas |

---

## Decisões técnicas importantes

### Next.js 16: `proxy.ts` em vez de `middleware.ts`

No Next.js 16, o Middleware foi renomeado para Proxy. O arquivo correto é `proxy.ts` na raiz de `apps/web/`, e a função exportada deve se chamar `proxy` (não `middleware`).

```typescript
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: [...] }
```

### `@supabase/ssr` v0.10: `getAll` + `setAll` com `headers`

A API moderna exige `getAll` e `setAll` (os métodos `get`/`set`/`remove` estão deprecados). O `setAll` recebe um segundo parâmetro `headers` para cache-control obrigatório:

```typescript
setAll(cookiesToSet, headers) {
  cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
}
```

### `cookies()` é assíncrono

No Next.js 15+, `cookies()` de `next/headers` é async. Usar sempre `await cookies()`.

### Server Actions com `useActionState`

Os formulários usam o hook `useActionState` do React 19 para gerenciar estado de erro sem JavaScript extra. As actions retornam `{ error: string | null; success?: string }`.

---

## Arquitetura de autenticação

```
Requisição → proxy.ts → refresh sessão → rota
                         ↓
                    supabase.auth.getUser()
                    escreve cookies atualizados na resposta
```

- **proxy.ts**: cria `createServerClient` com `request.cookies` (leitura) e `response.cookies` (escrita). Chama `getUser()` para validar/renovar tokens em toda requisição.
- **supabaseServer.ts**: usado em Server Components, Server Actions e Route Handlers. Usa `await cookies()` de `next/headers`. `setAll` tem try/catch — Server Components não podem escrever cookies, mas o proxy já faz o refresh.
- **supabaseClient.ts**: mantido do Task 007, usado em Client Components quando necessário (sem auth).

---

## Fluxos de autenticação

### Login
1. Usuário preenche email+senha em `/login`
2. `signIn` Server Action chama `supabase.auth.signInWithPassword()`
3. Cookies de sessão escritos automaticamente pelo `createServerClient`
4. `redirect('/')` — página inicial mostra estado autenticado

### Cadastro
1. Usuário preenche email+senha em `/register`
2. `signUp` Server Action chama `supabase.auth.signUp()`
3. `enable_confirmations = false` no projeto → sessão criada imediatamente
4. `redirect('/')` — usuário já está autenticado

### Recuperação de senha
1. Usuário insere e-mail em `/forgot-password`
2. `forgotPassword` Server Action chama `supabase.auth.resetPasswordForEmail()`
3. Link enviado para o e-mail, aponta para `/auth/callback?next=/update-password`
4. Callback troca o código por sessão e redireciona

### Logout
1. `LogoutButton` chama `signOut` via `useTransition`
2. `signOut` Server Action chama `supabase.auth.signOut()`
3. `redirect('/login')`

### Callback de e-mail
1. Supabase envia link com `?code=...`
2. `/auth/callback` Route Handler chama `exchangeCodeForSession(code)`
3. Redireciona para `?next=` ou `/` por padrão

---

## Configuração necessária no Supabase Dashboard

Para que os redirecionamentos de e-mail funcionem em produção:

1. **Authentication → URL Configuration:**
   - Site URL: `https://seu-dominio.com`
   - Redirect URLs: `https://seu-dominio.com/auth/callback`

2. **Em desenvolvimento (`http://localhost:3000`)**, adicionar:
   - Redirect URLs: `http://localhost:3000/auth/callback`

---

## Efeito na homepage (`page.tsx`)

| Estado | O que aparece |
|---|---|
| Não autenticado | Botões "Entrar" e "Criar conta" |
| Autenticado | E-mail do usuário + botão Sair + lista de temas |
| Autenticado, sem temas cadastrados | E-mail + "Nenhum tema disponível" |
| Erro ao buscar temas | Mensagem de erro inline |

---

## Verificações realizadas

- [x] `npx tsc --noEmit` — sem erros TypeScript
- [x] `npm run lint` — sem erros ESLint
- [x] Nenhuma chave `service_role` exposta no frontend
- [x] `NEXT_PUBLIC_` apenas na anon key
- [x] `proxy.ts` (não `middleware.ts`) — correto para Next.js 16
- [x] `setAll` implementado com o parâmetro `headers` obrigatório do `@supabase/ssr` v0.10
- [x] `cookies()` sempre com `await`
- [x] `useActionState` do React 19 usado nos formulários
- [x] `signOut` no Server Action, `LogoutButton` como Client Component com `useTransition`

---

## Próxima task sugerida

**Task 009 — Submissão de Redação**
- Criar página `/nova-redacao` com seleção de tema e campo de texto
- Criar API Route para enviar redação ao modelo de IA (Groq)
- Salvar resultado em `essays` e `essay_corrections`
- Decrementar `profiles.credits` (operação atômica)

