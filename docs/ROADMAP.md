# Roadmap por fases

## Fase 0 - Base tecnica

- Vite, React, TypeScript, Zustand y Tailwind CSS.
- React Router y estructura modular por dominio.
- Cliente Supabase preparado con variables de entorno.
- PWA con manifiesto y actualizacion automatica.
- Versiones exactas, lockfile, compilacion y auditoria de seguridad.

## Fase 1 - SaaS interno para negocios

- Registro, login, recuperacion, perfil de usuario y rutas protegidas.
- Alta y edicion del negocio con pais, ciudad, moneda y zona horaria.
- Alta, edicion y activacion de canchas por deporte.
- Limite de canchas por plan validado en PostgreSQL.
- Dashboard operativo y reservas en lista o calendario.
- Sin marketplace funcional ni chatbot.

## Fase 2 - Disponibilidad y reservas de invitados

- Calendario y busqueda por pais, ciudad, deporte y fecha.
- Disponibilidad calculada en servidor.
- Reserva temporal con expiracion y proteccion anti-solapamiento.
- Checkout sin cuenta con nombre, telefono, email y consentimiento.

## Fase 3 - Pagos y suscripciones

- Stripe Connect y division 10/90.
- Webhooks idempotentes.
- Suscripciones SaaS por limite de canchas.
- Reembolsos, cancelaciones y conciliacion.

## Fase 4 - Torneos

- Creacion de torneos por negocio.
- Equipos, jugadores, inscripciones y pagos.
- Fixture, marcadores JSONB y tabla de posiciones.

## Fase 5 - WhatsApp e IA

- Webhook de WhatsApp Business.
- Contexto conversacional con limites de retencion.
- Function Calling para consultar disponibilidad.
- Enlaces firmados hacia el checkout.

## Fase 6 - Operacion internacional e IoT

- Monedas, zonas horarias, paises y reglas regionales.
- Integraciones de cerraduras, luces y credenciales temporales.
- Observabilidad, alertas, respaldo y recuperacion.
