-- Configurable payment-processing charges for reservations, events and subscriptions.
-- The customer-facing total is grossed up so the processing charge does not reduce
-- the service amount or Rapicancha's platform fee.

do $$
begin
  alter type public.payment_type add value if not exists 'evento';
exception
  when undefined_object then null;
end $$;

create table if not exists public.tarifas_pasarela (
  id uuid primary key default gen_random_uuid(),
  proveedor text not null,
  moneda_codigo char(3) not null,
  tipo_pago text,
  porcentaje numeric(8, 6) not null default 0,
  cargo_fijo_minor integer not null default 0,
  impuesto_porcentaje numeric(8, 6) not null default 0,
  activa boolean not null default true,
  vigente_desde timestamptz not null default now(),
  vigente_hasta timestamptz,
  descripcion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tarifas_pasarela_porcentaje_chk check (porcentaje >= 0 and porcentaje < 1),
  constraint tarifas_pasarela_fijo_chk check (cargo_fijo_minor >= 0),
  constraint tarifas_pasarela_impuesto_chk check (impuesto_porcentaje >= 0 and impuesto_porcentaje < 1),
  constraint tarifas_pasarela_tipo_chk check (tipo_pago is null or tipo_pago in ('reserva', 'evento', 'torneo', 'suscripcion')),
  constraint tarifas_pasarela_vigencia_chk check (vigente_hasta is null or vigente_hasta > vigente_desde)
);

create unique index if not exists tarifas_pasarela_regla_activa_uidx
  on public.tarifas_pasarela (proveedor, moneda_codigo, coalesce(tipo_pago, '*'))
  where activa and vigente_hasta is null;

create index if not exists tarifas_pasarela_busqueda_idx
  on public.tarifas_pasarela (proveedor, moneda_codigo, tipo_pago, activa, vigente_desde desc);

insert into public.tarifas_pasarela (
  proveedor, moneda_codigo, tipo_pago, porcentaje, cargo_fijo_minor,
  impuesto_porcentaje, descripcion
)
select
  'epayco', 'COP', null, 0.0329, 700, 0.19,
  'Tarifa estandar ePayco para comercios con cuentas de otros bancos.'
where not exists (
  select 1 from public.tarifas_pasarela
  where proveedor = 'epayco' and moneda_codigo = 'COP'
    and tipo_pago is null and activa and vigente_hasta is null
);

alter table public.reservas
  add column if not exists precio_base_minor integer not null default 0,
  add column if not exists comision_plataforma_minor integer not null default 0,
  add column if not exists cargo_pasarela_minor integer not null default 0,
  add column if not exists tasa_pasarela_snapshot numeric(8, 6) not null default 0,
  add column if not exists cargo_fijo_pasarela_snapshot_minor integer not null default 0,
  add column if not exists impuesto_pasarela_snapshot numeric(8, 6) not null default 0;

update public.reservas
set precio_base_minor = precio_total_minor
where precio_base_minor = 0 and precio_total_minor > 0;

alter table public.pagos
  add column if not exists monto_base_minor integer not null default 0,
  add column if not exists cargo_pasarela_minor integer not null default 0,
  add column if not exists tasa_pasarela_snapshot numeric(8, 6) not null default 0,
  add column if not exists cargo_fijo_pasarela_snapshot_minor integer not null default 0,
  add column if not exists impuesto_pasarela_snapshot numeric(8, 6) not null default 0,
  add column if not exists inscripcion_evento_id uuid references public.inscripciones_evento(id) on delete set null;

update public.pagos
set monto_base_minor = monto_total_minor
where monto_base_minor = 0 and monto_total_minor > 0;

create index if not exists pagos_inscripcion_evento_idx
  on public.pagos(inscripcion_evento_id)
  where inscripcion_evento_id is not null;

alter table public.inscripciones_evento
  add column if not exists cargo_pasarela_minor integer not null default 0,
  add column if not exists tasa_pasarela_snapshot numeric(8, 6) not null default 0,
  add column if not exists cargo_fijo_pasarela_snapshot_minor integer not null default 0,
  add column if not exists impuesto_pasarela_snapshot numeric(8, 6) not null default 0;

alter table public.suscripciones
  add column if not exists precio_base_minor integer not null default 0,
  add column if not exists comision_plataforma_minor integer not null default 0,
  add column if not exists cargo_pasarela_minor integer not null default 0,
  add column if not exists total_minor integer not null default 0,
  add column if not exists moneda_codigo char(3),
  add column if not exists tasa_pasarela_snapshot numeric(8, 6) not null default 0,
  add column if not exists cargo_fijo_pasarela_snapshot_minor integer not null default 0,
  add column if not exists impuesto_pasarela_snapshot numeric(8, 6) not null default 0;

create or replace function public.cotizar_pago(
  p_proveedor text,
  p_tipo_pago text,
  p_moneda_codigo text,
  p_precio_base_minor integer,
  p_comision_plataforma_minor integer default 0
)
returns table (
  precio_base_minor integer,
  comision_plataforma_minor integer,
  subtotal_minor integer,
  cargo_pasarela_minor integer,
  total_minor integer,
  tasa_pasarela numeric,
  cargo_fijo_pasarela_minor integer,
  impuesto_pasarela numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_regla public.tarifas_pasarela%rowtype;
  v_subtotal integer;
  v_factor numeric;
  v_total integer;
begin
  if p_precio_base_minor < 0 or p_comision_plataforma_minor < 0 then
    raise exception 'Los importes del pago no pueden ser negativos';
  end if;

  select t.* into v_regla
  from public.tarifas_pasarela t
  where t.proveedor = lower(trim(p_proveedor))
    and t.moneda_codigo = upper(trim(p_moneda_codigo))
    and t.activa
    and t.vigente_desde <= now()
    and (t.vigente_hasta is null or t.vigente_hasta > now())
    and (t.tipo_pago = p_tipo_pago or t.tipo_pago is null)
  order by (t.tipo_pago = p_tipo_pago) desc, t.vigente_desde desc
  limit 1;

  v_subtotal := p_precio_base_minor + p_comision_plataforma_minor;
  if v_regla.id is null then
    return query select p_precio_base_minor, p_comision_plataforma_minor,
      v_subtotal, 0, v_subtotal, 0::numeric, 0, 0::numeric;
    return;
  end if;

  v_factor := v_regla.porcentaje * (1 + v_regla.impuesto_porcentaje);
  if v_factor >= 1 then raise exception 'La tarifa de pasarela configurada no es valida'; end if;

  v_total := ceil(
    (v_subtotal + (v_regla.cargo_fijo_minor * (1 + v_regla.impuesto_porcentaje)))
    / (1 - v_factor)
  )::integer;

  return query select p_precio_base_minor, p_comision_plataforma_minor,
    v_subtotal, greatest(v_total - v_subtotal, 0), v_total,
    v_regla.porcentaje, v_regla.cargo_fijo_minor, v_regla.impuesto_porcentaje;
end;
$$;

create or replace function public.aplicar_cargo_pasarela_inscripcion_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cotizacion record;
begin
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

drop trigger if exists calcular_cargo_pasarela_inscripcion_evento on public.inscripciones_evento;
create trigger calcular_cargo_pasarela_inscripcion_evento
before insert or update of precio_base_minor, descuento_minor, tarifa_plataforma_minor, moneda_codigo
on public.inscripciones_evento
for each row execute function public.aplicar_cargo_pasarela_inscripcion_evento();

create or replace function public.aplicar_cargo_pasarela_pago()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cotizacion record;
begin
  if new.monto_base_minor <= 0 then
    new.monto_base_minor := greatest(new.monto_total_minor - new.comision_plataforma_minor, 0);
  end if;

  select * into v_cotizacion
  from public.cotizar_pago(
    new.payment_provider, new.tipo_pago::text, new.moneda,
    new.monto_base_minor, new.comision_plataforma_minor
  );

  new.cargo_pasarela_minor := v_cotizacion.cargo_pasarela_minor;
  new.monto_total_minor := v_cotizacion.total_minor;
  new.tasa_pasarela_snapshot := v_cotizacion.tasa_pasarela;
  new.cargo_fijo_pasarela_snapshot_minor := v_cotizacion.cargo_fijo_pasarela_minor;
  new.impuesto_pasarela_snapshot := v_cotizacion.impuesto_pasarela;
  return new;
end;
$$;

drop trigger if exists calcular_cargo_pasarela_pago on public.pagos;
create trigger calcular_cargo_pasarela_pago
before insert on public.pagos
for each row execute function public.aplicar_cargo_pasarela_pago();

alter table public.tarifas_pasarela enable row level security;

drop policy if exists "Administradores gestionan tarifas de pasarela" on public.tarifas_pasarela;
create policy "Administradores gestionan tarifas de pasarela"
on public.tarifas_pasarela for all to authenticated
using (public.is_admin()) with check (public.is_admin());

revoke all on function public.cotizar_pago(text, text, text, integer, integer) from public;
grant execute on function public.cotizar_pago(text, text, text, integer, integer) to anon, authenticated, service_role;
grant select, insert, update, delete on public.tarifas_pasarela to authenticated;

comment on table public.tarifas_pasarela is
  'Reglas versionables para trasladar al comprador el costo informado de procesamiento de pagos.';
comment on column public.pagos.cargo_pasarela_minor is
  'Cargo de procesamiento cobrado al comprador y destinado a cubrir la pasarela; no es ingreso del club.';
