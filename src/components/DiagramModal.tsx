import { useEffect, useRef, useState } from 'react'

interface Props {
  svg: string
  onClose: () => void
}

/**
 * Expand the SVG viewBox to include content that overflows the original bounds.
 * Same logic as MermaidSection — needed here too because the SVG string from
 * mermaid.render() may have content at negative coordinates (e.g. mindmaps).
 */
function fixSvgViewBox(container: HTMLElement) {
  const svgEl = container.querySelector('svg') as SVGSVGElement | null
  if (!svgEl) return
  try {
    const PAD = 16
    const bbox = svgEl.getBBox()
    if (!bbox || bbox.width <= 0 || bbox.height <= 0) return
    const vb = svgEl.viewBox.baseVal
    const newX = Math.min(vb.x, bbox.x - PAD)
    const newY = Math.min(vb.y, bbox.y - PAD)
    const newR = Math.max(vb.x + vb.width,  bbox.x + bbox.width  + PAD)
    const newB = Math.max(vb.y + vb.height, bbox.y + bbox.height + PAD)
    svgEl.setAttribute('viewBox', `${newX} ${newY} ${newR - newX} ${newB - newY}`)
    svgEl.removeAttribute('height')
    svgEl.style.width = '100%'
    svgEl.style.height = 'auto'
  } catch {
    // getBBox() can throw for off-screen / hidden elements — safe to ignore
  }
}

export function DiagramModal({ svg, onClose }: Props) {
  const [pct, setPct] = useState(100)
  const [dragging, setDragging] = useState(false)

  const zoomRef = useRef(1)
  const panRef  = useRef({ x: 0, y: 0 })
  const dragRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)

  // Single content layer: position absolute, transform-origin 0 0
  // transform: translate(panX, panY) scale(zoom)
  const contentRef  = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const initialized = useRef(false)

  function applyTransform() {
    if (!contentRef.current) return
    const { x, y } = panRef.current
    const z = zoomRef.current
    contentRef.current.style.transform = `translate(${x}px, ${y}px) scale(${z})`
  }

  function fitToView() {
    // Allow init effect to re-run
    initialized.current = false
    // Trigger re-render so the effect fires
    setPct(p => p)
  }

  // Fit-to-viewport + fixSvgViewBox — runs every render but short-circuits after first
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Fix SVG viewBox FIRST so that bounds (including negative-coord content) are correct
    if (contentRef.current) fixSvgViewBox(contentRef.current)

    const card = contentRef.current?.firstElementChild as HTMLElement | null
    if (!card || !containerRef.current) return

    const nw = card.offsetWidth  || 800
    const nh = card.offsetHeight || 600
    const cw = containerRef.current.clientWidth  - 80
    const ch = containerRef.current.clientHeight - 80
    const fit = Math.min(cw / nw, ch / nh, 1)

    panRef.current = {
      x: (containerRef.current.clientWidth  - nw * fit) / 2,
      y: (containerRef.current.clientHeight - nh * fit) / 2,
    }
    zoomRef.current = fit
    applyTransform()
    setPct(Math.round(fit * 100))
  })

  // Escape key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  // Lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Wheel zoom toward cursor
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const fn = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const prev = zoomRef.current
      const next = Math.max(0.05, Math.min(50, prev * (e.deltaY < 0 ? 1.12 : 1 / 1.12)))
      // Keep the content point under the cursor fixed after zoom
      panRef.current = {
        x: mx - (mx - panRef.current.x) * next / prev,
        y: my - (my - panRef.current.y) * next / prev,
      }
      zoomRef.current = next
      applyTransform()
      setPct(Math.round(next * 100))
    }
    el.addEventListener('wheel', fn, { passive: false })
    return () => el.removeEventListener('wheel', fn)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

        <div className="flex items-center rounded-lg overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <button onClick={() => {
            const prev = zoomRef.current
            const next = Math.max(0.05, prev / 1.25)
            const cx = (containerRef.current?.clientWidth  ?? 0) / 2
            const cy = (containerRef.current?.clientHeight ?? 0) / 2
            panRef.current = {
              x: cx - (cx - panRef.current.x) * next / prev,
              y: cy - (cy - panRef.current.y) * next / prev,
            }
            zoomRef.current = next
            applyTransform()
            setPct(Math.round(next * 100))
          }}
            className="px-3 py-1.5 text-sm font-mono hover:bg-white/10 transition-colors"
            style={{ color: '#e2e0ed' }}>−</button>
          <button onClick={fitToView}
            className="px-3 py-1.5 text-xs font-mono hover:bg-white/10 transition-colors min-w-[52px] text-center"
            style={{ color: '#c4c1d8', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}
            title="Fit to screen">{pct}%</button>
          <button onClick={() => {
            const prev = zoomRef.current
            const next = Math.min(50, prev * 1.25)
            const cx = (containerRef.current?.clientWidth  ?? 0) / 2
            const cy = (containerRef.current?.clientHeight ?? 0) / 2
            panRef.current = {
              x: cx - (cx - panRef.current.x) * next / prev,
              y: cy - (cy - panRef.current.y) * next / prev,
            }
            zoomRef.current = next
            applyTransform()
            setPct(Math.round(next * 100))
          }}
            className="px-3 py-1.5 text-sm font-mono hover:bg-white/10 transition-colors"
            style={{ color: '#e2e0ed' }}>+</button>
        </div>

        <span className="text-xs ml-2 hidden sm:block" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Scroll to zoom · Drag to pan
        </span>

        <button onClick={onClose}
          className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: '#9d98bb' }} title="Close (Esc)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Canvas — overflow-hidden clips the view, content is absolute-positioned */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden select-none relative"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={e => {
          e.preventDefault()
          setDragging(true)
          dragRef.current = { mx: e.clientX, my: e.clientY, px: panRef.current.x, py: panRef.current.y }
        }}
        onMouseMove={e => {
          if (!dragRef.current) return
          panRef.current = {
            x: dragRef.current.px + e.clientX - dragRef.current.mx,
            y: dragRef.current.py + e.clientY - dragRef.current.my,
          }
          applyTransform()
        }}
        onMouseUp={() => { setDragging(false); dragRef.current = null }}
        onMouseLeave={() => { setDragging(false); dragRef.current = null }}
      >
        {/* Single content layer: translate + scale with origin at top-left */}
        <div
          ref={contentRef}
          style={{ position: 'absolute', top: 0, left: 0, transformOrigin: '0 0' }}
        >
          {/* White card — sizes to SVG content after fixSvgViewBox */}
          <div
            style={{
              display: 'inline-block',
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>

    </div>
  )
}
