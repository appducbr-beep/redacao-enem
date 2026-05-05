-- ============================================================
-- Migration 014 — Função set_credit_balance
--
-- Define o saldo disponível de um usuário para um valor exato.
-- Usada pelo webhook Asaas (PAYMENT_CONFIRMED) para resetar
-- créditos Pro a 20 a cada ciclo, sem acumulação.
--
-- Regra de negócio:
--   Pro Mensal: 20 créditos por ciclo mensal
--   Pro Anual:  20 créditos por ciclo mensal (mesmo que pague anual)
--   Créditos NÃO são acumulativos — cada ciclo redefine para 20.
--
-- Design:
--   credits_available é GENERATED ALWAYS AS (total - used) STORED.
--   Para setar available = N: credits_total := credits_used + N.
--   Preserva credits_used intacto.
--   A diferença (positiva ou negativa) é registrada em credit_transactions.
--
-- Idempotência:
--   Se chamada duas vezes com mesmo alvo, saldo fica 20 em ambas.
--   Não há acumulação acidental.
-- ============================================================

create or replace function public.set_credit_balance(
  target_user_id    uuid,
  available_credits integer,
  reason            text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_available integer;
  v_current_used      integer;
  v_diff              integer;
begin
  if available_credits < 0 then
    raise exception 'set_credit_balance: available_credits cannot be negative (received: %)',
      available_credits;
  end if;

  -- Bloqueia a linha para operação atômica (evita race condition)
  select credits_available, credits_used
  into   v_current_available, v_current_used
  from   public.credit_wallets
  where  user_id = target_user_id
  for    update;

  if not found then
    raise exception 'set_credit_balance: wallet not found for user %', target_user_id;
  end if;

  v_diff := available_credits - v_current_available;

  -- Ajusta credits_total de forma que (total - used) = available_credits
  -- CHECK constraint (credits_used <= credits_total) sempre satisfeita pois available >= 0
  update public.credit_wallets
  set    credits_total = v_current_used + available_credits,
         updated_at    = now()
  where  user_id = target_user_id;

  -- Registra auditoria somente se houve mudança real
  -- amount = diferença aplicada (pode ser negativo: ex. 25 → 20 = -5)
  if v_diff != 0 then
    insert into public.credit_transactions (user_id, amount, transaction_type, reason)
    values (target_user_id, v_diff, 'adjustment', reason);
  end if;
end;
$$;

comment on function public.set_credit_balance(uuid, integer, text) is
  'Define o saldo disponível para exatamente available_credits. '
  'Preserva credits_used. Registra adjustment em credit_transactions. '
  'Idempotente: chamadas repetidas com mesmo alvo resultam no mesmo saldo.';
