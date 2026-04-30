# Task 010 — Sistema de Créditos (infraestrutura)

**Status:** concluída  
**Data:** 2026-04-26  
**Responsável:** Claude Code (operador técnico)  
**Referências:** spec 02 v0.5, task-009

---

## Objetivo

Criar a infraestrutura de créditos: tabelas, funções SECURITY DEFINER, trigger automático para novos usuários e backfill de usuários existentes. Exibir saldo na home.

**Fora de escopo nesta task:** envio de redação, integração IA, integração Asaas.

---

## Arquivos criados / alterados

| Arquivo | Ação | Descrição |
|---|---|---|
| `supabase/migrations/20260426000012_create_credit_system.sql` | criado | Tabelas, funções, trigger, RLS, backfill |
| `apps/web/app/page.tsx` | alterado | Exibe créditos disponíveis na home |
| `docs/specs/02-banco-de-dados.md` | alterado | v0.5: `credit_wallets`, `credit_transactions`, funções, diagrama |

---

## SQL criado — visão geral

### Tabelas

**`credit_wallets`** — uma linha por usuário:
```sql
credits_available  GENERATED ALWAYS AS (credits_total - credits_used) STORED
```
CHECK garante `credits_used <= credits_total`, então `credits_available >= 0` sempre.

**`credit_transactions`** — log imutável:
```sql
transaction_type  IN ('grant', 'consume', 'refund', 'adjustment')
```

### Funções SECURITY DEFINER

| Função | Descrição |
|---|---|
| `get_available_credits(p_user_id)` | Retorna saldo. NULL se wallet não existe. STABLE. |
| `grant_credits(p_user_id, p_amount, p_reason)` | Aumenta `credits_total`. Lança exceção se amount ≤ 0 ou wallet não existe. |
| `consume_credit(p_user_id, p_essay_id, p_reason)` | Aumenta `credits_used`. **FOR UPDATE** para prevenir race condition. Atualiza `essays.credit_consumed = true`. |
| `refund_credit(p_user_id, p_essay_id, p_reason)` | Reduz `credits_used` (mín. 0). Atualiza `essays.credit_consumed = false`. |

### Trigger

`on_profile_created` → `handle_new_profile_wallet()` — dispara `AFTER INSERT ON profiles`:
- Cria `credit_wallets` com `credits_total = 3`, `source = 'free_signup'`
- Registra transação `+3 | grant | free_signup`

### Backfill (idempotente)

```sql
WITH new_wallets AS (
  INSERT INTO credit_wallets (user_id, credits_total, source)
  SELECT id, 3, 'free_signup' FROM profiles
  WHERE NOT EXISTS (SELECT 1 FROM credit_wallets WHERE user_id = profiles.id)
  RETURNING user_id
)
INSERT INTO credit_transactions (user_id, amount, transaction_type, reason)
SELECT user_id, 3, 'grant', 'free_signup' FROM new_wallets;
```

Seguro para re-execução: `WHERE NOT EXISTS` evita wallets duplicadas.

---

## Como aplicar a migration

Execute no **Supabase Dashboard → SQL Editor**, nesta ordem:

1. `supabase/migrations/20260426000012_create_credit_system.sql`

A migration é idempotente em relação ao backfill. Aplique apenas uma vez. Se precisar re-executar parcialmente, o backfill pode ser re-executado isoladamente sem duplicar dados.

---

## Como testar no Supabase (SQL Editor)

### 1. Verificar wallets dos usuários existentes
```sql
SELECT u.email, cw.credits_total, cw.credits_used, cw.credits_available, cw.source
FROM auth.users u
JOIN public.credit_wallets cw ON cw.user_id = u.id
ORDER BY cw.created_at;
```
**Esperado:** todos os usuários existentes têm wallet com `credits_available = 3`.

### 2. Verificar transações iniciais
```sql
SELECT ct.transaction_type, ct.amount, ct.reason, ct.created_at
FROM public.credit_transactions ct
ORDER BY ct.created_at;
```
**Esperado:** uma linha `grant | 3 | free_signup` por usuário.

### 3. Testar trigger com novo usuário
Criar um novo usuário via Supabase Auth → verificar que wallet e transação foram criados automaticamente.

### 4. Testar `get_available_credits`
```sql
-- Substitua pelo UUID de um usuário real
SELECT public.get_available_credits('seu-user-uuid-aqui');
```
**Esperado:** `3`

### 5. Testar `grant_credits`
```sql
SELECT public.grant_credits('seu-user-uuid-aqui', 5, 'test_grant');
SELECT * FROM public.credit_wallets WHERE user_id = 'seu-user-uuid-aqui';
```
**Esperado:** `credits_total = 8`, `credits_available = 8`

### 6. Testar `consume_credit` (requer essay existente)
```sql
-- Só pode ser testado após Task 011 (envio de redação).
-- Exemplo futuro:
SELECT public.consume_credit('user-uuid', 'essay-uuid', 'test_consume');
```

### 7. Testar erro de saldo insuficiente
```sql
-- Tente consumir mais créditos do que o disponível:
DO $$
BEGIN
  PERFORM public.consume_credit('seu-user-uuid-aqui', gen_random_uuid(), 'test');
  PERFORM public.consume_credit('seu-user-uuid-aqui', gen_random_uuid(), 'test');
  PERFORM public.consume_credit('seu-user-uuid-aqui', gen_random_uuid(), 'test');
  PERFORM public.consume_credit('seu-user-uuid-aqui', gen_random_uuid(), 'test'); -- deve falhar
END;
$$;
```
**Esperado:** exceção `consume_credit: insufficient credits`.

---

## Como testar no frontend

1. Aplicar a migration
2. `cd apps/web && npm run dev`
3. Acessar `http://localhost:3000` autenticado
4. **Esperado:** linha "Créditos disponíveis — **3**" na home
5. Se a wallet ainda não existir: "Créditos ainda não carregados"
6. Fazer logout → a linha de créditos desaparece

---

## Notas sobre `profiles.credits`

O campo `profiles.credits` (migration 002) é mantido por compatibilidade. A partir desta task, **`credit_wallets.credits_available` é a fonte canônica**. O campo legado não é sincronizado automaticamente — isso pode ser removido em refactor futuro.

---

## Limitações conhecidas

1. **`consume_credit` não pode ser testada no frontend ainda** — requer envio de redação (Task 011)
2. **Créditos Pro não renovam automaticamente** — renovação é responsabilidade do webhook Asaas (Task futura)
3. **`profiles.credits` e `credit_wallets` não estão sincronizados** — campo legado não é atualizado
4. **Sem expiração de créditos Free** — créditos Free são permanentes na V1 (especificado pelo negócio)
5. **`grant_credits` só pode ser chamada via SQL Editor ou backend** — sem interface admin ainda

---

## Próxima task sugerida

**Task 011 — Envio de Redação**
- Criar página `/redacoes/nova?tema=<id>`
- Formulário de texto para a redação
- Verificar `get_available_credits()` antes de aceitar envio
- Chamar `consume_credit()` ao criar a redação
- Salvar em `essays` com status `pending`
