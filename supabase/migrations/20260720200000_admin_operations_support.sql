begin;

create table if not exists public.soporte_casos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete restrict,
  creado_por uuid not null references public.usuarios(id) on delete restrict,
  asignado_a uuid references public.usuarios(id) on delete set null,
  titulo text not null check (char_length(trim(titulo)) between 3 and 140),
  descripcion text not null check (char_length(trim(descripcion)) between 3 and 4000),
  estado text not null default 'abierto' check (estado in ('abierto', 'en_progreso', 'esperando_negocio', 'resuelto', 'cerrado')),
  prioridad text not null default 'media' check (prioridad in ('baja', 'media', 'alta', 'critica')),
  resolucion text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  resuelto_en timestamptz
);

create index if not exists soporte_casos_negocio_estado_idx
  on public.soporte_casos (negocio_id, estado, creado_en desc);

create table if not exists public.admin_auditoria (
  id bigint generated always as identity primary key,
  admin_id uuid not null references public.usuarios(id) on delete restrict,
  accion text not null check (accion in ('INSERT', 'UPDATE', 'DELETE')),
  tabla text not null,
  registro_id uuid,
  negocio_id uuid references public.negocios(id) on delete set null,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  creado_en timestamptz not null default now()
);

create index if not exists admin_auditoria_admin_fecha_idx
  on public.admin_auditoria (admin_id, creado_en desc);
create index if not exists admin_auditoria_negocio_fecha_idx
  on public.admin_auditoria (negocio_id, creado_en desc);

create or replace function public.actualizar_soporte_caso()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.actualizado_en := now();
  if new.estado in ('resuelto', 'cerrado') and old.estado not in ('resuelto', 'cerrado') then
    new.resuelto_en := now();
  elsif new.estado not in ('resuelto', 'cerrado') then
    new.resuelto_en := null;
  end if;
  return new;
end;
$$;

drop trigger if exists soporte_casos_actualizado_en on public.soporte_casos;
create trigger soporte_casos_actualizado_en
before update on public.soporte_casos
for each row execute function public.actualizar_soporte_caso();

create or replace function public.auditar_operacion_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  anterior jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  nuevo jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  fila jsonb := coalesce(nuevo, anterior);
  negocio uuid;
begin
  if public.is_admin() then
    begin
      negocio := nullif(fila ->> 'negocio_id', '')::uuid;
    exception when invalid_text_representation then
      negocio := null;
    end;

    insert into public.admin_auditoria (admin_id, accion, tabla, registro_id, negocio_id, datos_anteriores, datos_nuevos)
    values (auth.uid(), tg_op, tg_table_name, nullif(fila ->> 'id', '')::uuid, negocio, anterior, nuevo);
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'torneos', 'equipos', 'jugadores_equipo', 'inscripciones_torneo',
    'jugadores_inscritos_torneo', 'partidos', 'tabla_posiciones',
    'reservas', 'pagos', 'suscripciones', 'canchas', 'sedes',
    'cancha_tarifas', 'soporte_casos'
  ] loop
    execute format('alter table public.%I enable row level security', tabla);
    execute format('grant select, insert, update, delete on public.%I to authenticated', tabla);
    execute format('drop policy if exists "Administradores gestionan %s" on public.%I', tabla, tabla);
    execute format(
      'create policy "Administradores gestionan %s" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      tabla,
      tabla
    );

    execute format('drop trigger if exists auditoria_admin_%I on public.%I', tabla, tabla);
    execute format(
      'create trigger auditoria_admin_%I after insert or update or delete on public.%I for each row execute function public.auditar_operacion_admin()',
      tabla,
      tabla
    );
  end loop;
end;
$$;

alter table public.admin_auditoria enable row level security;
grant select on public.admin_auditoria to authenticated;
grant usage, select on sequence public.admin_auditoria_id_seq to authenticated;

drop policy if exists "Administradores leen auditoria" on public.admin_auditoria;
create policy "Administradores leen auditoria"
on public.admin_auditoria for select to authenticated
using (public.is_admin());

drop policy if exists "Negocios crean casos de soporte" on public.soporte_casos;
create policy "Negocios crean casos de soporte"
on public.soporte_casos for insert to authenticated
with check (
  creado_por = auth.uid()
  and exists (
    select 1 from public.negocios n
    where n.id = negocio_id and n.dueno_id = auth.uid()
  )
);

drop policy if exists "Negocios leen sus casos de soporte" on public.soporte_casos;
create policy "Negocios leen sus casos de soporte"
on public.soporte_casos for select to authenticated
using (
  exists (
    select 1 from public.negocios n
    where n.id = negocio_id and n.dueno_id = auth.uid()
  )
);

commit;
