import { useEffect, useRef, useState } from 'react'

interface Props {
  svg: string
  onClose: () => void
}

export function DiagramModal({ svg, onClose }: Props) {
  const [pct, setPct] = useState(100)           // toolbar display only
  const [dragging, setDragging] = useState(false)

  // All transform state lives in refs — never touched by React reconciliation
  const zoomRef = useRef(1)
  const panRef  = useRef({ x: 0, y: 0 })
  const dragRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)

  // Two-layer approach: outer = translate (pan), inner = zoom (via CSS zoom — vector-crisp)
  const panLayerRef  = useRef<HTMLDivElement>(null)
  const zoomLayerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const initialized = useRef(false)

  function commitZoom(z: number) {
    const clamped = Math.max(0.05, Math.min(20, z))
    zoomRef.current = clamped
    if (zoomLayerRef.current) (zoomLayerRef.current.style as CSSStyleDeclaration & { zoom: string }).zoom = String(clamped)
    setPct(Math.round(clamped * 100))
  }

  function commitPan(x: number, y: number) {
    panRef.current = { x, y }
    if (panLayerRef.current) panLayerRef.current.style.transform = `translate(${x}px, ${y}px)`
  }

  // Fit-to-viewport once, after first paint
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const svgEl = zoomLayerRef.current?.querySelector('svg')
    if (!svgEl || !containerRef.current) return

    const rect  = svgEl.getBoundingClientRect()
    const nw = rect.width  || 800
    const nh = rect.height || 600
    const cw = containerRef.current.clientWidth  - 80
    const ch = containerRef.current.clientHeight - 80
    commitZoom(Math.min(cw / nw, ch / nh, 1))
  })  // Intentionally no deps: runs every render but short-circuits after first via flag

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

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const fn = (e: WheelEvent) => {
      e.preventDefault()
      commitZoom(zoomRef.current * (e.deltaY < 0 ? 1.12 : 1 / 1.12))
    }
    el.addEventListener('wheel', fn, { passive: false })
    return () => el.removeEventListener('wheel', fn)
  }, []) // stable — reads from ref, no closures over state

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

        <div className="flex items-center rounded-lg overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <button onClick={() => commitZoom(zoomRef.current / 1.25)}
            className="px-3 py-1.5 text-sm font-mono hover:bg-white/10 transition-colors"
            style={{ color: '#e2e0ed' }}>−</button>
          <button onClick={() => { commitZoom(1); commitPan(0, 0) }}
            className="px-3 py-1.5 text-xs font-mono hover:bg-white/10 transition-colors min-w-[52px] text-center"
            style={{ color: '#c4c1d8', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}
            title="Reset">{pct}%</button>
          <button onClick={() => commitZoom(zoomRef.current * 1.25)}
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

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden select-none flex items-center justify-center"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={e => {
          e.preventDefault()
          setDragging(true)
          dragRef.current = { mx: e.clientX, my: e.clientY, px: panRef.current.x, py: panRef.current.y }
        }}
        onMouseMove={e => {
          if (!dragRef.current) return
          commitPan(
            dragRef.current.px + e.clientX - dragRef.current.mx,
            dragRef.current.py + e.clientY - dragRef.current.my,
          )
        }}
        onMouseUp={() => { setDragging(false); dragRef.current = null }}
        onMouseLeave={() => { setDragging(false); dragRef.current = null }}
      >
        {/* Pan layer */}
        <div ref={panLayerRef} style={{ display: 'inline-block' }}>
          {/* Zoom layer — CSS zoom re-renders SVG as vector at target size, no pixel upscaling */}
          <div
            ref={zoomLayerRef}
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
