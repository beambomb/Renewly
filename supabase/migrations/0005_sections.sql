-- Sections: adds the `reminder` and `savings` kinds, widens money columns for
-- large amounts (for example tens of millions of rupiah) and adds savings_entries.

-- ---------------------------------------------------------------------------
-- Kinds and statuses
-- ---------------------------------------------------------------------------

alter table public.items drop constraint items_kind_check;
alter table public.items add constraint items_kind_check
  check (kind in ('subscription', 'recurring', 'warranty', 'reminder', 'savings'));

alter table public.items drop constraint items_status_check;
alter table public.items add constraint items_status_check
  check (status in ('active', 'paused', 'cancelled', 'done'));

-- Only one-off reminders are ever "done".
alter table public.items add constraint items_done_only_reminders
  check (status <> 'done' or kind = 'reminder');

-- ---------------------------------------------------------------------------
-- Money: bigint minor units with higher caps (50 million rupiah at 2 decimals
-- is 5,000,000,000 and does not fit in a 32-bit integer).
-- ---------------------------------------------------------------------------

alter table public.items drop constraint items_price_cents_check;
alter table public.items drop constraint items_usual_price_cents_check;
alter table public.purchase_history drop constraint purchase_history_price_cents_check;

alter table public.items alter column price_cents type bigint;
alter table public.items alter column usual_price_cents type bigint;
alter table public.purchase_history alter column price_cents type bigint;

alter table public.items add constraint items_price_cents_check
  check (price_cents is null or price_cents between 0 and 100000000000000);
alter table public.items add constraint items_usual_price_cents_check
  check (usual_price_cents is null or usual_price_cents between 0 and 100000000000000);
alter table public.purchase_history add constraint purchase_history_price_cents_check
  check (price_cents is null or price_cents between 0 and 100000000000000);

-- ---------------------------------------------------------------------------
-- Savings columns on items (the deadline reuses due_date)
-- ---------------------------------------------------------------------------

alter table public.items add column target_minor bigint
  check (target_minor is null or (target_minor > 0 and target_minor <= 100000000000000));
-- Maintained from savings_entries; clients cannot edit it directly.
alter table public.items add column saved_minor bigint
  check (saved_minor is null or saved_minor >= 0);

-- Savings goals without a deadline have no period: dates become optional for
-- savings only, and are always set together.
alter table public.items alter column period_start drop not null;
alter table public.items alter column due_date drop not null;
alter table public.items add constraint items_period_required
  check (kind = 'savings' or (period_start is not null and due_date is not null));
alter table public.items add constraint items_period_pair
  check ((period_start is null) = (due_date is null));

alter table public.items add constraint items_savings_fields check (
  kind <> 'savings' or (target_minor is not null and currency is not null and saved_minor is not null)
);

-- A repeating reminder every N days needs N. billing_cycle is null for one-offs.
alter table public.items add constraint items_reminder_fields check (
  kind <> 'reminder' or billing_cycle is null or billing_cycle <> 'custom' or cycle_days is not null
);

-- ---------------------------------------------------------------------------
-- saved_minor guard: starts at 0, and only the savings_entries trigger may change it
-- ---------------------------------------------------------------------------

create or replace function public.guard_saved_minor()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.saved_minor := case when new.kind = 'savings' then 0 else null end;
  elsif new.saved_minor is distinct from old.saved_minor and pg_trigger_depth() < 2 then
    raise exception 'saved_minor is maintained from savings_entries' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger items_guard_saved_minor
  before insert or update on public.items
  for each row execute function public.guard_saved_minor();

-- ---------------------------------------------------------------------------
-- savings_entries: signed amounts (deposit > 0, withdrawal < 0, adjustment either)
-- ---------------------------------------------------------------------------

create table public.savings_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id uuid not null,
  entry_type text not null check (entry_type in ('deposit', 'withdrawal', 'adjustment')),
  amount_minor bigint not null check (amount_minor <> 0 and abs(amount_minor) <= 100000000000000),
  occurred_on date not null,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  constraint savings_entries_sign check (
    entry_type = 'adjustment'
    or (entry_type = 'deposit' and amount_minor > 0)
    or (entry_type = 'withdrawal' and amount_minor < 0)
  ),
  constraint savings_entries_item_fk
    foreign key (item_id, user_id) references public.items (id, user_id) on delete cascade
);

create index savings_entries_user_id_idx on public.savings_entries (user_id);
create index savings_entries_item_date_idx on public.savings_entries (item_id, occurred_on desc, created_at desc);

-- Keeps items.saved_minor equal to the sum of the entries. If the sum would go
-- below zero the items check constraint rejects the whole statement.
create or replace function public.sync_saved_minor()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target uuid := coalesce(new.item_id, old.item_id);
  total bigint;
begin
  select coalesce(sum(amount_minor), 0) into total from public.savings_entries where item_id = target;
  update public.items set saved_minor = total where id = target and kind = 'savings';
  return null;
end;
$$;

create trigger savings_entries_sync_saved
  after insert or delete on public.savings_entries
  for each row execute function public.sync_saved_minor();

-- ---------------------------------------------------------------------------
-- RLS: owner-only; entries are immutable (corrections are new entries)
-- ---------------------------------------------------------------------------

alter table public.savings_entries enable row level security;

revoke all on public.savings_entries from anon, authenticated;
grant select, insert, delete on public.savings_entries to authenticated;

create policy savings_entries_select_own on public.savings_entries
  for select to authenticated using (user_id = (select auth.uid()));
create policy savings_entries_insert_own on public.savings_entries
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy savings_entries_delete_own on public.savings_entries
  for delete to authenticated using (user_id = (select auth.uid()));
