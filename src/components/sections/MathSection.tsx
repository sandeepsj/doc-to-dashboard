import { useMemo, useState } from 'react'
import katex from 'katex'
import type { MathSection as MathSectionType } from '../../types'

interface Props {
  section: MathSectionType
}

export function MathSection({ section }: Props) {
  const [showSource, setShowSource] = useState(false)

  const rendered = useMemo(() => {
    try {
      return {
        html: katex.renderToString(section.value, {
          throwOnError: false,
          displayMode: true,
          output: 'html',
        }),
        error: null,
      }
    } catch (e) {
      return { html: null, error: e instanceof Error ? e.message : 'KaTeX error' }
    }
  }, [section.value])

  if (rendered.error || !rendered.html) {
    return (
      <pre className="p-4 text-xs rounded-2xl overflow-x-auto font-mono"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
        {'$$\n'}{section.value}{'\n$$'}
      </pre>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-x-auto shadow-sm"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-end px-3 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setShowSource((v) => !v)}
          className="text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer"
          style={{ color: 'var(--text-faint)', background: 'var(--bg-subtle)' }}
        >
          {showSource ? 'rendered' : 'source'}
        </button>
      </div>
      {showSource ? (
        <pre className="p-4 text-xs overflow-x-auto font-mono" style={{ color: 'var(--text-secondary)' }}>
          {section.value}
        </pre>
      ) : (
        <div
          className="p-4 md:p-6 flex justify-center overflow-x-auto katex-display-wrapper"
          dangerouslySetInnerHTML={{ __html: rendered.html }}
        />
      )}
    </div>
  )
}
