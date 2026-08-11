import { rename, rm, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const projectId = 'nuktopommfdkqmpxtujb'
const outputPath = 'supabase/types/database.ts'
const temporaryPath = `${outputPath}.tmp`
const supabaseCli = resolve('node_modules/supabase/dist/supabase.js')

const generator = spawn(
  process.execPath,
  [
    supabaseCli,
    'gen',
    'types',
    'typescript',
    '--project-id',
    projectId,
    '--schema',
    'public',
  ],
  { stdio: ['ignore', 'pipe', 'inherit'] },
)

const chunks = []
generator.stdout.on('data', (chunk) => chunks.push(chunk))

const exitCode = await new Promise((resolve, reject) => {
  generator.once('error', reject)
  generator.once('close', resolve)
})

if (exitCode !== 0) {
  throw new Error(`Supabase type generation failed with exit code ${exitCode}`)
}

await writeFile(temporaryPath, Buffer.concat(chunks))
await rm(outputPath, { force: true })
await rename(temporaryPath, outputPath)
console.log(`Updated ${outputPath}`)
