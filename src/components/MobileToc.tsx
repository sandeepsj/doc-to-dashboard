import { useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { HeadingSection } from '../types'

interface Props {
  open: boolean
  headings: HeadingSection[]
  activeHeadingId: string | null
  onClose: () => void
}

export function MobileToc({ open, headings, activeHeadingId, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    onClose()
  }, [onClose])

  // Scroll active item into view when sheet opens
  useEffect(() => {
    if (open && activeHeadingId && sheetRef.current) {
      const btn = sheetRef.current.querySelector(`[data-id="${activeHeadingId}"]`) as HTMLElement
      btn?.scrollIntoView({ block: 'nearest' })
    }
  }, [open, activeHeadingId])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="toc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm xl:hidden"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="toc-sheet"
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 xl:hidden rounded-t-3xl overflow-hidden"
            style={{ background: '#0c0a14', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '70dvh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Title bar */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#9d98bb' }}>
                On this page
              </p>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: '#6b6490', background: 'rgba(255,255,255,0.05)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* List */}
            <nav className="overflow-y-auto px-4 py-3 pb-8 space-y-0.5" style={{ maxHeight: 'calc(70dvh - 88px)' }}>
              {headings.map((h) => {
                const isActive = activeHeadingId === h.id
                const indent = (h.depth - 1) * 12
                return (
                  <button
                    key={h.id}
                    data-id={h.id}
                    onClick={() => scrollTo(h.id)}
                    className="w-full text-left py-2.5 pr-3 rounded-xl text-[13px] flex items-center gap-2.5 transition-all active:scale-[0.98]"
                    style={{
                      paddingLeft: `${indent + 12}px`,
                      background: isActive ? 'rgba(124,58,237,0.12)' : 'transparent',
                      color: isActive ? '#a78bfa' : '#6b6490',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {isActive && (
                      <span
                        className="flex-shrink-0 w-1 rounded-full"
                        style={{ height: '14px', background: 'linear-gradient(180deg, #8b5cf6, #d946ef)' }}
                      />
                    )}
                    <span className="truncate">{h.text}</span>
                  </button>
                )
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
