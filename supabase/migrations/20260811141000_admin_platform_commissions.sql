-- Super Admin-managed Rapicancha commissions by purchase type.

create table if not exists public.comisiones_plataforma (
  id uuid primary key default gen_random_uuid(),
  tipo_pago text not null unique,
  porcentaje numeric(8, 6) not null default 0,
  activa boolean not null default true,
  descripcion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comisiones_plataforma_tipo_chk
    check (tipo_pago in ('reserva', 'evento', 'torneo', 'suscripcion')),
  constraint comisiones_plataforma_porcentaje_chk
    check (porcentaje >= 0 and porcentaje <= 1)
);

insert into public.comisiones_plataforma (tipo_pago, porcentaje, descripcion)
values
  ('reserva', 0.10, 'Comision por reservas de canchas.'),
  ('evento', 0.10, 'Comision por inscripciones a eventos.'),
  ('torneo', 0.10, 'Comision por inscripciones a torneos.'),
  ('suscripcion', 0, 'Sin recargo adicional sobre el precio mensual del plan.')
on conflict (tipo_pago) do nothing;

alter table public.reservas
  add column if not exists tasa_plataforma_snapshot numeric(8, 6) not null default 0;

alter table public.pagos
  add column if not exists tasa_plataforma_snapshot numeric(8, 6) not null default 0;

alter table public.suscripciones
  add column if not exists tasa_plataforma_snapshot numeric(8, 6) not null default 0;

create or replace function public.cotizar_compra(
  p_proveedor text,
  p_tipo_pago text,
  p_moneda_codigo text,
  p_precio_base_minor integer
)
returns table (
  precio_base_minor integer,
  comision_plataforma_minor integer,
  subtotal_minor integer,
  cargo_pasarela_minor integer,
  total_minor integer,
  tasa_plataforma numeric,
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
  v_tasa_plataforma numeric := 0;
begin
  if p_precio_base_minor < 0 then
    raise exception 'El precio base no puede ser negativo';
  end if;

  select c.porcentaje into v_tasa_plataforma
  from public.comisiones_plataforma c
  where c.tipo_pago = p_tipo_pago and c.activa
  limit 1;

  v_tasa_plataforma := coalesce(v_tasa_plataforma, 0);

  return query
  select q.precio_base_minor, q.comision_plataforma_minor, q.subtotal_minor,
    q.cargo_pasarela_minor, q.total_minor, v_tasa_plataforma,
    q.tasa_pasarela, q.cargo_fijo_pasarela_minor, q.impuesto_pasarela
  from public.cotizar_pago(
    p_proveedor, p_tipo_pago, p_moneda_codigo, p_precio_base_minor,
    round(p_precio_base_minor * v_tasa_plataforma)::integer
  ) q;
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
  from public.cotizar_compra(
    'epayco', 'evento', new.moneda_codigo,
    greatest(new.precio_base_minor - new.descuento_minor, 0)
  );
  new.tarifa_plataforma_minor := v_cotizacion.comision_plataforma_minor;
  new.tasa_plataforma_snapshot := v_cotizacion.tasa_plataforma;
  new.cargo_pasarela_minor := v_cotizacion.cargo_pasarela_minor;
  new.total_minor := v_cotizacion.total_minor;
  new.tasa_pasarela_snapshot := v_cotizacion.tasa_pasarela;
  new.cargo_fijo_pasarela_snapshot_minor := v_cotizacion.cargo_fijo_pasarela_minor;
  new.impuesto_pasarela_snapshot := v_cotizacion.impuesto_pasarela;
  return new;
end;
$$;

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
  from public.cotizar_compra(
    new.payment_provider, new.tipo_pago::text, new.moneda, new.monto_base_minor
  );

  new.comision_plataforma_minor := v_cotizacion.comision_plataforma_minor;
  new.tasa_plataforma_snapshot := v_cotizacion.tasa_plataforma;
  new.cargo_pasarela_minor := v_cotizacion.cargo_pasarela_minor;
  new.monto_total_minor := v_cotizacion.total_minor;
  new.tasa_pasarela_snapshot := v_cotizacion.tasa_pasarela;
  new.cargo_fijo_pasarela_snapshot_minor := v_cotizacion.cargo_fijo_pasarela_minor;
  new.impuesto_pasarela_snapshot := v_cotizacion.impuesto_pasarela;
  return new;
end;
$$;

alter table public.comisiones_plataforma enable row level security;

drop policy if exists "Administradores gestionan comisiones de plataforma" on public.comisiones_plataforma;
create policy "Administradores gestionan comisiones de plataforma"
on public.comisiones_plataforma for all to authenticated
using (public.is_admin()) with check (public.is_admin());

revoke all on function public.cotizar_compra(text, text, text, integer) from public;
grant execute on function public.cotizar_compra(text, text, text, integer) to anon, authenticated, service_role;
grant select, insert, update, delete on public.comisiones_plataforma to authenticated;

comment on table public.comisiones_plataforma is
  'Porcentajes de Rapicancha administrados por Super Admin y congelados en cada compra.';
