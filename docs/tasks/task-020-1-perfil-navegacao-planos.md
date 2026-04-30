# Task 020.1 — Perfil do usuário e navegação para planos

**Status:** concluída  
**Data:** 2026-04-30  
**Responsável:** Claude Code (operador técnico)

---

## Objetivo

Corrigir dois problemas de produto antes de testar Asaas:

1. Dashboard mostrava email como saudação quando o usuário não tinha nome
2. A página /planos estava desconectada da navegação normal

---

## A) Coleta de nome no cadastro

**Arquivo:** `app/register/page.tsx`

Adicionado campo "Nome completo" (obrigatório) antes do e-mail.

**Como é salvo:**

```
/register form → signUp() Server Action → supabase.auth.signUp()
    → supabaseAdmin.from('profiles').update({ full_name }).eq('id', data.user.id)
```

- O trigger existente cria o perfil quando o usuário é criado em `auth.users`
- A Server Action atualiza `profiles.full_name` imediatamente após o signup
- CPF **não** é coletado no cadastro — apenas no momento de assinar (via CpfModal)
- O nome **não** é armazenado em `auth.users.user_metadata`, apenas em `profiles.full_name`

**Migration necessária:** nenhuma — `full_name` já existe em `profiles`

---

## B) Página de perfil

**Arquivo:** `app/perfil/page.tsx` (Server Component)  
**Arquivo:** `app/perfil/ProfileForm.tsx` (Client Component)  
**Arquivo:** `app/actions/profile.ts` (Server Action)

Campos disponíveis:
- Nome completo — editável
- E-mail — somente leitura (campo desabilitado)
- Plano atual — exibido com badge + botão "Ver planos Pro" se não for Pro

**Server Action `updateProfile`:**
- Valida autenticação via `createClient()` (anon key)
- Atualiza `profiles.full_name` via `supabaseAdmin` (service_role)
- Chama `revalidatePath('/perfil')` e `revalidatePath('/')` para refletir nome atualizado no dashboard

---

## C) Saudação do dashboard

**Arquivo:** `app/page.tsx`

| Situação | Saudação exibida |
|---|---|
| `profiles.full_name` preenchido | "Olá, [Primeiro Nome]!" |
| `profiles.full_name` vazio/null | "Olá! Complete seu perfil" |

Adicionado link "Editar perfil → /perfil" junto à linha de subtítulo do greeting.

---

## D) Navegação para /planos

### Dashboard (`app/page.tsx`)

| Situação | O que aparece |
|---|---|
| Usuário free | 4º card de ação "Planos Pro" → /planos (grid 2×2 no mobile, 4 colunas no desktop) |
| Créditos = 0 e plano free | Banner laranja "Créditos esgotados" com botão "Assinar Pro" → /planos |
| Usuário Pro | Grid 3 cards (sem card de planos); sem banner |

### Já existia (não alterado)

| Página | Onde aparece |
|---|---|
| `/temas` | "Assinar Pro" → /planos quando há temas Pro e usuário é free |
| `/redacao/nova` | "Ver planos" → /planos quando créditos = 0 |
| `/planos` | Botão Pro redireciona para /login se não autenticado; abre CpfModal se autenticado |

---

## Arquivos criados/alterados

| Arquivo | Tipo | Mudança |
|---|---|---|
| `app/register/page.tsx` | alterado | campo "Nome completo" adicionado |
| `app/actions/auth.ts` | alterado | `signUp` salva `full_name` em profiles |
| `app/actions/profile.ts` | criado | Server Action `updateProfile` |
| `app/perfil/page.tsx` | criado | página de perfil (Server Component) |
| `app/perfil/ProfileForm.tsx` | criado | formulário de edição (Client Component) |
| `app/page.tsx` | alterado | greeting, "Editar perfil", 4º card, banner créditos |

---

## Como testar

### Cadastro com nome
1. Acesse `/register`
2. Preencha Nome, E-mail, Senha
3. Após redirect para `/`, o dashboard deve mostrar "Olá, [Primeiro Nome]!"

### Usuário sem nome (migração de conta existente)
1. Acesse `/perfil`
2. Preencha o nome e clique "Salvar alterações"
3. Acesse `/` — saudação deve refletir o nome atualizado

### Dashboard — ver planos
1. Logado como usuário free: deve aparecer card "Planos Pro" (4º card)
2. Com créditos = 0: banner laranja "Créditos esgotados" aparece abaixo das stats

### Página de perfil
1. `/perfil` — exibe nome, email readonly, plano atual
2. Se free: botão "Ver planos Pro" → /planos
3. Editar nome → salvar → atualiza imediatamente no dashboard (revalidatePath)
