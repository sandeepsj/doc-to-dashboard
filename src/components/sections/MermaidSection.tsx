import { useEffect, useId, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { DiagramModal } from '../DiagramModal'
import type { MermaidSection as MermaidSectionType } from '../../types'

interface Props {
  section: MermaidSectionType
}

/**
 * Expand the SVG viewBox to include content that overflows the original bounds
 * (e.g. a title that extends past x=0). Only applies when getBBox returns a
 * valid bounding box larger than the current viewBox — never shrinks or zeroes it.
 */
function fixSvgViewBox(container: HTMLElement) {
  const svgEl = container.querySelector('svg') as SVGSVGElement | null
  if (!svgEl) return
  try {
    const PAD = 16
    const bbox = svgEl.getBBox()

    if (!bbox || bbox.width <= 0 || bbox.height <= 0) {
      // getBBox returns 0 for diagrams that use <foreignObject> for text (e.g. timeline).
      // Still normalize sizing: if the SVG has a valid viewBox, let CSS control dimensions.
      const vb = svgEl.viewBox?.baseVal
      if (vb && vb.width > 0 && vb.height > 0) {
        svgEl.removeAttribute('width')
        svgEl.removeAttribute('height')
        svgEl.style.width = '100%'
        svgEl.style.height = 'auto'
        svgEl.style.maxWidth = ''   // clear any Mermaid-set inline max-width
      }
      return
    }

    const vb = svgEl.viewBox.baseVal
    const newX = Math.min(vb.x, bbox.x - PAD)
    const newY = Math.min(vb.y, bbox.y - PAD)
    const newR = Math.max(vb.x + vb.width,  bbox.x + bbox.width  + PAD)
    const newB = Math.max(vb.y + vb.height, bbox.y + bbox.height + PAD)
    svgEl.setAttribute('viewBox', `${newX} ${newY} ${newR - newX} ${newB - newY}`)
    svgEl.removeAttribute('width')
    svgEl.removeAttribute('height')
    svgEl.style.width = '100%'
    svgEl.style.height = 'auto'
    svgEl.style.maxWidth = ''
  } catch {
    // getBBox() can throw for off-screen / hidden elements — safe to ignore
  }
}

/**
 * Fix known Mermaid syntax limitations before rendering.
 * - quadrantChart: strip parentheses from point labels (lexer rejects them)
 */
function sanitizeMermaid(source: string): string {
  const first = source.trimStart().toLowerCase()
  if (first.startsWith('quadrantchart')) {
    return source
      .split('\n')
      .map((line) => {
        // Data point lines look like:  Label text: [x, y]
        const m = line.match(/^(\s*)(.+?)(\s*:\s*\[[\d.,\s]+\]\s*)$/)
        if (m) {
          // Strip parentheses from label only (not from the coords bracket)
          const clean = m[2].replace(/[()]/g, '')
          return `${m[1]}${clean}${m[3]}`
        }
        return line
      })
      .join('\n')
  }
  return source
}

export function MermaidSection({ section }: Props) {
  const rawId = useId()
  const uid = `mermaid-${rawId.replace(/:/g, '')}`
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
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
        // When the code block lang IS the diagram type (e.g. ```xychart-beta),
        // section.value lacks the type as its first line — mermaid.render() needs it.
        const source = section.lang === 'mermaid'
          ? section.value
          : `${section.lang}\n${section.value}`
        const { svg: rawSvg } = await mermaid.render(uid, sanitizeMermaid(source))
        if (!cancelled) {
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
    <>
      <div
        className="rounded-2xl overflow-hidden shadow-sm group relative"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {svg ? (
          <>
            <div
              ref={wrapperRef}
              className="p-4 md:p-6 flex justify-center overflow-x-auto mermaid-wrapper"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            {/* Expand button — appears on hover */}
            <button
              onClick={() => setModalOpen(true)}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
              title="Open fullscreen (zoom & pan)"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              Expand
            </button>
          </>
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

      {modalOpen && svg && (
        <DiagramModal svg={svg} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
