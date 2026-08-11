-- Atomic group purchases for sports events. One order and payment can contain
-- between one and ten individual participant registrations.

create table if not exists public.ordenes_evento (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete restrict,
  evento_id uuid not null references public.eventos(id) on delete restrict,
  comprador_usuario_id uuid references auth.users(id) on delete set null,
  referencia_publica text not null unique,
  estado text not null default 'pending',
  cantidad integer not null,
  comprador_nombre text not null,
  comprador_email text not null,
  comprador_telefono_e164 text not null,
  moneda_codigo char(3) not null,
  monto_base_minor integer not null,
  comision_plataforma_minor integer not null,
  cargo_pasarela_minor integer not null,
  total_minor integer not null,
  tasa_plataforma_snapshot numeric(8, 6) not null default 0,
  tasa_pasarela_snapshot numeric(8, 6) not null default 0,
  cargo_fijo_pasarela_snapshot_minor integer not null default 0,
  impuesto_pasarela_snapshot numeric(8, 6) not null default 0,
  expira_en timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ordenes_evento_estado_chk check (estado in ('pending', 'paid', 'failed', 'refunded', 'canceled')),
  constraint ordenes_evento_cantidad_chk check (cantidad between 1 and 10),
  constraint ordenes_evento_importes_chk check (
    monto_base_minor >= 0 and comision_plataforma_minor >= 0
    and cargo_pasarela_minor >= 0 and total_minor >= 0
  ),
  constraint ordenes_evento_email_chk check (position('@' in comprador_email) > 1),
  constraint ordenes_evento_telefono_chk check (comprador_telefono_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

alter table public.inscripciones_evento
  add column if not exists orden_evento_id uuid references public.ordenes_evento(id) on delete restrict;

alter table public.pagos
  add column if not exists orden_evento_id uuid references public.ordenes_evento(id) on delete set null;

create index if not exists ordenes_evento_evento_estado_idx
  on public.ordenes_evento(evento_id, estado, created_at desc);
create index if not exists ordenes_evento_negocio_estado_idx
  on public.ordenes_evento(negocio_id, estado, created_at desc);
create index if not exists inscripciones_evento_orden_idx
  on public.inscripciones_evento(orden_evento_id);
create index if not exists pagos_orden_evento_idx
  on public.pagos(orden_evento_id) where orden_evento_id is not null;

drop trigger if exists set_ordenes_evento_updated_at on public.ordenes_evento;
create trigger set_ordenes_evento_updated_at before update on public.ordenes_evento
for each row execute function public.set_updated_at();

create or replace function public.aplicar_cargo_pasarela_inscripcion_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cotizacion record;
begin
  if new.orden_evento_id is not null then
    new.cargo_pasarela_minor := 0;
    new.total_minor := greatest(new.precio_base_minor - new.descuento_minor, 0) + new.tarifa_plataforma_minor;
    new.tasa_pasarela_snapshot := 0;
    new.cargo_fijo_pasarela_snapshot_minor := 0;
    new.impuesto_pasarela_snapshot := 0;
    return new;
  end if;

  select * into v_cotizacion
  from public.cotizar_pago(
    'epayco', 'evento', new.moneda_codigo,
    greatest(new.precio_base_minor - new.descuento_minor, 0),
    new.tarifa_plataforma_minor
  );
  new.cargo_pasarela_minor := v_cotizacion.cargo_pasarela_minor;
  new.total_minor := v_cotizacion.total_minor;
  new.tasa_pasarela_snapshot := v_cotizacion.tasa_pasarela;
  new.cargo_fijo_pasarela_snapshot_minor := v_cotizacion.cargo_fijo_pasarela_minor;
  new.impuesto_pasarela_snapshot := v_cotizacion.impuesto_pasarela;
  return new;
end;
$$;

create or replace function public.sincronizar_estado_orden_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado is distinct from old.estado then
    update public.inscripciones_evento
    set estado = case new.estado
      when 'paid' then 'pagada'::public.inscripcion_evento_estado
      when 'refunded' then 'reembolsada'::public.inscripcion_evento_estado
      when 'failed' then 'cancelada'::public.inscripcion_evento_estado
      when 'canceled' then 'cancelada'::public.inscripcion_evento_estado
      else estado
    end
    where orden_evento_id = new.id
      and new.estado in ('paid', 'refunded', 'failed', 'canceled');
  end if;
  return new;
end;
$$;

drop trigger if exists sincronizar_estado_orden_evento on public.ordenes_evento;
create trigger sincronizar_estado_orden_evento
after update of estado on public.ordenes_evento
for each row execute function public.sincronizar_estado_orden_evento();

create or replace function public.crear_orden_evento_publica(
  p_modalidad_evento_id uuid,
  p_participantes jsonb,
  p_comprador_nombre text,
  p_comprador_email text,
  p_comprador_telefono_e164 text,
  p_acepta_terminos boolean,
  p_acepta_privacidad boolean
)
returns table (
  referencia_publica text,
  cantidad integer,
  monto_base_minor integer,
  tarifa_plataforma_minor integer,
  cargo_pasarela_minor integer,
  total_minor integer,
  moneda_codigo text,
  expira_en timestamptz,
  inscripciones jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evento public.eventos%rowtype;
  v_modalidad public.modalidades_evento%rowtype;
  v_orden_id uuid;
  v_referencia text;
  v_expira timestamptz := now() + interval '15 minutes';
  v_cantidad integer;
  v_ocupacion integer;
  v_cotizacion record;
  v_item jsonb;
  v_categoria_id uuid;
  v_categoria public.categorias_evento%rowtype;
  v_participante_id uuid;
  v_numero text;
  v_referencia_inscripcion text;
  v_indice integer := 0;
  v_comision_item integer;
  v_edad integer;
  v_peso numeric;
  v_inscripciones jsonb := '[]'::jsonb;
begin
  if not coalesce(p_acepta_terminos, false) or not coalesce(p_acepta_privacidad, false) then
    raise exception 'Debes aceptar los terminos y la politica de privacidad' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_participantes) <> 'array' then
    raise exception 'La lista de participantes no es valida' using errcode = 'P0001';
  end if;
  v_cantidad := jsonb_array_length(p_participantes);
  if v_cantidad < 1 or v_cantidad > 10 then
    raise exception 'Puedes comprar entre 1 y 10 cupos por orden' using errcode = 'P0001';
  end if;
  if length(btrim(p_comprador_nombre)) < 3
    or position('@' in lower(btrim(p_comprador_email))) <= 1
    or p_comprador_telefono_e164 !~ '^\+[1-9][0-9]{7,14}$'
  then raise exception 'Los datos del comprador no son validos' using errcode = 'P0001'; end if;

  if exists (
    select 1 from (
      select lower(btrim(x->>'tipo_documento')) as tipo, lower(btrim(x->>'numero_documento')) as numero, count(*)
      from jsonb_array_elements(p_participantes) x
      group by 1, 2 having count(*) > 1
    ) duplicados
  ) then raise exception 'No puedes registrar dos veces al mismo participante' using errcode = 'P0001'; end if;

  select me.* into v_modalidad from public.modalidades_evento me
  where me.id = p_modalidad_evento_id and me.activa = true for update;
  if not found then raise exception 'La modalidad no esta disponible' using errcode = 'P0001'; end if;

  select e.* into v_evento from public.eventos e
  where e.id = v_modalidad.evento_id and e.negocio_id = v_modalidad.negocio_id
    and e.es_publico = true and e.estado = 'publicado' for update;
  if not found then raise exception 'El evento no esta disponible para inscripciones' using errcode = 'P0001'; end if;
  if v_evento.inscripciones_abren_en is not null and now() < v_evento.inscripciones_abren_en then
    raise exception 'Las inscripciones aun no estan abiertas' using errcode = 'P0001';
  end if;
  if v_evento.inscripciones_cierran_en is not null and now() > v_evento.inscripciones_cierran_en then
    raise exception 'Las inscripciones ya cerraron' using errcode = 'P0001';
  end if;

  select count(*)::integer into v_ocupacion from public.inscripciones_evento ie
  where ie.modalidad_evento_id = v_modalidad.id and ie.estado not in ('cancelada', 'reembolsada')
    and (ie.estado <> 'pendiente_pago' or ie.expira_en > now());
  if v_modalidad.capacidad is not null and v_ocupacion + v_cantidad > v_modalidad.capacidad then
    raise exception 'No hay suficientes cupos en la modalidad' using errcode = 'P0001';
  end if;
  select count(*)::integer into v_ocupacion from public.inscripciones_evento ie
  where ie.evento_id = v_evento.id and ie.estado not in ('cancelada', 'reembolsada')
    and (ie.estado <> 'pendiente_pago' or ie.expira_en > now());
  if v_evento.capacidad_total is not null and v_ocupacion + v_cantidad > v_evento.capacidad_total then
    raise exception 'No hay suficientes cupos en el evento' using errcode = 'P0001';
  end if;

  select * into v_cotizacion from public.cotizar_compra(
    'epayco', 'evento', btrim(v_modalidad.moneda_codigo),
    v_modalidad.precio_base_minor * v_cantidad
  );
  v_referencia := 'EVO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20));

  insert into public.ordenes_evento (
    negocio_id, evento_id, comprador_usuario_id, referencia_publica, cantidad,
    comprador_nombre, comprador_email, comprador_telefono_e164, moneda_codigo,
    monto_base_minor, comision_plataforma_minor, cargo_pasarela_minor, total_minor,
    tasa_plataforma_snapshot, tasa_pasarela_snapshot, cargo_fijo_pasarela_snapshot_minor,
    impuesto_pasarela_snapshot, expira_en
  ) values (
    v_evento.negocio_id, v_evento.id, auth.uid(), v_referencia, v_cantidad,
    btrim(p_comprador_nombre), lower(btrim(p_comprador_email)), p_comprador_telefono_e164,
    v_modalidad.moneda_codigo, v_cotizacion.precio_base_minor,
    v_cotizacion.comision_plataforma_minor, v_cotizacion.cargo_pasarela_minor,
    v_cotizacion.total_minor, v_cotizacion.tasa_plataforma, v_cotizacion.tasa_pasarela,
    v_cotizacion.cargo_fijo_pasarela_minor, v_cotizacion.impuesto_pasarela, v_expira
  ) returning id into v_orden_id;

  for v_item in select value from jsonb_array_elements(p_participantes)
  loop
    v_indice := v_indice + 1;
    v_categoria_id := nullif(v_item->>'categoria_id', '')::uuid;
    v_peso := nullif(v_item->>'peso_declarado', '')::numeric;

    if length(btrim(v_item->>'nombres')) < 2 or length(btrim(v_item->>'apellidos')) < 2
      or length(btrim(v_item->>'numero_documento')) < 5
      or position('@' in lower(btrim(v_item->>'email'))) <= 1
      or (v_item->>'telefono_e164') !~ '^\+[1-9][0-9]{7,14}$'
      or (v_item->>'contacto_emergencia_telefono_e164') !~ '^\+[1-9][0-9]{7,14}$'
      or nullif(v_item->>'fecha_nacimiento', '') is null
    then raise exception 'Completa correctamente los datos del participante %', v_indice using errcode = 'P0001'; end if;

    if exists (
      select 1 from public.inscripciones_evento ie join public.participantes p on p.id = ie.participante_id
      where ie.evento_id = v_evento.id
        and lower(p.tipo_documento) = lower(btrim(v_item->>'tipo_documento'))
        and lower(p.numero_documento) = lower(btrim(v_item->>'numero_documento'))
        and ie.estado not in ('cancelada', 'reembolsada')
        and (ie.estado <> 'pendiente_pago' or ie.expira_en > now())
    ) then raise exception 'El participante % ya esta inscrito en este evento', v_indice using errcode = 'P0001'; end if;

    if v_categoria_id is not null then
      select ce.* into v_categoria from public.categorias_evento ce
      where ce.id = v_categoria_id and ce.evento_id = v_evento.id and ce.negocio_id = v_evento.negocio_id
        and ce.activa = true and (ce.modalidad_evento_id is null or ce.modalidad_evento_id = v_modalidad.id);
      if not found then raise exception 'La categoria del participante % no esta disponible', v_indice using errcode = 'P0001'; end if;
      v_edad := extract(year from age((v_evento.inicio_at at time zone v_evento.zona_horaria)::date, (v_item->>'fecha_nacimiento')::date));
      if (v_categoria.edad_minima is not null and v_edad < v_categoria.edad_minima)
        or (v_categoria.edad_maxima is not null and v_edad > v_categoria.edad_maxima)
      then raise exception 'La edad del participante % no corresponde a la categoria', v_indice using errcode = 'P0001'; end if;
      if v_categoria.genero is not null and lower(v_categoria.genero) not in ('abierta', 'mixto', 'no_aplica')
        and lower(v_categoria.genero) <> lower(coalesce(v_item->>'genero', ''))
      then raise exception 'El genero del participante % no corresponde a la categoria', v_indice using errcode = 'P0001'; end if;
      if (v_categoria.peso_minimo is not null or v_categoria.peso_maximo is not null) and v_peso is null
      then raise exception 'La categoria requiere el peso del participante %', v_indice using errcode = 'P0001'; end if;
      if (v_categoria.peso_minimo is not null and v_peso < v_categoria.peso_minimo)
        or (v_categoria.peso_maximo is not null and v_peso > v_categoria.peso_maximo)
      then raise exception 'El peso del participante % no corresponde a la categoria', v_indice using errcode = 'P0001'; end if;
    end if;

    insert into public.participantes (
      usuario_propietario_id, nombres, apellidos, tipo_documento, numero_documento,
      fecha_nacimiento, genero, email, telefono_e164,
      contacto_emergencia_nombre, contacto_emergencia_telefono_e164
    ) values (
      auth.uid(), btrim(v_item->>'nombres'), btrim(v_item->>'apellidos'), upper(btrim(v_item->>'tipo_documento')),
      btrim(v_item->>'numero_documento'), (v_item->>'fecha_nacimiento')::date, nullif(btrim(v_item->>'genero'), ''),
      lower(btrim(v_item->>'email')), v_item->>'telefono_e164', btrim(v_item->>'contacto_emergencia_nombre'),
      v_item->>'contacto_emergencia_telefono_e164'
    ) returning id into v_participante_id;

    v_referencia_inscripcion := 'EVT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20));
    v_numero := 'INS-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    v_comision_item := v_cotizacion.comision_plataforma_minor / v_cantidad;
    if v_indice <= (v_cotizacion.comision_plataforma_minor % v_cantidad) then
      v_comision_item := v_comision_item + 1;
    end if;

    insert into public.inscripciones_evento (
      orden_evento_id, negocio_id, evento_id, modalidad_evento_id, categoria_evento_id,
      participante_id, comprador_usuario_id, referencia_publica, numero_inscripcion,
      precio_base_minor, tarifa_plataforma_minor, tasa_plataforma_snapshot, total_minor,
      moneda_codigo, talla_camiseta, peso_declarado, terminos_aceptados_en,
      privacidad_aceptada_en, expira_en
    ) values (
      v_orden_id, v_evento.negocio_id, v_evento.id, v_modalidad.id, v_categoria_id,
      v_participante_id, auth.uid(), v_referencia_inscripcion, v_numero,
      v_modalidad.precio_base_minor, v_comision_item, v_cotizacion.tasa_plataforma,
      v_modalidad.precio_base_minor + v_comision_item, v_modalidad.moneda_codigo,
      nullif(btrim(v_item->>'talla_camiseta'), ''), v_peso, now(), now(), v_expira
    );
    v_inscripciones := v_inscripciones || jsonb_build_array(jsonb_build_object(
      'numero_inscripcion', v_numero, 'referencia_publica', v_referencia_inscripcion,
      'participante', btrim(v_item->>'nombres') || ' ' || btrim(v_item->>'apellidos')
    ));
  end loop;

  return query select v_referencia, v_cantidad, v_cotizacion.precio_base_minor,
    v_cotizacion.comision_plataforma_minor, v_cotizacion.cargo_pasarela_minor,
    v_cotizacion.total_minor, btrim(v_modalidad.moneda_codigo), v_expira, v_inscripciones;
end;
$$;

alter table public.ordenes_evento enable row level security;
grant select on public.ordenes_evento to authenticated;

drop policy if exists "Ordenes de evento visibles por comprador o gestor" on public.ordenes_evento;
create policy "Ordenes de evento visibles por comprador o gestor"
on public.ordenes_evento for select to authenticated
using (comprador_usuario_id = auth.uid() or public.owns_negocio(negocio_id) or public.is_admin());

revoke all on function public.crear_orden_evento_publica(uuid, jsonb, text, text, text, boolean, boolean) from public;
grant execute on function public.crear_orden_evento_publica(uuid, jsonb, text, text, text, boolean, boolean) to anon, authenticated;

comment on table public.ordenes_evento is
  'Compra atomica de uno a diez cupos de evento, liquidada en un solo pago.';
