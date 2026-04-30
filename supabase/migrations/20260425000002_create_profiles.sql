-- ============================================================
-- Migration 002 — Profiles
-- Estende auth.users com dados da aplicação.
-- Inclui:
--   - função genérica set_updated_at() (reusada nas demais tabelas)
--   - trigger updated_at em profiles
--   - função handle_new_user() (cria profile ao registrar)
--   - trigger on_auth_user_created em auth.users
-- ============================================================

-- ------------------------------------------------------------
-- Tabela
-- ------------------------------------------------------------
create table public.profiles (
  id            uuid          not null,
  full_name     text,
  avatar_url    text,
  role          public.user_role  not null default 'student',
  plan          public.plan_type  not null default 'free',
  credits       integer           not null default 3 check (credits >= 0),
  asaas_customer_id text          unique,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),

  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id)
    references auth.users (id) on delete cascade
);

comment on table public.profiles is
  'Extensão de auth.users com dados de aplicação do usuário.';
comment on column public.profiles.role is
  'Papel no sistema. Base para middleware admin e RLS.';
comment on column public.profiles.plan is
  'Plano atual (desnormalizado). Fonte canônica para planos pagos é subscriptions.status.';
comment on column public.profiles.credits is
  'Créditos avulsos. Ignorado quando plan = pro ou school com assinatura ativa.';
comment on column public.profiles.asaas_customer_id is
  'ID do cliente no Asaas. Preenchido na primeira compra.';

-- ------------------------------------------------------------
-- Função genérica: set_updated_at
-- Reutilizada por todas as tabelas que possuem updated_at.
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Função: handle_new_user
-- Cria automaticamente o profile ao registrar em auth.users.
-- SECURITY DEFINER: executa como dono da função, não como o
-- usuário chamante, evitando falhas de RLS durante o INSERT.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    avatar_url,
    role,
    plan,
    credits
  ) values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    'student',
    'free',
    3
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
