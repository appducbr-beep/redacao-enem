# Supabase Auth — Configuração de URLs

## Por que isso importa

O Supabase Auth redireciona o usuário para `/auth/callback` após confirmar e-mail, login OAuth ou recuperação de senha. Se a URL de callback não estiver na lista de permitidas, o Supabase bloqueia o redirect com erro.

---

## Onde configurar

**Supabase Dashboard → Authentication → URL Configuration**

Dois campos:

| Campo | Descrição |
|---|---|
| **Site URL** | URL principal da aplicação (usada como fallback) |
| **Redirect URLs** | Lista de URLs permitidas para redirect pós-auth |

---

## Configuração por ambiente

### Local (desenvolvimento)

```
Site URL:      http://localhost:3000
Redirect URLs: http://localhost:3000/auth/callback
```

### Vercel Preview (sandbox atual)

```
Site URL:      https://redacao-enem-green.vercel.app
Redirect URLs: https://redacao-enem-green.vercel.app/auth/callback
               https://*.vercel.app/auth/callback
```

> O padrão com wildcard (`https://*.vercel.app/auth/callback`) cobre todos os preview deployments automaticamente.

### Produção

```
Site URL:      https://reda1000.app.br

Redirect URLs: https://reda1000.app.br/auth/callback
               https://reda1000.app.br/reset-password
               https://www.reda1000.app.br/auth/callback
               https://redacao-enem-green.vercel.app/auth/callback
               https://*.vercel.app/auth/callback
               http://localhost:3000/auth/callback
               http://localhost:3000/reset-password
```

> Manter `redacao-enem-green.vercel.app` na lista mesmo após o domínio entrar em produção — os preview deployments continuam usando essa URL.

---

## Rotas de autenticação

### Callback

**Arquivo:** `app/auth/callback/route.ts`

Essa rota troca o `code` retornado pelo Supabase por uma sessão de usuário e redireciona conforme o param `next`.

```
GET /auth/callback?code=<code>
→ Cria sessão
→ Redireciona para / (default)

GET /auth/callback?code=<code>&next=/reset-password
→ Cria sessão (user autenticado para resetar senha)
→ Redireciona para /reset-password
```

### Reset de senha

**Arquivo:** `app/reset-password/page.tsx`

Página onde o usuário define a nova senha após chegar via email de reset.

Fluxo:
1. Usuário solicita reset em `/forgot-password`
2. Email enviado com link para `/auth/callback?next=/reset-password`
3. Callback cria sessão e redireciona para `/reset-password`
4. Usuário preenche nova senha + confirmação
5. `updatePassword` server action chama `supabase.auth.updateUser({ password })`
6. Redirect para `/login?reset=success`

---

## Checklist de configuração

- [ ] `http://localhost:3000/auth/callback` na lista de Redirect URLs
- [ ] `http://localhost:3000/reset-password` na lista de Redirect URLs (dev)
- [ ] `https://redacao-enem-green.vercel.app/auth/callback` na lista (sandbox/preview)
- [ ] `https://*.vercel.app/auth/callback` na lista (cobre previews futuros)
- [ ] **Antes do go-live:** Site URL atualizado para `https://reda1000.app.br`
- [ ] **Antes do go-live:** `https://reda1000.app.br/auth/callback` adicionado
- [ ] **Antes do go-live:** `https://reda1000.app.br/reset-password` adicionado
- [ ] **Antes do go-live:** `https://www.reda1000.app.br/auth/callback` adicionado
- [ ] Fluxo de login testado no domínio de produção
- [ ] Fluxo de reset de senha testado end-to-end
- [ ] SMTP personalizado configurado (ver `docs/launch/brevo-auth-emails.md`)

---

## Quando atualizar

Se o domínio mudar (ex: de `redacao-enem-green.vercel.app` para `reda1000.app.br`):

1. Supabase Dashboard → Authentication → URL Configuration
2. Atualizar **Site URL**
3. Adicionar nova URL em **Redirect URLs**
4. Não remover a URL antiga imediatamente — aguardar DNS propagar e testar

---

## Erro comum

```
Error: redirect_uri não está na lista de URLs permitidas
```

**Causa:** URL do ambiente não está cadastrada no Supabase.  
**Solução:** Adicionar a URL completa (incluindo `/auth/callback`) nas Redirect URLs.
