-- Reminder idempotency log, in-app notifications and Web Push subscriptions.

-- One row per (item, due date, offset, channel). The unique key is what makes
-- reminders idempotent: the sender inserts with ON CONFLICT DO NOTHING and only
-- sends when the insert returned a row. offset_days = -1 marks the single
-- "overdue" notification for a due date.
create table public.reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id uuid not null,
  due_date date not null,
  offset_days integer not null check (offset_days between -1 and 365),
  channel text not null check (channel in ('in_app', 'email', 'push')),
  status text not null default 'claimed' check (status in ('claimed', 'sent', 'failed')),
  attempts smallint not null default 1 check (attempts between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminder_log_unique unique (item_id, due_date, offset_days, channel),
  constraint reminder_log_item_fk
    foreign key (item_id, user_id) references public.items (id, user_id) on delete cascade
);

create index reminder_log_user_id_idx on public.reminder_log (user_id);

create trigger reminder_log_set_updated_at
  before update on public.reminder_log
  for each row execute function public.set_updated_at();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id uuid references public.items (id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 500),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 1 and 1000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

create trigger push_subscriptions_prevent_user_id_change
  before update on public.push_subscriptions
  for each row execute function public.prevent_user_id_change();
