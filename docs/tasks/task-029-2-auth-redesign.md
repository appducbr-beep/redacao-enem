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

## QA (029.2)

- 75 testes passando, 0 erros de lint, build limpo
- `/login`, `/register`, `/forgot-password` renderizados como static (○)

---

## 029.3 — Premium Auth Pass

**Data:** 2026-05-12

### Objetivo

Elevar as telas de autenticação a uma experiência realmente premium: fundo vivo, topbar com identidade forte, hero com painel escuro sofisticado, card com vidro translúcido, inputs e botão de alto impacto.

### Componentes alterados

#### `AuthShell.tsx`
- Fundo: `bg-gradient-to-br from-slate-50 via-blue-50/40 to-white` — elimina sensação de tela plana
- Dois blur circles decorativos: azul claro (superior-esquerdo) e violeta suave (inferior-direito), `blur-3xl opacity baixa`
- Topbar: `bg-white/70 backdrop-blur-md border-b border-white/60 shadow-sm` — efeito glass
- Logo expandido: ícone "R" `rounded-xl` + nome "Reda1000" + tagline `"Correção de redação ENEM"` em 10px
- Nova prop `topbarAction?: React.ReactNode` — cada página passa o link secundário (ex: "Criar conta" no login, "Entrar" no cadastro)
- `<main>` com `min-h-[calc(100vh-68px)] flex items-center` — conteúdo sempre centralizado verticalmente

#### `AuthHero.tsx`
- Badge: `"Preparação ENEM • Feedback por competência"`
- Título: `"Treine redação com clareza, método e evolução real."`
- Subtítulo: explicação sobre diagnósticos por competência
- Painel escuro premium: `from-blue-800 to-blue-950 rounded-3xl shadow-2xl`
  - Header com emoji ✍️ em `bg-white/15 rounded-2xl`
  - 3 mini-cards dentro: `bg-white/10 border-white/15 rounded-2xl` — "C1–C5 avaliadas", "Histórico completo", "Evolução por nota"
  - Evita cards brancos empilhados fora do painel (padrão anterior)

#### `AuthCard.tsx`
- Nova prop `icon?: string` — renderiza emoji em container `w-14 h-14 rounded-2xl bg-blue-50 border-blue-100`
- Glass: `bg-white/90 backdrop-blur-md border border-white/70 shadow-2xl rounded-3xl`
- Substituiu `rounded-2xl shadow-md border-slate-200` pelo visual glass mais sofisticado

### Páginas atualizadas

#### `/login`
- `topbarAction`: link "Criar conta" → `/register`
- Subtítulo: `"Continue sua jornada rumo a uma redação mais forte."`
- Inputs: `h-12 rounded-2xl bg-slate-50 focus:ring-4 focus:ring-blue-100`
- Botão: `bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-600/20 h-12 rounded-2xl`
- Texto do botão: `"Entrar na plataforma"`
- CTA envolvida em `bg-slate-50 rounded-2xl px-4 py-3.5`

#### `/register`
- `topbarAction`: link "Entrar" → `/login`
- Subtítulo: `"Comece com créditos gratuitos e veja como sua redação pode evoluir."`
- Placeholder na senha: `"Mínimo 6 caracteres"` (substituiu hint solto abaixo do campo)
- Mesmos padrões de input e botão do login

#### `/forgot-password`
- `topbarAction`: link "Entrar" → `/login`
- Ícone: 🔑
- Info box azul: `bg-blue-50 border-blue-100` com instrução sobre verificar spam
- Texto do botão: `"Enviar instruções"`
- Link "← Voltar para o login" envolvido em `bg-slate-50 rounded-2xl` em ambos os estados

### Decisões de UX

- **`topbarAction` como prop vs. lógica interna**: passado pela página para manter AuthShell sem estado e sem dependências de rota.
- **Icon como string**: suficiente para emojis; evita complexidade de ReactNode para um detalhe decorativo.
- **`gap-16` no grid**: aumenta respiração entre hero e card, especialmente com o painel escuro mais volumoso.
- **CTA em `bg-slate-50 rounded-2xl`**: delimita a zona de ação secundária sem poluir o formulário.

### QA (029.3)

- 75 testes passando, 0 erros de lint, build limpo
- Todas as 3 páginas continuam estáticas (○)
