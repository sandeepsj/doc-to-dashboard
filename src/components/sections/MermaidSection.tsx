import { useEffect, useId, useRef, useState } from 'react'
import mermaid from 'mermaid'
import type { MermaidSection as MermaidSectionType } from '../../types'

interface Props {
  section: MermaidSectionType
}

/** After inserting SVG into the DOM, expand its viewBox to include any
 *  content (e.g. the title) that overflows the original bounds. */
function fixSvgViewBox(container: HTMLElement) {
  const svgEl = container.querySelector('svg') as SVGSVGElement | null
  if (!svgEl) return
  try {
    const PAD = 12
    const bbox = svgEl.getBBox()
    svgEl.setAttribute(
      'viewBox',
      `${bbox.x - PAD} ${bbox.y - PAD} ${bbox.width + PAD * 2} ${bbox.height + PAD * 2}`
    )
    svgEl.removeAttribute('height')
    svgEl.style.width = '100%'
    svgEl.style.height = 'auto'
  } catch {
    // getBBox() can throw for off-screen / hidden elements — safe to ignore
  }
}

export function MermaidSection({ section }: Props) {
  const rawId = useId()
  const uid = `mermaid-${rawId.replace(/:/g, '')}`
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Fix viewBox after SVG is inserted into the DOM
  useEffect(() => {
    if (svg && wrapperRef.current) {
      fixSvgViewBox(wrapperRef.current)
    }
  }, [svg])

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
          // Mermaid's output is from its own controlled renderer — safe without DOMPurify.
          // DOMPurify strips inline <style> blocks that Mermaid embeds for text colours
          // (erDiagram, classDiagram, etc.), which makes all label text invisible.
          setSvg(rawSvg)
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
          ref={wrapperRef}
          className="p-4 md:p-6 flex justify-center overflow-x-auto mermaid-wrapper"
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
