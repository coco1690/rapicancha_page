import process from 'node:process'

export function supabaseDbConfig(options = {}) {
  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim()
  const password = process.env.SUPABASE_DB_PASSWORD
  const connectionString = process.env.SUPABASE_DB_URL?.trim()
  const timeout = options.connectionTimeoutMillis ?? 30000

  if (connectionString) {
    return {
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: timeout,
      query_timeout: options.queryTimeoutMillis,
    }
  }

  if (!projectRef) throw new Error('Missing SUPABASE_PROJECT_REF')
  if (!password) throw new Error('Missing SUPABASE_DB_PASSWORD')

  const host = process.env.SUPABASE_DB_HOST?.trim() || `db.${projectRef}.supabase.co`
  const pooler = host.includes('.pooler.supabase.com')
  const port = Number(process.env.SUPABASE_DB_PORT?.trim() || '5432')
  const user = process.env.SUPABASE_DB_USER?.trim() || (pooler ? `postgres.${projectRef}` : 'postgres')

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SUPABASE_DB_PORT must be a valid port')
  }

  return {
    host,
    port,
    database: process.env.SUPABASE_DB_NAME?.trim() || 'postgres',
    user,
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: timeout,
    query_timeout: options.queryTimeoutMillis,
  }
}

export function databaseConnectionError(error) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  const host = process.env.SUPABASE_DB_HOST?.trim()
    || (process.env.SUPABASE_PROJECT_REF ? `db.${process.env.SUPABASE_PROJECT_REF}.supabase.co` : '')

  if (['ENOTFOUND', 'ENETUNREACH', 'EHOSTUNREACH'].includes(code) && host.startsWith('db.')) {
    return new Error(
      'El endpoint directo de Supabase no es accesible desde esta red. '
      + 'Copia el Host y User de Connect > Session pooler y define '
      + 'SUPABASE_DB_HOST y SUPABASE_DB_USER antes de repetir el comando.',
      { cause: error },
    )
  }

  return error
}
