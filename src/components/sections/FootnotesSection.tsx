import type { FootnotesSection as FootnotesSectionType } from '../../types'

interface Props {
  section: FootnotesSectionType
}

export function FootnotesSection({ section }: Props) {
  if (section.items.length === 0) return null

  return (
    <div
      className="rounded-2xl px-4 py-4 mt-2"
      style={{
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        borderTop: '2px solid var(--border)',
      }}
    >
      <h4
        className="text-[10px] font-bold uppercase tracking-widest mb-3"
        style={{ color: 'var(--text-faint)' }}
      >
        Footnotes
      </h4>
      <ol className="space-y-1.5">
        {section.items.map((item) => (
          <li key={item.id} id={`fn-${item.id}`} className="flex gap-2 text-xs">
            <span
              className="text-[10px] font-bold shrink-0 w-5 text-center"
              style={{ color: 'var(--text-accent)' }}
            >
              {item.id}
            </span>
            <span
              className="prose-inline"
              dangerouslySetInnerHTML={{ __html: item.html }}
              style={{ color: 'var(--text-secondary)' }}
            />
          </li>
        ))}
      </ol>
    </div>
  )
}
