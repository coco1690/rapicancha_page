-- Administrative sports catalog management.

grant insert, update, delete on public.deportes to authenticated;

drop policy if exists "Administradores gestionan deportes" on public.deportes;
create policy "Administradores gestionan deportes"
on public.deportes for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

