-- Event participants and registrations. Personal data stays behind RLS and
-- public registration is performed only through a validated database function.

do $$
begin
  create type public.inscripcion_evento_estado as enum (
    'pendiente_pago', 'pagada', 'confirmada', 'cancelada',
    'reembolsada', 'acreditada', 'completada'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.participantes (
  id uuid primary key default gen_random_uuid(),
  usuario_propietario_id uuid references auth.users(id) on delete set null,
  nombres text not null,
  apellidos text not null,
  tipo_documento text not null,
  numero_documento text not null,
  fecha_nacimiento date not null,
  genero text,
  email text not null,
  telefono_e164 text not null,
  contacto_emergencia_nombre text not null,
  contacto_emergencia_telefono_e164 text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint participantes_nombres_chk check (length(btrim(nombres)) >= 2),
  constraint participantes_apellidos_chk check (length(btrim(apellidos)) >= 2),
  constraint participantes_documento_chk check (length(btrim(numero_documento)) >= 5),
  constraint participantes_email_chk check (position('@' in email) > 1),
  constraint participantes_telefono_chk check (telefono_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  constraint participantes_emergencia_telefono_chk check (contacto_emergencia_telefono_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create table if not exists public.inscripciones_evento (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null,
  evento_id uuid not null,
  modalidad_evento_id uuid not null references public.modalidades_evento(id) on delete restrict,
  categoria_evento_id uuid references public.categorias_evento(id) on delete restrict,
  participante_id uuid not null references public.participantes(id) on delete restrict,
  comprador_usuario_id uuid references auth.users(id) on delete set null,
  referencia_publica text not null unique,
  numero_inscripcion text not null unique,
  numero_dorsal text,
  estado public.inscripcion_evento_estado not null default 'pendiente_pago',
  precio_base_minor integer not null,
  descuento_minor integer not null default 0,
  tarifa_plataforma_minor integer not null default 0,
  tasa_plataforma_snapshot numeric(6, 5) not null default 0.1,
  total_minor integer not null,
  moneda_codigo char(3) not null,
  talla_camiseta text,
  peso_declarado numeric(7, 2),
  terminos_aceptados_en timestamptz not null,
  privacidad_aceptada_en timestamptz not null,
  expira_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inscripciones_evento_evento_negocio_fk
    foreign key (evento_id, negocio_id)
    references public.eventos(id, negocio_id)
    on delete restrict,
  constraint inscripciones_evento_importes_chk check (
    precio_base_minor >= 0 and descuento_minor >= 0
    and tarifa_plataforma_minor >= 0 and total_minor >= 0
  ),
  constraint inscripciones_evento_tasa_chk check (
    tasa_plataforma_snapshot between 0 and 1
  )
);

alter table public.inscripciones_evento
  add column if not exists peso_declarado numeric(7, 2);

create unique index if not exists inscripciones_evento_evento_participante_unique
  on public.inscripciones_evento(evento_id, participante_id)
  where estado not in ('cancelada', 'reembolsada');
create index if not exists inscripciones_evento_negocio_estado_idx
  on public.inscripciones_evento(negocio_id, estado, created_at desc);
create index if not exists inscripciones_evento_evento_estado_idx
  on public.inscripciones_evento(evento_id, estado);
create index if not exists inscripciones_evento_modalidad_estado_idx
  on public.inscripciones_evento(modalidad_evento_id, estado);
create index if not exists participantes_usuario_idx
  on public.participantes(usuario_propietario_id)
  where usuario_propietario_id is not null;

create or replace function public.validar_contexto_inscripcion_evento()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.modalidades_evento me
    where me.id = new.modalidad_evento_id
      and me.evento_id = new.evento_id
      and me.negocio_id = new.negocio_id
  ) then
    raise exception 'La modalidad no pertenece al evento indicado' using errcode = '23514';
  end if;

  if new.categoria_evento_id is not null and not exists (
    select 1 from public.categorias_evento ce
    where ce.id = new.categoria_evento_id
      and ce.evento_id = new.evento_id
      and ce.negocio_id = new.negocio_id
      and (ce.modalidad_evento_id is null or ce.modalidad_evento_id = new.modalidad_evento_id)
  ) then
    raise exception 'La categoria no corresponde al evento o modalidad' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_contexto_inscripcion_evento on public.inscripciones_evento;
create trigger validar_contexto_inscripcion_evento
before insert or update of negocio_id, evento_id, modalidad_evento_id, categoria_evento_id
on public.inscripciones_evento
for each row execute function public.validar_contexto_inscripcion_evento();

drop trigger if exists set_participantes_updated_at on public.participantes;
create trigger set_participantes_updated_at before update on public.participantes
for each row execute function public.set_updated_at();
drop trigger if exists set_inscripciones_evento_updated_at on public.inscripciones_evento;
create trigger set_inscripciones_evento_updated_at before update on public.inscripciones_evento
for each row execute function public.set_updated_at();

alter table public.participantes enable row level security;
alter table public.inscripciones_evento enable row level security;

grant select on public.participantes, public.inscripciones_evento to authenticated;
grant update on public.inscripciones_evento to authenticated;

drop policy if exists "Participantes visibles por propietario o gestor" on public.participantes;
create policy "Participantes visibles por propietario o gestor"
on public.participantes for select to authenticated
using (
  usuario_propietario_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.inscripciones_evento ie
    where ie.participante_id = id and public.owns_negocio(ie.negocio_id)
  )
);

drop policy if exists "Inscripciones visibles por comprador o gestor" on public.inscripciones_evento;
create policy "Inscripciones visibles por comprador o gestor"
on public.inscripciones_evento for select to authenticated
using (
  comprador_usuario_id = auth.uid()
  or public.owns_negocio(negocio_id)
  or public.is_admin()
);

drop policy if exists "Gestores actualizan inscripciones" on public.inscripciones_evento;
create policy "Gestores actualizan inscripciones"
on public.inscripciones_evento for update to authenticated
using (public.owns_negocio(negocio_id) or public.is_admin())
with check (public.owns_negocio(negocio_id) or public.is_admin());

drop function if exists public.crear_inscripcion_evento_publica(uuid, uuid, text, text, text, text, date, text, text, text, text, text, text, boolean, boolean);

create or replace function public.crear_inscripcion_evento_publica(
  p_modalidad_evento_id uuid,
  p_categoria_evento_id uuid,
  p_nombres text,
  p_apellidos text,
  p_tipo_documento text,
  p_numero_documento text,
  p_fecha_nacimiento date,
  p_genero text,
  p_email text,
  p_telefono_e164 text,
  p_contacto_emergencia_nombre text,
  p_contacto_emergencia_telefono_e164 text,
  p_talla_camiseta text,
  p_peso_declarado numeric,
  p_acepta_terminos boolean,
  p_acepta_privacidad boolean
)
returns table (
  referencia_publica text,
  numero_inscripcion text,
  precio_base_minor integer,
  tarifa_plataforma_minor integer,
  total_minor integer,
  moneda_codigo text,
  expira_en timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evento public.eventos%rowtype;
  v_modalidad public.modalidades_evento%rowtype;
  v_participante_id uuid;
  v_categoria_id uuid := nullif(p_categoria_evento_id, '00000000-0000-0000-0000-000000000000'::uuid);
  v_categoria public.categorias_evento%rowtype;
  v_referencia text;
  v_numero text;
  v_tarifa integer;
  v_total integer;
  v_ocupacion integer;
  v_edad integer;
  v_peso numeric := nullif(p_peso_declarado, 0);
  v_expira timestamptz := now() + interval '15 minutes';
begin
  if not coalesce(p_acepta_terminos, false) or not coalesce(p_acepta_privacidad, false) then
    raise exception 'Debes aceptar los terminos y la politica de privacidad' using errcode = 'P0001';
  end if;

  select me.* into v_modalidad
  from public.modalidades_evento me
  where me.id = p_modalidad_evento_id and me.activa = true
  for update;
  if not found then raise exception 'La modalidad no esta disponible' using errcode = 'P0001'; end if;

  select e.* into v_evento
  from public.eventos e
  where e.id = v_modalidad.evento_id
    and e.negocio_id = v_modalidad.negocio_id
    and e.es_publico = true
    and e.estado = 'publicado'
  for update;
  if not found then raise exception 'El evento no esta disponible para inscripciones' using errcode = 'P0001'; end if;

  if v_evento.inscripciones_abren_en is not null and now() < v_evento.inscripciones_abren_en then
    raise exception 'Las inscripciones aun no estan abiertas' using errcode = 'P0001';
  end if;
  if v_evento.inscripciones_cierran_en is not null and now() > v_evento.inscripciones_cierran_en then
    raise exception 'Las inscripciones ya cerraron' using errcode = 'P0001';
  end if;

  if v_categoria_id is not null then
    select ce.* into v_categoria from public.categorias_evento ce
    where ce.id = v_categoria_id and ce.evento_id = v_evento.id
      and ce.negocio_id = v_evento.negocio_id and ce.activa = true
      and (ce.modalidad_evento_id is null or ce.modalidad_evento_id = v_modalidad.id);
    if not found then raise exception 'La categoria seleccionada no esta disponible' using errcode = 'P0001'; end if;

    v_edad := extract(year from age((v_evento.inicio_at at time zone v_evento.zona_horaria)::date, p_fecha_nacimiento));
    if (v_categoria.edad_minima is not null and v_edad < v_categoria.edad_minima)
      or (v_categoria.edad_maxima is not null and v_edad > v_categoria.edad_maxima)
    then raise exception 'La edad del participante no corresponde a la categoria' using errcode = 'P0001'; end if;
    if v_categoria.genero is not null
      and lower(v_categoria.genero) not in ('abierta', 'mixto', 'no_aplica')
      and lower(v_categoria.genero) <> lower(coalesce(p_genero, ''))
    then raise exception 'El genero del participante no corresponde a la categoria' using errcode = 'P0001'; end if;
    if (v_categoria.peso_minimo is not null or v_categoria.peso_maximo is not null)
      and v_peso is null
    then raise exception 'La categoria requiere el peso del participante' using errcode = 'P0001'; end if;
    if (v_categoria.peso_minimo is not null and v_peso < v_categoria.peso_minimo)
      or (v_categoria.peso_maximo is not null and v_peso > v_categoria.peso_maximo)
    then raise exception 'El peso del participante no corresponde a la categoria' using errcode = 'P0001'; end if;
  end if;

  if exists (
    select 1 from public.inscripciones_evento ie
    join public.participantes p on p.id = ie.participante_id
    where ie.evento_id = v_evento.id
      and lower(p.tipo_documento) = lower(btrim(p_tipo_documento))
      and lower(p.numero_documento) = lower(btrim(p_numero_documento))
      and ie.estado not in ('cancelada', 'reembolsada')
      and (ie.estado <> 'pendiente_pago' or ie.expira_en > now())
  ) then raise exception 'El participante ya tiene una inscripcion para este evento' using errcode = 'P0001'; end if;

  select count(*)::integer into v_ocupacion from public.inscripciones_evento ie
  where ie.modalidad_evento_id = v_modalidad.id
    and ie.estado not in ('cancelada', 'reembolsada')
    and (ie.estado <> 'pendiente_pago' or ie.expira_en > now());
  if v_modalidad.capacidad is not null and v_ocupacion >= v_modalidad.capacidad then
    raise exception 'La modalidad alcanzo su limite de cupos' using errcode = 'P0001';
  end if;

  select count(*)::integer into v_ocupacion from public.inscripciones_evento ie
  where ie.evento_id = v_evento.id
    and ie.estado not in ('cancelada', 'reembolsada')
    and (ie.estado <> 'pendiente_pago' or ie.expira_en > now());
  if v_evento.capacidad_total is not null and v_ocupacion >= v_evento.capacidad_total then
    raise exception 'El evento alcanzo su limite de cupos' using errcode = 'P0001';
  end if;

  insert into public.participantes (
    usuario_propietario_id, nombres, apellidos, tipo_documento, numero_documento,
    fecha_nacimiento, genero, email, telefono_e164,
    contacto_emergencia_nombre, contacto_emergencia_telefono_e164
  ) values (
    auth.uid(), btrim(p_nombres), btrim(p_apellidos), upper(btrim(p_tipo_documento)),
    btrim(p_numero_documento), p_fecha_nacimiento, nullif(btrim(p_genero), ''),
    lower(btrim(p_email)), p_telefono_e164, btrim(p_contacto_emergencia_nombre),
    p_contacto_emergencia_telefono_e164
  ) returning id into v_participante_id;

  v_referencia := 'EVT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20));
  v_numero := 'INS-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_tarifa := round(v_modalidad.precio_base_minor * 0.10)::integer;
  v_total := v_modalidad.precio_base_minor + v_tarifa;

  insert into public.inscripciones_evento (
    negocio_id, evento_id, modalidad_evento_id, categoria_evento_id,
    participante_id, comprador_usuario_id, referencia_publica, numero_inscripcion,
    precio_base_minor, tarifa_plataforma_minor, tasa_plataforma_snapshot,
    total_minor, moneda_codigo, talla_camiseta, peso_declarado, terminos_aceptados_en,
    privacidad_aceptada_en, expira_en
  ) values (
    v_evento.negocio_id, v_evento.id, v_modalidad.id, v_categoria_id,
    v_participante_id, auth.uid(), v_referencia, v_numero,
    v_modalidad.precio_base_minor, v_tarifa, 0.10,
    v_total, v_modalidad.moneda_codigo, nullif(btrim(p_talla_camiseta), ''), v_peso,
    now(), now(), v_expira
  );

  return query
  select i.referencia_publica, i.numero_inscripcion, i.precio_base_minor,
    i.tarifa_plataforma_minor, i.total_minor, btrim(i.moneda_codigo), i.expira_en
  from public.inscripciones_evento i
  where i.referencia_publica = v_referencia;
end;
$$;

revoke all on function public.crear_inscripcion_evento_publica(uuid, uuid, text, text, text, text, date, text, text, text, text, text, text, numeric, boolean, boolean) from public;
grant execute on function public.crear_inscripcion_evento_publica(uuid, uuid, text, text, text, text, date, text, text, text, text, text, text, numeric, boolean, boolean) to anon, authenticated;

comment on table public.participantes is 'Datos personales privados de participantes de eventos.';
comment on table public.inscripciones_evento is 'Inscripciones a eventos con precios calculados y congelados en el servidor.';
