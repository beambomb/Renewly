-- The demo seed must satisfy every constraint and produce the intended mix.
-- (The seed is read from supabase/seed.sql by the runner via the \i-free include below.)

insert into auth.users (id, aud, role, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'seed@example.test');

-- __SEED__

select rls_test.eq('seed creates 7 subscriptions',
  (select count(*) from public.items where kind = 'subscription'), 7);
select rls_test.eq('seed creates 4 recurring purchases',
  (select count(*) from public.items where kind = 'recurring'), 4);
select rls_test.eq('seed creates 3 warranties',
  (select count(*) from public.items where kind = 'warranty'), 3);
select rls_test.eq('seed includes overdue, urgent and comfortable items',
  (select count(*) from public.items where due_date < current_date), 3);
select rls_test.eq('seed history makes 4 coffee purchases',
  (select count(*) from public.purchase_history), 4);
select rls_test.eq('seed uses more than one currency',
  (select count(distinct currency) from public.items where kind = 'subscription'), 2);

-- re-running is safe
-- __SEED__
select rls_test.eq('seed is idempotent', (select count(*) from public.items), 14);
