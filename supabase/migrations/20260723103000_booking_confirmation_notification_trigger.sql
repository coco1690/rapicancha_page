begin;

create or replace function public.notificar_reserva_confirmada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cancha_nombre text;
begin
  if new.estado_reserva <> 'confirmada'
    or (tg_op = 'UPDATE' and old.estado_reserva = 'confirmada') then
    return new;
  end if;

  select c.nombre into cancha_nombre
  from public.canchas c
  where c.id = new.cancha_id;

  insert into public.notificaciones_negocio (
    negocio_id,
    reserva_id,
    tipo,
    titulo,
    mensaje,
    datos
  )
  values (
    new.negocio_id,
    new.id,
    'reserva_confirmada',
    'Nueva reserva confirmada',
    format(
      '%s reservo %s el %s de %s a %s.',
      new.nombre_cliente,
      coalesce(cancha_nombre, 'una cancha'),
      new.fecha_local,
      left(new.hora_inicio_local::text, 5),
      left(new.hora_fin_local::text, 5)
    ),
    jsonb_build_object(
      'referencia', new.referencia_publica,
      'nombreCliente', new.nombre_cliente,
      'telefonoCliente', new.telefono_cliente,
      'cancha', cancha_nombre,
      'fecha', new.fecha_local,
      'horaInicio', new.hora_inicio_local,
      'horaFin', new.hora_fin_local,
      'precioTotalMinor', new.precio_total_minor,
      'moneda', new.moneda
    )
  )
  on conflict (reserva_id, tipo) do nothing;

  return new;
end;
$$;

drop trigger if exists reservas_notificar_confirmacion on public.reservas;
create trigger reservas_notificar_confirmacion
after insert or update of estado_reserva on public.reservas
for each row execute function public.notificar_reserva_confirmada();

insert into public.notificaciones_negocio (
  negocio_id,
  reserva_id,
  tipo,
  titulo,
  mensaje,
  datos
)
select
  r.negocio_id,
  r.id,
  'reserva_confirmada',
  'Nueva reserva confirmada',
  format(
    '%s reservo %s el %s de %s a %s.',
    r.nombre_cliente,
    coalesce(c.nombre, 'una cancha'),
    r.fecha_local,
    left(r.hora_inicio_local::text, 5),
    left(r.hora_fin_local::text, 5)
  ),
  jsonb_build_object(
    'referencia', r.referencia_publica,
    'nombreCliente', r.nombre_cliente,
    'telefonoCliente', r.telefono_cliente,
    'cancha', c.nombre,
    'fecha', r.fecha_local,
    'horaInicio', r.hora_inicio_local,
    'horaFin', r.hora_fin_local,
    'precioTotalMinor', r.precio_total_minor,
    'moneda', r.moneda
  )
from public.reservas r
left join public.canchas c on c.id = r.cancha_id
where r.estado_reserva = 'confirmada'
on conflict (reserva_id, tipo) do nothing;

commit;
