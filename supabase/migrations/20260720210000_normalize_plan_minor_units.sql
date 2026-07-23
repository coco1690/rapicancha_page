begin;

create table if not exists public.rapicancha_migrations (
  id text primary key,
  aplicado_en timestamptz not null default now()
);

alter table public.rapicancha_migrations enable row level security;

do $$
begin
  if not exists (
    select 1 from public.rapicancha_migrations
    where id = '20260720210000_normalize_cop_plan_minor_units'
  ) then
    update public.planes
    set precio_mensual_minor = precio_mensual_minor * 100
    where upper(coalesce(moneda_codigo, moneda)) = 'COP';

    insert into public.rapicancha_migrations (id)
    values ('20260720210000_normalize_cop_plan_minor_units');
  end if;
end;
$$;

commit;
