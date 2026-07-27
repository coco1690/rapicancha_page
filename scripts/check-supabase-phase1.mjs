import process from 'node:process'
import pg from 'pg'
import { databaseConnectionError, supabaseDbConfig } from './supabase-db-config.mjs'

const { Client } = pg

const client = new Client(supabaseDbConfig({
  connectionTimeoutMillis: 15000,
}))

const tables = [
  'usuarios',
  'paises',
  'departamentos',
  'ciudades',
  'planes',
  'deportes',
  'negocios',
  'sedes',
  'canchas',
  'cancha_tarifas',
]

try {
  await client.connect()

  for (const table of tables) {
    const result = await client.query(`select count(*)::int as total from public.${table}`)
    console.log(`${table}: ${result.rows[0].total}`)
  }

  const viewResult = await client.query(
    "select count(*)::int as total from information_schema.views where table_schema = 'public' and table_name = 'v_marketplace_canchas'",
  )
  console.log(`v_marketplace_canchas: ${viewResult.rows[0].total === 1 ? 'ok' : 'missing'}`)
} catch (error) {
  throw databaseConnectionError(error)
} finally {
  await client.end().catch(() => {})
}
