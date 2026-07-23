# Rapicancha

Base del frontend de Rapicancha con Vite, React, TypeScript, Zustand, Tailwind CSS,
React Router, Supabase JS y soporte PWA.

## Requisitos

- Node.js 22.12 o superior dentro de la rama 22, o Node.js 24
- Yarn 4.17.1 o superior, dentro de la rama 4

## Desarrollo

```powershell
corepack enable
yarn install
yarn dev
```

Las instalaciones posteriores deben respetar el archivo de bloqueo:

```powershell
yarn install --immutable
yarn typecheck
yarn build
yarn npm audit --severity high
```

## Configuracion

Crea `.env.local` a partir de `.env.example` y completa solamente las claves
publicas de Supabase. Nunca agregues `service_role`, `secret keys` de Supabase
ni secretos de Stripe al frontend.

## Estructura

- `src/app`: rutas y composicion principal en TypeScript.
- `src/features`: modulos funcionales por dominio.
- `src/shared`: componentes, layouts y paginas compartidas.
- `src/services`: clientes de servicios externos.
- `src/stores`: estado global de interfaz con Zustand.
- `src/config`: lectura centralizada de configuracion publica.
- `supabase/types`: tipos generados desde la base de datos.

Las reservas de invitados, los pagos y cualquier operacion privilegiada se
implementaran mediante Edge Functions; el navegador no escribira directamente
en tablas sensibles.

Consulta tambien:

- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/SECURITY.md`
- `docs/PHASE_1_SUPABASE.md`
