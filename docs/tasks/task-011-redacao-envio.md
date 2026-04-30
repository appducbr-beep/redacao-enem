# Task 011 — Envio de Redação

**Status:** concluída  
**Data:** 2026-04-26  
**Responsável:** Claude Code (operador técnico)  
**Referências:** spec 02 v0.5, task-010

---

## Objetivo

Implementar o fluxo completo de envio de redação: formulário com validação de texto, consumo de crédito atômico e página de confirmação.

**Fora de escopo nesta task:** correção IA (Groq), exibição da nota, histórico de redações.

---

## Arquivos criados / alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `apps/web/app/actions/essays.ts` | criado | Server Action `submitEssay` — validação + INSERT + consume_credit |
| `apps/web/components/EssayForm.tsx` | criado | Formulário Client Component com contador de caracteres |
| `apps/web/app/redacao/nova/page.tsx` | criado | Página `/redacao/nova?tema_id=<uuid>` |
| `apps/web/app/redacoes/[id]/page.tsx` | criado | Página de confirmação pós-envio |
| `apps/web/app/temas/[id]/page.tsx` | alterado | Botão "Começar redação" ativado (link para `/redacao/nova`) |

---

## Fluxo de envio (`submitEssay`)

1. **Autenticação** — `supabase.auth.getUser()`. Erro se não autenticado.
2. **E-mail confirmado** — `user.email_confirmed_at`. Erro se null.
3. **Parâmetros** — valida `tema_id` presente e `content` com trim.
4. **Tamanho do texto** — mínimo 800, máximo 4.500 caracteres.
5. **Acesso ao tema** — busca `essay_topics` (active=true). Verifica `is_free || isUserPro`.
6. **Créditos** — chama `get_available_credits(user_id)`. Erro se < 1.
7. **INSERT essay** — `status='pending'`, `credit_consumed=false` (default).
8. **consume_credit** — RPC `consume_credit(user_id, essay_id, 'essay_correction')`. Atômico via `FOR UPDATE`. Se falhar, retorna erro (crédito não debitado; essay fica orphan em `pending` — o pipeline ignora essays sem `credit_consumed=true`).
9. **UPDATE status** — `'pending'` → `'processing'`.
10. **Redirect** — `/redacoes/<essay_id>`.

### Status oficiais da aplicação

O enum `essay_status` (migration 001) define os únicos valores válidos. O ciclo de vida de uma redação segue dois caminhos possíveis:

```
pending → processing → done
pending → processing → error
```

| Valor | Quando é atribuído |
|---|---|
| `pending` | INSERT inicial — redação recebida, crédito ainda não consumido |
| `processing` | Após `consume_credit` com sucesso — redação na fila da IA |
| `done` | Pipeline IA concluiu a correção com sucesso |
| `error` | Pipeline IA falhou — `refund_credit` deve ser chamado |

Nenhum outro valor deve ser usado no código.

---

## Validação no cliente (`EssayForm`)

- Contador de caracteres em tempo real com `useState`
- Botão Submit desabilitado se `charCount < 800` ou `charCount > 4500`
- Feedback visual por cor: cinza → laranja (abaixo do mínimo) → verde (ok) → vermelho (excedeu)
- Mensagem "Faltam N caracteres" enquanto abaixo do mínimo

---

## Página `/redacao/nova`

- Server Component — valida acesso e créditos antes de renderizar o formulário
- Se `tema_id` ausente → `notFound()`
- Se tema inativo ou não encontrado → `notFound()`
- Se usuário free tentando tema Pro → `redirect('/temas/<id>')`
- Se créditos = 0 → exibe banner de upgrade em vez do formulário

---

## Página `/redacoes/[id]`

- Server Component — carrega essay por ID + `user_id = auth.uid()` (RLS implícito + filtro explícito)
- Status label: `pending → Aguardando | processing → Em correção | done → Corrigida | error → Erro`
- Join com `essay_topics(title)` para exibir nome do tema

---

## Como testar

### Pré-requisitos
1. Migrations 011 e 012 aplicadas no Supabase
2. Seed `001_essay_topics.sql` aplicado
3. `cd apps/web && npm run dev`

### Caminho feliz (usuário free, tema gratuito)
1. Login com usuário free (credits = 3)
2. Acessar `/temas` → clicar em tema gratuito → "Começar redação"
3. Escrever redação ≥ 800 chars
4. Clicar "Enviar redação"
5. **Esperado:** redirect para `/redacoes/<id>` com status "Em correção"
6. Verificar no Supabase: `credit_wallets.credits_used` = 1, `essays.credit_consumed` = true

### Validações
- Enviar com < 800 chars → botão bloqueado no cliente; erro no servidor se bypass
- Enviar tema Pro com conta free → erro "Este tema é exclusivo do plano Pro"
- Enviar com credits = 0 → banner de upgrade (sem formulário)

### Race condition
- Só pode ser testada manualmente: duas abas, ambas com 1 crédito disponível, envio simultâneo
- **Esperado:** apenas uma redação aceita; a outra recebe erro "Erro ao consumir crédito"

---

## Limitações conhecidas

1. **Sem pipeline IA** — essays ficam em `processing` indefinidamente até Task futura (Groq)
2. **Sem histórico** — não há página listando redações enviadas
3. **Essay orphan em falha de consume** — se `consume_credit` falhar após INSERT, a essay permanece em `pending` sem `credit_consumed`. Não afeta o usuário (crédito não debitado) mas gera lixo na tabela.
4. **Sem confirmação antes do envio** — o crédito é debitado imediatamente

---

## Próxima task sugerida

**Task 012 — Pipeline de Correção IA (Groq)**
- Endpoint `/api/corrections/process` (service_role) ou job programado
- Buscar essays com `status='processing'` e `credit_consumed=true`
- Chamar Groq com o prompt de correção ENEM (5 competências)
- Salvar resultado em `essay_corrections`
- Atualizar `essays.status = 'done'` (ou `'error'` + `refund_credit`)
