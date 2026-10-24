-- Test helpers. The runner wraps each test file in a transaction that is always
-- rolled back, so nothing here persists. Results are recorded in rls_test.results.

create schema rls_test;
create table rls_test.results (at timestamptz not null default clock_timestamp(), label text not null);

grant usage on schema rls_test to anon, authenticated;
grant insert on rls_test.results to anon, authenticated;

create function rls_test.pass(label text) returns void
language plpgsql as $$
begin
  insert into rls_test.results (label) values (label);
end;
$$;

-- Assert two numbers are equal.
create function rls_test.eq(label text, actual bigint, expected bigint) returns void
language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'FAIL: % (expected %, got %)', label, expected, actual;
  end if;
  perform rls_test.pass(label);
end;
$$;

-- Assert a statement raises an error (optionally with a specific SQLSTATE).
create function rls_test.fails(label text, stmt text, expected_state text default null) returns void
language plpgsql as $$
declare
  got text;
begin
  begin
    execute stmt;
  exception when others then
    got := sqlstate;
  end;
  if got is null then
    raise exception 'FAIL: % (statement was allowed)', label;
  end if;
  if expected_state is not null and got <> expected_state then
    raise exception 'FAIL: % (expected SQLSTATE %, got %)', label, expected_state, got;
  end if;
  perform rls_test.pass(label);
end;
$$;

-- Assert a DML statement touches exactly the expected number of rows.
create function rls_test.affected(label text, stmt text, expected bigint) returns void
language plpgsql as $$
declare
  n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  perform rls_test.eq(label, n, expected);
end;
$$;

-- Assert a query is either denied outright or returns zero rows.
create function rls_test.sees_nothing(label text, query text) returns void
language plpgsql as $$
declare
  n bigint;
begin
  begin
    execute format('select count(*) from (%s) as t', query) into n;
  exception when others then
    perform rls_test.pass(label || ' (denied)');
    return;
  end;
  perform rls_test.eq(label, n, 0);
end;
$$;
