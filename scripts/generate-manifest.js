/**
 * Scans public/projects/ for subdirectories, collects .md file lists,
 * and writes public/projects/manifest.json.
 *
 * Run automatically via predev / prebuild in package.json.
 */
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectsDir = join(__dirname, '..', 'public', 'projects')

// Ensure the directory exists
mkdirSync(projectsDir, { recursive: true })

function toTitle(id) {
  return id
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function getDescription(dir, files) {
  for (const file of files) {
    try {
      const content = readFileSync(join(dir, file), 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.replace(/^#+\s*/, '').replace(/[*_`[\]]/g, '').trim()
        if (trimmed.length > 10) return trimmed.slice(0, 160)
      }
    } catch {
      // ignore unreadable files
    }
  }
  return ''
}

const projects = []

for (const entry of readdirSync(projectsDir).sort()) {
  if (entry === 'manifest.json' || entry.startsWith('.')) continue
  const entryPath = join(projectsDir, entry)
  if (!statSync(entryPath).isDirectory()) continue

  const files = readdirSync(entryPath)
    .filter((f) => f.endsWith('.md'))
    .sort()

  if (files.length === 0) continue

  projects.push({
    id: entry,
    name: toTitle(entry),
    description: getDescription(entryPath, files),
    fileCount: files.length,
    files,
  })
}

writeFileSync(join(projectsDir, 'manifest.json'), JSON.stringify({ projects }, null, 2))
console.log(`[manifest] ${projects.length} project(s) written to public/projects/manifest.json`)
