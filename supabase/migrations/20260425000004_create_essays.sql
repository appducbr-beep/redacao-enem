-- ============================================================
-- Migration 004 — Essays
-- Redações enviadas pelos usuários para correção.
-- ============================================================

create table public.essays (
  id               uuid                  not null default gen_random_uuid(),
  user_id          uuid                  not null,
  topic_id         uuid                  not null,
  content          text                  not null,
  storage_url      text,
  modality         public.essay_modality not null default 'text',
  word_count       integer,
  credit_consumed  boolean               not null default false,
  status           public.essay_status   not null default 'pending',
  created_at       timestamptz           not null default now(),
  updated_at       timestamptz           not null default now(),

  constraint essays_pkey primary key (id),
  constraint essays_user_id_fkey foreign key (user_id)
    references public.profiles (id) on delete cascade,
  constraint essays_topic_id_fkey foreign key (topic_id)
    references public.essay_topics (id) on delete restrict,
  constraint essays_content_not_empty check (length(trim(content)) > 0)
);

comment on table public.essays is
  'Redações enviadas pelos usuários. Uma redação por envio.';
comment on column public.essays.credit_consumed is
  'True quando o crédito foi debitado. Evita estornos duplos em caso de erro na correção.';
comment on column public.essays.storage_url is
  'Path no Supabase Storage. Preenchido para modalidades pdf e photo.';
comment on column public.essays.updated_at is
  'Atualizado a cada mudança de status. Útil para detectar jobs de correção travados.';

create trigger essays_set_updated_at
  before update on public.essays
  for each row execute function public.set_updated_at();

alter table public.essays enable row level security;
