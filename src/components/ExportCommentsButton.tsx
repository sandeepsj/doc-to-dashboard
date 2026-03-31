import { useState, useRef, useEffect } from 'react'

interface Props {
  onExport: (unresolvedOnly: boolean) => string
  commentCount: number
  docName: string
}

export function ExportCommentsButton({ onExport, commentCount, docName }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (commentCount === 0) return null

  const handleExport = (unresolvedOnly: boolean) => {
    const text = onExport(unresolvedOnly)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docName.replace(/\.[^.]+$/, '')}-comments.txt`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors"
        style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}
        title="Export comments"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span className="hidden sm:inline">Export</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-lg py-1 z-50 min-w-[140px] shadow-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => handleExport(true)}
            className="w-full text-left px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/8"
            style={{ color: 'var(--text-primary)' }}
          >
            Export unresolved
          </button>
          <button
            onClick={() => handleExport(false)}
            className="w-full text-left px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/8"
            style={{ color: 'var(--text-muted)' }}
          >
            Export all
          </button>
        </div>
      )}
    </div>
  )
}
