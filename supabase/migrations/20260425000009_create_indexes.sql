-- ============================================================
-- Migration 009 — Indexes
-- Cobre as queries mais frequentes previstas no MVP.
-- Nota: colunas com UNIQUE já têm índice implícito (não duplicar).
-- ============================================================

-- ------------------------------------------------------------
-- essays
-- ------------------------------------------------------------

-- Histórico do usuário (query principal do dashboard)
create index idx_essays_user_created
  on public.essays (user_id, created_at desc);

-- Filtro por status (admin e monitoramento de jobs travados)
create index idx_essays_status
  on public.essays (status);

-- ------------------------------------------------------------
-- essay_corrections
-- ------------------------------------------------------------

-- UNIQUE em essay_id já cria índice implícito.
-- Índice explícito adicional não é necessário.

-- ------------------------------------------------------------
-- asaas_payments
-- ------------------------------------------------------------

-- Histórico financeiro do usuário
create index idx_asaas_payments_user_id
  on public.asaas_payments (user_id);

-- Filtro por status (admin)
create index idx_asaas_payments_status
  on public.asaas_payments (status);

-- ------------------------------------------------------------
-- subscriptions
-- ------------------------------------------------------------

-- UNIQUE em user_id já cria índice implícito.

-- Filtro por status (verificação de acesso)
create index idx_subscriptions_status
  on public.subscriptions (status);

-- ------------------------------------------------------------
-- webhook_logs
-- ------------------------------------------------------------

-- Verificação de idempotência (UNIQUE já cria índice, mas
-- o índice parcial abaixo acelera a busca de eventos pendentes)
create index idx_webhook_logs_unprocessed
  on public.webhook_logs (created_at desc)
  where processed = false;

-- ------------------------------------------------------------
-- essay_topics
-- ------------------------------------------------------------

-- Listagem de temas ativos (query pública mais frequente)
create index idx_essay_topics_active
  on public.essay_topics (active, created_at desc);
