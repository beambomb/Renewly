-- Schema constraints, defaults, triggers and cascades (run as the database owner).

insert into auth.users (id, aud, role, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'a@example.test');

-- Profile is created by trigger with safe defaults.
select rls_test.eq('new user gets a profile',
  (select count(*) from public.profiles where user_id = '00000000-0000-4000-8000-0000000000a1'), 1);
select rls_test.eq('profile default timezone is UTC',
  (select count(*) from public.profiles where timezone = 'UTC' and default_currency = 'USD'
     and reminder_offsets = '{7,3,1,0}'), 1);

select rls_test.fails('invalid time zone is rejected',
  $q$ update public.profiles set timezone = 'Mars/Olympus' $q$, '22023');
select rls_test.affected('valid time zone is accepted',
  $q$ update public.profiles set timezone = 'Pacific/Auckland' $q$, 1);
select rls_test.fails('lowercase currency is rejected',
  $q$ update public.profiles set default_currency = 'usd' $q$);
select rls_test.fails('negative reminder offset is rejected',
  $q$ update public.profiles set reminder_offsets = '{-1}' $q$);
select rls_test.fails('offset over 365 is rejected',
  $q$ update public.profiles set reminder_offsets = '{400}' $q$);
select rls_test.fails('more than 10 offsets are rejected',
  $q$ update public.profiles set reminder_offsets = '{0,1,2,3,4,5,6,7,8,9,10}' $q$);

-- Valid rows of each kind.
insert into public.items (id, user_id, kind, name, period_start, due_date,
  price_cents, currency, billing_cycle, auto_renew)
values ('10000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1',
  'subscription', 'Netflix', current_date - 20, current_date + 10, 1549, 'USD', 'monthly', true);
insert into public.items (id, user_id, kind, name, period_start, due_date, last_purchased_on, duration_days)
values ('10000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000a1',
  'recurring', 'Coffee beans', current_date - 5, current_date + 9, current_date - 5, 14);
insert into public.items (id, user_id, kind, name, period_start, due_date, purchased_on, warranty_months, expires_on)
values ('10000000-0000-4000-8000-0000000000a3', '00000000-0000-4000-8000-0000000000a1',
  'warranty', 'Laptop', current_date - 100, current_date + 600, current_date - 100, 24, current_date + 600);
select rls_test.eq('three kinds can be stored',
  (select count(*) from public.items), 3);

-- user_id defaults and cannot move.
select rls_test.fails('unknown kind is rejected',
  $q$ insert into public.items (user_id, kind, name, period_start, due_date)
      values ('00000000-0000-4000-8000-0000000000a1', 'gadget', 'x', current_date, current_date) $q$);
select rls_test.fails('empty name is rejected',
  $q$ insert into public.items (user_id, kind, name, period_start, due_date, last_purchased_on, duration_days)
      values ('00000000-0000-4000-8000-0000000000a1', 'recurring', '   ', current_date, current_date, current_date, 1) $q$);
select rls_test.fails('subscription needs a price',
  $q$ insert into public.items (user_id, kind, name, period_start, due_date, currency, billing_cycle, auto_renew)
      values ('00000000-0000-4000-8000-0000000000a1', 'subscription', 'x', current_date, current_date, 'USD', 'monthly', true) $q$,
  '23514');
select rls_test.fails('custom cycle needs cycle_days',
  $q$ insert into public.items (user_id, kind, name, period_start, due_date, price_cents, currency, billing_cycle, auto_renew)
      values ('00000000-0000-4000-8000-0000000000a1', 'subscription', 'x', current_date, current_date, 100, 'USD', 'custom', true) $q$,
  '23514');
select rls_test.fails('recurring needs a duration',
  $q$ insert into public.items (user_id, kind, name, period_start, due_date, last_purchased_on)
      values ('00000000-0000-4000-8000-0000000000a1', 'recurring', 'x', current_date, current_date, current_date) $q$,
  '23514');
select rls_test.fails('warranty needs an expiry',
  $q$ insert into public.items (user_id, kind, name, period_start, due_date, purchased_on, warranty_months)
      values ('00000000-0000-4000-8000-0000000000a1', 'warranty', 'x', current_date, current_date, current_date, 12) $q$,
  '23514');
select rls_test.fails('due date before period start is rejected',
  $q$ insert into public.items (user_id, kind, name, period_start, due_date, last_purchased_on, duration_days)
      values ('00000000-0000-4000-8000-0000000000a1', 'recurring', 'x', current_date, current_date - 1, current_date, 1) $q$,
  '23514');
select rls_test.fails('lowercase item currency is rejected',
  $q$ update public.items set currency = 'usd' where id = '10000000-0000-4000-8000-0000000000a1' $q$);
select rls_test.fails('http cancel link is rejected',
  $q$ update public.items set cancel_url = 'http://example.com/cancel' where id = '10000000-0000-4000-8000-0000000000a1' $q$);
select rls_test.fails('javascript cancel link is rejected',
  $q$ update public.items set cancel_url = 'javascript:alert(1)' where id = '10000000-0000-4000-8000-0000000000a1' $q$);
select rls_test.affected('https cancel link is accepted',
  $q$ update public.items set cancel_url = 'https://example.com/cancel' where id = '10000000-0000-4000-8000-0000000000a1' $q$, 1);
select rls_test.fails('unknown status is rejected',
  $q$ update public.items set status = 'deleted' where id = '10000000-0000-4000-8000-0000000000a1' $q$);
select rls_test.fails('bad per-item offsets are rejected',
  $q$ update public.items set reminder_offsets = '{-3}' where id = '10000000-0000-4000-8000-0000000000a1' $q$);
select rls_test.fails('user_id cannot be changed',
  $q$ update public.items set user_id = '00000000-0000-4000-8000-0000000000b2' where id = '10000000-0000-4000-8000-0000000000a1' $q$);

-- purchase_history
insert into public.purchase_history (user_id, item_id, event, occurred_on, price_cents, currency, store, quantity)
values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a2',
  'purchase', current_date - 5, 1299, 'USD', 'Corner shop', 1);
select rls_test.fails('history needs a valid event',
  $q$ insert into public.purchase_history (user_id, item_id, event, occurred_on)
      values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a2', 'gift', current_date) $q$);
select rls_test.fails('history quantity must be positive',
  $q$ insert into public.purchase_history (user_id, item_id, occurred_on, quantity)
      values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a2', current_date, 0) $q$);

-- reminder_log idempotency key
insert into public.reminder_log (user_id, item_id, due_date, offset_days, channel, status)
values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', current_date + 10, 7, 'email', 'sent');
select rls_test.fails('same reminder cannot be logged twice',
  $q$ insert into public.reminder_log (user_id, item_id, due_date, offset_days, channel)
      values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', current_date + 10, 7, 'email') $q$,
  '23505');
select rls_test.affected('ON CONFLICT DO NOTHING claims nothing the second time',
  $q$ insert into public.reminder_log (user_id, item_id, due_date, offset_days, channel)
      values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', current_date + 10, 7, 'email')
      on conflict (item_id, due_date, offset_days, channel) do nothing $q$, 0);
select rls_test.affected('a different channel is a new reminder',
  $q$ insert into public.reminder_log (user_id, item_id, due_date, offset_days, channel)
      values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', current_date + 10, 7, 'push')
      on conflict (item_id, due_date, offset_days, channel) do nothing $q$, 1);
select rls_test.affected('a new due date is a new reminder',
  $q$ insert into public.reminder_log (user_id, item_id, due_date, offset_days, channel)
      values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', current_date + 40, 7, 'email')
      on conflict (item_id, due_date, offset_days, channel) do nothing $q$, 1);
select rls_test.affected('overdue marker (offset -1) is allowed',
  $q$ insert into public.reminder_log (user_id, item_id, due_date, offset_days, channel)
      values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', current_date - 2, -1, 'in_app') $q$, 1);

-- notifications keep existing when the item is deleted (item_id nulled)
insert into public.notifications (id, user_id, item_id, title)
values ('20000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1',
  '10000000-0000-4000-8000-0000000000a3', 'Laptop warranty ends soon');

-- cascades
delete from public.items where id = '10000000-0000-4000-8000-0000000000a3';
select rls_test.eq('deleting an item keeps its notification but clears the link',
  (select count(*) from public.notifications where id = '20000000-0000-4000-8000-0000000000a1' and item_id is null), 1);
delete from public.items where id = '10000000-0000-4000-8000-0000000000a2';
select rls_test.eq('deleting an item deletes its history',
  (select count(*) from public.purchase_history), 0);

delete from auth.users where id = '00000000-0000-4000-8000-0000000000a1';
select rls_test.eq('deleting a user removes items, profile, logs and notifications',
  (select (select count(*) from public.items) + (select count(*) from public.profiles)
        + (select count(*) from public.reminder_log) + (select count(*) from public.notifications)), 0);

-- storage bucket configuration
select rls_test.eq('logos bucket is private with a 512 KB limit',
  (select count(*) from storage.buckets
    where id = 'logos' and public = false and file_size_limit = 524288
      and allowed_mime_types @> array['image/png', 'image/jpeg', 'image/webp']
      and cardinality(allowed_mime_types) = 3), 1);
select rls_test.eq('receipts bucket is private with a 3 MB limit',
  (select count(*) from storage.buckets
    where id = 'receipts' and public = false and file_size_limit = 3145728
      and cardinality(allowed_mime_types) = 3), 1);
