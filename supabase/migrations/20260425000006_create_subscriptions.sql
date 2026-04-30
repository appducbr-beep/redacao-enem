-- ============================================================
-- Migration 006 — Subscriptions
-- Ciclo de vida das assinaturas de plano Pro/School.
-- Fonte canônica para verificar se um plano pago está ativo.
-- INSERT/UPDATE: somente via service_role (webhook handler).
-- ============================================================

create table public.subscriptions (
  id                      uuid                       not null default gen_random_uuid(),
  user_id                 uuid                       not null unique,
  asaas_subscription_id   text                       not null unique,
  plan                    public.plan_type           not null,
  status                  public.subscription_status not null,
  amount                  numeric(10, 2)             not null,
  billing_cycle           text                       not null
    check (billing_cycle in ('monthly', 'yearly')),
  next_billing_date       date,
  cancelled_at            timestamptz,
  created_at              timestamptz                not null default now(),
  updated_at              timestamptz                not null default now(),

  constraint subscriptions_pkey primary key (id),
  constraint subscriptions_user_id_fkey foreign key (user_id)
    references public.profiles (id) on delete cascade,
  constraint subscriptions_plan_not_free check (plan <> 'free')
);

comment on table public.subscriptions is
  'Ciclo de vida de assinaturas Pro/School. Um registro por usuário (UNIQUE user_id). '
  'Verificar status = active antes de conceder acesso irrestrito a correções.';
comment on column public.subscriptions.plan is
  'Deve ser pro ou school; never free (enforced by check constraint).';
comment on column public.subscriptions.status is
  'active: acesso liberado. past_due: pagamento em atraso. cancelled/expired: revogar acesso.';
comment on column public.subscriptions.next_billing_date is
  'Próxima data de cobrança. Atualizada pelo webhook SUBSCRIPTION_RENEWED.';
comment on column public.subscriptions.cancelled_at is
  'Timestamp de cancelamento. Preenchido pelo webhook SUBSCRIPTION_CANCELLED.';

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;
