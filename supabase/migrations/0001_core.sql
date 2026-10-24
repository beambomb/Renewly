-- Renewly core schema: profiles, items, purchase_history.
-- RLS is enabled in 0003_rls.sql. Every table has user_id defaulting to auth.uid().

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_user_id_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Reminder offsets: at most 10 whole numbers between 0 and 365.
create or replace function public.valid_offsets(offsets int[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_length(offsets, 1), 0) <= 10
     and not exists (
       select 1 from unnest(offsets) as o where o is null or o < 0 or o > 365
     );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 64),
  default_currency char(3) not null default 'USD' check (default_currency ~ '^[A-Z]{3}$'),
  reminder_offsets int[] not null default '{7,3,1,0}' check (public.valid_offsets(reminder_offsets)),
  email_enabled boolean not null default true,
  push_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reject unknown IANA time zone names (an invalid name raises an error).
create or replace function public.validate_profile_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform now() at time zone new.timezone;
  return new;
exception when invalid_parameter_value or invalid_datetime_format or data_exception then
  raise exception 'invalid time zone: %', new.timezone using errcode = '22023';
end;
$$;

create trigger profiles_validate_timezone
  before insert or update of timezone on public.profiles
  for each row execute function public.validate_profile_timezone();
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger profiles_prevent_user_id_change
  before update on public.profiles
  for each row execute function public.prevent_user_id_change();

-- ---------------------------------------------------------------------------
-- items: one table for subscriptions, recurring purchases and warranties
-- ---------------------------------------------------------------------------

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('subscription', 'recurring', 'warranty')),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  category text check (category is null or char_length(category) <= 40),
  notes text check (notes is null or char_length(notes) <= 2000),
  emoji text check (emoji is null or char_length(emoji) <= 8),
  logo_path text check (logo_path is null or char_length(logo_path) <= 200),
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  -- null means "use the profile default"
  reminder_offsets int[] check (reminder_offsets is null or public.valid_offsets(reminder_offsets)),
  -- Derived by the app's pure date logic and persisted so the scheduler can query by date.
  period_start date not null,
  due_date date not null,

  -- subscription
  price_cents integer check (price_cents is null or price_cents between 0 and 100000000),
  currency char(3) check (currency is null or currency ~ '^[A-Z]{3}$'),
  billing_cycle text check (billing_cycle is null or billing_cycle in ('weekly', 'monthly', 'yearly', 'custom')),
  cycle_days integer check (cycle_days is null or cycle_days between 1 and 3650),
  billing_anchor_day smallint check (billing_anchor_day is null or billing_anchor_day between 1 and 31),
  payment_method text check (payment_method is null or char_length(payment_method) <= 80),
  auto_renew boolean,
  cancel_url text check (cancel_url is null or (cancel_url ~* '^https://[^[:space:]]+$' and char_length(cancel_url) <= 500)),

  -- recurring purchase
  last_purchased_on date,
  duration_days integer check (duration_days is null or duration_days between 1 and 3650),
  usual_price_cents integer check (usual_price_cents is null or usual_price_cents between 0 and 100000000),
  usual_currency char(3) check (usual_currency is null or usual_currency ~ '^[A-Z]{3}$'),
  usual_store text check (usual_store is null or char_length(usual_store) <= 80),
  usual_quantity numeric(10, 2) check (usual_quantity is null or usual_quantity > 0),

  -- warranty
  purchased_on date,
  warranty_months integer check (warranty_months is null or warranty_months between 1 and 600),
  expires_on date,
  serial_number text check (serial_number is null or char_length(serial_number) <= 80),
  receipt_path text check (receipt_path is null or char_length(receipt_path) <= 200),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint items_dates_ordered check (due_date >= period_start),
  constraint items_subscription_fields check (
    kind <> 'subscription' or (
      price_cents is not null and currency is not null and billing_cycle is not null
      and auto_renew is not null and (billing_cycle <> 'custom' or cycle_days is not null)
    )
  ),
  constraint items_recurring_fields check (
    kind <> 'recurring' or (last_purchased_on is not null and duration_days is not null)
  ),
  constraint items_warranty_fields check (
    kind <> 'warranty' or (purchased_on is not null and warranty_months is not null and expires_on is not null)
  ),
  -- lets child tables reference (id, user_id) so a child can never point at another user's item
  constraint items_id_user_unique unique (id, user_id)
);

create index items_user_id_idx on public.items (user_id);
create index items_user_due_idx on public.items (user_id, due_date);
create index items_active_due_idx on public.items (due_date) where status = 'active';

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();
create trigger items_prevent_user_id_change
  before update on public.items
  for each row execute function public.prevent_user_id_change();

-- ---------------------------------------------------------------------------
-- purchase_history
-- ---------------------------------------------------------------------------

create table public.purchase_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id uuid not null,
  event text not null default 'purchase' check (event in ('purchase', 'renewal')),
  occurred_on date not null,
  price_cents integer check (price_cents is null or price_cents between 0 and 100000000),
  currency char(3) check (currency is null or currency ~ '^[A-Z]{3}$'),
  store text check (store is null or char_length(store) <= 80),
  quantity numeric(10, 2) check (quantity is null or quantity > 0),
  created_at timestamptz not null default now(),
  constraint purchase_history_item_fk
    foreign key (item_id, user_id) references public.items (id, user_id) on delete cascade
);

create index purchase_history_user_id_idx on public.purchase_history (user_id);
create index purchase_history_item_date_idx on public.purchase_history (item_id, occurred_on desc);

create trigger purchase_history_prevent_user_id_change
  before update on public.purchase_history
  for each row execute function public.prevent_user_id_change();

-- ---------------------------------------------------------------------------
-- New auth user -> profile row
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
