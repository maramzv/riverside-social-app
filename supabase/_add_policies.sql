-- Demo-only: no auth/sign-in in any of the 4 products yet (per Outline open question),
-- so every table gets one permissive policy for anon + authenticated. Revisit before
-- any real deployment with real customer/payment data.
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'Books', 'Customers', 'Events', 'Inventory', 'Merchandise',
      'Purchases', 'Social Media Accounts', 'Social Posts', 'Store Info'
    ])
  loop
    execute format('drop policy if exists %I on %I;', t || '_demo_all_access', t);
    execute format(
      'create policy %I on %I for all to anon, authenticated using (true) with check (true);',
      t || '_demo_all_access', t
    );
  end loop;
end $$;

notify pgrst, 'reload schema';
