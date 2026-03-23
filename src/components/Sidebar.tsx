import type { ParsedDocument } from '../types'

interface Props {
  documents: ParsedDocument[]
  activeDocId: string | null
  onSelectDoc: (id: string) => void
  onAddFiles: () => void
  onClose: () => void
}

export function Sidebar({ documents, activeDocId, onSelectDoc, onAddFiles, onClose }: Props) {
  return (
    <aside
      className="w-64 xl:w-56 flex-shrink-0 flex flex-col h-full"
      style={{ background: '#0c0a14', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #c026d3)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <span className="font-bold text-sm text-white tracking-tight">DocDash</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onAddFiles}
            title="Add files"
            className="w-7 h-7 rounded-md flex items-center justify-center text-ink-400 hover:text-white hover:bg-ink-700 transition-colors text-lg leading-none"
          >
            +
          </button>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            title="Close"
            className="xl:hidden w-7 h-7 rounded-md flex items-center justify-center text-ink-500 hover:text-white hover:bg-ink-700 transition-colors"
            aria-label="Close sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-4">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink-600">
          Files
        </p>
        <ul className="space-y-0.5">
          {documents.map((doc) => {
            const isActive = activeDocId === doc.id
            return (
              <li key={doc.id}>
                <button
                  onClick={() => onSelectDoc(doc.id)}
                  className="w-full text-left px-2.5 py-2.5 xl:py-2 rounded-lg text-[13px] flex items-center gap-2 transition-all active:scale-[0.98]"
                  style={isActive ? {
                    color: 'white',
                    fontWeight: 500,
                    background: 'linear-gradient(90deg, rgba(124,58,237,0.25), rgba(192,38,211,0.12))',
                    boxShadow: 'inset 0 0 0 1px rgba(139,92,246,0.25)',
                  } : { color: '#6b6490' }}
                >
                  <svg
                    width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke={isActive ? '#a78bfa' : '#6b6490'} strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="truncate">{doc.name}</span>
                  {isActive && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }}
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
