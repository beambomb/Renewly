-- Reminder and savings sections, large amounts, savings_entries and their isolation.
-- Fixed ids: A = ...a1, B = ...b2.

insert into auth.users (id, aud, role, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'a@example.test'),
  ('00000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', 'b@example.test');

-- ---- reminders ----
insert into public.items (id, user_id, kind, name, period_start, due_date)
values ('10000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1',
  'reminder', 'Renew passport', current_date, current_date + 60);
select rls_test.eq('a one-off reminder needs no billing cycle',
  (select count(*) from public.items where kind = 'reminder' and billing_cycle is null), 1);

insert into public.items (user_id, kind, name, period_start, due_date, billing_cycle, billing_anchor_day)
values ('00000000-0000-4000-8000-0000000000a1', 'reminder', 'Pay rent', current_date - 20, current_date + 10, 'monthly', 5);
select rls_test.eq('a repeating monthly reminder can be stored',
  (select count(*) from public.items where kind = 'reminder' and billing_cycle = 'monthly'), 1);

select rls_test.fails('a custom repeating reminder needs cycle_days',
  $q$ insert into public.items (user_id, kind, name, period_start, due_date, billing_cycle)
      values ('00000000-0000-4000-8000-0000000000a1', 'reminder', 'x', current_date, current_date + 1, 'custom') $q$, '23514');
select rls_test.affected('a one-off reminder can be marked done',
  $q$ update public.items set status = 'done' where id = '10000000-0000-4000-8000-0000000000c1' $q$, 1);
select rls_test.fails('only reminders can be done',
  $q$ insert into public.items (user_id, kind, name, status, period_start, due_date, last_purchased_on, duration_days)
      values ('00000000-0000-4000-8000-0000000000a1', 'recurring', 'x', 'done', current_date, current_date + 1, current_date, 1) $q$, '23514');

-- ---- large amounts (rupiah) ----
insert into public.items (user_id, kind, name, period_start, due_date, price_cents, currency, billing_cycle, auto_renew)
values ('00000000-0000-4000-8000-0000000000a1', 'subscription', 'Big price', current_date - 5, current_date + 25,
  5000000000, 'IDR', 'monthly', true);
select rls_test.eq('a price above the 32-bit limit fits',
  (select count(*) from public.items where price_cents = 5000000000), 1);
select rls_test.fails('absurd prices are still rejected',
  $q$ insert into public.items (user_id, kind, name, period_start, due_date, price_cents, currency, billing_cycle, auto_renew)
      values ('00000000-0000-4000-8000-0000000000a1', 'subscription', 'x', current_date, current_date + 1, 100000000000001, 'IDR', 'monthly', true) $q$, '23514');

-- ---- savings goals ----
insert into public.items (id, user_id, kind, name, currency, target_minor, saved_minor)
values ('10000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000a1',
  'savings', 'Emergency fund', 'IDR', 5000000000, 999);
select rls_test.eq('a savings goal without a deadline needs no dates',
  (select count(*) from public.items where id = '10000000-0000-4000-8000-0000000000d1'
     and period_start is null and due_date is null), 1);
select rls_test.eq('a new goal always starts at zero, whatever the client sent',
  (select saved_minor from public.items where id = '10000000-0000-4000-8000-0000000000d1'), 0);

insert into public.items (user_id, kind, name, currency, target_minor, saved_minor, period_start, due_date)
values ('00000000-0000-4000-8000-0000000000a1', 'savings', 'Trip', 'IDR', 1000000000, 0, current_date, current_date + 180);
select rls_test.eq('a goal with a deadline stores both dates',
  (select count(*) from public.items where name = 'Trip' and due_date = current_date + 180), 1);

select rls_test.fails('a goal needs a target',
  $q$ insert into public.items (user_id, kind, name, currency, saved_minor)
      values ('00000000-0000-4000-8000-0000000000a1', 'savings', 'x', 'IDR', 0) $q$, '23514');
select rls_test.fails('a goal needs a currency',
  $q$ insert into public.items (user_id, kind, name, target_minor, saved_minor)
      values ('00000000-0000-4000-8000-0000000000a1', 'savings', 'x', 1000, 0) $q$, '23514');
select rls_test.fails('a goal target must be above zero',
  $q$ insert into public.items (user_id, kind, name, currency, target_minor, saved_minor)
      values ('00000000-0000-4000-8000-0000000000a1', 'savings', 'x', 'IDR', 0, 0) $q$, '23514');
select rls_test.fails('a goal deadline needs a period start too',
  $q$ insert into public.items (user_id, kind, name, currency, target_minor, saved_minor, due_date)
      values ('00000000-0000-4000-8000-0000000000a1', 'savings', 'x', 'IDR', 1000, 0, current_date + 5) $q$, '23514');
select rls_test.fails('other kinds still require their dates',
  $q$ insert into public.items (user_id, kind, name, last_purchased_on, duration_days)
      values ('00000000-0000-4000-8000-0000000000a1', 'recurring', 'x', current_date, 5) $q$, '23514');

-- ---- savings_entries and the saved total ----
insert into public.savings_entries (user_id, item_id, entry_type, amount_minor, occurred_on, note)
values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000d1', 'deposit', 1000000000, current_date, 'Start');
select rls_test.eq('a deposit raises the saved total',
  (select saved_minor from public.items where id = '10000000-0000-4000-8000-0000000000d1'), 1000000000);

insert into public.savings_entries (user_id, item_id, entry_type, amount_minor, occurred_on)
values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000d1', 'deposit', 250000000, current_date);
insert into public.savings_entries (user_id, item_id, entry_type, amount_minor, occurred_on)
values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000d1', 'withdrawal', -400000000, current_date);
select rls_test.eq('deposits and withdrawals add up',
  (select saved_minor from public.items where id = '10000000-0000-4000-8000-0000000000d1'), 850000000);

select rls_test.fails('a withdrawal cannot take the total below zero',
  $q$ insert into public.savings_entries (user_id, item_id, entry_type, amount_minor, occurred_on)
      values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000d1', 'withdrawal', -850000001, current_date) $q$, '23514');
select rls_test.eq('a rejected withdrawal leaves the total unchanged',
  (select saved_minor from public.items where id = '10000000-0000-4000-8000-0000000000d1'), 850000000);

insert into public.savings_entries (user_id, item_id, entry_type, amount_minor, occurred_on, note)
values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000d1', 'adjustment', -50000000, current_date, 'Correction');
select rls_test.eq('an adjustment can lower the total',
  (select saved_minor from public.items where id = '10000000-0000-4000-8000-0000000000d1'), 800000000);

select rls_test.fails('a deposit must be positive',
  $q$ insert into public.savings_entries (user_id, item_id, entry_type, amount_minor, occurred_on)
      values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000d1', 'deposit', -5, current_date) $q$, '23514');
select rls_test.fails('a withdrawal must be negative',
  $q$ insert into public.savings_entries (user_id, item_id, entry_type, amount_minor, occurred_on)
      values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000d1', 'withdrawal', 5, current_date) $q$, '23514');
select rls_test.fails('a zero amount is rejected',
  $q$ insert into public.savings_entries (user_id, item_id, entry_type, amount_minor, occurred_on)
      values ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000d1', 'adjustment', 0, current_date) $q$, '23514');
select rls_test.fails('saved_minor cannot be edited directly',
  $q$ update public.items set saved_minor = 5 where id = '10000000-0000-4000-8000-0000000000d1' $q$, '42501');
select rls_test.affected('other fields on a goal can still be edited',
  $q$ update public.items set name = 'Dana darurat' where id = '10000000-0000-4000-8000-0000000000d1' $q$, 1);
select rls_test.eq('editing other fields does not change the total',
  (select saved_minor from public.items where id = '10000000-0000-4000-8000-0000000000d1'), 800000000);

delete from public.savings_entries where note = 'Correction';
select rls_test.eq('deleting an entry updates the total',
  (select saved_minor from public.items where id = '10000000-0000-4000-8000-0000000000d1'), 850000000);

-- non-savings items never carry a saved amount
select rls_test.eq('other kinds have no saved amount',
  (select count(*) from public.items where kind <> 'savings' and saved_minor is not null), 0);

-- ---- another user's goal for the isolation checks ----
insert into public.items (id, user_id, kind, name, currency, target_minor, saved_minor)
values ('10000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000b2',
  'savings', 'B goal', 'IDR', 1000, 0);
insert into public.savings_entries (id, user_id, item_id, entry_type, amount_minor, occurred_on)
values ('50000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000b2',
  '10000000-0000-4000-8000-0000000000d2', 'deposit', 300, current_date);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

select rls_test.eq('A sees only own savings entries',
  (select count(*) from public.savings_entries where user_id <> auth.uid()), 0);
select rls_test.eq('A sees own savings entries',
  (select count(*) from public.savings_entries), 3);
select rls_test.fails('A cannot add an entry to B goal',
  $q$ insert into public.savings_entries (item_id, entry_type, amount_minor, occurred_on)
      values ('10000000-0000-4000-8000-0000000000d2', 'deposit', 100, current_date) $q$);
select rls_test.fails('A cannot add an entry as B',
  $q$ insert into public.savings_entries (user_id, item_id, entry_type, amount_minor, occurred_on)
      values ('00000000-0000-4000-8000-0000000000b2', '10000000-0000-4000-8000-0000000000d2', 'deposit', 100, current_date) $q$, '42501');
select rls_test.affected('A cannot delete B entries',
  $q$ delete from public.savings_entries where id = '50000000-0000-4000-8000-0000000000b2' $q$, 0);
select rls_test.fails('entries cannot be edited',
  $q$ update public.savings_entries set amount_minor = 1 $q$, '42501');
select rls_test.affected('A can add a deposit to own goal',
  $q$ insert into public.savings_entries (item_id, entry_type, amount_minor, occurred_on)
      values ('10000000-0000-4000-8000-0000000000d1', 'deposit', 100, current_date) $q$, 1);
select rls_test.eq('the owner sees the updated total',
  (select saved_minor from public.items where id = '10000000-0000-4000-8000-0000000000d1'), 850000100);

reset role;
select rls_test.eq('B goal total is untouched',
  (select saved_minor from public.items where id = '10000000-0000-4000-8000-0000000000d2'), 300);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select rls_test.fails('anon cannot read savings entries', $q$ select * from public.savings_entries $q$, '42501');
reset role;

-- cascade
delete from public.items where id = '10000000-0000-4000-8000-0000000000d1';
select rls_test.eq('deleting a goal deletes its entries',
  (select count(*) from public.savings_entries where item_id = '10000000-0000-4000-8000-0000000000d1'), 0);
