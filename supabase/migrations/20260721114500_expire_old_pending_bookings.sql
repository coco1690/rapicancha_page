-- Pending payments are temporary holds. Old holds should not block the court.

update public.reservas
set estado_reserva = 'expirada'
where estado_reserva = 'pendiente_pago'
  and creado_en < now() - interval '7 minutes';

update public.pagos
set estado = 'failed'
where estado = 'pending'
  and creado_en < now() - interval '7 minutes'
  and reserva_id in (
    select id
    from public.reservas
    where estado_reserva = 'expirada'
  );
