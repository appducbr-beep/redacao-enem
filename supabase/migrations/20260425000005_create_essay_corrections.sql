-- ============================================================
-- Migration 005 — Essay Corrections
-- Resultado da correção gerada pela IA via Groq.
-- Relação 1:1 com essays (UNIQUE em essay_id).
-- total_score é coluna GERADA — nunca editável diretamente.
-- Notas c1–c5: apenas múltiplos de 40 entre 0 e 200 (escala ENEM).
-- ============================================================

create table public.essay_corrections (
  id           uuid        not null default gen_random_uuid(),
  essay_id     uuid        not null unique,
  c1           smallint    not null check (c1 in (0, 40, 80, 120, 160, 200)),
  c2           smallint    not null check (c2 in (0, 40, 80, 120, 160, 200)),
  c3           smallint    not null check (c3 in (0, 40, 80, 120, 160, 200)),
  c4           smallint    not null check (c4 in (0, 40, 80, 120, 160, 200)),
  c5           smallint    not null check (c5 in (0, 40, 80, 120, 160, 200)),
  total_score  smallint    generated always as (c1 + c2 + c3 + c4 + c5) stored,
  feedback     jsonb       not null,
  ai_model     text        not null,
  tokens_used  integer,
  created_at   timestamptz not null default now(),

  constraint essay_corrections_pkey primary key (id),
  constraint essay_corrections_essay_id_fkey foreign key (essay_id)
    references public.essays (id) on delete cascade
);

comment on table public.essay_corrections is
  'Resultado da correção por IA. Relação 1:1 com essays via UNIQUE(essay_id).';
comment on column public.essay_corrections.total_score is
  'Soma de c1+c2+c3+c4+c5. Gerada automaticamente; máximo 1000.';
comment on column public.essay_corrections.feedback is
  'JSON completo do Groq: {competencies: {c1..c5: {score, feedback}}, general_comment, strengths[], improvements[]}';
comment on column public.essay_corrections.tokens_used is
  'Total de tokens consumidos na chamada ao Groq. Para monitoramento de custo.';

alter table public.essay_corrections enable row level security;
