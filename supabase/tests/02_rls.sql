-- Cross-user isolation. User A must never read or modify user B's rows or files,
-- and anonymous callers get nothing. Fixed ids: A = ...a1, B = ...b2.

insert into auth.users (id, aud, role, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'a@example.test'),
  ('00000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', 'b@example.test');

insert into public.items (id, user_id, kind, name, period_start, due_date, price_cents, currency, billing_cycle, auto_renew)
values ('10000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1',
  'subscription', 'A Netflix', current_date - 20, current_date + 10, 1549, 'USD', 'monthly', true);
insert into public.items (id, user_id, kind, name, period_start, due_date, last_purchased_on, duration_days)
values ('10000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000b2',
  'recurring', 'B Pasta', current_date - 5, current_date + 25, current_date - 5, 30);

insert into public.purchase_history (id, user_id, item_id, occurred_on) values
  ('30000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', current_date),
  ('30000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000b2', '10000000-0000-4000-8000-0000000000b2', current_date);

insert into public.reminder_log (user_id, item_id, due_date, offset_days, channel, status) values
  ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', current_date + 10, 7, 'email', 'sent'),
  ('00000000-0000-4000-8000-0000000000b2', '10000000-0000-4000-8000-0000000000b2', current_date + 25, 7, 'email', 'sent');

insert into public.notifications (id, user_id, item_id, title) values
  ('20000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', 'A notice'),
  ('20000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000b2', '10000000-0000-4000-8000-0000000000b2', 'B notice');

insert into public.push_subscriptions (id, user_id, endpoint, p256dh, auth) values
  ('40000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1', 'https://push.example/a', 'k', 'a'),
  ('40000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000b2', 'https://push.example/b', 'k', 'a');

insert into storage.objects (bucket_id, name) values
  ('logos', '00000000-0000-4000-8000-0000000000a1/logo.webp'),
  ('logos', '00000000-0000-4000-8000-0000000000b2/logo.webp'),
  ('receipts', '00000000-0000-4000-8000-0000000000b2/receipt.webp');

-- ===========================================================================
-- Act as user A
-- ===========================================================================
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

select rls_test.eq('A: auth.uid() resolves to A',
  (select count(*) from (select auth.uid() as u) s where u = '00000000-0000-4000-8000-0000000000a1'), 1);

-- items
select rls_test.eq('A sees only own items', (select count(*) from public.items), 1);
select rls_test.eq('A cannot read B item by id',
  (select count(*) from public.items where id = '10000000-0000-4000-8000-0000000000b2'), 0);
select rls_test.affected('A cannot update B item',
  $q$ update public.items set name = 'hacked' where id = '10000000-0000-4000-8000-0000000000b2' $q$, 0);
select rls_test.affected('A cannot delete B item',
  $q$ delete from public.items where id = '10000000-0000-4000-8000-0000000000b2' $q$, 0);
select rls_test.fails('A cannot insert an item owned by B',
  $q$ insert into public.items (user_id, kind, name, period_start, due_date, last_purchased_on, duration_days)
      values ('00000000-0000-4000-8000-0000000000b2', 'recurring', 'x', current_date, current_date, current_date, 1) $q$, '42501');
select rls_test.fails('A cannot hand own item to B',
  $q$ update public.items set user_id = '00000000-0000-4000-8000-0000000000b2' where id = '10000000-0000-4000-8000-0000000000a1' $q$);
select rls_test.affected('A insert without user_id defaults to A',
  $q$ insert into public.items (kind, name, period_start, due_date, last_purchased_on, duration_days)
      values ('recurring', 'Mine', current_date, current_date + 5, current_date, 5) $q$, 1);
select rls_test.eq('A now has 2 items', (select count(*) from public.items), 2);
select rls_test.affected('A can update own item',
  $q$ update public.items set name = 'A Netflix HD' where id = '10000000-0000-4000-8000-0000000000a1' $q$, 1);

-- purchase_history
select rls_test.eq('A sees only own history', (select count(*) from public.purchase_history), 1);
select rls_test.fails('A cannot add history to B item (own user_id)',
  $q$ insert into public.purchase_history (user_id, item_id, occurred_on)
      values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000b2', current_date) $q$);
select rls_test.fails('A cannot add history as B',
  $q$ insert into public.purchase_history (user_id, item_id, occurred_on)
      values ('00000000-0000-4000-8000-0000000000b2', '10000000-0000-4000-8000-0000000000b2', current_date) $q$, '42501');
select rls_test.affected('A cannot delete B history',
  $q$ delete from public.purchase_history where id = '30000000-0000-4000-8000-0000000000b2' $q$, 0);
select rls_test.affected('A can add history to own item',
  $q$ insert into public.purchase_history (item_id, occurred_on, price_cents)
      values ('10000000-0000-4000-8000-0000000000a1', current_date, 100) $q$, 1);

-- profiles
select rls_test.eq('A sees only own profile', (select count(*) from public.profiles), 1);
select rls_test.affected('A cannot update B profile',
  $q$ update public.profiles set timezone = 'Asia/Tokyo' where user_id = '00000000-0000-4000-8000-0000000000b2' $q$, 0);
select rls_test.affected('A can update own profile',
  $q$ update public.profiles set timezone = 'Europe/Berlin' where user_id = '00000000-0000-4000-8000-0000000000a1' $q$, 1);
select rls_test.fails('A cannot create a profile for B',
  $q$ insert into public.profiles (user_id) values ('00000000-0000-4000-8000-0000000000b2') $q$);

-- reminder_log: read-only for owners
select rls_test.eq('A sees only own reminder log', (select count(*) from public.reminder_log), 1);
select rls_test.fails('A cannot write the reminder log',
  $q$ insert into public.reminder_log (item_id, due_date, offset_days, channel)
      values ('10000000-0000-4000-8000-0000000000a1', current_date + 1, 1, 'email') $q$, '42501');
select rls_test.fails('A cannot edit the reminder log',
  $q$ update public.reminder_log set status = 'failed' $q$, '42501');
select rls_test.fails('A cannot erase the reminder log',
  $q$ delete from public.reminder_log $q$, '42501');

-- notifications
select rls_test.eq('A sees only own notifications', (select count(*) from public.notifications), 1);
select rls_test.affected('A cannot mark B notification read',
  $q$ update public.notifications set read_at = now() where id = '20000000-0000-4000-8000-0000000000b2' $q$, 0);
select rls_test.affected('A can mark own notification read',
  $q$ update public.notifications set read_at = now() where id = '20000000-0000-4000-8000-0000000000a1' $q$, 1);
select rls_test.fails('A cannot rewrite a notification title',
  $q$ update public.notifications set title = 'forged' where id = '20000000-0000-4000-8000-0000000000a1' $q$, '42501');
select rls_test.fails('A cannot create notifications',
  $q$ insert into public.notifications (title) values ('spam') $q$, '42501');
select rls_test.affected('A cannot delete B notification',
  $q$ delete from public.notifications where id = '20000000-0000-4000-8000-0000000000b2' $q$, 0);

-- push_subscriptions
select rls_test.eq('A sees only own push subscriptions', (select count(*) from public.push_subscriptions), 1);
select rls_test.affected('A cannot delete B push subscription',
  $q$ delete from public.push_subscriptions where id = '40000000-0000-4000-8000-0000000000b2' $q$, 0);
select rls_test.fails('A cannot register a push subscription for B',
  $q$ insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
      values ('00000000-0000-4000-8000-0000000000b2', 'https://push.example/x', 'k', 'a') $q$, '42501');

-- storage
select rls_test.eq('A sees only own files', (select count(*) from storage.objects), 1);
select rls_test.eq('A cannot see B receipt',
  (select count(*) from storage.objects where bucket_id = 'receipts'), 0);
select rls_test.fails('A cannot upload into B folder',
  $q$ insert into storage.objects (bucket_id, name) values ('logos', '00000000-0000-4000-8000-0000000000b2/evil.webp') $q$, '42501');
select rls_test.fails('A cannot upload outside any user folder',
  $q$ insert into storage.objects (bucket_id, name) values ('logos', 'loose.webp') $q$, '42501');
select rls_test.fails('A cannot upload to an unknown bucket path',
  $q$ insert into storage.objects (bucket_id, name) values ('avatars', '00000000-0000-4000-8000-0000000000a1/x.webp') $q$);
select rls_test.affected('A can upload into own folder',
  $q$ insert into storage.objects (bucket_id, name) values ('logos', '00000000-0000-4000-8000-0000000000a1/new.webp') $q$, 1);
select rls_test.affected('A cannot overwrite B file',
  $q$ update storage.objects set name = '00000000-0000-4000-8000-0000000000b2/logo.webp' where name like '%b2/logo.webp' $q$, 0);
select rls_test.fails('A cannot move own file into B folder',
  $q$ update storage.objects set name = '00000000-0000-4000-8000-0000000000b2/stolen.webp'
      where name = '00000000-0000-4000-8000-0000000000a1/new.webp' $q$, '42501');
-- Supabase blocks direct DELETEs on storage tables with a trigger (the Storage API
-- sets this flag itself). Enable it for this transaction so the RLS policy is what is tested.
select set_config('storage.allow_delete_query', 'true', true);
select rls_test.affected('A cannot delete B file',
  $q$ delete from storage.objects where name like '%b2/%' $q$, 0);
select rls_test.affected('A can delete own file',
  $q$ delete from storage.objects where name = '00000000-0000-4000-8000-0000000000a1/new.webp' $q$, 1);

-- ===========================================================================
-- Back to the owner: B's data must be untouched by everything A tried
-- ===========================================================================
reset role;

select rls_test.eq('B item name unchanged',
  (select count(*) from public.items where id = '10000000-0000-4000-8000-0000000000b2' and name = 'B Pasta'), 1);
select rls_test.eq('B profile timezone unchanged',
  (select count(*) from public.profiles where user_id = '00000000-0000-4000-8000-0000000000b2' and timezone = 'UTC'), 1);
select rls_test.eq('B has exactly its own rows everywhere',
  (select (select count(*) from public.items where user_id = '00000000-0000-4000-8000-0000000000b2')
        + (select count(*) from public.purchase_history where user_id = '00000000-0000-4000-8000-0000000000b2')
        + (select count(*) from public.reminder_log where user_id = '00000000-0000-4000-8000-0000000000b2')
        + (select count(*) from public.notifications where user_id = '00000000-0000-4000-8000-0000000000b2' and read_at is null)
        + (select count(*) from public.push_subscriptions where user_id = '00000000-0000-4000-8000-0000000000b2')
        + (select count(*) from storage.objects where name like '00000000-0000-4000-8000-0000000000b2/%')), 7);

-- ===========================================================================
-- Act as user B (symmetry check)
-- ===========================================================================
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);

select rls_test.eq('B sees only own items', (select count(*) from public.items), 1);
select rls_test.eq('B sees nothing of A (history, log, notices, push)',
  (select (select count(*) from public.purchase_history where user_id <> auth.uid())
        + (select count(*) from public.reminder_log where user_id <> auth.uid())
        + (select count(*) from public.notifications where user_id <> auth.uid())
        + (select count(*) from public.push_subscriptions where user_id <> auth.uid())), 0);
select rls_test.affected('B cannot delete A item',
  $q$ delete from public.items where id = '10000000-0000-4000-8000-0000000000a1' $q$, 0);
select rls_test.eq('B cannot see A files',
  (select count(*) from storage.objects where name like '00000000-0000-4000-8000-0000000000a1/%'), 0);

-- ===========================================================================
-- Anonymous (no session)
-- ===========================================================================
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select rls_test.fails('anon cannot read items', $q$ select * from public.items $q$, '42501');
select rls_test.fails('anon cannot read profiles', $q$ select * from public.profiles $q$, '42501');
select rls_test.fails('anon cannot read history', $q$ select * from public.purchase_history $q$, '42501');
select rls_test.fails('anon cannot read reminder log', $q$ select * from public.reminder_log $q$, '42501');
select rls_test.fails('anon cannot read notifications', $q$ select * from public.notifications $q$, '42501');
select rls_test.fails('anon cannot read push subscriptions', $q$ select * from public.push_subscriptions $q$, '42501');
select rls_test.fails('anon cannot insert items',
  $q$ insert into public.items (kind, name, period_start, due_date, last_purchased_on, duration_days)
      values ('recurring', 'x', current_date, current_date, current_date, 1) $q$, '42501');
select rls_test.sees_nothing('anon cannot read files', $q$ select * from storage.objects $q$);
select rls_test.fails('anon cannot upload files',
  $q$ insert into storage.objects (bucket_id, name) values ('logos', '00000000-0000-4000-8000-0000000000a1/anon.webp') $q$);

reset role;
