import type { HtmlSection as HtmlSectionType } from '../../types'

interface Props {
  section: HtmlSectionType
}

export function HtmlSection({ section }: Props) {
  return (
    <div
      className={`overflow-x-auto rounded-2xl shadow-sm ${section.isTable ? 'html-table-wrapper' : ''}`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      dangerouslySetInnerHTML={{ __html: section.value }}
    />
  )
}
