import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMath from 'remark-math'
import { load as yamlLoad } from 'js-yaml'
import DOMPurify from 'dompurify'
import katex from 'katex'
import type { Root, Node, Parent, PhrasingContent } from 'mdast'
import type {
  DashboardSection,
  HeadingSection,
  TableSection,
  CodeSection,
  ListSection,
  BlockquoteSection,
  ImageSection,
  ParagraphSection,
  HorizontalRuleSection,
  MermaidSection,
  FrontmatterSection,
  MathSection,
  FootnotesSection,
  HtmlSection,
  GlossarySection,
  PlaceholderSection,
  ListItem,
  ParsedDocument,
  HeadingDepth,
} from '../types'

const MERMAID_LANGS = new Set([
  'mermaid', 'flowchart', 'sequencediagram', 'classdiagram',
  'erdiagram', 'statediagram', 'statediagram-v2', 'gantt',
  'pie', 'mindmap', 'timeline', 'sankey-beta', 'xychart-beta',
  'quadrantchart', 'block-beta', 'gitgraph',
])

const PLACEHOLDER_LANGS = new Set(['plantuml', 'dot', 'graphviz'])

// ── helpers ────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function textContent(nodes: PhrasingContent[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text' || n.type === 'inlineCode') return n.value
      if ('children' in n && Array.isArray((n as Parent).children))
        return textContent((n as Parent).children as PhrasingContent[])
      return ''
    })
    .join('')
}

/** Convert phrasing content to a minimal HTML string for inline rendering */
function phrasingToHtml(nodes: PhrasingContent[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return escapeHtml(n.value)
      if (n.type === 'inlineCode') return `<code>${escapeHtml(n.value)}</code>`
      if (n.type === 'strong')
        return `<strong>${phrasingToHtml((n as Parent).children as PhrasingContent[])}</strong>`
      if (n.type === 'emphasis')
        return `<em>${phrasingToHtml((n as Parent).children as PhrasingContent[])}</em>`
      if (n.type === 'delete')
        return `<del>${phrasingToHtml((n as Parent).children as PhrasingContent[])}</del>`
      if (n.type === 'link') {
        const href = (n as { url: string }).url
        const label = phrasingToHtml((n as Parent).children as PhrasingContent[])
        return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${label}</a>`
      }
      if (n.type === 'image') {
        const src = (n as { url: string; alt: string }).url
        const alt = (n as { url: string; alt: string }).alt
        return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`
      }
      if (n.type === 'break') return '<br />'
      if (n.type === 'inlineMath') {
        try {
          return katex.renderToString((n as { value: string }).value, {
            throwOnError: false, displayMode: false, output: 'html',
          })
        } catch {
          return `<code>$${escapeHtml((n as { value: string }).value)}$</code>`
        }
      }
      if (n.type === 'footnoteReference') {
        const ref = n as { identifier: string; label?: string }
        const label = ref.label ?? ref.identifier
        return `<sup class="footnote-ref">[${escapeHtml(label)}]</sup>`
      }
      if ('children' in n)
        return phrasingToHtml((n as Parent).children as PhrasingContent[])
      return ''
    })
    .join('')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function detectVariant(text: string): BlockquoteSection['variant'] {
  const lower = text.trimStart().toLowerCase()
  if (lower.startsWith('[!note]') || lower.startsWith('note:')) return 'note'
  if (lower.startsWith('[!warning]') || lower.startsWith('warning:')) return 'warning'
  if (lower.startsWith('[!tip]') || lower.startsWith('tip:')) return 'tip'
  if (lower.startsWith('[!important]') || lower.startsWith('important:')) return 'important'
  return 'default'
}

// ── list recursion ─────────────────────────────────────────────────────────

function parseListItems(
  nodes: import('mdast').ListItem[]
): ListItem[] {
  return nodes.map((item) => {
    const checked = item.checked ?? null
    let text = ''
    const children: ListItem[] = []

    for (const child of item.children) {
      if (child.type === 'paragraph') {
        text = phrasingToHtml(child.children as PhrasingContent[])
      } else if (child.type === 'list') {
        children.push(...parseListItems(child.children))
      }
    }

    return { text, checked, children }
  })
}

// ── footnote pre-pass ──────────────────────────────────────────────────────

function collectFootnotes(nodes: Node[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const node of nodes) {
    if (node.type === 'footnoteDefinition') {
      const fd = node as import('mdast').FootnoteDefinition
      const html = fd.children
        .map((c) => c.type === 'paragraph'
          ? phrasingToHtml(c.children as PhrasingContent[])
          : '')
        .join(' ')
      map.set(fd.identifier, html)
    }
  }
  return map
}

// ── glossary detection ─────────────────────────────────────────────────────

function tryExtractGlossaryEntry(
  p: import('mdast').Paragraph
): { term: string; definition: string } | null {
  const children = p.children
  if (children.length < 2) return null
  if (children[0].type !== 'strong') return null
  const second = children[1]
  if (second.type !== 'text') return null
  const secondText = second.value
  if (!secondText.startsWith(':') && !secondText.startsWith('\u2014') && !secondText.startsWith('\u2013')) return null
  const term = textContent((children[0] as Parent).children as PhrasingContent[])
  const definition = phrasingToHtml(children.slice(1) as PhrasingContent[])
    .replace(/^[:—–]\s*/, '')
  return { term, definition }
}

// ── main walker ────────────────────────────────────────────────────────────

function walkNodes(nodes: Node[], footnoteMap: Map<string, string>): DashboardSection[] {
  const sections: DashboardSection[] = []
  let glossaryBuffer: { term: string; definition: string }[] = []

  function flushGlossary() {
    if (glossaryBuffer.length > 0) {
      sections.push({ type: 'glossary', entries: glossaryBuffer } satisfies GlossarySection)
      glossaryBuffer = []
    }
  }

  for (const node of nodes) {
    if (node.type === 'yaml') {
      flushGlossary()
      try {
        const yamlNode = node as unknown as { value: string }
        const parsed = yamlLoad(yamlNode.value) as Record<string, unknown>
        if (parsed && typeof parsed === 'object') {
          sections.push({ type: 'frontmatter', data: parsed, raw: yamlNode.value } satisfies FrontmatterSection)
        }
      } catch { /* skip malformed YAML */ }
      continue
    }

    if (node.type === 'footnoteDefinition') continue // pre-collected

    if (node.type === 'heading') {
      flushGlossary()
      const h = node as import('mdast').Heading
      const text = textContent(h.children as PhrasingContent[])
      const depth = h.depth as HeadingDepth
      sections.push({
        type: 'heading',
        id: slugify(text),
        depth,
        text,
      } satisfies HeadingSection)
      continue
    }

    if (node.type === 'table') {
      flushGlossary()
      const t = node as import('mdast').Table
      const aligns = t.align ?? []
      const [headerRow, ...dataRows] = t.children

      const headers = headerRow.children.map((cell) =>
        textContent(cell.children as PhrasingContent[])
      )
      const rows = dataRows.map((row) =>
        row.children.map((cell) =>
          textContent(cell.children as PhrasingContent[])
        )
      )

      sections.push({
        type: 'table',
        headers,
        aligns: headers.map((_, i) => aligns[i] ?? null),
        rows,
      } satisfies TableSection)
      continue
    }

    if (node.type === 'code') {
      flushGlossary()
      const c = node as import('mdast').Code
      const normLang = (c.lang ?? '').toLowerCase().trim()

      if (MERMAID_LANGS.has(normLang)) {
        sections.push({ type: 'mermaid', lang: normLang, value: c.value } satisfies MermaidSection)
        continue
      }
      if (PLACEHOLDER_LANGS.has(normLang)) {
        const label = normLang === 'plantuml' ? 'PlantUML diagram'
          : normLang === 'dot' || normLang === 'graphviz' ? 'GraphViz diagram'
          : `${normLang} diagram`
        sections.push({ type: 'placeholder', label, raw: c.value } satisfies PlaceholderSection)
        continue
      }

      sections.push({
        type: 'code',
        lang: c.lang ?? null,
        value: c.value,
      } satisfies CodeSection)
      continue
    }

    if (node.type === 'math') {
      flushGlossary()
      sections.push({
        type: 'math',
        value: (node as unknown as { value: string }).value,
        display: true,
      } satisfies MathSection)
      continue
    }

    if (node.type === 'html') {
      flushGlossary()
      const clean = DOMPurify.sanitize((node as unknown as { value: string }).value, {
        ALLOWED_TAGS: ['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col', 'br', 'strong', 'em', 'code', 'span', 'p', 'a'],
        ALLOWED_ATTR: ['colspan', 'rowspan', 'scope', 'class', 'style', 'align', 'href', 'target', 'rel'],
      })
      if (clean.trim()) {
        sections.push({ type: 'html', value: clean, isTable: /<table/i.test(clean) } satisfies HtmlSection)
      }
      continue
    }

    if (node.type === 'list') {
      flushGlossary()
      const l = node as import('mdast').List
      sections.push({
        type: 'list',
        ordered: l.ordered ?? false,
        items: parseListItems(l.children),
      } satisfies ListSection)
      continue
    }

    if (node.type === 'blockquote') {
      flushGlossary()
      const bq = node as import('mdast').Blockquote
      const rawText = bq.children
        .map((child) => {
          if (child.type === 'paragraph') {
            return phrasingToHtml(child.children as PhrasingContent[])
          }
          return ''
        })
        .join('<br />')

      const variant = detectVariant(rawText.replace(/<[^>]+>/g, ''))
      // Strip the [!KEYWORD] marker from the content so it doesn't appear twice
      const content = rawText.replace(/^\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]\s*/i, '')

      sections.push({
        type: 'blockquote',
        variant,
        content,
      } satisfies BlockquoteSection)
      continue
    }

    if (node.type === 'paragraph') {
      const p = node as import('mdast').Paragraph
      // Check if paragraph is a standalone image
      if (p.children.length === 1 && p.children[0].type === 'image') {
        flushGlossary()
        const img = p.children[0] as import('mdast').Image
        sections.push({
          type: 'image',
          url: img.url,
          alt: img.alt ?? '',
          title: img.title ?? null,
        } satisfies ImageSection)
        continue
      }

      // Glossary detection
      const glossaryEntry = tryExtractGlossaryEntry(p)
      if (glossaryEntry) {
        glossaryBuffer.push(glossaryEntry)
        continue
      }

      flushGlossary()
      sections.push({
        type: 'paragraph',
        html: phrasingToHtml(p.children as PhrasingContent[]),
      } satisfies ParagraphSection)
      continue
    }

    if (node.type === 'thematicBreak') {
      flushGlossary()
      sections.push({ type: 'hr' } satisfies HorizontalRuleSection)
      continue
    }
  }

  flushGlossary()

  // Append footnotes section if any footnotes were found
  if (footnoteMap.size > 0) {
    sections.push({
      type: 'footnotes',
      items: Array.from(footnoteMap.entries()).map(([id, html]) => ({ id, html })),
    } satisfies FootnotesSection)
  }

  return sections
}

// ── public API ─────────────────────────────────────────────────────────────

export function parseMarkdown(content: string, fileName: string): ParsedDocument {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm)
    .use(remarkMath)
  const tree = processor.parse(content) as Root

  const footnoteMap = collectFootnotes(tree.children as Node[])
  const sections = walkNodes(tree.children as Node[], footnoteMap)
  const headings = sections.filter((s): s is HeadingSection => s.type === 'heading')

  return {
    id: crypto.randomUUID(),
    name: fileName.replace(/\.md$/i, ''),
    sections,
    headings,
  }
}
