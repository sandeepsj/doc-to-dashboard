import type { ParagraphSection } from '../../types'

interface Props {
  section: ParagraphSection
}

export function ParagraphSection({ section }: Props) {
  return (
    <p
      className="prose-inline leading-relaxed text-[14px]"
      style={{ color: 'var(--text-primary)' }}
      dangerouslySetInnerHTML={{ __html: section.html }}
    />
  )
}
