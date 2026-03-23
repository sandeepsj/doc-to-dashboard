import type { DashboardSection, ListItem } from '../types'
import type { ReadableSegment } from '../types/reader'

function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent ?? ''
}

function flattenListItems(items: ListItem[], depth = 0): string {
  return items
    .map((item) => {
      const prefix = depth > 0 ? '  '.repeat(depth) : ''
      const line = `${prefix}${stripHtml(item.text)}`
      const childLines = item.children.length > 0
        ? flattenListItems(item.children, depth + 1)
        : ''
      return childLines ? `${line}\n${childLines}` : line
    })
    .join('\n')
}

export function extractReadableSegments(sections: DashboardSection[]): ReadableSegment[] {
  const segments: ReadableSegment[] = []

  sections.forEach((section, index) => {
    let text = ''

    switch (section.type) {
      case 'heading':
        text = section.text
        break
      case 'paragraph':
        text = stripHtml(section.html)
        break
      case 'list':
        text = flattenListItems(section.items)
        break
      case 'blockquote':
        text = stripHtml(section.content)
        break
      case 'table':
        text = `Table: ${section.headers.join(', ')}. ` +
          section.rows.map((row, i) => `Row ${i + 1}: ${row.join(', ')}`).join('. ')
        break
      case 'code':
        text = `Code block${section.lang ? ` in ${section.lang}` : ''}.`
        break
      case 'image':
        text = section.alt ? `Image: ${section.alt}` : ''
        break
      case 'hr':
        return
    }

    text = text.trim()
    if (text.length > 0) {
      segments.push({ sectionIndex: index, text })
    }
  })

  return segments
}
