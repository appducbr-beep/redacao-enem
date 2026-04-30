-- ============================================================
-- Migration 012 — Sistema de créditos
--
-- Cria:
--   credit_wallets        — carteira de créditos por usuário
--   credit_transactions   — log imutável de cada movimentação
--
-- Funções SECURITY DEFINER:
--   get_available_credits  — lê saldo disponível
--   grant_credits          — adiciona créditos (total sobe)
--   consume_credit         — consome 1 crédito (usado sobe); atômico com FOR UPDATE
--   refund_credit          — devolve 1 crédito (usado desce)
--
-- Trigger:
--   on_profile_created → handle_new_profile_wallet()
--   Cria wallet + transação inicial toda vez que um profile é inserido.
--
-- Backfill (idempotente via CTE):
--   Cria wallet e transação para usuários que já existem sem wallet.
--
-- Notas de design:
--   • credits_available é GENERATED ALWAYS AS (total - used) STORED.
--     O CHECK (credits_used <= credits_total) garante que nunca fique negativo.
--   • Operações de write (grant/consume/refund) só são expostas via funções
--     SECURITY DEFINER. Usuários não têm policy INSERT/UPDATE/DELETE nas tabelas.
--   • profiles.credits é mantido por compatibilidade mas não é a fonte canônica
--     a partir desta task — credit_wallets é.
-- ============================================================

-- ------------------------------------------------------------
-- Tabela: credit_wallets
-- Uma linha por usuário (UNIQUE user_id).
-- ------------------------------------------------------------
create table public.credit_wallets (
  id                uuid        not null default gen_random_uuid(),
  user_id           uuid        not null,
  credits_total     integer     not null default 0,
  credits_used      integer     not null default 0,
  credits_available integer     generated always as (credits_total - credits_used) stored,
  cycle_start       timestamptz,
  cycle_end         timestamptz,
  source            text        not null default 'free_signup',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint credit_wallets_pkey         primary key (id),
  constraint credit_wallets_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade,
  constraint credit_wallets_user_id_key  unique (user_id),
  constraint credit_wallets_credits_valid check (
    credits_total >= 0
    and credits_used >= 0
    and credits_used <= credits_total
  )
);

comment on table public.credit_wallets is
  'Carteira de créditos de cada usuário. Uma linha por usuário.';
comment on column public.credit_wallets.credits_total is
  'Total de créditos concedidos no ciclo atual. Aumenta com grant_credits().';
comment on column public.credit_wallets.credits_used is
  'Total de créditos consumidos no ciclo atual. Aumenta com consume_credit().';
comment on column public.credit_wallets.credits_available is
  'Saldo disponível (total - usado). GENERATED ALWAYS AS; nunca negativo.';
comment on column public.credit_wallets.cycle_start is
  'Início do ciclo de renovação (planos Pro). NULL para plano Free.';
comment on column public.credit_wallets.cycle_end is
  'Fim do ciclo de renovação (planos Pro). NULL para plano Free.';
comment on column public.credit_wallets.source is
  'Origem da wallet: free_signup | pro_monthly | pro_yearly | school.';

create trigger credit_wallets_set_updated_at
  before update on public.credit_wallets
  for each row execute function public.set_updated_at();

alter table public.credit_wallets enable row level security;

-- ------------------------------------------------------------
-- Tabela: credit_transactions
-- Log imutável de cada movimentação de crédito.
-- Sem trigger updated_at — linhas jamais são alteradas.
-- ------------------------------------------------------------
create table public.credit_transactions (
  id               uuid        not null default gen_random_uuid(),
  user_id          uuid        not null,
  essay_id         uuid,
  amount           integer     not null,
  transaction_type text        not null,
  reason           text        not null,
  created_at       timestamptz not null default now(),

  constraint credit_transactions_pkey          primary key (id),
  constraint credit_transactions_user_id_fkey  foreign key (user_id)
    references auth.users (id) on delete cascade,
  constraint credit_transactions_essay_id_fkey foreign key (essay_id)
    references public.essays (id) on delete set null,
  constraint credit_transactions_type_check    check (
    transaction_type in ('grant', 'consume', 'refund', 'adjustment')
  )
);

comment on table public.credit_transactions is
  'Log imutável de todas as movimentações de crédito. Nunca DELETE ou UPDATE.';
comment on column public.credit_transactions.amount is
  'Quantidade de créditos movimentados (sempre positivo; direção determinada por transaction_type).';
comment on column public.credit_transactions.transaction_type is
  'grant: créditos adicionados | consume: crédito debitado | refund: crédito devolvido | adjustment: ajuste manual.';

alter table public.credit_transactions enable row level security;

-- ------------------------------------------------------------
-- Índices
-- ------------------------------------------------------------
create index idx_credit_wallets_user_id
  on public.credit_wallets (user_id);

create index idx_credit_transactions_user_id
  on public.credit_transactions (user_id);

create index idx_credit_transactions_essay_id
  on public.credit_transactions (essay_id)
  where essay_id is not null;

-- ------------------------------------------------------------
-- RLS Policies
-- ------------------------------------------------------------
create policy "credit_wallets: select own or admin"
  on public.credit_wallets
  for select
  using (auth.uid() = user_id or is_admin());

create policy "credit_transactions: select own or admin"
  on public.credit_transactions
  for select
  using (auth.uid() = user_id or is_admin());

-- Sem policies INSERT/UPDATE/DELETE para usuários.
-- Writes só ocorrem via funções SECURITY DEFINER abaixo.

-- ------------------------------------------------------------
-- Função: get_available_credits
-- Lê o saldo disponível de um usuário. STABLE (pode ser cacheada).
-- Retorna NULL se o usuário não tiver wallet.
-- ------------------------------------------------------------
create or replace function public.get_available_credits(p_user_id uuid)
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select credits_available
  from   public.credit_wallets
  where  user_id = p_user_id;
$$;

-- ------------------------------------------------------------
-- Função: grant_credits
-- Adiciona créditos ao total de um usuário.
-- Usada pelo webhook de assinatura e por concessões manuais.
-- ------------------------------------------------------------
create or replace function public.grant_credits(
  p_user_id uuid,
  p_amount  integer,
  p_reason  text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then
    raise exception 'grant_credits: amount must be positive (received: %)', p_amount;
  end if;

  update public.credit_wallets
  set    credits_total = credits_total + p_amount,
         updated_at    = now()
  where  user_id = p_user_id;

  if not found then
    raise exception 'grant_credits: wallet not found for user %', p_user_id;
  end if;

  insert into public.credit_transactions (user_id, amount, transaction_type, reason)
  values (p_user_id, p_amount, 'grant', p_reason);
end;
$$;

-- ------------------------------------------------------------
-- Função: consume_credit
-- Debita 1 crédito do usuário para uma redação.
-- Atômico: usa FOR UPDATE para prevenir race condition em
-- submissões simultâneas.
-- Também marca essays.credit_consumed = true.
-- Lança exceção se saldo insuficiente ou wallet não encontrada.
-- ------------------------------------------------------------
create or replace function public.consume_credit(
  p_user_id  uuid,
  p_essay_id uuid,
  p_reason   text default 'essay_correction'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available integer;
begin
  if p_essay_id is null then
    raise exception 'consume_credit: essay_id is required';
  end if;

  -- Bloqueia a linha para prevenir consumo duplicado em requisições concorrentes
  select credits_available
  into   v_available
  from   public.credit_wallets
  where  user_id = p_user_id
  for    update;

  if v_available is null then
    raise exception 'consume_credit: wallet not found for user %', p_user_id;
  end if;

  if v_available < 1 then
    raise exception 'consume_credit: insufficient credits for user % (available: %)',
      p_user_id, v_available;
  end if;

  update public.credit_wallets
  set    credits_used = credits_used + 1,
         updated_at   = now()
  where  user_id = p_user_id;

  -- Marca a redação como crédito consumido (base para controle de estorno)
  update public.essays
  set    credit_consumed = true
  where  id = p_essay_id;

  insert into public.credit_transactions (user_id, essay_id, amount, transaction_type, reason)
  values (p_user_id, p_essay_id, 1, 'consume', p_reason);
end;
$$;

-- ------------------------------------------------------------
-- Função: refund_credit
-- Devolve 1 crédito consumido (ex: falha da IA).
-- Usa greatest(0, ...) para nunca deixar credits_used negativo.
-- Também desmarca essays.credit_consumed.
-- ------------------------------------------------------------
create or replace function public.refund_credit(
  p_user_id  uuid,
  p_essay_id uuid,
  p_reason   text default 'ai_error_refund'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.credit_wallets
  set    credits_used = greatest(0, credits_used - 1),
         updated_at   = now()
  where  user_id = p_user_id;

  if not found then
    raise exception 'refund_credit: wallet not found for user %', p_user_id;
  end if;

  -- Desmarca a redação para permitir nova tentativa ou auditoria
  update public.essays
  set    credit_consumed = false
  where  id = p_essay_id;

  insert into public.credit_transactions (user_id, essay_id, amount, transaction_type, reason)
  values (p_user_id, p_essay_id, 1, 'refund', p_reason);
end;
$$;

-- ------------------------------------------------------------
-- Trigger: on_profile_created
-- Cria wallet + transação inicial para cada novo profile.
-- Dispara AFTER INSERT ON profiles (não em auth.users diretamente),
-- pois nesse ponto o profile já existe e podemos usar new.id.
-- ------------------------------------------------------------
create or replace function public.handle_new_profile_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.credit_wallets (user_id, credits_total, source)
  values (new.id, 3, 'free_signup');

  insert into public.credit_transactions (user_id, amount, transaction_type, reason)
  values (new.id, 3, 'grant', 'free_signup');

  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile_wallet();

-- ------------------------------------------------------------
-- Backfill: usuários existentes sem wallet
--
-- Idempotente: o WHERE NOT EXISTS evita reprocessar usuários
-- que já têm wallet. A CTE garante que as transações são
-- inseridas apenas para os wallets recém-criados nesta execução.
-- ------------------------------------------------------------
with new_wallets as (
  insert into public.credit_wallets (user_id, credits_total, source)
  select p.id, 3, 'free_signup'
  from   public.profiles p
  where  not exists (
    select 1
    from   public.credit_wallets cw
    where  cw.user_id = p.id
  )
  returning user_id
)
insert into public.credit_transactions (user_id, amount, transaction_type, reason)
select user_id, 3, 'grant', 'free_signup'
from   new_wallets;
