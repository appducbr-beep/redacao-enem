# Spec 03 — Fluxo de Autenticação

**Status:** rascunho  
**Versão:** 0.1  
**Última atualização:** 2026-04-25

---

## Objetivo

Definir como usuários se registram, fazem login e como a sessão é gerenciada.

## Tecnologia

- **Supabase Auth** como provedor de identidade
- JWT emitido pelo Supabase, validado nas API Routes
- Cookies HTTP-only via `@supabase/ssr`

## Fluxos previstos

### Registro
1. Usuário preenche e-mail + senha (ou clica em "Entrar com Google")
2. Supabase cria o registro em `auth.users`
3. Trigger cria automaticamente o registro em `profiles`
4. E-mail de confirmação é enviado (Supabase SMTP)
5. Usuário confirma e é redirecionado ao dashboard

### Login com e-mail/senha
1. Usuário informa credenciais
2. Supabase valida e retorna `access_token` + `refresh_token`
3. Tokens armazenados em cookies HTTP-only
4. Redirect para `/dashboard`

### Login social (Google)
1. Usuário clica em "Entrar com Google"
2. Redirect OAuth para Google
3. Callback retorna ao Supabase
4. Sessão criada normalmente

### Recuperação de senha
1. Usuário informa e-mail
2. Supabase envia link de reset
3. Usuário define nova senha

### Logout
1. Supabase invalida a sessão
2. Cookies removidos
3. Redirect para `/`

## Proteção de rotas

- Rotas `/dashboard/**` e `/api/**` exigem sessão válida
- Middleware Next.js intercepta e redireciona para `/login` se não autenticado
- API Routes verificam JWT no header `Authorization: Bearer <token>`

## Escopo desta spec

Fluxo de autenticação. Autorização por plano/créditos é coberta na spec de pagamentos.

## Fora de escopo

- SSO corporativo / SAML — versão futura
- 2FA — versão futura
