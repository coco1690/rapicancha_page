begin;

alter table public.reservas
  add column if not exists acepta_terminos boolean not null default false,
  add column if not exists terminos_version text,
  add column if not exists terminos_aceptados_en timestamptz;

alter table public.reservas
  drop constraint if exists reservas_terminos_aceptados_check;

alter table public.reservas
  add constraint reservas_terminos_aceptados_check
  check (
    not acepta_terminos
    or (
      terminos_version is not null
      and btrim(terminos_version) <> ''
      and terminos_aceptados_en is not null
    )
  );

comment on column public.reservas.acepta_terminos is
  'Evidencia de aceptacion expresa de los terminos antes de iniciar el pago.';
comment on column public.reservas.terminos_version is
  'Version de los terminos aceptada por el cliente.';
comment on column public.reservas.terminos_aceptados_en is
  'Fecha y hora en que se registro la aceptacion.';

commit;

