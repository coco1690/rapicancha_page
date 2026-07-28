# WhatsApp transaccional para reservas

## Plantillas Twilio

Crear dos plantillas de categoria `Utility` y lenguaje espanol en Twilio Content Template Builder.

### Confirmacion para el cliente

```text
Hola {{1}}. Tu reserva fue confirmada.

ID: {{2}}
Club: {{3}}
Cancha: {{4}}
Fecha: {{5}}
Horario: {{6}}

Presenta este ID al llegar al club.
```

Guardar el Content SID `HX...` como:

```text
TWILIO_CUSTOMER_BOOKING_CONTENT_SID
```

### Confirmacion para el club

```text
Nueva reserva confirmada.

ID: {{1}}
Cliente: {{2}}
Telefono: {{3}}
Cancha: {{4}}
Fecha: {{5}}
Horario: {{6}}
```

Guardar el Content SID `HX...` como:

```text
TWILIO_CLUB_BOOKING_CONTENT_SID
```

Rapicancha usa el documento solo en memoria para crear el checkout de ePayco. No lo guarda en reservas, `localStorage`, payloads de auditoria, mensajes, notificaciones ni logs.

## Secrets de Supabase

Configurar los siguientes secrets directamente en Supabase. No usar variables `VITE_*`.

```text
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM
TWILIO_MESSAGING_SERVICE_SID
TWILIO_CUSTOMER_BOOKING_CONTENT_SID
TWILIO_CLUB_BOOKING_CONTENT_SID
TWILIO_STATUS_CALLBACK_URL
WHATSAPP_WORKER_SECRET
```

Solo se necesita uno entre `TWILIO_WHATSAPP_FROM` y `TWILIO_MESSAGING_SERVICE_SID`.

La URL de callback debe ser exactamente:

```text
https://nuktopommfdkqmpxtujb.supabase.co/functions/v1/twilio-message-status
```

`WHATSAPP_WORKER_SECRET` debe ser un valor aleatorio largo y distinto de las credenciales de Twilio.

## Orden de despliegue

```powershell
corepack yarn db:push:twilio-whatsapp
corepack yarn db:push:country-calling-codes
corepack yarn functions:deploy:create-booking-checkout
corepack yarn functions:deploy:send-whatsapp-notifications
corepack yarn functions:deploy:twilio-message-status
corepack yarn functions:deploy:epayco-webhook
corepack yarn functions:deploy:reconcile-epayco-payment
```

## Reintentos automáticos

Crear en Supabase Vault:

```sql
select vault.create_secret(
  'https://nuktopommfdkqmpxtujb.supabase.co',
  'project_url'
);

select vault.create_secret(
  'REEMPLAZAR_CON_EL_MISMO_WHATSAPP_WORKER_SECRET',
  'whatsapp_worker_secret'
);
```

Programar el worker cada minuto:

```sql
select cron.schedule(
  'dispatch-whatsapp-notifications',
  '* * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'project_url'
    ) || '/functions/v1/send-whatsapp-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-rapicancha-worker-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'whatsapp_worker_secret'
      )
    ),
    body := '{"limit": 20}'::jsonb
  );
  $$
);
```

Antes de volver a ejecutar el bloque, revisar `cron.job` para evitar crear el mismo trabajo dos veces.

## Prueba

1. Configurar en el perfil del club un numero E.164, por ejemplo `+573148632751`.
2. Activar `Notificaciones WhatsApp`.
3. En Twilio Sandbox, verificar que cliente y club hayan unido sus numeros al Sandbox.
4. Crear una reserva y aceptar la confirmacion transaccional por WhatsApp.
5. Aprobar el pago en ePayco Sandbox.
6. Revisar `whatsapp_notificaciones`.
7. Confirmar la transicion `queued -> sent -> delivered -> read`.

El estado del mensaje no modifica el estado del pago ni de la reserva.

Los indicativos se administran en `Admin > Ubicaciones > Paises`. Los formularios muestran la bandera y el indicativo por separado, pero guardan el telefono completo en formato E.164.

## Diagnostico rapido

- `pending`, `intentos = 0` y `twilio_message_sid = null`: el worker no fue invocado. Revisar `WHATSAPP_WORKER_SECRET`, el despliegue sin verificacion JWT y los logs de `epayco-webhook`.
- `pending` o `failed`, `intentos >= 1` y `error_codigo` informado: el worker alcanzo Twilio y se debe corregir el error registrado.
- `queued` con `twilio_message_sid`: Twilio acepto el mensaje; los callbacks posteriores deben actualizarlo a `sent`, `delivered` o `read`.
- La falta de saldo solo puede diagnosticarse despues de que `intentos` sea mayor que cero y Twilio devuelva su codigo de error.
