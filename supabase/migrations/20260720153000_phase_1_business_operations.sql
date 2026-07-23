-- Phase 1 completion: business operations, plan enforcement and secure roles.

create unique index if not exists idx_departamentos_pais_nombre_unique
  on public.departamentos (pais_id, nombre);

create unique index if not exists idx_ciudades_departamento_nombre_unique
  on public.ciudades (departamento_id, nombre);

insert into public.departamentos (pais_id, nombre, codigo)
select p.id, seed.nombre, seed.codigo
from public.paises p
join (values
  ('CO', 'Bogota D.C.', 'DC'),
  ('CO', 'Antioquia', 'ANT'),
  ('CO', 'Valle del Cauca', 'VAC'),
  ('CO', 'Atlantico', 'ATL'),
  ('CO', 'Bolivar', 'BOL'),
  ('CO', 'Santander', 'SAN'),
  ('CO', 'Risaralda', 'RIS'),
  ('CO', 'Caldas', 'CAL'),
  ('MX', 'Ciudad de Mexico', 'CMX'),
  ('MX', 'Jalisco', 'JAL'),
  ('MX', 'Nuevo Leon', 'NLE'),
  ('PE', 'Lima', 'LIM'),
  ('CL', 'Region Metropolitana de Santiago', 'RM'),
  ('AR', 'Buenos Aires', 'BA')
) as seed(pais_codigo, nombre, codigo)
  on p.codigo_iso2 = seed.pais_codigo
on conflict (pais_id, nombre) do update
set codigo = excluded.codigo, activo = true;

insert into public.ciudades (departamento_id, nombre)
select d.id, seed.ciudad
from public.departamentos d
join public.paises p on p.id = d.pais_id
join (values
  ('CO', 'Bogota D.C.', 'Bogota'),
  ('CO', 'Antioquia', 'Medellin'),
  ('CO', 'Valle del Cauca', 'Cali'),
  ('CO', 'Atlantico', 'Barranquilla'),
  ('CO', 'Bolivar', 'Cartagena'),
  ('CO', 'Santander', 'Bucaramanga'),
  ('CO', 'Risaralda', 'Pereira'),
  ('CO', 'Caldas', 'Manizales'),
  ('MX', 'Ciudad de Mexico', 'Ciudad de Mexico'),
  ('MX', 'Jalisco', 'Guadalajara'),
  ('MX', 'Nuevo Leon', 'Monterrey'),
  ('PE', 'Lima', 'Lima'),
  ('CL', 'Region Metropolitana de Santiago', 'Santiago'),
  ('AR', 'Buenos Aires', 'Buenos Aires')
) as seed(pais_codigo, departamento, ciudad)
  on p.codigo_iso2 = seed.pais_codigo and d.nombre = seed.departamento
on conflict (departamento_id, nombre) do update
set activo = true;

create or replace function public.prevent_unauthorized_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol is not distinct from old.rol then
    return new;
  end if;

  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.id = auth.uid()
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
create trigger protect_usuario_role
before update of rol on public.usuarios
for each row execute function public.prevent_unauthorized_role_change();

create or replace function public.promote_business_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.usuarios
  set rol = 'negocio'
  where id = new.dueno_id and rol = 'cliente';
  return new;
end;
$$;

drop trigger if exists promote_owner_after_business_insert on public.negocios;
create trigger promote_owner_after_business_insert
after insert on public.negocios
for each row execute function public.promote_business_owner();

create or replace function public.validate_court_plan_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_courts integer;
  current_courts integer;
begin
  perform 1 from public.negocios where id = new.negocio_id for update;

  select p.limite_canchas
  into allowed_courts
  from public.negocios n
  join public.planes p on p.id = n.plan_id
  where n.id = new.negocio_id and p.activo = true;

  if allowed_courts is null then
    raise exception 'El negocio no tiene un plan activo'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
  into current_courts
  from public.canchas c
  where c.negocio_id = new.negocio_id
    and (tg_op = 'INSERT' or c.id <> new.id);

  if current_courts >= allowed_courts then
    raise exception 'Limite de canchas alcanzado para el plan actual (%)', allowed_courts
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_limite_canchas on public.canchas;
create trigger validar_limite_canchas
before insert or update of negocio_id on public.canchas
for each row execute function public.validate_court_plan_limit();

alter table public.reservas enable row level security;

grant select on public.reservas to authenticated;

drop policy if exists "Negocios ven reservas asociadas" on public.reservas;
create policy "Negocios ven reservas asociadas"
on public.reservas for select
to authenticated
using (public.owns_negocio(negocio_id) or public.is_admin());

drop policy if exists "Clientes ven sus reservas" on public.reservas;
create policy "Clientes ven sus reservas"
on public.reservas for select
to authenticated
using (usuario_id = auth.uid() or public.is_admin());

