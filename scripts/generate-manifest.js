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

mkdirSync(projectsDir, { recursive: true })

/** Folder id → display name: strip trailing date suffix, title-case the rest */
function toTitle(id) {
  const base = id.replace(/_\d{8}$/, '')   // drop _20260324 suffix
  return base
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Try to read display name and description from the first .md file:
 * - name  → `title:` field in YAML frontmatter (if present)
 * - desc  → first real prose line (skips frontmatter block and headings)
 */
function readMeta(dir, files) {
  for (const file of files) {
    try {
      const content = readFileSync(join(dir, file), 'utf8')
      const lines = content.split('\n')

      let inFrontmatter = false
      let frontmatterDone = false
      let inCodeBlock = false
      let name = null
      const descLines = []

      for (let i = 0; i < lines.length; i++) {
        const raw = lines[i]
        const trimmed = raw.trim()

        // Detect YAML frontmatter block
        if (i === 0 && trimmed === '---') { inFrontmatter = true; continue }
        if (inFrontmatter) {
          if (trimmed === '---') { inFrontmatter = false; frontmatterDone = true; continue }
          const m = trimmed.match(/^title:\s*["']?(.+?)["']?\s*$/)
          if (m) name = m[1].trim()
          continue
        }

        // Track fenced code blocks — skip their contents
        if (trimmed.startsWith('```')) { inCodeBlock = !inCodeBlock; continue }
        if (inCodeBlock) continue

        // Skip blank lines, headings, blockquotes, rules, HTML, tables
        if (!trimmed || trimmed.startsWith('#')) continue
        if (/^(>|---|===|<!--|\|)/.test(trimmed)) continue
        if (!frontmatterDone && /^\w[\w\s]+:\s+\S/.test(trimmed)) continue

        const clean = trimmed.replace(/[*_`[\]()>]/g, '').replace(/\s+/g, ' ').trim()
        if (clean.length > 15) { descLines.push(clean); break }
      }

      const desc = descLines.join(' ').slice(0, 160)
      return { name, desc }
    } catch {
      // ignore unreadable files
    }
  }
  return { name: null, desc: '' }
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

  const { name: fmName, desc } = readMeta(entryPath, files)

  projects.push({
    id: entry,
    name: fmName ?? toTitle(entry),
    description: desc,
    fileCount: files.length,
    files,
  })
}

writeFileSync(join(projectsDir, 'manifest.json'), JSON.stringify({ projects }, null, 2))
console.log(`[manifest] ${projects.length} project(s) written to public/projects/manifest.json`)
