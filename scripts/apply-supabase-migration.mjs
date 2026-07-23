import { readFile } from 'node:fs/promises'
import process from 'node:process'
import pg from 'pg'

const { Client } = pg

const projectRef = process.env.SUPABASE_PROJECT_REF
const password = process.env.SUPABASE_DB_PASSWORD
const migrationPath = process.argv[2]

if (!projectRef) {
  throw new Error('Missing SUPABASE_PROJECT_REF')
}

if (!password) {
  throw new Error('Missing SUPABASE_DB_PASSWORD')
}

if (!migrationPath) {
  throw new Error('Usage: node scripts/apply-supabase-migration.mjs <migration.sql>')
}

const sql = await readFile(migrationPath, 'utf8')

const retryableCodes = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH'])
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

let lastError
for (let attempt = 1; attempt <= 3; attempt += 1) {
  const client = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    query_timeout: 120000,
  })

  try {
    await client.connect()
    await client.query(sql)
    console.log(`Applied migration: ${migrationPath}`)
    lastError = undefined
    break
  } catch (error) {
    lastError = error
    const message = error instanceof Error ? error.message.toLowerCase() : ''
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
    const retryable = retryableCodes.has(code) || message.includes('timeout')
    if (!retryable || attempt === 3) break
    console.warn(`Database connection attempt ${attempt} failed. Retrying...`)
    await wait(attempt * 2000)
  } finally {
    await client.end().catch(() => {})
  }
}

if (lastError) throw lastError
