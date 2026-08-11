-- Realtime participant directory, explicit marketing consent and paid
-- registration notifications for clubs.

begin;

create table if not exists public.preferencias_contacto_participante (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  participante_id uuid not null references public.participantes(id) on delete cascade,
  acepta_marketing_email boolean not null default false,
  acepta_marketing_whatsapp boolean not null default false,
  marketing_email_aceptado_en timestamptz,
  marketing_whatsapp_aceptado_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (negocio_id, participante_id)
);

create index if not exists preferencias_contacto_email_idx
  on public.preferencias_contacto_participante(negocio_id, participante_id)
  where acepta_marketing_email;
create index if not exists preferencias_contacto_whatsapp_idx
  on public.preferencias_contacto_participante(negocio_id, participante_id)
  where acepta_marketing_whatsapp;

drop trigger if exists set_preferencias_contacto_updated_at on public.preferencias_contacto_participante;
create trigger set_preferencias_contacto_updated_at
before update on public.preferencias_contacto_participante
for each row execute function public.set_updated_at();

alter table public.preferencias_contacto_participante enable row level security;
grant select, update on public.preferencias_contacto_participante to authenticated;

drop policy if exists "Gestores consultan preferencias de participantes" on public.preferencias_contacto_participante;
create policy "Gestores consultan preferencias de participantes"
on public.preferencias_contacto_participante for select to authenticated
using (public.is_admin() or public.owns_negocio(negocio_id));

drop policy if exists "Gestores actualizan preferencias de participantes" on public.preferencias_contacto_participante;
create policy "Gestores actualizan preferencias de participantes"
on public.preferencias_contacto_participante for update to authenticated
using (public.is_admin() or public.owns_negocio(negocio_id))
with check (public.is_admin() or public.owns_negocio(negocio_id));

alter table public.notificaciones_negocio
  add column if not exists inscripcion_evento_id uuid references public.inscripciones_evento(id) on delete cascade,
  add column if not exists orden_evento_id uuid references public.ordenes_evento(id) on delete cascade;

alter table public.notificaciones_negocio
  drop constraint if exists notificaciones_negocio_tipo_check;
alter table public.notificaciones_negocio
  add constraint notificaciones_negocio_tipo_check check (
    tipo in ('reserva_confirmada', 'reserva_cancelada', 'participante_inscrito', 'sistema')
  );

create unique index if not exists notificaciones_negocio_inscripcion_tipo_uidx
  on public.notificaciones_negocio(inscripcion_evento_id, tipo)
  where inscripcion_evento_id is not null;
create unique index if not exists notificaciones_negocio_orden_evento_tipo_uidx
  on public.notificaciones_negocio(orden_evento_id, tipo)
  where orden_evento_id is not null;

create or replace function public.notificar_orden_evento_pagada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evento_nombre text;
begin
  if new.estado = 'paid' and old.estado is distinct from 'paid' then
    select nombre into v_evento_nombre from public.eventos where id = new.evento_id;
    insert into public.notificaciones_negocio (
      negocio_id, orden_evento_id, tipo, titulo, mensaje, datos
    ) values (
      new.negocio_id, new.id, 'participante_inscrito',
      case when new.cantidad = 1 then 'Nuevo participante inscrito' else 'Nuevos participantes inscritos' end,
      new.comprador_nombre || ' confirmo ' || new.cantidad || case when new.cantidad = 1 then ' cupo' else ' cupos' end || ' para ' || coalesce(v_evento_nombre, 'un evento') || '.',
      jsonb_build_object(
        'ordenId', new.id, 'referencia', new.referencia_publica,
        'eventoId', new.evento_id, 'evento', v_evento_nombre,
        'cantidad', new.cantidad, 'estado', new.estado
      )
    ) on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists notificar_orden_evento_pagada on public.ordenes_evento;
create trigger notificar_orden_evento_pagada
after update of estado on public.ordenes_evento
for each row execute function public.notificar_orden_evento_pagada();

create or replace function public.notificar_inscripcion_evento_pagada_individual()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text;
  v_evento_nombre text;
begin
  if new.orden_evento_id is null and new.estado in ('pagada', 'confirmada')
    and old.estado not in ('pagada', 'confirmada')
  then
    select btrim(nombres || ' ' || apellidos) into v_nombre
    from public.participantes where id = new.participante_id;
    select nombre into v_evento_nombre from public.eventos where id = new.evento_id;
    insert into public.notificaciones_negocio (
      negocio_id, inscripcion_evento_id, tipo, titulo, mensaje, datos
    ) values (
      new.negocio_id, new.id, 'participante_inscrito', 'Nuevo participante inscrito',
      coalesce(v_nombre, 'Un participante') || ' se inscribio en ' || coalesce(v_evento_nombre, 'un evento') || '.',
      jsonb_build_object(
        'inscripcionId', new.id, 'referencia', new.referencia_publica,
        'eventoId', new.evento_id, 'evento', v_evento_nombre,
        'participante', v_nombre, 'estado', new.estado
      )
    ) on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists notificar_inscripcion_evento_pagada_individual on public.inscripciones_evento;
create trigger notificar_inscripcion_evento_pagada_individual
after update of estado on public.inscripciones_evento
for each row execute function public.notificar_inscripcion_evento_pagada_individual();

create or replace function public.crear_orden_evento_publica_con_preferencias(
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
  v_result record;
  v_item jsonb;
begin
  select * into v_result from public.crear_orden_evento_publica(
    p_modalidad_evento_id, p_participantes, p_comprador_nombre,
    p_comprador_email, p_comprador_telefono_e164,
    p_acepta_terminos, p_acepta_privacidad
  );

  for v_item in select value from jsonb_array_elements(p_participantes)
  loop
    insert into public.preferencias_contacto_participante (
      negocio_id, participante_id, acepta_marketing_email,
      acepta_marketing_whatsapp, marketing_email_aceptado_en,
      marketing_whatsapp_aceptado_en
    )
    select oe.negocio_id, p.id,
      coalesce((v_item->>'acepta_marketing_email')::boolean, false),
      coalesce((v_item->>'acepta_marketing_whatsapp')::boolean, false),
      case when coalesce((v_item->>'acepta_marketing_email')::boolean, false) then now() end,
      case when coalesce((v_item->>'acepta_marketing_whatsapp')::boolean, false) then now() end
    from public.inscripciones_evento ie
    join public.ordenes_evento oe on oe.id = ie.orden_evento_id
    join public.participantes p on p.id = ie.participante_id
    where oe.referencia_publica = v_result.referencia_publica
      and lower(p.tipo_documento) = lower(btrim(v_item->>'tipo_documento'))
      and lower(p.numero_documento) = lower(btrim(v_item->>'numero_documento'))
    on conflict (negocio_id, participante_id) do update set
      acepta_marketing_email = excluded.acepta_marketing_email,
      acepta_marketing_whatsapp = excluded.acepta_marketing_whatsapp,
      marketing_email_aceptado_en = excluded.marketing_email_aceptado_en,
      marketing_whatsapp_aceptado_en = excluded.marketing_whatsapp_aceptado_en;
  end loop;

  return query select v_result.referencia_publica, v_result.cantidad,
    v_result.monto_base_minor, v_result.tarifa_plataforma_minor,
    v_result.cargo_pasarela_minor, v_result.total_minor,
    v_result.moneda_codigo, v_result.expira_en, v_result.inscripciones;
end;
$$;

revoke all on function public.crear_orden_evento_publica_con_preferencias(uuid, jsonb, text, text, text, boolean, boolean) from public;
grant execute on function public.crear_orden_evento_publica_con_preferencias(uuid, jsonb, text, text, text, boolean, boolean) to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.participantes;
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.inscripciones_evento;
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.preferencias_contacto_participante;
exception when duplicate_object then null;
end;
$$;

comment on table public.preferencias_contacto_participante is
  'Consentimientos opcionales y revocables de marketing, aislados por participante y club.';

commit;
