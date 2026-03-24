import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  svg: string
  onClose: () => void
}

const MIN_ZOOM = 0.05
const MAX_ZOOM = 20

export function DiagramModal({ svg, onClose }: Props) {
  // Display-only state (toolbar %). Everything else is driven via direct DOM
  // manipulation to avoid React re-renders touching the SVG element mid-interaction.
  const [displayZoom, setDisplayZoom] = useState(1)
  const [dragging, setDragging] = useState(false)

  const containerRef  = useRef<HTMLDivElement>(null)
  const contentRef    = useRef<HTMLDivElement>(null)
  const naturalSize   = useRef<{ w: number; h: number } | null>(null)
  const zoomRef       = useRef(1)
  const panRef        = useRef({ x: 0, y: 0 })
  const dragOrigin    = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const isDragging    = useRef(false)

  // Apply zoom: resize SVG element directly (re-renders vector at new size — stays crisp)
  const applyZoom = useCallback((next: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
    zoomRef.current = z
    setDisplayZoom(z)
    if (!contentRef.current || !naturalSize.current) return
    const svgEl = contentRef.current.querySelector('svg') as SVGSVGElement | null
    if (!svgEl) return
    svgEl.style.width  = `${naturalSize.current.w * z}px`
    svgEl.style.height = `${naturalSize.current.h * z}px`
  }, [])

  // Apply pan: update transform directly, no state change → no React re-render
  const applyPan = useCallback((x: number, y: number) => {
    panRef.current = { x, y }
    if (contentRef.current) {
      contentRef.current.style.transform = `translate(${x}px, ${y}px)`
    }
  }, [])

  // On mount: measure natural SVG size and fit to viewport
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!containerRef.current || !contentRef.current) return
      const svgEl = contentRef.current.querySelector('svg') as SVGSVGElement | null
      if (!svgEl) return

      svgEl.removeAttribute('width')
      svgEl.removeAttribute('height')
      svgEl.style.width  = ''
      svgEl.style.height = ''

      const rect = svgEl.getBoundingClientRect()
      const nw = rect.width  || 800
      const nh = rect.height || 600
      naturalSize.current = { w: nw, h: nh }

      const cw = containerRef.current.clientWidth  - 80
      const ch = containerRef.current.clientHeight - 80
      const fit = Math.min(cw / nw, ch / nh, 1)
      applyZoom(fit)
    })
    return () => cancelAnimationFrame(frame)
  }, [applyZoom])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Scroll-wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    applyZoom(zoomRef.current * factor)
  }, [applyZoom])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Mouse drag handlers — all DOM direct, no state for pan
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    setDragging(true)
    dragOrigin.current = {
      mx: e.clientX, my: e.clientY,
      px: panRef.current.x, py: panRef.current.y,
    }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !dragOrigin.current) return
    applyPan(
      dragOrigin.current.px + e.clientX - dragOrigin.current.mx,
      dragOrigin.current.py + e.clientY - dragOrigin.current.my,
    )
  }

  const onMouseUp = () => {
    isDragging.current = false
    setDragging(false)
    dragOrigin.current = null
  }

  const zoomIn  = () => applyZoom(zoomRef.current * 1.25)
  const zoomOut = () => applyZoom(zoomRef.current / 1.25)
  const reset   = () => { applyZoom(1); applyPan(0, 0) }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}>

      {/* Top bar */}
      <div
        className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <button onClick={zoomOut} className="px-3 py-1.5 text-sm font-mono hover:bg-white/10 transition-colors" style={{ color: '#e2e0ed' }} title="Zoom out">−</button>
          <button onClick={reset}   className="px-3 py-1.5 text-xs font-mono hover:bg-white/10 transition-colors min-w-[52px] text-center" style={{ color: '#c4c1d8', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }} title="Reset">{Math.round(displayZoom * 100)}%</button>
          <button onClick={zoomIn}  className="px-3 py-1.5 text-sm font-mono hover:bg-white/10 transition-colors" style={{ color: '#e2e0ed' }} title="Zoom in">+</button>
        </div>

        <span className="text-xs ml-2 hidden sm:block" style={{ color: 'rgba(255,255,255,0.3)' }}>Scroll to zoom · Drag to pan</span>

        <button
          onClick={onClose}
          className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: '#9d98bb' }}
          title="Close (Esc)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden select-none"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div className="w-full h-full flex items-center justify-center">
          {/* Opaque background so diagram text is always readable */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              display: 'inline-block',
            }}
          >
            <div
              ref={contentRef}
              style={{ display: 'inline-block' }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>
      </div>

    </div>
  )
}
