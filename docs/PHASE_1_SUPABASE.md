# Fase 1 - SaaS interno para negocios

Esta fase versiona el contrato inicial de datos para identidad, multi-tenant y
catalogo publico.

## Incluye

- Perfiles de usuario ligados a `auth.users`.
- Roles `admin`, `negocio` y `cliente`.
- Paises, departamentos y ciudades para operar por ubicacion.
- Moneda y zona horaria por pais y negocio.
- Planes SaaS por limite de canchas.
- Deportes y variantes como padel, tenis, voley, futbol 5, futbol 8 y futbol 11.
- Negocios, sedes, canchas y tarifas.
- Vista publica `v_marketplace_canchas`.
- RLS habilitado en todas las tablas de la fase.
- Registro, login y restauracion de sesion con Supabase Auth.
- Rutas privadas bajo `/negocio`.
- Perfil de usuario y alta/edicion del negocio.
- Gestion de canchas y limite de plan aplicado por trigger.
- Vista de reservas del negocio en lista y calendario.

## No incluye todavia

- Reservas e invitados.
- Pagos de Stripe Connect.
- Suscripciones reales de Stripe.
- Torneos.
- WhatsApp, IA e IoT.

Esos modulos se agregan en migraciones separadas para no mezclar reglas de
negocio.

## Aplicacion

Cuando conectes el proyecto a Supabase:

```powershell
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

Para una base local:

```powershell
supabase start
supabase db reset
```

## Validaciones manuales

- `select * from public.planes;`
- `select * from public.deportes;`
- `select * from public.paises;`
- `select * from public.v_marketplace_canchas;`

La vista del marketplace puede devolver vacio hasta que exista al menos un
negocio activo con canchas activas.
