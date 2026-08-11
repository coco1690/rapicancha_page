-- Optional bib assignment and shirt-size collection for sports events.

alter table public.eventos
  add column if not exists requiere_dorsal boolean not null default false,
  add column if not exists dorsal_inicial integer not null default 1,
  add column if not exists solicita_talla_camiseta boolean not null default false,
  add column if not exists tallas_camiseta text[] not null default array['XS', 'S', 'M', 'L', 'XL', 'XXL']::text[];

alter table public.eventos
  drop constraint if exists eventos_dorsal_inicial_chk,
  add constraint eventos_dorsal_inicial_chk check (dorsal_inicial > 0),
  drop constraint if exists eventos_tallas_camiseta_chk,
  add constraint eventos_tallas_camiseta_chk check (cardinality(tallas_camiseta) > 0);

create unique index if not exists inscripciones_evento_dorsal_uidx
  on public.inscripciones_evento(evento_id, numero_dorsal)
  where numero_dorsal is not null;

create or replace function public.preparar_dorsal_inscripcion_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evento public.eventos%rowtype;
  v_siguiente integer;
begin
  select * into v_evento from public.eventos where id = new.evento_id;
  if v_evento.id is null then return new; end if;

  new.talla_camiseta := nullif(upper(btrim(new.talla_camiseta)), '');
  if v_evento.solicita_talla_camiseta then
    if new.talla_camiseta is null or not (new.talla_camiseta = any(v_evento.tallas_camiseta)) then
      raise exception 'Selecciona una talla de camiseta valida' using errcode = 'P0001';
    end if;
  end if;

  new.numero_dorsal := nullif(btrim(new.numero_dorsal), '');
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
    new.numero_dorsal := v_siguiente::text;
  end if;

  return new;
end;
$$;

drop trigger if exists preparar_dorsal_inscripcion_evento on public.inscripciones_evento;
create trigger preparar_dorsal_inscripcion_evento
before insert or update of estado, numero_dorsal, talla_camiseta
on public.inscripciones_evento
for each row execute function public.preparar_dorsal_inscripcion_evento();

create or replace function public.asignar_dorsales_existentes_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.requiere_dorsal and (not old.requiere_dorsal or new.dorsal_inicial <> old.dorsal_inicial) then
    update public.inscripciones_evento
    set estado = estado
    where evento_id = new.id
      and numero_dorsal is null
      and estado in ('pagada', 'confirmada', 'acreditada', 'completada');
  end if;
  return new;
end;
$$;

drop trigger if exists asignar_dorsales_existentes_evento on public.eventos;
create trigger asignar_dorsales_existentes_evento
after update of requiere_dorsal, dorsal_inicial on public.eventos
for each row execute function public.asignar_dorsales_existentes_evento();

comment on column public.eventos.requiere_dorsal is
  'Asigna un dorsal unico al aprobar o confirmar la inscripcion.';
comment on column public.eventos.solicita_talla_camiseta is
  'Obliga al participante a seleccionar una talla permitida.';
