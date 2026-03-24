import type { GlossarySection as GlossarySectionType } from '../../types'

interface Props {
  section: GlossarySectionType
}

export function GlossarySection({ section }: Props) {
  return (
    <dl className="space-y-2">
      {section.entries.map((entry, i) => (
        <div
          key={i}
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
        >
          <dt className="text-sm font-semibold" style={{ color: 'var(--text-accent)' }}>
            {entry.term}
          </dt>
          <dd
            className="text-sm mt-0.5 prose-inline"
            dangerouslySetInnerHTML={{ __html: entry.definition }}
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>
      ))}
    </dl>
  )
}
