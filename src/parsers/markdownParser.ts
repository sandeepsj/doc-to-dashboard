import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
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
  ListItem,
  ParsedDocument,
  HeadingDepth,
} from '../types'

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

// ── main walker ────────────────────────────────────────────────────────────

function walkNodes(nodes: Node[]): DashboardSection[] {
  const sections: DashboardSection[] = []

  for (const node of nodes) {
    if (node.type === 'heading') {
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
      const c = node as import('mdast').Code
      sections.push({
        type: 'code',
        lang: c.lang ?? null,
        value: c.value,
      } satisfies CodeSection)
      continue
    }

    if (node.type === 'list') {
      const l = node as import('mdast').List
      sections.push({
        type: 'list',
        ordered: l.ordered ?? false,
        items: parseListItems(l.children),
      } satisfies ListSection)
      continue
    }

    if (node.type === 'blockquote') {
      const bq = node as import('mdast').Blockquote
      const rawText = bq.children
        .map((child) => {
          if (child.type === 'paragraph') {
            return phrasingToHtml(child.children as PhrasingContent[])
          }
          return ''
        })
        .join('<br />')

      sections.push({
        type: 'blockquote',
        variant: detectVariant(rawText.replace(/<[^>]+>/g, '')),
        content: rawText,
      } satisfies BlockquoteSection)
      continue
    }

    if (node.type === 'paragraph') {
      const p = node as import('mdast').Paragraph
      // Check if paragraph is a standalone image
      if (
        p.children.length === 1 &&
        p.children[0].type === 'image'
      ) {
        const img = p.children[0] as import('mdast').Image
        sections.push({
          type: 'image',
          url: img.url,
          alt: img.alt ?? '',
          title: img.title ?? null,
        } satisfies ImageSection)
        continue
      }

      sections.push({
        type: 'paragraph',
        html: phrasingToHtml(p.children as PhrasingContent[]),
      } satisfies ParagraphSection)
      continue
    }

    if (node.type === 'thematicBreak') {
      sections.push({ type: 'hr' } satisfies HorizontalRuleSection)
      continue
    }
  }

  return sections
}

// ── public API ─────────────────────────────────────────────────────────────

export function parseMarkdown(content: string, fileName: string): ParsedDocument {
  const processor = unified().use(remarkParse).use(remarkGfm)
  const tree = processor.parse(content) as Root

  const sections = walkNodes(tree.children as Node[])
  const headings = sections.filter((s): s is HeadingSection => s.type === 'heading')

  return {
    id: crypto.randomUUID(),
    name: fileName.replace(/\.md$/i, ''),
    sections,
    headings,
  }
}
