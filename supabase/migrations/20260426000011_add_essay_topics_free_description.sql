-- ============================================================
-- Migration 011 — essay_topics: is_free + description
--
-- Motivação (Task 009):
--   O modelo de negócio introduz temas gratuitos e temas Pro.
--   is_free: distingue o nível de acesso exigido.
--   description: texto curto exibido no card de listagem.
--
-- Impacto em RLS:
--   Nenhum. A política atual permite que todo autenticado veja
--   todos os temas ativos. A filtragem Free/Pro é feita pela
--   aplicação (página /temas). Isso é intencional para que
--   temas Pro apareçam "bloqueados" ao invés de invisíveis.
-- ============================================================

alter table public.essay_topics
  add column if not exists is_free     boolean not null default true,
  add column if not exists description text;

comment on column public.essay_topics.is_free is
  'true = acessível no plano Free; false = exige plano Pro ou School.';
comment on column public.essay_topics.description is
  'Descrição curta (1-2 frases) exibida no card de listagem.';
