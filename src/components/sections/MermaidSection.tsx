import { useEffect, useId, useState } from 'react'
import mermaid from 'mermaid'
import DOMPurify from 'dompurify'
import type { MermaidSection as MermaidSectionType } from '../../types'

interface Props {
  section: MermaidSectionType
}

export function MermaidSection({ section }: Props) {
  const rawId = useId()
  const uid = `mermaid-${rawId.replace(/:/g, '')}`
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      const isDark = document.documentElement.classList.contains('dark')

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: isDark ? 'dark' : 'default',
        darkMode: isDark,
      })

      try {
        const { svg: rawSvg } = await mermaid.render(uid, section.value)
        if (!cancelled) {
          setSvg(DOMPurify.sanitize(rawSvg, { USE_PROFILES: { svg: true, svgFilters: true } }))
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Render failed')
          setSvg(null)
        }
      }
    }

    render()

    const observer = new MutationObserver(() => {
      setSvg(null)
      setError(null)
      render()
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [section.value, uid])

  if (error) {
    return (
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
          <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>{section.lang}</span>
          <span className="text-xs ml-auto" style={{ color: '#ef4444' }}>Render error</span>
        </div>
        <pre className="p-4 text-xs overflow-x-auto font-mono" style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)' }}>
          {section.value}
        </pre>
        <div className="px-4 py-2 text-xs" style={{ color: '#ef4444', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)' }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {svg ? (
        <div
          className="p-4 md:p-6 flex justify-center overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="p-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-faint)' }}>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs">Rendering diagram…</span>
          </div>
        </div>
      )}
    </div>
  )
}
