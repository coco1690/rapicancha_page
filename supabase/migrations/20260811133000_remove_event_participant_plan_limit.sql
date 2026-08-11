-- Event capacity belongs to each event and modality, not to the SaaS plan.

alter table public.planes
  drop constraint if exists planes_limite_participantes_evento_chk;

alter table public.planes
  drop column if exists limite_participantes_evento;

comment on column public.planes.limite_eventos is
  'Cantidad maxima de eventos activos; NULL representa capacidad ilimitada.';
