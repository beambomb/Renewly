-- Demo data for the FIRST user in auth.users (sign in once, then run this).
--   Hosted project: paste into the Supabase SQL editor.
--   Local CLI:      runs automatically on `supabase db reset` (no user yet -> does nothing).
-- Dates are relative to today so the rings look realistic whenever you seed.
-- Safe to re-run: it first removes items whose names start with "[demo] ".

do $$
declare
  uid uuid := (select id from auth.users order by created_at limit 1);
  today date := current_date;
  coffee uuid := gen_random_uuid();
begin
  if uid is null then
    raise notice 'No user found; sign in once, then run this seed again.';
    return;
  end if;

  delete from public.items where user_id = uid and name like '[demo] %';

  -- Subscriptions (period_start = previous billing date, due_date = next billing date)
  insert into public.items (user_id, kind, name, category, emoji, period_start, due_date,
    price_cents, currency, billing_cycle, cycle_days, billing_anchor_day, payment_method, auto_renew, cancel_url, notes)
  values
    (uid, 'subscription', '[demo] Netflix', 'Entertainment', 'N', (today + 12 - interval '1 month')::date, today + 12,
      1549, 'USD', 'monthly', null, extract(day from today + 12)::int, 'Visa 4242', true, 'https://www.netflix.com/cancelplan', null),
    (uid, 'subscription', '[demo] Spotify', 'Music', 'S', (today + 3 - interval '1 month')::date, today + 3,
      1199, 'USD', 'monthly', null, extract(day from today + 3)::int, 'Visa 4242', true, null, 'Family plan'),
    (uid, 'subscription', '[demo] iCloud 200 GB', 'Cloud', 'C', (today + 25 - interval '1 month')::date, today + 25,
      299, 'USD', 'monthly', null, extract(day from today + 25)::int, 'Apple Pay', true, null, null),
    (uid, 'subscription', '[demo] Amazon Prime', 'Shopping', 'P', (today + 120 - interval '1 year')::date, today + 120,
      13900, 'USD', 'yearly', null, extract(day from today + 120)::int, 'Mastercard 1881', true, null, null),
    (uid, 'subscription', '[demo] Gym', 'Health', 'G', today - 12, today + 16,
      3500, 'EUR', 'custom', 28, null, 'Direct debit', true, null, 'Every 28 days'),
    (uid, 'subscription', '[demo] Meal box', 'Food', 'M', today - 5, today + 2,
      2499, 'USD', 'weekly', 7, null, 'Visa 4242', true, null, null),
    (uid, 'subscription', '[demo] Domain name', 'Work', 'D', (today - 3 - interval '1 year')::date, today - 3,
      1499, 'USD', 'yearly', null, extract(day from today - 3)::int, 'Visa 4242', false, null,
      'Does not auto-renew, so it shows as overdue');

  -- Recurring purchases
  insert into public.items (id, user_id, kind, name, category, emoji, period_start, due_date,
    last_purchased_on, duration_days, usual_price_cents, usual_currency, usual_store, usual_quantity)
  values
    (coffee, uid, 'recurring', '[demo] Coffee beans', 'Groceries', 'C', today - 10, today + 4,
      today - 10, 14, 1299, 'USD', 'Corner roastery', 1),
    (gen_random_uuid(), uid, 'recurring', '[demo] Laundry detergent', 'Household', 'L', today - 20, today + 25,
      today - 20, 45, 1899, 'USD', 'Supermarket', 1),
    (gen_random_uuid(), uid, 'recurring', '[demo] Toothpaste', 'Toiletries', 'T', today - 57, today + 3,
      today - 57, 60, 449, 'USD', 'Pharmacy', 2),
    (gen_random_uuid(), uid, 'recurring', '[demo] Water filter cartridge', 'Household', 'W', today - 100, today - 10,
      today - 100, 90, 2499, 'USD', 'Online', 1);

  -- History for the coffee beans: four purchases, real interval about 12 days vs 14 estimated
  insert into public.purchase_history (user_id, item_id, event, occurred_on, price_cents, currency, store, quantity)
  values
    (uid, coffee, 'purchase', today - 46, 1249, 'USD', 'Corner roastery', 1),
    (uid, coffee, 'purchase', today - 34, 1299, 'USD', 'Corner roastery', 1),
    (uid, coffee, 'purchase', today - 22, 1299, 'USD', 'Corner roastery', 1),
    (uid, coffee, 'purchase', today - 10, 1349, 'USD', 'Corner roastery', 1);

  -- Warranties
  insert into public.items (user_id, kind, name, category, emoji, period_start, due_date,
    purchased_on, warranty_months, expires_on, serial_number, notes)
  values
    (uid, 'warranty', '[demo] Laptop', 'Electronics', 'L', today - 400, (today - 400 + interval '36 months')::date,
      today - 400, 36, (today - 400 + interval '36 months')::date, 'SN-LT-20481', 'Keep the receipt for service'),
    (uid, 'warranty', '[demo] Headphones', 'Electronics', 'H', today - 700, (today - 700 + interval '24 months')::date,
      today - 700, 24, (today - 700 + interval '24 months')::date, 'SN-HP-77310', null),
    (uid, 'warranty', '[demo] Washing machine', 'Appliances', 'W', today - 1000, (today - 1000 + interval '24 months')::date,
      today - 1000, 24, (today - 1000 + interval '24 months')::date, 'SN-WM-55902', 'Expired, shows as overdue');
end;
$$;
