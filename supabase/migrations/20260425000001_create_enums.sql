-- ============================================================
-- Migration 001 — Enums
-- Todas as migrations dependem destes tipos.
-- Deve ser a primeira migration executada.
-- ============================================================

create type public.user_role as enum (
  'student',
  'admin'
);

create type public.plan_type as enum (
  'free',
  'pro',
  'school'
);

create type public.essay_status as enum (
  'pending',
  'processing',
  'done',
  'error'
);

create type public.essay_modality as enum (
  'text',
  'pdf',
  'photo'
);

create type public.payment_status as enum (
  'pending',
  'confirmed',
  'overdue',
  'cancelled',
  'refunded'
);

create type public.payment_type as enum (
  'credit_purchase',
  'subscription'
);

create type public.subscription_status as enum (
  'active',
  'cancelled',
  'expired',
  'past_due'
);
