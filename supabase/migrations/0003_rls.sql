-- Row Level Security: every row is owner-only. Anonymous users get nothing.
-- (select auth.uid()) is wrapped so Postgres evaluates it once per statement.

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.purchase_history enable row level security;
alter table public.reminder_log enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

-- Privileges: start from nothing, grant only what the app needs.
revoke all on public.profiles, public.items, public.purchase_history,
  public.reminder_log, public.notifications, public.push_subscriptions
  from anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.items to authenticated;
grant select, insert, update, delete on public.purchase_history to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
-- Written only by the Edge Function (service role); clients can only read it.
grant select on public.reminder_log to authenticated;
-- Clients can read, delete, and mark as read (only the read_at column).
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- profiles
create policy profiles_select_own on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy profiles_delete_own on public.profiles
  for delete to authenticated using (user_id = (select auth.uid()));

-- items
create policy items_select_own on public.items
  for select to authenticated using (user_id = (select auth.uid()));
create policy items_insert_own on public.items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy items_update_own on public.items
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy items_delete_own on public.items
  for delete to authenticated using (user_id = (select auth.uid()));

-- purchase_history (the composite FK also pins item_id to the same user)
create policy purchase_history_select_own on public.purchase_history
  for select to authenticated using (user_id = (select auth.uid()));
create policy purchase_history_insert_own on public.purchase_history
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy purchase_history_update_own on public.purchase_history
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy purchase_history_delete_own on public.purchase_history
  for delete to authenticated using (user_id = (select auth.uid()));

-- reminder_log: read-only for owners
create policy reminder_log_select_own on public.reminder_log
  for select to authenticated using (user_id = (select auth.uid()));

-- notifications: read, mark read, delete
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notifications_delete_own on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));

-- push_subscriptions
create policy push_subscriptions_select_own on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy push_subscriptions_insert_own on public.push_subscriptions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy push_subscriptions_update_own on public.push_subscriptions
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy push_subscriptions_delete_own on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));
