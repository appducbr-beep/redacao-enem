-- ============================================================
-- Migration 003 — Essay Topics
-- Banco de temas de redação.
-- Leitura: usuários autenticados (apenas ativos).
-- Escrita: somente admins.
-- Nota: o requisito original chamou esta tabela de "themes";
--       o nome canônico aprovado na spec 02 é "essay_topics".
-- ============================================================

create table public.essay_topics (
  id                   uuid        not null default gen_random_uuid(),
  title                text        not null,
  year                 integer,
  motivational_texts   jsonb       not null default '[]'::jsonb,
  active               boolean     not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint essay_topics_pkey primary key (id),
  constraint essay_topics_year_check check (year is null or (year >= 1998 and year <= 2100))
);

comment on table public.essay_topics is
  'Banco de temas de redação. Temas históricos do ENEM e temas novos.';
comment on column public.essay_topics.year is
  'Ano ENEM de referência. NULL indica tema novo (não histórico).';
comment on column public.essay_topics.motivational_texts is
  'Array JSONB: [{type: text|image|chart, source: string, content?: string, url?: string}]';

create trigger essay_topics_set_updated_at
  before update on public.essay_topics
  for each row execute function public.set_updated_at();

alter table public.essay_topics enable row level security;
