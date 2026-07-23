# Seguridad base

## Dependencias

- Se utiliza `yarn`; npm no forma parte del flujo del proyecto.
- Las versiones directas se fijan exactamente en `package.json`.
- `yarn.lock` debe versionarse despues de la primera instalacion valida.
- CI debe ejecutar `yarn install --immutable`, `yarn npm audit --severity high`
  y `yarn build`.

## Secretos

- El frontend solo recibe `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Las variables que comienzan por `VITE_` quedan incluidas en el bundle publico.
- `service_role`, `secret keys` de Supabase, secretos de Stripe, tokens de
  WhatsApp y claves de IA viven exclusivamente en secretos de Supabase Edge
  Functions.
- Los archivos `.env` locales estan excluidos de Git.

## Datos y autorizacion

- RLS se habilita en toda tabla con datos privados o multi-tenant.
- Una politica `SELECT` publica no debe exponer columnas privadas del negocio.
- Las vistas publicas contienen solo campos necesarios para el marketplace.
- Los webhooks validan firmas y procesan eventos de forma idempotente.
- Ningun monto, comision, rol o `negocio_id` enviado por el navegador se toma
  como autoridad sin validacion del servidor.
- Las cuentas administrativas se validan en RLS y en Edge Functions. Una cuenta
  suspendida no conserva permisos de administrador ni de propietario.
- Negocios, planes y usuarios se desactivan en lugar de borrarse fisicamente
  para conservar reservas, pagos y trazabilidad.
- Las invitaciones usan la funcion `admin-users`; la clave secreta permanece en
  Supabase y nunca se incluye en el bundle de Vite.
