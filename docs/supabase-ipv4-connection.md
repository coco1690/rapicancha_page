# Conexion a Supabase desde una red IPv4

El endpoint directo `db.<project-ref>.supabase.co:5432` usa IPv6 por defecto. Para ejecutar migraciones desde una red sin IPv6 se debe usar el **Session pooler** de Supabase.

## Obtener los datos

1. Abrir el proyecto en Supabase.
2. Presionar `Connect`.
3. Seleccionar `Session pooler`.
4. Copiar únicamente `Host` y `User`.
5. Usar el puerto `5432`.

El usuario tiene una forma similar a:

```text
postgres.nuktopommfdkqmpxtujb
```

El host depende de la región del proyecto y tiene una forma similar a:

```text
aws-0-REGION.pooler.supabase.com
```

No se debe adivinar la región. Se debe copiar el host mostrado por Supabase.

## Configurar PowerShell

```powershell
$env:SUPABASE_PROJECT_REF = "nuktopommfdkqmpxtujb"
$env:SUPABASE_DB_HOST = "HOST_DEL_SESSION_POOLER"
$env:SUPABASE_DB_USER = "postgres.nuktopommfdkqmpxtujb"
$env:SUPABASE_DB_PORT = "5432"
$env:SUPABASE_DB_PASSWORD = Read-Host "Contrasena de base de datos Supabase" -MaskInput
```

Luego se pueden ejecutar las migraciones:

```powershell
corepack yarn db:push:twilio-whatsapp
corepack yarn db:push:country-calling-codes
```

Al terminar:

```powershell
Remove-Item Env:\SUPABASE_DB_PASSWORD -ErrorAction SilentlyContinue
```

Las variables de host y usuario se pueden mantener durante la sesion de PowerShell. No deben guardarse contrasenas en archivos del repositorio.
