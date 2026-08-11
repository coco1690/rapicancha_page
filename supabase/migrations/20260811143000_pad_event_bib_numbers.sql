-- Format event bibs using the event-capacity width (500 -> 001, 1000 -> 0001).

create or replace function public.preparar_dorsal_inscripcion_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evento public.eventos%rowtype;
  v_siguiente integer;
  v_ancho integer;
begin
  select * into v_evento from public.eventos where id = new.evento_id;
  if v_evento.id is null then return new; end if;

  v_ancho := case
    when v_evento.capacidad_total is not null then length(v_evento.capacidad_total::text)
    else 3
  end;
  v_ancho := greatest(v_ancho, length(v_evento.dorsal_inicial::text));

  new.talla_camiseta := nullif(upper(btrim(new.talla_camiseta)), '');
  if v_evento.solicita_talla_camiseta then
    if new.talla_camiseta is null or not (new.talla_camiseta = any(v_evento.tallas_camiseta)) then
      raise exception 'Selecciona una talla de camiseta valida' using errcode = 'P0001';
    end if;
  end if;

  new.numero_dorsal := nullif(btrim(new.numero_dorsal), '');
  if new.numero_dorsal ~ '^[0-9]+$' then
    new.numero_dorsal := lpad(new.numero_dorsal::integer::text, v_ancho, '0');
  end if;

  if v_evento.requiere_dorsal
    and new.numero_dorsal is null
    and new.estado in ('pagada', 'confirmada', 'acreditada', 'completada')
  then
    perform pg_advisory_xact_lock(hashtextextended(new.evento_id::text, 0));
    select greatest(
      v_evento.dorsal_inicial,
      coalesce(max(i.numero_dorsal::integer) filter (where i.numero_dorsal ~ '^[0-9]+$'), v_evento.dorsal_inicial - 1) + 1
    ) into v_siguiente
    from public.inscripciones_evento i
    where i.evento_id = new.evento_id and (new.id is null or i.id <> new.id);
    new.numero_dorsal := lpad(v_siguiente::text, v_ancho, '0');
  end if;

  return new;
end;
$$;

-- Normalize numeric dorsals already assigned during development.
update public.inscripciones_evento i
set numero_dorsal = lpad(
  i.numero_dorsal::integer::text,
  greatest(coalesce(length(e.capacidad_total::text), 3), length(e.dorsal_inicial::text)),
  '0'
)
from public.eventos e
where e.id = i.evento_id
  and i.numero_dorsal ~ '^[0-9]+$'
  and not exists (
    select 1
    from public.inscripciones_evento other
    where other.evento_id = i.evento_id
      and other.id <> i.id
      and other.numero_dorsal ~ '^[0-9]+$'
      and other.numero_dorsal::integer = i.numero_dorsal::integer
  );

comment on column public.inscripciones_evento.numero_dorsal is
  'Dorsal unico por evento, rellenado con ceros segun los digitos de la capacidad total.';
