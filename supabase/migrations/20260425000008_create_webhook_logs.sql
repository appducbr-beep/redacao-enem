-- ============================================================
-- Migration 008 — Webhook Logs
-- Log de todos os webhooks recebidos do Asaas.
-- Base para idempotência e auditoria.
-- Sem políticas de usuário: apenas service_role tem acesso.
-- ============================================================

create table public.webhook_logs (
  id               uuid        not null default gen_random_uuid(),
  event            text        not null,
  asaas_event_id   text        unique,
  payload          jsonb       not null,
  processed        boolean     not null default false,
  processed_at     timestamptz,
  error_message    text,
  created_at       timestamptz not null default now(),

  constraint webhook_logs_pkey primary key (id)
);

comment on table public.webhook_logs is
  'Log imutável de webhooks do Asaas. Registrado ANTES do processamento. '
  'asaas_event_id UNIQUE garante idempotência. Apenas service_role acessa.';
comment on column public.webhook_logs.asaas_event_id is
  'ID único do evento no Asaas. Verificar este campo antes de processar para evitar duplicatas.';
comment on column public.webhook_logs.processed is
  'False ao inserir. Atualizado para true após processamento bem-sucedido.';
comment on column public.webhook_logs.error_message is
  'Preenchido quando o processamento falha. NULL indica sucesso.';

alter table public.webhook_logs enable row level security;
