import process from 'node:process'
import pg from 'pg'

const { Client } = pg

const projectRef = process.env.SUPABASE_PROJECT_REF
const password = process.env.SUPABASE_DB_PASSWORD

if (!projectRef) {
  throw new Error('Missing SUPABASE_PROJECT_REF')
}

if (!password) {
  throw new Error('Missing SUPABASE_DB_PASSWORD')
}

const client = new Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
})

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
} finally {
  await client.end().catch(() => {})
}

