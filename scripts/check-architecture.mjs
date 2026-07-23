import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative, sep } from 'node:path'

const root = process.cwd()
const sourceRoot = join(root, 'src')
const sourceExtensions = new Set(['.ts', '.tsx'])
const violations = []

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : sourceExtensions.has(extname(path)) ? [path] : []
  })
}

for (const file of walk(sourceRoot)) {
  const code = readFileSync(file, 'utf8')
  const path = relative(root, file).split(sep).join('/')
  const isDataLayer = path.startsWith('src/services/repositories/') || path.startsWith('src/services/supabase/')

  if (!isDataLayer && /(?:services\/supabase\/client|\bsupabase\s*\.)/.test(code)) {
    violations.push(`${path}: el acceso a Supabase solo se permite en repositorios.`)
  }

  if (/\buse(?:State|Reducer|SyncExternalStore)\s*\(/.test(code)) {
    violations.push(`${path}: Zustand debe ser la unica fuente de estado.`)
  }

  if (path.endsWith('.tsx') && /<(?:button|input|select|textarea)\b/.test(code)) {
    violations.push(`${path}: usa los controles compartidos de Material UI.`)
  }
}

if (violations.length > 0) {
  console.error(`Arquitectura invalida:\n${violations.map((item) => `- ${item}`).join('\n')}`)
  process.exit(1)
}

console.log('Arquitectura valida: UI sin Supabase directo y estado centralizado en Zustand.')
