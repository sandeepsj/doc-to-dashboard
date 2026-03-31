import type { DashboardSection } from '../types'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function flattenListItems(items: { text: string; children: { text: string; children: unknown[] }[] }[]): string {
  return items
    .map((item) => {
      const text = stripHtml(item.text)
      const childText = flattenListItems(item.children as typeof items)
      return childText ? `${text} ${childText}` : text
    })
    .join('; ')
}

export function getSectionText(section: DashboardSection): string {
  switch (section.type) {
    case 'heading':
      return section.text
    case 'paragraph':
      return stripHtml(section.html)
    case 'code':
      return section.value
    case 'list':
      return flattenListItems(section.items)
    case 'blockquote':
      return stripHtml(section.content)
    case 'table':
      return [section.headers.join(' | '), ...section.rows.map((r) => r.join(' | '))].join('\n')
    case 'image':
      return section.alt || section.url
    case 'mermaid':
      return section.value
    case 'math':
      return section.value
    case 'frontmatter':
      return section.raw
    case 'footnotes':
      return section.items.map((f) => stripHtml(f.html)).join('; ')
    case 'html':
      return stripHtml(section.value)
    case 'glossary':
      return section.entries.map((e) => `${e.term}: ${e.definition}`).join('; ')
    case 'placeholder':
      return section.label
    case 'hr':
      return '---'
    default:
      return ''
  }
}

export function getSectionSnippet(section: DashboardSection, maxLength = 120): string {
  const text = getSectionText(section)
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
