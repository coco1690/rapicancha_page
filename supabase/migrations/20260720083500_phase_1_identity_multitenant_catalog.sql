-- Phase 1: identity, multi-tenant ownership and public catalog.

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.user_role as enum ('admin', 'negocio', 'cliente');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.negocio_estado as enum ('borrador', 'activo', 'suspendido', 'cancelado');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.cancha_estado as enum ('activa', 'mantenimiento', 'inactiva');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.precio_tipo as enum ('hora', 'franja');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  rol public.user_role not null default 'cliente',
  nombre text,
  telefono text,
  email text,
  acepto_marketing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.usuarios add column if not exists rol public.user_role default 'cliente';
alter table public.usuarios add column if not exists nombre text;
alter table public.usuarios add column if not exists telefono text;
alter table public.usuarios add column if not exists email text;
alter table public.usuarios add column if not exists acepto_marketing boolean default false;
alter table public.usuarios add column if not exists created_at timestamptz default now();
alter table public.usuarios add column if not exists updated_at timestamptz default now();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create table if not exists public.paises (
  id uuid primary key default gen_random_uuid(),
  codigo_iso2 char(2) not null unique,
  nombre text not null,
  moneda_codigo char(3) not null,
  moneda_simbolo text not null,
  zona_horaria_default text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.paises add column if not exists codigo_iso2 char(2);
alter table public.paises add column if not exists nombre text;
alter table public.paises add column if not exists moneda_codigo char(3);
alter table public.paises add column if not exists moneda_simbolo text;
alter table public.paises add column if not exists zona_horaria_default text;
alter table public.paises add column if not exists activo boolean default true;
alter table public.paises add column if not exists created_at timestamptz default now();

create table if not exists public.departamentos (
  id uuid primary key default gen_random_uuid(),
  pais_id uuid not null references public.paises(id) on delete restrict,
  nombre text not null,
  codigo text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (pais_id, nombre)
);

alter table public.departamentos add column if not exists pais_id uuid references public.paises(id) on delete restrict;
alter table public.departamentos add column if not exists nombre text;
alter table public.departamentos add column if not exists codigo text;
alter table public.departamentos add column if not exists activo boolean default true;
alter table public.departamentos add column if not exists created_at timestamptz default now();

create table if not exists public.ciudades (
  id uuid primary key default gen_random_uuid(),
  departamento_id uuid not null references public.departamentos(id) on delete restrict,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (departamento_id, nombre)
);

alter table public.ciudades add column if not exists departamento_id uuid references public.departamentos(id) on delete restrict;
alter table public.ciudades add column if not exists nombre text;
alter table public.ciudades add column if not exists activo boolean default true;
alter table public.ciudades add column if not exists created_at timestamptz default now();

create table if not exists public.planes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  limite_canchas integer not null check (limite_canchas > 0),
  precio_mensual_minor integer not null check (precio_mensual_minor >= 0),
  moneda_codigo char(3) not null default 'USD',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.planes add column if not exists slug text;
alter table public.planes add column if not exists nombre text;
alter table public.planes add column if not exists limite_canchas integer;
alter table public.planes add column if not exists precio_mensual_minor integer;
alter table public.planes add column if not exists moneda_codigo char(3) default 'USD';
alter table public.planes add column if not exists activo boolean default true;
alter table public.planes add column if not exists created_at timestamptz default now();
alter table public.planes add column if not exists updated_at timestamptz default now();

create table if not exists public.deportes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  categoria text not null,
  jugadores_por_equipo integer,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.deportes add column if not exists slug text;
alter table public.deportes add column if not exists nombre text;
alter table public.deportes add column if not exists categoria text;
alter table public.deportes add column if not exists jugadores_por_equipo integer;
alter table public.deportes add column if not exists activo boolean default true;
alter table public.deportes add column if not exists created_at timestamptz default now();

create table if not exists public.negocios (
  id uuid primary key default gen_random_uuid(),
  dueno_id uuid not null references public.usuarios(id) on delete restrict,
  plan_id uuid references public.planes(id) on delete restrict,
  ciudad_id uuid references public.ciudades(id) on delete restrict,
  slug text not null unique,
  nombre text not null,
  descripcion text,
  telefono text,
  email text,
  direccion text,
  latitud numeric(10, 7),
  longitud numeric(10, 7),
  zona_horaria text not null default 'America/Bogota',
  moneda_codigo char(3) not null default 'COP',
  estado public.negocio_estado not null default 'borrador',
  fecha_fin_prueba timestamptz,
  stripe_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint negocios_latitud_chk check (latitud is null or latitud between -90 and 90),
  constraint negocios_longitud_chk check (longitud is null or longitud between -180 and 180)
);

alter table public.negocios add column if not exists dueno_id uuid references public.usuarios(id) on delete restrict;
alter table public.negocios add column if not exists plan_id uuid references public.planes(id) on delete restrict;
alter table public.negocios add column if not exists ciudad_id uuid references public.ciudades(id) on delete restrict;
alter table public.negocios add column if not exists slug text;
alter table public.negocios add column if not exists nombre text;
alter table public.negocios add column if not exists descripcion text;
alter table public.negocios add column if not exists telefono text;
alter table public.negocios add column if not exists email text;
alter table public.negocios add column if not exists direccion text;
alter table public.negocios add column if not exists latitud numeric(10, 7);
alter table public.negocios add column if not exists longitud numeric(10, 7);
alter table public.negocios add column if not exists zona_horaria text default 'America/Bogota';
alter table public.negocios add column if not exists moneda_codigo char(3) default 'COP';
alter table public.negocios add column if not exists estado public.negocio_estado default 'borrador';
alter table public.negocios add column if not exists fecha_fin_prueba timestamptz;
alter table public.negocios add column if not exists stripe_account_id text;
alter table public.negocios add column if not exists created_at timestamptz default now();
alter table public.negocios add column if not exists updated_at timestamptz default now();

create table if not exists public.sedes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  ciudad_id uuid references public.ciudades(id) on delete restrict,
  nombre text not null,
  direccion text,
  latitud numeric(10, 7),
  longitud numeric(10, 7),
  telefono text,
  zona_horaria text,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sedes_latitud_chk check (latitud is null or latitud between -90 and 90),
  constraint sedes_longitud_chk check (longitud is null or longitud between -180 and 180)
);

alter table public.sedes add column if not exists negocio_id uuid references public.negocios(id) on delete cascade;
alter table public.sedes add column if not exists ciudad_id uuid references public.ciudades(id) on delete restrict;
alter table public.sedes add column if not exists nombre text;
alter table public.sedes add column if not exists direccion text;
alter table public.sedes add column if not exists latitud numeric(10, 7);
alter table public.sedes add column if not exists longitud numeric(10, 7);
alter table public.sedes add column if not exists telefono text;
alter table public.sedes add column if not exists zona_horaria text;
alter table public.sedes add column if not exists activa boolean default true;
alter table public.sedes add column if not exists created_at timestamptz default now();
alter table public.sedes add column if not exists updated_at timestamptz default now();

create table if not exists public.canchas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  sede_id uuid references public.sedes(id) on delete set null,
  deporte_id uuid not null references public.deportes(id) on delete restrict,
  nombre text not null,
  descripcion text,
  estado public.cancha_estado not null default 'activa',
  capacidad_jugadores integer,
  superficie text,
  cubierta boolean not null default false,
  iot_lock_code text,
  iot_light_switch_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (negocio_id, nombre)
);

alter table public.canchas add column if not exists negocio_id uuid references public.negocios(id) on delete cascade;
alter table public.canchas add column if not exists sede_id uuid references public.sedes(id) on delete set null;
alter table public.canchas add column if not exists deporte_id uuid references public.deportes(id) on delete restrict;
alter table public.canchas add column if not exists nombre text;
alter table public.canchas add column if not exists descripcion text;
alter table public.canchas add column if not exists estado public.cancha_estado default 'activa';
alter table public.canchas add column if not exists capacidad_jugadores integer;
alter table public.canchas add column if not exists superficie text;
alter table public.canchas add column if not exists cubierta boolean default false;
alter table public.canchas add column if not exists iot_lock_code text;
alter table public.canchas add column if not exists iot_light_switch_id text;
alter table public.canchas add column if not exists created_at timestamptz default now();
alter table public.canchas add column if not exists updated_at timestamptz default now();

create table if not exists public.cancha_tarifas (
  id uuid primary key default gen_random_uuid(),
  cancha_id uuid not null references public.canchas(id) on delete cascade,
  tipo public.precio_tipo not null default 'hora',
  nombre text not null default 'Tarifa general',
  dias_semana smallint[] not null default array[1,2,3,4,5,6,7]::smallint[],
  hora_inicio time not null default '00:00',
  hora_fin time not null default '23:59',
  precio_minor integer not null check (precio_minor >= 0),
  moneda_codigo char(3) not null,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cancha_tarifas_horas_chk check (hora_inicio < hora_fin),
  constraint cancha_tarifas_dias_chk check (
    array_length(dias_semana, 1) between 1 and 7
    and dias_semana <@ array[1,2,3,4,5,6,7]::smallint[]
  )
);

alter table public.cancha_tarifas add column if not exists cancha_id uuid references public.canchas(id) on delete cascade;
alter table public.cancha_tarifas add column if not exists tipo public.precio_tipo default 'hora';
alter table public.cancha_tarifas add column if not exists nombre text default 'Tarifa general';
alter table public.cancha_tarifas add column if not exists dias_semana smallint[] default array[1,2,3,4,5,6,7]::smallint[];
alter table public.cancha_tarifas add column if not exists hora_inicio time default '00:00';
alter table public.cancha_tarifas add column if not exists hora_fin time default '23:59';
alter table public.cancha_tarifas add column if not exists precio_minor integer;
alter table public.cancha_tarifas add column if not exists moneda_codigo char(3);
alter table public.cancha_tarifas add column if not exists activa boolean default true;
alter table public.cancha_tarifas add column if not exists created_at timestamptz default now();
alter table public.cancha_tarifas add column if not exists updated_at timestamptz default now();

create index if not exists idx_departamentos_pais on public.departamentos(pais_id);
create index if not exists idx_ciudades_departamento on public.ciudades(departamento_id);
create unique index if not exists idx_paises_codigo_iso2_unique on public.paises(codigo_iso2);
create unique index if not exists idx_planes_slug_unique on public.planes(slug);
create unique index if not exists idx_deportes_slug_unique on public.deportes(slug);
create unique index if not exists idx_negocios_slug_unique on public.negocios(slug);
create index if not exists idx_negocios_dueno on public.negocios(dueno_id);
create index if not exists idx_negocios_ciudad_estado on public.negocios(ciudad_id, estado);
create index if not exists idx_sedes_negocio on public.sedes(negocio_id);
create index if not exists idx_canchas_negocio on public.canchas(negocio_id);
create index if not exists idx_canchas_deporte_estado on public.canchas(deporte_id, estado);
create index if not exists idx_cancha_tarifas_cancha on public.cancha_tarifas(cancha_id);

drop trigger if exists set_usuarios_updated_at on public.usuarios;
create trigger set_usuarios_updated_at
before update on public.usuarios
for each row execute function public.set_updated_at();

drop trigger if exists set_planes_updated_at on public.planes;
create trigger set_planes_updated_at
before update on public.planes
for each row execute function public.set_updated_at();

drop trigger if exists set_negocios_updated_at on public.negocios;
create trigger set_negocios_updated_at
before update on public.negocios
for each row execute function public.set_updated_at();

drop trigger if exists set_sedes_updated_at on public.sedes;
create trigger set_sedes_updated_at
before update on public.sedes
for each row execute function public.set_updated_at();

drop trigger if exists set_canchas_updated_at on public.canchas;
create trigger set_canchas_updated_at
before update on public.canchas
for each row execute function public.set_updated_at();

drop trigger if exists set_cancha_tarifas_updated_at on public.cancha_tarifas;
create trigger set_cancha_tarifas_updated_at
before update on public.cancha_tarifas
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios
    where id = auth.uid()
      and rol = 'admin'
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
    from public.negocios
    where id = target_negocio_id
      and dueno_id = auth.uid()
  );
$$;

create or replace view public.v_marketplace_canchas
with (security_invoker = true)
as
select
  c.id as cancha_id,
  c.nombre as cancha_nombre,
  c.descripcion as cancha_descripcion,
  c.cubierta,
  c.superficie,
  d.id as deporte_id,
  d.slug as deporte_slug,
  d.nombre as deporte_nombre,
  n.id as negocio_id,
  n.slug as negocio_slug,
  n.nombre as negocio_nombre,
  coalesce(s.direccion, n.direccion) as direccion,
  coalesce(s.latitud, n.latitud) as latitud,
  coalesce(s.longitud, n.longitud) as longitud,
  coalesce(s.zona_horaria, n.zona_horaria) as zona_horaria,
  n.moneda_codigo,
  ciu.nombre as ciudad,
  dep.nombre as departamento,
  p.codigo_iso2 as pais_codigo,
  p.nombre as pais
from public.canchas c
join public.deportes d on d.id = c.deporte_id
join public.negocios n on n.id = c.negocio_id
left join public.sedes s on s.id = c.sede_id
left join public.ciudades ciu on ciu.id = coalesce(s.ciudad_id, n.ciudad_id)
left join public.departamentos dep on dep.id = ciu.departamento_id
left join public.paises p on p.id = dep.pais_id
where c.estado = 'activa'
  and d.activo = true
  and n.estado = 'activo'
  and coalesce(s.activa, true) = true;

grant usage on schema public to anon, authenticated;
grant select on
  public.paises,
  public.departamentos,
  public.ciudades,
  public.planes,
  public.deportes,
  public.negocios,
  public.sedes,
  public.canchas,
  public.cancha_tarifas,
  public.v_marketplace_canchas
to anon, authenticated;

grant select, insert, update on
  public.usuarios,
  public.negocios,
  public.sedes,
  public.canchas,
  public.cancha_tarifas
to authenticated;

alter table public.usuarios enable row level security;
alter table public.paises enable row level security;
alter table public.departamentos enable row level security;
alter table public.ciudades enable row level security;
alter table public.planes enable row level security;
alter table public.deportes enable row level security;
alter table public.negocios enable row level security;
alter table public.sedes enable row level security;
alter table public.canchas enable row level security;
alter table public.cancha_tarifas enable row level security;

drop policy if exists "Usuarios leen su perfil" on public.usuarios;
create policy "Usuarios leen su perfil"
on public.usuarios for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "Usuarios actualizan su perfil" on public.usuarios;
create policy "Usuarios actualizan su perfil"
on public.usuarios for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Catalogo geografico visible" on public.paises;
create policy "Catalogo geografico visible"
on public.paises for select
to anon, authenticated
using (activo = true or public.is_admin());

drop policy if exists "Departamentos visibles" on public.departamentos;
create policy "Departamentos visibles"
on public.departamentos for select
to anon, authenticated
using (activo = true or public.is_admin());

drop policy if exists "Ciudades visibles" on public.ciudades;
create policy "Ciudades visibles"
on public.ciudades for select
to anon, authenticated
using (activo = true or public.is_admin());

drop policy if exists "Planes visibles" on public.planes;
create policy "Planes visibles"
on public.planes for select
to anon, authenticated
using (activo = true or public.is_admin());

drop policy if exists "Deportes visibles" on public.deportes;
create policy "Deportes visibles"
on public.deportes for select
to anon, authenticated
using (activo = true or public.is_admin());

drop policy if exists "Negocios visibles o propios" on public.negocios;
create policy "Negocios visibles o propios"
on public.negocios for select
to anon, authenticated
using (estado = 'activo' or dueno_id = auth.uid() or public.is_admin());

drop policy if exists "Duenos crean negocios" on public.negocios;
create policy "Duenos crean negocios"
on public.negocios for insert
to authenticated
with check (dueno_id = auth.uid());

drop policy if exists "Duenos actualizan negocios" on public.negocios;
create policy "Duenos actualizan negocios"
on public.negocios for update
to authenticated
using (dueno_id = auth.uid() or public.is_admin())
with check (dueno_id = auth.uid() or public.is_admin());

drop policy if exists "Sedes visibles o propias" on public.sedes;
create policy "Sedes visibles o propias"
on public.sedes for select
to anon, authenticated
using (
  activa = true
  or public.owns_negocio(negocio_id)
  or public.is_admin()
);

drop policy if exists "Duenos gestionan sedes" on public.sedes;
create policy "Duenos gestionan sedes"
on public.sedes for all
to authenticated
using (public.owns_negocio(negocio_id) or public.is_admin())
with check (public.owns_negocio(negocio_id) or public.is_admin());

drop policy if exists "Canchas visibles o propias" on public.canchas;
create policy "Canchas visibles o propias"
on public.canchas for select
to anon, authenticated
using (
  estado = 'activa'
  or public.owns_negocio(negocio_id)
  or public.is_admin()
);

drop policy if exists "Duenos gestionan canchas" on public.canchas;
create policy "Duenos gestionan canchas"
on public.canchas for all
to authenticated
using (public.owns_negocio(negocio_id) or public.is_admin())
with check (public.owns_negocio(negocio_id) or public.is_admin());

drop policy if exists "Tarifas visibles o propias" on public.cancha_tarifas;
create policy "Tarifas visibles o propias"
on public.cancha_tarifas for select
to anon, authenticated
using (
  activa = true
  or exists (
    select 1
    from public.canchas c
    where c.id = cancha_id
      and (public.owns_negocio(c.negocio_id) or public.is_admin())
  )
);

drop policy if exists "Duenos gestionan tarifas" on public.cancha_tarifas;
create policy "Duenos gestionan tarifas"
on public.cancha_tarifas for all
to authenticated
using (
  exists (
    select 1
    from public.canchas c
    where c.id = cancha_id
      and (public.owns_negocio(c.negocio_id) or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.canchas c
    where c.id = cancha_id
      and (public.owns_negocio(c.negocio_id) or public.is_admin())
  )
);

update public.planes
set slug = case nombre
  when 'Plan Base' then 'base'
  when 'Plan Estandar' then 'estandar'
  when 'Plan Estándar' then 'estandar'
  when 'Plan Full' then 'full'
  else slug
end
where slug is null
  and nombre in ('Plan Base', 'Plan Estandar', 'Plan Estándar', 'Plan Full');

insert into public.planes (slug, nombre, limite_canchas, precio_mensual_minor, moneda_codigo)
values
  ('base', 'Plan Base', 3, 2900, 'USD'),
  ('estandar', 'Plan Estandar', 6, 5900, 'USD'),
  ('full', 'Plan Full', 999, 9900, 'USD')
on conflict (slug) do update
set
  nombre = excluded.nombre,
  limite_canchas = excluded.limite_canchas,
  precio_mensual_minor = excluded.precio_mensual_minor,
  moneda_codigo = excluded.moneda_codigo,
  activo = true;

update public.deportes
set slug = case nombre
  when 'Padel' then 'padel'
  when 'Pádel' then 'padel'
  when 'Tenis' then 'tenis'
  when 'Voley' then 'voley'
  when 'Futbol 5' then 'futbol-5'
  when 'Fútbol 5' then 'futbol-5'
  when 'Futbol 8' then 'futbol-8'
  when 'Fútbol 8' then 'futbol-8'
  when 'Futbol 11' then 'futbol-11'
  when 'Fútbol 11' then 'futbol-11'
  when 'Basket' then 'basket'
  else slug
end
where slug is null
  and nombre in (
    'Padel',
    'Pádel',
    'Tenis',
    'Voley',
    'Futbol 5',
    'Fútbol 5',
    'Futbol 8',
    'Fútbol 8',
    'Futbol 11',
    'Fútbol 11',
    'Basket'
  );

insert into public.deportes (slug, nombre, categoria, jugadores_por_equipo)
values
  ('padel', 'Padel', 'raqueta', 2),
  ('tenis', 'Tenis', 'raqueta', 1),
  ('voley', 'Voley', 'equipo', 6),
  ('futbol-5', 'Futbol 5', 'futbol', 5),
  ('futbol-8', 'Futbol 8', 'futbol', 8),
  ('futbol-11', 'Futbol 11', 'futbol', 11),
  ('basket', 'Basket', 'equipo', 5)
on conflict (slug) do update
set
  nombre = excluded.nombre,
  categoria = excluded.categoria,
  jugadores_por_equipo = excluded.jugadores_por_equipo,
  activo = true;

update public.paises
set codigo_iso2 = case nombre
  when 'Colombia' then 'CO'
  when 'Mexico' then 'MX'
  when 'México' then 'MX'
  when 'Peru' then 'PE'
  when 'Perú' then 'PE'
  when 'Chile' then 'CL'
  when 'Argentina' then 'AR'
  else codigo_iso2
end
where codigo_iso2 is null
  and nombre in ('Colombia', 'Mexico', 'México', 'Peru', 'Perú', 'Chile', 'Argentina');

insert into public.paises (codigo_iso2, nombre, moneda_codigo, moneda_simbolo, zona_horaria_default)
values
  ('CO', 'Colombia', 'COP', '$', 'America/Bogota'),
  ('MX', 'Mexico', 'MXN', '$', 'America/Mexico_City'),
  ('PE', 'Peru', 'PEN', 'S/', 'America/Lima'),
  ('CL', 'Chile', 'CLP', '$', 'America/Santiago'),
  ('AR', 'Argentina', 'ARS', '$', 'America/Argentina/Buenos_Aires')
on conflict (codigo_iso2) do update
set
  nombre = excluded.nombre,
  moneda_codigo = excluded.moneda_codigo,
  moneda_simbolo = excluded.moneda_simbolo,
  zona_horaria_default = excluded.zona_horaria_default,
  activo = true;
