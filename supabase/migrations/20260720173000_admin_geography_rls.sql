-- Administrative geography catalog management.

grant insert, update on
  public.paises,
  public.departamentos,
  public.ciudades
to authenticated;

drop policy if exists "Administradores gestionan paises" on public.paises;
create policy "Administradores gestionan paises"
on public.paises for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Administradores gestionan departamentos" on public.departamentos;
create policy "Administradores gestionan departamentos"
on public.departamentos for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Administradores gestionan ciudades" on public.ciudades;
create policy "Administradores gestionan ciudades"
on public.ciudades for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Catalogo geografico visible" on public.paises;
create policy "Catalogo geografico visible"
on public.paises for select
to anon, authenticated
using (activo = true or public.is_admin());

drop policy if exists "Departamentos visibles" on public.departamentos;
create policy "Departamentos visibles"
on public.departamentos for select
to anon, authenticated
using (
  public.is_admin()
  or (
    activo = true
    and exists (
      select 1 from public.paises p
      where p.id = pais_id and p.activo = true
    )
  )
);

drop policy if exists "Ciudades visibles" on public.ciudades;
create policy "Ciudades visibles"
on public.ciudades for select
to anon, authenticated
using (
  public.is_admin()
  or (
    activo = true
    and exists (
      select 1
      from public.departamentos d
      join public.paises p on p.id = d.pais_id
      where d.id = departamento_id
        and d.activo = true
        and p.activo = true
    )
  )
);

