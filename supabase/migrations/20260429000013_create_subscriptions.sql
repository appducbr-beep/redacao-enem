-- ============================================================
-- Migration 013 — Campos adicionais em subscriptions (Task 020)
--
-- A tabela subscriptions JÁ EXISTE (migration 006).
-- Esta migration é estritamente incremental: apenas ALTER TABLE.
-- Nenhum dado existente é removido ou alterado.
--
-- NÃO contém CREATE TABLE.
-- Todos os ALTER usam IF NOT EXISTS — safe para re-execução.
-- ============================================================

-- 1. Adicionar 'pending' ao enum subscription_status
--    Necessário para registrar a assinatura antes do pagamento ser confirmado.
--    ADD VALUE IF NOT EXISTS é idempotente (não falha nem reverte em rollback).
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'pending';

-- 2. asaas_customer_id — ID do customer no Asaas
--    Não existe em migration 006. Nullable: registros antigos ficam NULL.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS asaas_customer_id text;

-- 3. environment — sandbox ou production
--    Não existe em migration 006.
--    DEFAULT 'sandbox' garante que registros existentes não quebrem (NOT NULL safe).
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS environment text
    NOT NULL DEFAULT 'sandbox'
    CHECK (environment IN ('sandbox', 'production'));

-- ============================================================
-- Campos da lista "esperados" que JÁ EXISTEM na migration 006
-- (listados aqui para referência — não precisam ser adicionados):
--
--   asaas_subscription_id  text NOT NULL UNIQUE  ← migration 006 linha 11
--   billing_cycle          text NOT NULL CHECK   ← migration 006 linha 15-16
--   amount                 numeric(10,2) NOT NULL ← migration 006 linha 14
--   cancelled_at           timestamptz           ← migration 006 linha 18
--
-- Código Task 020 (subscribe.ts / webhook/route.ts) usa todos estes
-- campos corretamente conforme schema existente.
-- ============================================================
