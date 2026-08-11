-- Sports events foundation. This migration is additive and keeps courts,
-- bookings and tournaments independent from the new event lifecycle.

do $$
begin
  create type public.evento_estado as enum (
    'borrador',
    'publicado',
    'en_curso',
    'finalizado',
    'cancelado'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.planes
  add column if not exists eventos_habilitados boolean not null default false,
  add column if not exists limite_eventos integer,
  add column if not exists limite_participantes_evento integer;

do $$
begin
  alter table public.planes
    add constraint planes_limite_eventos_chk
    check (limite_eventos is null or limite_eventos > 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.planes
    add constraint planes_limite_participantes_evento_chk
    check (
      limite_participantes_evento is null
      or limite_participantes_evento > 0
    );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  deporte_id uuid not null references public.deportes(id) on delete restrict,
  ciudad_id uuid references public.ciudades(id) on delete restrict,
  nombre text not null,
  slug text not null,
  descripcion text,
  reglamento_url text,
  portada_url text,
  direccion text,
  latitud numeric(10, 7),
  longitud numeric(10, 7),
  zona_horaria text not null,
  moneda_codigo char(3) not null,
  inicio_at timestamptz not null,
  fin_at timestamptz not null,
  inscripciones_abren_en timestamptz,
  inscripciones_cierran_en timestamptz,
  capacidad_total integer,
  estado public.evento_estado not null default 'borrador',
  es_publico boolean not null default false,
  configuracion jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eventos_slug_por_negocio_unique unique (negocio_id, slug),
  constraint eventos_id_negocio_unique unique (id, negocio_id),
  constraint eventos_nombre_chk check (length(btrim(nombre)) >= 3),
  constraint eventos_slug_chk check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint eventos_fechas_chk check (fin_at > inicio_at),
  constraint eventos_inscripciones_chk check (
    inscripciones_abren_en is null
    or inscripciones_cierran_en is null
    or inscripciones_cierran_en > inscripciones_abren_en
  ),
  constraint eventos_capacidad_chk check (
    capacidad_total is null or capacidad_total > 0
  ),
  constraint eventos_latitud_chk check (
    latitud is null or latitud between -90 and 90
  ),
  constraint eventos_longitud_chk check (
    longitud is null or longitud between -180 and 180
  ),
  constraint eventos_configuracion_object_chk check (
    jsonb_typeof(configuracion) = 'object'
  )
);

create table if not exists public.modalidades_evento (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null,
  negocio_id uuid not null,
  nombre text not null,
  slug text not null,
  descripcion text,
  distancia numeric(10, 3),
  unidad_distancia text,
  inicio_at timestamptz,
  capacidad integer,
  precio_base_minor integer not null default 0,
  moneda_codigo char(3) not null,
  activa boolean not null default true,
  orden smallint not null default 0,
  configuracion jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modalidades_evento_evento_negocio_fk
    foreign key (evento_id, negocio_id)
    references public.eventos(id, negocio_id)
    on delete cascade,
  constraint modalidades_evento_slug_unique unique (evento_id, slug),
  constraint modalidades_evento_id_contexto_unique
    unique (id, evento_id, negocio_id),
  constraint modalidades_evento_nombre_chk check (length(btrim(nombre)) >= 2),
  constraint modalidades_evento_slug_chk check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint modalidades_evento_distancia_chk check (
    distancia is null or distancia > 0
  ),
  constraint modalidades_evento_distancia_unidad_chk check (
    (distancia is null and unidad_distancia is null)
    or (distancia is not null and nullif(btrim(unidad_distancia), '') is not null)
  ),
  constraint modalidades_evento_capacidad_chk check (
    capacidad is null or capacidad > 0
  ),
  constraint modalidades_evento_precio_chk check (precio_base_minor >= 0),
  constraint modalidades_evento_configuracion_object_chk check (
    jsonb_typeof(configuracion) = 'object'
  )
);

create table if not exists public.categorias_evento (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null,
  negocio_id uuid not null,
  modalidad_evento_id uuid references public.modalidades_evento(id) on delete cascade,
  nombre text not null,
  genero text,
  edad_minima smallint,
  edad_maxima smallint,
  peso_minimo numeric(7, 2),
  peso_maximo numeric(7, 2),
  nivel text,
  activa boolean not null default true,
  orden smallint not null default 0,
  configuracion jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categorias_evento_evento_negocio_fk
    foreign key (evento_id, negocio_id)
    references public.eventos(id, negocio_id)
    on delete cascade,
  constraint categorias_evento_nombre_contexto_unique
    unique (evento_id, modalidad_evento_id, nombre),
  constraint categorias_evento_nombre_chk check (length(btrim(nombre)) >= 2),
  constraint categorias_evento_edades_chk check (
    (edad_minima is null or edad_minima >= 0)
    and (edad_maxima is null or edad_maxima >= 0)
    and (
      edad_minima is null
      or edad_maxima is null
      or edad_maxima >= edad_minima
    )
  ),
  constraint categorias_evento_pesos_chk check (
    (peso_minimo is null or peso_minimo > 0)
    and (peso_maximo is null or peso_maximo > 0)
    and (
      peso_minimo is null
      or peso_maximo is null
      or peso_maximo >= peso_minimo
    )
  ),
  constraint categorias_evento_configuracion_object_chk check (
    jsonb_typeof(configuracion) = 'object'
  )
);

create or replace function public.validar_limite_eventos_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  eventos_permitidos integer;
  modulo_habilitado boolean;
  eventos_actuales integer;
begin
  if new.estado in ('finalizado', 'cancelado') then
    return new;
  end if;

  perform 1
  from public.negocios
  where id = new.negocio_id
  for update;

  select p.eventos_habilitados, p.limite_eventos
  into modulo_habilitado, eventos_permitidos
  from public.negocios n
  join public.planes p on p.id = n.plan_id
  where n.id = new.negocio_id
    and p.activo = true;

  if coalesce(modulo_habilitado, false) = false then
    raise exception 'El plan actual no incluye la gestion de eventos'
      using errcode = 'P0001';
  end if;

  if eventos_permitidos is null then
    return new;
  end if;

  select count(*)::integer
  into eventos_actuales
  from public.eventos e
  where e.negocio_id = new.negocio_id
    and e.estado not in ('finalizado', 'cancelado')
    and (tg_op = 'INSERT' or e.id <> new.id);

  if eventos_actuales >= eventos_permitidos then
    raise exception 'Limite de eventos alcanzado para el plan actual (%)', eventos_permitidos
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_limite_eventos_plan on public.eventos;
create trigger validar_limite_eventos_plan
before insert or update of negocio_id, estado
on public.eventos
for each row execute function public.validar_limite_eventos_plan();

create or replace function public.validar_modalidad_categoria_evento()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.modalidad_evento_id is not null and not exists (
    select 1
    from public.modalidades_evento me
    where me.id = new.modalidad_evento_id
      and me.evento_id = new.evento_id
      and me.negocio_id = new.negocio_id
  ) then
    raise exception 'La modalidad no pertenece al evento y negocio indicados'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_modalidad_categoria_evento
on public.categorias_evento;
create trigger validar_modalidad_categoria_evento
before insert or update of modalidad_evento_id, evento_id, negocio_id
on public.categorias_evento
for each row execute function public.validar_modalidad_categoria_evento();

drop trigger if exists set_eventos_updated_at on public.eventos;
create trigger set_eventos_updated_at
before update on public.eventos
for each row execute function public.set_updated_at();

drop trigger if exists set_modalidades_evento_updated_at
on public.modalidades_evento;
create trigger set_modalidades_evento_updated_at
before update on public.modalidades_evento
for each row execute function public.set_updated_at();

drop trigger if exists set_categorias_evento_updated_at
on public.categorias_evento;
create trigger set_categorias_evento_updated_at
before update on public.categorias_evento
for each row execute function public.set_updated_at();

create index if not exists eventos_negocio_estado_idx
  on public.eventos(negocio_id, estado);
create index if not exists eventos_deporte_inicio_idx
  on public.eventos(deporte_id, inicio_at);
create index if not exists eventos_ciudad_inicio_idx
  on public.eventos(ciudad_id, inicio_at);
create index if not exists eventos_publicos_inicio_idx
  on public.eventos(inicio_at)
  where es_publico = true and estado in ('publicado', 'en_curso');
create index if not exists modalidades_evento_evento_activa_idx
  on public.modalidades_evento(evento_id, activa, orden);
create index if not exists categorias_evento_evento_activa_idx
  on public.categorias_evento(evento_id, activa, orden);
create index if not exists categorias_evento_modalidad_idx
  on public.categorias_evento(modalidad_evento_id)
  where modalidad_evento_id is not null;
create unique index if not exists categorias_evento_global_nombre_unique
  on public.categorias_evento(evento_id, lower(nombre))
  where modalidad_evento_id is null;

alter table public.eventos enable row level security;
alter table public.modalidades_evento enable row level security;
alter table public.categorias_evento enable row level security;

grant select on
  public.eventos,
  public.modalidades_evento,
  public.categorias_evento
to anon, authenticated;

grant insert, update, delete on
  public.eventos,
  public.modalidades_evento,
  public.categorias_evento
to authenticated;

drop policy if exists "Eventos publicos o gestionables" on public.eventos;
create policy "Eventos publicos o gestionables"
on public.eventos for select
to anon, authenticated
using (
  (es_publico = true and estado in ('publicado', 'en_curso', 'finalizado'))
  or public.owns_negocio(negocio_id)
  or public.is_admin()
);

drop policy if exists "Duenos y administradores crean eventos" on public.eventos;
create policy "Duenos y administradores crean eventos"
on public.eventos for insert
to authenticated
with check (public.owns_negocio(negocio_id) or public.is_admin());

drop policy if exists "Duenos y administradores actualizan eventos" on public.eventos;
create policy "Duenos y administradores actualizan eventos"
on public.eventos for update
to authenticated
using (public.owns_negocio(negocio_id) or public.is_admin())
with check (public.owns_negocio(negocio_id) or public.is_admin());

drop policy if exists "Duenos y administradores eliminan eventos" on public.eventos;
create policy "Duenos y administradores eliminan eventos"
on public.eventos for delete
to authenticated
using (public.owns_negocio(negocio_id) or public.is_admin());

drop policy if exists "Modalidades de eventos visibles" on public.modalidades_evento;
create policy "Modalidades de eventos visibles"
on public.modalidades_evento for select
to anon, authenticated
using (
  public.owns_negocio(negocio_id)
  or public.is_admin()
  or exists (
    select 1
    from public.eventos e
    where e.id = evento_id
      and e.negocio_id = negocio_id
      and e.es_publico = true
      and e.estado in ('publicado', 'en_curso', 'finalizado')
  )
);

drop policy if exists "Duenos y administradores gestionan modalidades"
on public.modalidades_evento;
create policy "Duenos y administradores gestionan modalidades"
on public.modalidades_evento for all
to authenticated
using (public.owns_negocio(negocio_id) or public.is_admin())
with check (public.owns_negocio(negocio_id) or public.is_admin());

drop policy if exists "Categorias de eventos visibles" on public.categorias_evento;
create policy "Categorias de eventos visibles"
on public.categorias_evento for select
to anon, authenticated
using (
  public.owns_negocio(negocio_id)
  or public.is_admin()
  or exists (
    select 1
    from public.eventos e
    where e.id = evento_id
      and e.negocio_id = negocio_id
      and e.es_publico = true
      and e.estado in ('publicado', 'en_curso', 'finalizado')
  )
);

drop policy if exists "Duenos y administradores gestionan categorias"
on public.categorias_evento;
create policy "Duenos y administradores gestionan categorias"
on public.categorias_evento for all
to authenticated
using (public.owns_negocio(negocio_id) or public.is_admin())
with check (public.owns_negocio(negocio_id) or public.is_admin());

insert into public.deportes (slug, nombre, categoria, jugadores_por_equipo)
values
  ('running', 'Running', 'resistencia', null),
  ('trail-running', 'Trail running', 'resistencia', null),
  ('ciclismo', 'Ciclismo', 'resistencia', null),
  ('mountain-bike', 'Mountain bike', 'resistencia', null),
  ('boxeo', 'Boxeo', 'combate', 1),
  ('crossfit', 'CrossFit', 'fitness', null),
  ('natacion', 'Natacion', 'acuatico', null),
  ('triatlon', 'Triatlon', 'multideporte', null),
  ('patinaje', 'Patinaje', 'resistencia', null),
  ('otros', 'Otros', 'otros', null)
on conflict (slug) do nothing;

update public.planes
set
  eventos_habilitados = true,
  limite_eventos = coalesce(limite_eventos, 1),
  limite_participantes_evento = coalesce(limite_participantes_evento, 250)
where activo = true;

update public.planes
set
  eventos_habilitados = true,
  limite_eventos = case slug
    when 'base' then 2
    when 'estandar' then 10
    when 'full' then null
    else limite_eventos
  end,
  limite_participantes_evento = case slug
    when 'base' then 500
    when 'estandar' then 2000
    when 'full' then null
    else limite_participantes_evento
  end
where slug in ('base', 'estandar', 'full');

comment on table public.eventos is
  'Eventos deportivos organizados por un negocio, separados de torneos y reservas de canchas.';
comment on table public.modalidades_evento is
  'Formatos inscribibles de un evento: distancia, prueba, tanda o division.';
comment on table public.categorias_evento is
  'Categorias opcionales por edad, genero, peso, nivel u otras reglas del deporte.';
comment on column public.planes.limite_eventos is
  'Cantidad maxima de eventos activos; NULL representa capacidad ilimitada.';
comment on column public.planes.limite_participantes_evento is
  'Cantidad maxima de participantes por evento; NULL representa capacidad ilimitada.';
