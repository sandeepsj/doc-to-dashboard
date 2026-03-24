import type { FrontmatterSection as FrontmatterSectionType } from '../../types'

interface Props {
  section: FrontmatterSectionType
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value === null || value === undefined) return ''
  return String(value)
}

export function FrontmatterSection({ section }: Props) {
  const { data } = section
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (entries.length === 0) return null

  const title = data.title as string | undefined
  const description = (data.description ?? data.abstract ?? data.summary) as string | undefined
  const tags = (data.tags ?? data.keywords) as string[] | string | undefined

  const metaEntries = entries.filter(([k]) =>
    !['title', 'description', 'abstract', 'summary', 'tags', 'keywords'].includes(k)
  )

  return (
    <div
      className="rounded-2xl px-4 md:px-5 py-4 md:py-5 shadow-sm"
      style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-faint)' }}>
          <rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
          Document Metadata
        </span>
      </div>

      {title && (
        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-heading)' }}>{title}</p>
      )}
      {description && (
        <p className="text-xs italic mb-3" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      )}
      {tags && (
        <div className="flex flex-wrap gap-1 mb-3">
          {(Array.isArray(tags) ? tags : String(tags).split(',')).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-accent)' }}
            >
              {String(tag).trim()}
            </span>
          ))}
        </div>
      )}
      {metaEntries.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          {metaEntries.map(([key, value]) => (
            <div key={key} className="flex gap-2 items-baseline text-xs">
              <dt className="font-medium capitalize shrink-0" style={{ color: 'var(--text-muted)', minWidth: '80px' }}>
                {key.replace(/_/g, ' ')}
              </dt>
              <dd style={{ color: 'var(--text-secondary)' }}>{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
