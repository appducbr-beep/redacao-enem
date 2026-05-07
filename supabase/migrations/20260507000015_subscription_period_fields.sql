-- ============================================================
-- Migration 015 — Campos de período e funções de manutenção
--
-- Adiciona em subscriptions (se não existirem):
--   cancel_at_period_end   — cancelamento programado (não imediato)
--   current_period_start   — início do ciclo atual
--   current_period_end     — fim do ciclo atual (data de expiração do acesso)
--   next_credit_reset_at   — próximo reset mensal de créditos (anual)
--   refund_required        — reembolso solicitado (cancelamento 7 dias)
--   refund_reason          — motivo do reembolso
--
-- Cria funções de manutenção (chamadas pelo cron):
--   process_subscription_credit_resets()  — resets mensais para plano anual
--   process_subscription_expirations()    — expira assinaturas com cancel_at_period_end
--
-- NÃO recria a tabela nem remove dados.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Campos adicionais em subscriptions
-- ------------------------------------------------------------

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- next_credit_reset_at: usado apenas para billing_cycle = 'yearly'
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS next_credit_reset_at timestamptz;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS refund_required boolean NOT NULL DEFAULT false;

-- Motivo do reembolso: '7_day_guarantee' ou texto livre
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS refund_reason text;

comment on column public.subscriptions.cancel_at_period_end is
  'True quando o usuário cancelou após 7 dias: acesso mantido até current_period_end.';
comment on column public.subscriptions.current_period_end is
  'Data de expiração do ciclo atual. Acesso Pro garantido até esta data.';
comment on column public.subscriptions.next_credit_reset_at is
  'Próxima data de reset mensal de créditos (anual). NULL para mensal.';
comment on column public.subscriptions.refund_required is
  'True quando o cancelamento ocorreu dentro de 7 dias e reembolso é devido.';

-- ------------------------------------------------------------
-- 2. Função: process_subscription_credit_resets
--
-- Reseta créditos para 20 em assinaturas anuais que atingiram
-- next_credit_reset_at e ainda estão dentro do período pago.
-- Retorna contagem de wallets resetadas.
-- ------------------------------------------------------------
create or replace function public.process_subscription_credit_resets()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_sub   record;
begin
  for v_sub in
    select id, user_id
    from   public.subscriptions
    where  status           = 'active'
      and  billing_cycle    = 'yearly'
      and  next_credit_reset_at <= now()
      and  current_period_end   >  now()
  loop
    perform public.set_credit_balance(
      v_sub.user_id,
      20,
      'annual_monthly_credit_reset'
    );

    update public.subscriptions
    set    next_credit_reset_at = next_credit_reset_at + interval '1 month'
    where  id = v_sub.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

comment on function public.process_subscription_credit_resets() is
  'Reseta créditos mensais para assinaturas anuais vencidas. '
  'Chamada pelo cron diário. Retorna nº de usuários processados.';

-- ------------------------------------------------------------
-- 3. Função: process_subscription_expirations
--
-- Para assinaturas com cancel_at_period_end = true e
-- current_period_end <= now(): cancela definitivamente,
-- reverte plan para free e zera créditos disponíveis.
-- Retorna contagem de assinaturas expiradas.
--
-- Nota: NÃO cancela no Asaas — isso é feito pelo cron HTTP
-- antes de chamar esta função (ou pelo webhook SUBSCRIPTION_CANCELLED).
-- ------------------------------------------------------------
create or replace function public.process_subscription_expirations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_sub   record;
begin
  for v_sub in
    select id, user_id
    from   public.subscriptions
    where  cancel_at_period_end = true
      and  status               = 'active'
      and  current_period_end   <= now()
  loop
    update public.subscriptions
    set    status       = 'cancelled',
           cancelled_at = now()
    where  id = v_sub.id;

    update public.profiles
    set    plan = 'free'
    where  id = v_sub.user_id;

    perform public.set_credit_balance(
      v_sub.user_id,
      0,
      'subscription_period_ended'
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

comment on function public.process_subscription_expirations() is
  'Expira assinaturas com cancel_at_period_end = true cujo período encerrou. '
  'Reverte plan para free e zera créditos. Chamada pelo cron diário.';
