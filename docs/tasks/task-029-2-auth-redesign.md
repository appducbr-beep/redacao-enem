# Task 029.2 — Redesign Premium das Telas de Autenticação

**Status:** Concluída  
**Data:** 2026-05-11  
**Branch:** v2-pre-lancamento

---

## Objetivo

Substituir as três telas de autenticação (login, registro, recuperação de senha) por um layout premium de duas colunas usando componentes compartilhados.

---

## Componentes criados

### `components/auth/AuthShell.tsx`
Shell de layout para todas as páginas de autenticação. Contém:
- Topbar branca com borda (`bg-white border-b border-slate-200 h-[72px]`)
- Logo: ícone "R" azul + "Reda1000"
- `<main>` com `max-w-6xl mx-auto px-4 py-10 lg:py-16`

### `components/auth/AuthHero.tsx`
Coluna esquerda visível apenas em desktop (`hidden lg:flex`). Contém:
- Badge "Preparação ENEM · Plataforma do aluno"
- Título e descrição do produto
- Painel azul com gradiente (`from-blue-700 to-blue-600`) com três cards de benefícios:
  - Correção completa (C1–C5)
  - Histórico organizado
  - Evolução real

### `components/auth/AuthCard.tsx`
Card branco para o formulário (`bg-white rounded-2xl shadow-md border border-slate-200 px-8 py-10`).  
Props: `title`, `subtitle`, `children`.

---

## Páginas atualizadas

### `app/login/page.tsx`
- Layout: `AuthShell` → `grid grid-cols-1 lg:grid-cols-2 gap-12 items-center` → `AuthHero` + `AuthCard`
- Título: "Acesse sua conta"
- Subtítulo: "Entre para continuar seus treinos e acompanhar sua evolução."
- Link "Esqueci minha senha" alinhado à direita do label de senha
- Inputs: `rounded-xl`, `focus:ring-2 focus:ring-blue-100`
- Botão: `rounded-xl py-3.5 font-semibold shadow-sm`
- CTA: "Ainda não tem conta? Criar conta grátis → /register"

### `app/register/page.tsx`
- Mesmo layout de duas colunas
- Título: "Crie sua conta grátis"
- Subtítulo: "Comece com créditos gratuitos para testar a plataforma."
- Campos: nome completo, e-mail, senha (com hint "Mínimo de 6 caracteres")
- Botão: "Criar conta grátis"
- CTA: "Já tem conta? Entrar → /login"
- Mantém `full_name` via server action `signUp`

### `app/forgot-password/page.tsx`
- Mesmo layout de duas colunas
- Título: "Recuperar senha"
- Subtítulo: "Informe seu e-mail e enviaremos um link para redefinir sua senha."
- Campo: e-mail cadastrado
- Estado de sucesso: card verde dentro do `AuthCard` (sem redirect)
- Link "← Voltar para o login" em ambos os estados (formulário e sucesso)

---

## QA

- 75 testes passando, 0 erros de lint, build limpo
- `/login`, `/register`, `/forgot-password` renderizados como static (○)
