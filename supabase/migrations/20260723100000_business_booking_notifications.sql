begin;

create table if not exists public.notificaciones_negocio (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  reserva_id uuid references public.reservas(id) on delete cascade,
  tipo text not null check (tipo in ('reserva_confirmada', 'reserva_cancelada', 'sistema')),
  titulo text not null,
  mensaje text not null,
  datos jsonb not null default '{}'::jsonb,
  leida boolean not null default false,
  creado_en timestamptz not null default now()
);

drop index if exists public.notificaciones_negocio_reserva_tipo_uidx;
create unique index notificaciones_negocio_reserva_tipo_uidx
  on public.notificaciones_negocio (reserva_id, tipo);
create index if not exists notificaciones_negocio_inbox_idx
  on public.notificaciones_negocio (negocio_id, leida, creado_en desc);

alter table public.notificaciones_negocio enable row level security;
grant select, update on public.notificaciones_negocio to authenticated;

drop policy if exists "Negocios leen sus notificaciones" on public.notificaciones_negocio;
create policy "Negocios leen sus notificaciones" on public.notificaciones_negocio for select to authenticated
using (exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = auth.uid()));

drop policy if exists "Negocios marcan sus notificaciones" on public.notificaciones_negocio;
create policy "Negocios marcan sus notificaciones" on public.notificaciones_negocio for update to authenticated
using (exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = auth.uid()))
with check (exists (select 1 from public.negocios n where n.id = negocio_id and n.dueno_id = auth.uid()));

drop policy if exists "Administradores gestionan notificaciones negocio" on public.notificaciones_negocio;
create policy "Administradores gestionan notificaciones negocio" on public.notificaciones_negocio for all to authenticated
using (public.is_admin()) with check (public.is_admin());

do $$
begin
  alter publication supabase_realtime add table public.notificaciones_negocio;
exception when duplicate_object then null;
end;
$$;

commit;
