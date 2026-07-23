# Arquitectura de Rapicancha

## Principios

- El frontend se organiza por dominios funcionales, no por tipos de archivo.
- El codigo de aplicacion se escribe en TypeScript; no se agregan nuevos
  modulos `.js` o `.jsx`.
- Supabase aplica seguridad mediante RLS; la interfaz nunca sustituye esas reglas.
- Las operaciones privilegiadas se ejecutan en Edge Functions.
- Las reservas de invitados usan referencias publicas de alta entropia y funciones
  controladas; no requieren una sesion de Supabase Auth.
- Los importes se manejan en unidades menores y siempre incluyen moneda.
- Las fechas operativas se guardan como instantes UTC junto con la zona horaria
  del negocio.

## Carpetas

```text
src/
  app/                  Rutas y composicion principal
  config/               Variables publicas y configuracion
  features/             Modulos por dominio
    admin/
    bookings/
    business-dashboard/
    businesses/
    marketplace/
  services/             Clientes de Supabase y servicios externos
  shared/               Layouts, componentes y paginas reutilizables
  stores/               Estado global de interfaz con Zustand
supabase/
  types/                Tipos generados desde la base de datos
```

Cada modulo puede crecer internamente con `components`, `hooks`, `services` y
`schemas` sin cambiar las rutas de otros dominios.

## Limites de responsabilidad

El navegador puede leer datos publicos mediante vistas o RPC expresamente
autorizadas. No puede confirmar pagos, calcular comisiones, crear reservas
definitivas ni utilizar claves `service_role`.

Supabase Edge Functions se encargara de checkout de invitados, Stripe Connect,
webhooks, WhatsApp y automatizacion IoT. PostgreSQL conserva las restricciones
de integridad, anti-solapamiento y aislamiento multi-tenant.

El cliente de Supabase se instancia con `Database` desde
`supabase/types/database.ts`; las consultas nuevas deben apoyarse en esos tipos
o en los aliases definidos en `src/services/supabase/tables.ts`.
