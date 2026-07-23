-- Business self-creation must go through a trusted flow:
-- admin support, complimentary trial, or Stripe subscription Edge Function.

drop policy if exists "Duenos crean negocios" on public.negocios;

drop policy if exists "Usuarios no crean negocios directamente" on public.negocios;
create policy "Usuarios no crean negocios directamente"
on public.negocios for insert
to authenticated
with check (false);

drop policy if exists "Administradores crean negocios" on public.negocios;
create policy "Administradores crean negocios"
on public.negocios for insert
to authenticated
with check (public.is_admin());
