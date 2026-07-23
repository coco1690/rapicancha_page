-- COP is a zero-decimal currency. Values must be stored as pesos, not cents.
-- This fixes rows accidentally saved with two extra zeroes by the previous UI helper.

update public.canchas
set precio_por_hora_minor = (precio_por_hora_minor / 100)::integer
where precio_por_hora_minor >= 500000
  and exists (
    select 1
    from public.negocios n
    where n.id = canchas.negocio_id
      and upper(coalesce(n.moneda_codigo, n.moneda, 'COP')) = 'COP'
  );

update public.cancha_tarifas
set precio_minor = (precio_minor / 100)::integer
where precio_minor >= 500000
  and exists (
    select 1
    from public.canchas c
    join public.negocios n on n.id = c.negocio_id
    where c.id = cancha_tarifas.cancha_id
      and upper(coalesce(cancha_tarifas.moneda_codigo, n.moneda_codigo, n.moneda, 'COP')) = 'COP'
  );

update public.reservas
set precio_total_minor = (precio_total_minor / 100)::integer
where precio_total_minor >= 500000
  and upper(moneda) = 'COP'
  and estado_reserva = 'pendiente_pago';

update public.pagos
set
  monto_total_minor = (monto_total_minor / 100)::integer,
  comision_plataforma_minor = (comision_plataforma_minor / 100)::integer,
  neto_negocio_minor = (neto_negocio_minor / 100)::integer
where monto_total_minor >= 500000
  and upper(moneda) = 'COP'
  and estado = 'pending';
