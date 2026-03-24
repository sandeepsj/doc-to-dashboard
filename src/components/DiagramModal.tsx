import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  svg: string
  onClose: () => void
}

const MIN_ZOOM = 0.05
const MAX_ZOOM = 20

export function DiagramModal({ svg, onClose }: Props) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const isDragging = useRef(false)
  const dragOrigin = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const naturalSize = useRef<{ w: number; h: number } | null>(null)

  // On mount: measure SVG natural size, fit to viewport, then scale SVG element directly
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!containerRef.current || !contentRef.current) return
      const svgEl = contentRef.current.querySelector('svg')
      if (!svgEl) return

      // Make SVG fully fluid so getBoundingClientRect gives the natural rendered size
      svgEl.removeAttribute('width')
      svgEl.removeAttribute('height')
      svgEl.style.width = ''
      svgEl.style.height = ''

      const rect = svgEl.getBoundingClientRect()
      const nw = rect.width || 800
      const nh = rect.height || 600
      naturalSize.current = { w: nw, h: nh }

      const cw = containerRef.current.clientWidth  - 80
      const ch = containerRef.current.clientHeight - 80
      const fit = Math.min(cw / nw, ch / nh, 1)

      // Apply initial fit by setting actual SVG dimensions (stays crisp at any size)
      svgEl.style.width  = `${nw * fit}px`
      svgEl.style.height = `${nh * fit}px`
      setZoom(fit)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  // Whenever zoom changes, update SVG dimensions directly → re-renders as vector
  useEffect(() => {
    if (!contentRef.current || !naturalSize.current) return
    const svgEl = contentRef.current.querySelector('svg')
    if (!svgEl) return
    svgEl.style.width  = `${naturalSize.current.w * zoom}px`
    svgEl.style.height = `${naturalSize.current.h * zoom}px`
  }, [zoom])

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

  // Scroll-wheel zoom — non-passive so we can preventDefault
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor)))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    setDragging(true)
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !dragOrigin.current) return
    setPan({
      x: dragOrigin.current.px + e.clientX - dragOrigin.current.mx,
      y: dragOrigin.current.py + e.clientY - dragOrigin.current.my,
    })
  }

  const onMouseUp = () => {
    isDragging.current = false
    setDragging(false)
    dragOrigin.current = null
  }

  const zoomIn  = () => setZoom(z => Math.min(MAX_ZOOM, z * 1.25))
  const zoomOut = () => setZoom(z => Math.max(MIN_ZOOM, z / 1.25))
  const reset   = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    if (contentRef.current && naturalSize.current) {
      const svgEl = contentRef.current.querySelector('svg')
      if (svgEl) {
        svgEl.style.width  = `${naturalSize.current.w}px`
        svgEl.style.height = `${naturalSize.current.h}px`
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <button
            onClick={zoomOut}
            className="px-3 py-1.5 text-sm font-mono hover:bg-white/10 transition-colors"
            style={{ color: '#e2e0ed' }}
            title="Zoom out"
          >−</button>
          <button
            onClick={reset}
            className="px-3 py-1.5 text-xs font-mono hover:bg-white/10 transition-colors min-w-[52px] text-center"
            style={{ color: '#c4c1d8', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}
            title="Reset zoom and pan"
          >{Math.round(zoom * 100)}%</button>
          <button
            onClick={zoomIn}
            className="px-3 py-1.5 text-sm font-mono hover:bg-white/10 transition-colors"
            style={{ color: '#e2e0ed' }}
            title="Zoom in"
          >+</button>
        </div>

        <span className="text-xs ml-2 hidden sm:block" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Scroll to zoom · Drag to pan
        </span>

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

      {/* Canvas — only translate for pan, no scale transform */}
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
          <div
            ref={contentRef}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>
    </div>
  )
}
