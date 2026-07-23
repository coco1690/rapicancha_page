-- Neutral payment provider model.
-- Keeps legacy Stripe columns for historical data, but new logic should use
-- payment_provider and provider_* columns.

alter table public.negocios
  add column if not exists payment_provider text not null default 'manual',
  add column if not exists provider_account_id text,
  add column if not exists provider_onboarding_status text not null default 'pending',
  add column if not exists provider_payload jsonb not null default '{}'::jsonb;

alter table public.pagos
  add column if not exists payment_provider text not null default 'manual',
  add column if not exists provider_payment_id text,
  add column if not exists provider_checkout_id text,
  add column if not exists provider_checkout_url text,
  add column if not exists provider_account_id text,
  add column if not exists provider_reference text,
  add column if not exists provider_payload jsonb not null default '{}'::jsonb;

alter table public.planes
  add column if not exists payment_provider text,
  add column if not exists provider_price_id text;

alter table public.suscripciones
  add column if not exists payment_provider text not null default 'manual',
  add column if not exists provider_subscription_id text;

alter table if exists public.paises_operacion
  add column if not exists payment_providers_disponibles text[] not null default array['manual']::text[];

update public.negocios
set
  payment_provider = 'stripe',
  provider_account_id = coalesce(provider_account_id, stripe_connect_id, stripe_account_id),
  provider_onboarding_status = case
    when coalesce(stripe_connect_id, stripe_account_id) is null then provider_onboarding_status
    else 'connected'
  end
where coalesce(stripe_connect_id, stripe_account_id) is not null
  and payment_provider = 'manual';

update public.pagos
set
  payment_provider = 'stripe',
  provider_payment_id = coalesce(provider_payment_id, stripe_payment_intent_id),
  provider_checkout_id = coalesce(provider_checkout_id, stripe_checkout_session_id),
  provider_account_id = coalesce(provider_account_id, stripe_connect_account_id)
where coalesce(stripe_payment_intent_id, stripe_checkout_session_id, stripe_connect_account_id) is not null
  and payment_provider = 'manual';

update public.planes
set
  payment_provider = 'stripe',
  provider_price_id = coalesce(provider_price_id, stripe_price_id)
where stripe_price_id is not null
  and payment_provider is null;

update public.suscripciones
set
  payment_provider = 'stripe',
  provider_subscription_id = coalesce(provider_subscription_id, stripe_subscription_id)
where stripe_subscription_id is not null
  and payment_provider = 'manual';

do $$
begin
  if to_regclass('public.paises_operacion') is not null then
    update public.paises_operacion
    set payment_providers_disponibles = case
      when codigo = 'CO' then array['mercadopago', 'epayco', 'dlocal', 'wompi', 'bold']::text[]
      when stripe_connect_disponible then array['stripe']::text[]
      else payment_providers_disponibles
    end
    where payment_providers_disponibles = array['manual']::text[]
      or codigo = 'CO';
  end if;
end $$;

alter table public.negocios
  drop constraint if exists negocios_payment_provider_chk,
  add constraint negocios_payment_provider_chk check (payment_provider in ('manual', 'mercadopago', 'epayco', 'dlocal', 'wompi', 'bold', 'stripe'));

alter table public.pagos
  drop constraint if exists pagos_payment_provider_chk,
  add constraint pagos_payment_provider_chk check (payment_provider in ('manual', 'mercadopago', 'epayco', 'dlocal', 'wompi', 'bold', 'stripe'));

alter table public.planes
  drop constraint if exists planes_payment_provider_chk,
  add constraint planes_payment_provider_chk check (payment_provider is null or payment_provider in ('manual', 'mercadopago', 'epayco', 'dlocal', 'wompi', 'bold', 'stripe'));

alter table public.suscripciones
  drop constraint if exists suscripciones_payment_provider_chk,
  add constraint suscripciones_payment_provider_chk check (payment_provider in ('manual', 'mercadopago', 'epayco', 'dlocal', 'wompi', 'bold', 'stripe'));

do $$
begin
  if to_regclass('public.paises_operacion') is not null then
    alter table public.paises_operacion
      drop constraint if exists paises_operacion_payment_providers_chk,
      add constraint paises_operacion_payment_providers_chk check (payment_providers_disponibles <@ array['manual', 'mercadopago', 'epayco', 'dlocal', 'wompi', 'bold', 'stripe']::text[]);
  end if;
end $$;

create index if not exists idx_negocios_payment_provider on public.negocios(payment_provider, provider_account_id);
create index if not exists idx_pagos_payment_provider on public.pagos(payment_provider, provider_payment_id);
create index if not exists idx_pagos_provider_reference on public.pagos(provider_reference);
create index if not exists idx_suscripciones_payment_provider on public.suscripciones(payment_provider, provider_subscription_id);

comment on column public.negocios.stripe_account_id is 'Legacy Stripe field. Use payment_provider/provider_account_id for new integrations.';
comment on column public.negocios.stripe_connect_id is 'Legacy Stripe field. Use payment_provider/provider_account_id for new integrations.';
comment on column public.pagos.stripe_checkout_session_id is 'Legacy Stripe field. Use provider_checkout_id/provider_checkout_url for new integrations.';
comment on column public.pagos.stripe_connect_account_id is 'Legacy Stripe field. Use provider_account_id for new integrations.';
comment on column public.pagos.stripe_payment_intent_id is 'Legacy Stripe field. Use provider_payment_id for new integrations.';
comment on column public.planes.stripe_price_id is 'Legacy Stripe field. Use payment_provider/provider_price_id for new integrations.';
comment on column public.suscripciones.stripe_subscription_id is 'Legacy Stripe field. Use payment_provider/provider_subscription_id for new integrations.';
do $$
begin
  if to_regclass('public.paises_operacion') is not null then
    comment on column public.paises_operacion.stripe_connect_disponible is 'Legacy Stripe availability flag. Use payment_providers_disponibles for new integrations.';
  end if;
end $$;
