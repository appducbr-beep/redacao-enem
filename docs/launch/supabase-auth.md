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

### Produção futura

```
Site URL:      https://reda1000.app.br
Redirect URLs: https://reda1000.app.br/auth/callback
```

---

## Rota de callback

**Arquivo:** `app/auth/callback/route.ts`

Essa rota troca o `code` retornado pelo Supabase por uma sessão de usuário e redireciona para o dashboard.

```
GET /auth/callback?code=<code>
→ Cria sessão
→ Redireciona para /
```

---

## Checklist de configuração

- [ ] `http://localhost:3000/auth/callback` na lista de Redirect URLs
- [ ] `https://redacao-enem-green.vercel.app/auth/callback` na lista (sandbox)
- [ ] `https://*.vercel.app/auth/callback` na lista (cobre previews futuros)
- [ ] Site URL atualizado para domínio de produção antes do go-live
- [ ] Redirect URL de produção adicionada antes do go-live

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
