import type { BlockquoteSection } from '../../types'

const variantConfig = {
  note: {
    label: 'Note',
    gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    bg: 'var(--bq-note-bg)', border: 'var(--bq-note-border)',
    text: 'var(--bq-note-text)', labelColor: 'var(--bq-note-label)',
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  },
  warning: {
    label: 'Warning',
    gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
    bg: 'var(--bq-warn-bg)', border: 'var(--bq-warn-border)',
    text: 'var(--bq-warn-text)', labelColor: 'var(--bq-warn-label)',
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  },
  tip: {
    label: 'Tip',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    bg: 'var(--bq-tip-bg)', border: 'var(--bq-tip-border)',
    text: 'var(--bq-tip-text)', labelColor: 'var(--bq-tip-label)',
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>,
  },
  important: {
    label: 'Important',
    gradient: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
    bg: 'var(--bq-imp-bg)', border: 'var(--bq-imp-border)',
    text: 'var(--bq-imp-text)', labelColor: 'var(--bq-imp-label)',
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  },
  default: {
    label: '',
    gradient: '',
    bg: 'var(--bq-def-bg)', border: 'var(--bq-def-border)',
    text: 'var(--bq-def-text)', labelColor: '',
    icon: null,
  },
}

interface Props { section: BlockquoteSection }

export function BlockquoteSection({ section }: Props) {
  const cfg = variantConfig[section.variant]
  return (
    <div className="rounded-2xl px-4 md:px-5 py-3.5 md:py-4 shadow-sm"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {section.variant !== 'default' ? (
        <div className="flex items-center gap-2 mb-2 md:mb-2.5">
          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-white"
            style={{ background: cfg.gradient }}>
            {cfg.icon}
          </div>
          <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest" style={{ color: cfg.labelColor }}>
            {cfg.label}
          </span>
        </div>
      ) : (
        <div className="text-3xl md:text-4xl leading-none font-serif mb-1" style={{ color: 'var(--bq-def-quote)' }}>"</div>
      )}
      <div className="text-[13px] md:text-[13.5px] leading-relaxed" style={{ color: cfg.text }}
        dangerouslySetInnerHTML={{ __html: section.content }} />
    </div>
  )
}
