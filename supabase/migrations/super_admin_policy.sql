-- Allow Super Admins to SELECT all companies
create policy "Super Admins can view all companies"
on company_info
for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.is_super_admin = true
  )
);

-- Allow Super Admins to UPDATE all companies
create policy "Super Admins can update all companies"
on company_info
for update
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.is_super_admin = true
  )
);

-- Allow Super Admins to DELETE companies
create policy "Super Admins can delete companies"
on company_info
for delete
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.is_super_admin = true
  )
);
