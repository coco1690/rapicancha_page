-- Administrative management with soft deletion and suspended-user enforcement.

alter table public.usuarios
  add column if not exists activo boolean not null default true;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and rol = 'admin' and activo = true
  );
$$;

create or replace function public.owns_negocio(target_negocio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.negocios n
    join public.usuarios u on u.id = n.dueno_id
    where n.id = target_negocio_id
      and n.dueno_id = auth.uid()
      and u.activo = true
  );
$$;

create or replace function public.protect_usuario_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol is not distinct from old.rol
    and new.activo is not distinct from old.activo
  then
    return new;
  end if;

  if old.rol = 'admin' and old.activo = true
    and (new.rol <> 'admin' or new.activo = false)
    and (select count(*) from public.usuarios where rol = 'admin' and activo = true) <= 1
  then
    raise exception 'No se puede desactivar o degradar al ultimo administrador activo'
      using errcode = 'P0001';
  end if;

  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.activo is distinct from old.activo then
    raise exception 'No tienes permiso para cambiar el estado del usuario'
      using errcode = '42501';
  end if;

  if new.id = auth.uid()
    and old.rol = 'cliente'
    and new.rol = 'negocio'
    and exists (select 1 from public.negocios n where n.dueno_id = new.id)
  then
    return new;
  end if;

  raise exception 'No tienes permiso para cambiar este rol'
    using errcode = '42501';
end;
$$;

drop trigger if exists protect_usuario_role on public.usuarios;
drop trigger if exists protect_usuario_admin_fields on public.usuarios;
create trigger protect_usuario_admin_fields
before update of rol, activo on public.usuarios
for each row execute function public.protect_usuario_admin_fields();

grant insert, update on public.planes to authenticated;

drop policy if exists "Administradores actualizan usuarios" on public.usuarios;
create policy "Administradores actualizan usuarios"
on public.usuarios for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Administradores gestionan planes" on public.planes;
create policy "Administradores gestionan planes"
on public.planes for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Administradores crean negocios" on public.negocios;
create policy "Administradores crean negocios"
on public.negocios for insert
to authenticated
with check (public.is_admin());

comment on column public.usuarios.activo is
  'False suspends private application access while preserving audit history.';

