\set ON_ERROR_STOP on
begin;

do $$
declare
  rel record;
begin
  for rel in
    select * from (values
      ('public','objective_ref_counters'),
      ('public','work_ref_counters')
    ) as t(schema_name, table_name)
  loop
    if has_table_privilege('anon', format('%I.%I', rel.schema_name, rel.table_name), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') then
      raise exception 'FPG12: anon retains direct privilege on %.%', rel.schema_name, rel.table_name;
    end if;
    if has_table_privilege('authenticated', format('%I.%I', rel.schema_name, rel.table_name), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') then
      raise exception 'FPG12: authenticated retains direct privilege on %.%', rel.schema_name, rel.table_name;
    end if;
  end loop;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='next_objective_ref' and p.prosecdef
  ) then
    raise exception 'FPG12: next_objective_ref definer path missing';
  end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='next_work_ref' and p.prosecdef
  ) then
    raise exception 'FPG12: next_work_ref definer path missing';
  end if;

  for rel in
    select * from (values
      ('hr_private','audit_events'),
      ('hr_private','compensation_history'),
      ('hr_private','documents'),
      ('hr_private','employment_terms'),
      ('hr_private','identifiers'),
      ('hr_private','payment_details')
    ) as t(schema_name, table_name)
  loop
    if has_table_privilege('anon', format('%I.%I', rel.schema_name, rel.table_name), 'SELECT,INSERT,UPDATE,DELETE') then
      raise exception 'FPG12: anon direct protected-HR privilege on %.%', rel.schema_name, rel.table_name;
    end if;
    if has_table_privilege('authenticated', format('%I.%I', rel.schema_name, rel.table_name), 'SELECT,INSERT,UPDATE,DELETE') then
      raise exception 'FPG12: authenticated direct protected-HR privilege on %.%', rel.schema_name, rel.table_name;
    end if;
  end loop;
end
$$;

rollback;
