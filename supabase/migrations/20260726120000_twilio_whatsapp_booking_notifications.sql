begin;

alter table public.paises
  add column if not exists indicativo_pais text;

update public.paises
set indicativo_pais = case upper(trim(codigo_iso2::text))
  when 'CO' then '+57'
  when 'MX' then '+52'
  when 'PE' then '+51'
  when 'CL' then '+56'
  when 'AR' then '+54'
  else indicativo_pais
end
where indicativo_pais is null;

alter table public.paises
  drop constraint if exists paises_indicativo_pais_check;
alter table public.paises
  add constraint paises_indicativo_pais_check
  check (indicativo_pais is null or indicativo_pais ~ '^\+[1-9][0-9]{0,3}$');

alter table public.reservas
  add column if not exists telefono_cliente_e164 text,
  add column if not exists acepta_notificaciones_whatsapp boolean not null default false;

alter table public.negocios
  add column if not exists whatsapp_telefono_e164 text,
  add column if not exists whatsapp_notificaciones_activas boolean not null default false;

alter table public.reservas
  drop constraint if exists reservas_telefono_cliente_e164_check;
alter table public.reservas
  add constraint reservas_telefono_cliente_e164_check
  check (telefono_cliente_e164 is null or telefono_cliente_e164 ~ '^\+[1-9][0-9]{7,14}$');

alter table public.negocios
  drop constraint if exists negocios_whatsapp_telefono_e164_check;
alter table public.negocios
  add constraint negocios_whatsapp_telefono_e164_check
  check (whatsapp_telefono_e164 is null or whatsapp_telefono_e164 ~ '^\+[1-9][0-9]{7,14}$');

create table if not exists public.whatsapp_notificaciones (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reservas(id) on delete cascade,
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  destinatario text not null check (destinatario in ('cliente', 'club')),
  evento text not null default 'reserva_confirmada' check (evento in ('reserva_confirmada')),
  estado text not null default 'pending'
    check (estado in ('pending', 'processing', 'queued', 'sent', 'delivered', 'read', 'failed', 'undelivered', 'canceled')),
  twilio_message_sid text,
  intentos integer not null default 0 check (intentos >= 0),
  proximo_intento_en timestamptz not null default now(),
  error_codigo text,
  error_detalle text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  enviado_en timestamptz,
  entregado_en timestamptz,
  leido_en timestamptz,
  unique (reserva_id, evento, destinatario)
);

create index if not exists whatsapp_notificaciones_pending_idx
  on public.whatsapp_notificaciones (estado, proximo_intento_en, creado_en)
  where estado in ('pending', 'processing');

create unique index if not exists whatsapp_notificaciones_twilio_sid_uidx
  on public.whatsapp_notificaciones (twilio_message_sid)
  where twilio_message_sid is not null;

alter table public.whatsapp_notificaciones enable row level security;
grant select on public.whatsapp_notificaciones to authenticated;

drop policy if exists "Negocios ven entregas WhatsApp asociadas" on public.whatsapp_notificaciones;
create policy "Negocios ven entregas WhatsApp asociadas"
on public.whatsapp_notificaciones for select
to authenticated
using (public.owns_negocio(negocio_id) or public.is_admin());

create or replace function public.enqueue_whatsapp_reserva_confirmada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  club_whatsapp_activo boolean;
  club_whatsapp text;
begin
  if new.estado_reserva <> 'confirmada'
    or (tg_op = 'UPDATE' and old.estado_reserva = 'confirmada') then
    return new;
  end if;

  if new.acepta_notificaciones_whatsapp
    and new.telefono_cliente_e164 is not null then
    insert into public.whatsapp_notificaciones (
      reserva_id,
      negocio_id,
      destinatario,
      evento
    )
    values (
      new.id,
      new.negocio_id,
      'cliente',
      'reserva_confirmada'
    )
    on conflict (reserva_id, evento, destinatario) do nothing;
  end if;

  select
    n.whatsapp_notificaciones_activas,
    n.whatsapp_telefono_e164
  into
    club_whatsapp_activo,
    club_whatsapp
  from public.negocios n
  where n.id = new.negocio_id;

  if coalesce(club_whatsapp_activo, false)
    and club_whatsapp is not null then
    insert into public.whatsapp_notificaciones (
      reserva_id,
      negocio_id,
      destinatario,
      evento
    )
    values (
      new.id,
      new.negocio_id,
      'club',
      'reserva_confirmada'
    )
    on conflict (reserva_id, evento, destinatario) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists reservas_enqueue_whatsapp_confirmacion on public.reservas;
create trigger reservas_enqueue_whatsapp_confirmacion
after insert or update of estado_reserva on public.reservas
for each row execute function public.enqueue_whatsapp_reserva_confirmada();

create or replace function public.claim_whatsapp_notificaciones(p_limit integer default 20)
returns setof public.whatsapp_notificaciones
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select wn.id
    from public.whatsapp_notificaciones wn
    where (
      wn.estado = 'pending'
      or (
        wn.estado = 'processing'
        and wn.actualizado_en < now() - interval '5 minutes'
      )
    )
      and wn.proximo_intento_en <= now()
      and wn.intentos < 5
    order by wn.creado_en
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 20), 100))
  )
  update public.whatsapp_notificaciones wn
  set
    estado = 'processing',
    intentos = wn.intentos + 1,
    actualizado_en = now(),
    error_codigo = null,
    error_detalle = null
  from candidates
  where wn.id = candidates.id
  returning wn.*;
end;
$$;

revoke all on function public.claim_whatsapp_notificaciones(integer) from public, anon, authenticated;
grant execute on function public.claim_whatsapp_notificaciones(integer) to service_role;

commit;
