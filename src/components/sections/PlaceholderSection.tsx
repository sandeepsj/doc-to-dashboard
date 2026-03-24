import type { PlaceholderSection as PlaceholderSectionType } from '../../types'

interface Props {
  section: PlaceholderSectionType
}

export function PlaceholderSection({ section }: Props) {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div
        className="px-4 py-2 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-faint)' }}>
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>{section.label}</span>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          rendering not yet supported
        </span>
      </div>
      <pre
        className="p-4 text-xs overflow-x-auto font-mono"
        style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
      >
        {section.raw}
      </pre>
    </div>
  )
}
