import type { HeadingSection } from '../../types'

interface Props {
  section: HeadingSection
}

export function HeadingSection({ section }: Props) {
  const Tag = `h${section.depth}` as keyof React.JSX.IntrinsicElements

  if (section.depth === 1) {
    return (
      <Tag id={section.id} className="scroll-mt-20 mt-6 md:mt-8 mb-4 md:mb-5 group">
        <a href={`#${section.id}`} className="no-underline block">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-heading)' }}>
            {section.text}
          </span>
          <div className="mt-2 h-0.5 rounded-full w-10 group-hover:w-20 transition-all duration-300"
            style={{ background: 'linear-gradient(90deg, #8b5cf6, #d946ef)' }} />
        </a>
      </Tag>
    )
  }

  if (section.depth === 2) {
    return (
      <Tag id={section.id} className="scroll-mt-20 mt-5 md:mt-7 mb-2 md:mb-3 group">
        <a href={`#${section.id}`} className="no-underline inline-flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }} />
          <span className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--text-heading)' }}>{section.text}</span>
          <span className="opacity-0 group-hover:opacity-40 text-sm transition-opacity" style={{ color: 'var(--text-muted)' }}>#</span>
        </a>
      </Tag>
    )
  }

  if (section.depth === 3) {
    return (
      <Tag id={section.id} className="scroll-mt-20 mt-4 md:mt-5 mb-2 group">
        <a href={`#${section.id}`} className="no-underline inline-flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }} />
          <span className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>{section.text}</span>
          <span className="opacity-0 group-hover:opacity-40 text-xs transition-opacity" style={{ color: 'var(--text-faint)' }}>#</span>
        </a>
      </Tag>
    )
  }

  const sizes: Record<number, string> = {
    4: 'text-sm font-semibold',
    5: 'text-xs font-semibold uppercase tracking-wider',
    6: 'text-xs font-medium uppercase tracking-widest',
  }
  return (
    <Tag id={section.id} className={`scroll-mt-20 mt-3 md:mt-4 mb-1.5 ${sizes[section.depth]}`}
      style={{ color: 'var(--text-muted)' }}>
      <a href={`#${section.id}`} className="no-underline hover:underline" style={{ color: 'inherit' }}>
        {section.text}
      </a>
    </Tag>
  )
}
