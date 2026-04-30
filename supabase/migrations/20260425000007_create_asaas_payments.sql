-- ============================================================
-- Migration 007 — Asaas Payments
-- Registro de transações financeiras via Asaas.
-- Cobre compras avulsas de créditos e parcelas de assinatura.
-- asaas_payment_id UNIQUE: impede registro duplo por webhook.
-- INSERT/UPDATE: somente via service_role (webhook handler).
-- Nota: spec 02 v0.3 nomeou esta tabela como "payments";
--       o requisito da task-004 especificou "asaas_payments"
--       para tornar o acoplamento ao Asaas explícito no nome.
-- ============================================================

create table public.asaas_payments (
  id                      uuid                   not null default gen_random_uuid(),
  user_id                 uuid                   not null,
  asaas_payment_id        text                   not null unique,
  asaas_subscription_id   text,
  amount                  numeric(10, 2)         not null,
  description             text,
  status                  public.payment_status  not null default 'pending',
  type                    public.payment_type    not null,
  created_at              timestamptz            not null default now(),
  updated_at              timestamptz            not null default now(),

  constraint asaas_payments_pkey primary key (id),
  constraint asaas_payments_user_id_fkey foreign key (user_id)
    references public.profiles (id) on delete cascade,
  constraint asaas_payments_amount_positive check (amount > 0)
);

comment on table public.asaas_payments is
  'Transações financeiras via Asaas. asaas_payment_id UNIQUE garante idempotência de webhooks.';
comment on column public.asaas_payments.asaas_payment_id is
  'ID da cobrança no Asaas. UNIQUE evita créditos duplicados por reenvio de webhook.';
comment on column public.asaas_payments.asaas_subscription_id is
  'Presente quando type = subscription. Relaciona o pagamento à assinatura correspondente.';
comment on column public.asaas_payments.description is
  'Ex: "Pacote Básico — 15 créditos" ou "Plano Pro — Agosto/2026"';

create trigger asaas_payments_set_updated_at
  before update on public.asaas_payments
  for each row execute function public.set_updated_at();

alter table public.asaas_payments enable row level security;
