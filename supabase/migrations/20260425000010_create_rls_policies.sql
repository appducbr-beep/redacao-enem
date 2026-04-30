-- ============================================================
-- Migration 010 — RLS Policies
-- Row Level Security para todas as tabelas.
--
-- Princípios:
--   1. service_role bypassa RLS por padrão no Supabase.
--      Nenhuma policy especial é necessária para ele.
--   2. Tabelas de pagamento/webhook só escrevem via service_role
--      (API routes internas). Usuários só lêem seus próprios dados.
--   3. is_admin() usa SECURITY DEFINER para evitar recursão
--      ao consultar profiles dentro de uma policy de profiles.
-- ============================================================

-- ------------------------------------------------------------
-- Função auxiliar: is_admin()
-- SECURITY DEFINER: executa como dono da função, não o caller,
-- evitando recursão quando usada em policies da tabela profiles.
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- ============================================================
-- profiles
-- SELECT: próprio usuário ou admin.
-- UPDATE: próprio usuário (campos de perfil).
--         Role e plan só devem ser alterados via service_role
--         (API routes internas); a aplicação não deve expor
--         esses campos em formulários de usuário.
-- INSERT: via trigger handle_new_user (SECURITY DEFINER).
-- DELETE: não exposto (exclusão de conta via service_role).
-- ============================================================
create policy "profiles: select own or admin"
  on public.profiles
  for select
  using (auth.uid() = id or is_admin());

create policy "profiles: update own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: admin update any"
  on public.profiles
  for update
  using (is_admin());

-- ============================================================
-- essay_topics
-- SELECT: usuários autenticados vêem temas ativos.
--         Admin vê todos (inclusive inativos).
-- INSERT/UPDATE/DELETE: somente admin.
-- ============================================================
create policy "essay_topics: authenticated see active"
  on public.essay_topics
  for select
  using (
    auth.role() = 'authenticated'
    and active = true
  );

create policy "essay_topics: admin see all"
  on public.essay_topics
  for select
  using (is_admin());

create policy "essay_topics: admin insert"
  on public.essay_topics
  for insert
  with check (is_admin());

create policy "essay_topics: admin update"
  on public.essay_topics
  for update
  using (is_admin());

create policy "essay_topics: admin delete"
  on public.essay_topics
  for delete
  using (is_admin());

-- ============================================================
-- essays
-- SELECT: próprio usuário ou admin.
-- INSERT: próprio usuário (user_id deve ser o auth.uid()).
-- UPDATE: próprio usuário (ex: cancelar envio antes do processamento).
-- DELETE: não exposto.
-- ============================================================
create policy "essays: select own or admin"
  on public.essays
  for select
  using (auth.uid() = user_id or is_admin());

create policy "essays: insert own"
  on public.essays
  for insert
  with check (auth.uid() = user_id);

create policy "essays: update own"
  on public.essays
  for update
  using (auth.uid() = user_id);

-- ============================================================
-- essay_corrections
-- SELECT: usuário lê correções de suas próprias redações.
--         Admin lê todas.
-- INSERT/UPDATE: somente service_role (pipeline de IA).
--   Não há policy de INSERT/UPDATE aqui intencionalmente:
--   o backend usa service_role que bypassa RLS.
-- ============================================================
create policy "essay_corrections: select own or admin"
  on public.essay_corrections
  for select
  using (
    is_admin()
    or exists (
      select 1
      from public.essays
      where essays.id = essay_corrections.essay_id
        and essays.user_id = auth.uid()
    )
  );

-- ============================================================
-- subscriptions
-- SELECT: próprio usuário ou admin.
-- INSERT/UPDATE: somente service_role (webhook handler).
-- ============================================================
create policy "subscriptions: select own or admin"
  on public.subscriptions
  for select
  using (auth.uid() = user_id or is_admin());

-- ============================================================
-- asaas_payments
-- SELECT: próprio usuário ou admin.
-- INSERT/UPDATE: somente service_role (webhook handler).
-- ============================================================
create policy "asaas_payments: select own or admin"
  on public.asaas_payments
  for select
  using (auth.uid() = user_id or is_admin());

-- ============================================================
-- webhook_logs
-- Sem policies de usuário.
-- RLS habilitado sem política permissiva = acesso bloqueado
-- para todos os roles exceto service_role (que bypassa RLS).
-- ============================================================
-- (nenhuma policy adicionada intencionalmente)
