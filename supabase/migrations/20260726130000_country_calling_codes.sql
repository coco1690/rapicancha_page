begin;

alter table public.paises
  add column if not exists indicativo_pais text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'paises'
      and column_name = 'prefijo_telefonico'
  ) then
    execute '
      update public.paises
      set indicativo_pais = coalesce(indicativo_pais, prefijo_telefonico)
      where prefijo_telefonico is not null
    ';
  end if;
end;
$$;

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

commit;
