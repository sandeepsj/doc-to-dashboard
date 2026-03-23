import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ThemeToggle } from './ThemeToggle'

interface Props {
  onFiles: (files: File[]) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

const features = [
  { icon: '⇅', label: 'Sortable tables' },
  { icon: '</>', label: 'Syntax highlight' },
  { icon: '⎘', label: 'Multi-file nav' },
  { icon: '◎', label: 'Scroll-spy TOC' },
]

export function FileDropzone({ onFiles, theme, onToggleTheme }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      const mdFiles = accepted.filter((f) => f.name.endsWith('.md'))
      if (mdFiles.length > 0) onFiles(mdFiles)
    },
    [onFiles]
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'text/markdown': ['.md'] },
    multiple: true,
    noClick: false,
  })

  return (
    <div className="min-h-[100dvh] bg-mesh flex items-center justify-center px-4 py-10 sm:p-8 relative">
      {/* Theme toggle — top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      {/* Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #c026d3)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Doc<span className="text-gradient">to</span>Dashboard
          </h1>
          <p className="text-ink-400 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
            Drop Markdown files and watch each section transform into a purpose-built UI.
          </p>
        </div>

        {/* Drop zone — shows full drag target on desktop, tap button on mobile */}
        <div
          {...getRootProps()}
          className={`
            relative rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-300
            border border-ink-700
            ${isDragActive
              ? 'bg-violet-600/10 border-violet-500 scale-[1.01] shadow-[0_0_40px_rgba(124,58,237,0.25)]'
              : 'bg-ink-900/60 hover:bg-ink-800/60 hover:border-ink-500 backdrop-blur-sm'}
          `}
        >
          <input {...getInputProps()} />
          <div
            className={`absolute inset-3 rounded-xl border-2 border-dashed pointer-events-none transition-colors ${isDragActive ? 'border-violet-500/60' : 'border-ink-700/60'}`}
          />

          <div className="relative">
            {isDragActive ? (
              <>
                <div className="text-4xl sm:text-5xl mb-3 animate-bounce">🎯</div>
                <p className="text-violet-300 font-semibold text-base sm:text-lg">Release to import!</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ink-800 border border-ink-700 flex items-center justify-center mx-auto mb-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9d98bb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>

                {/* Desktop: passive hint text */}
                <p className="hidden sm:block text-white font-semibold text-base mb-1">
                  Drop Markdown files here
                </p>
                <p className="hidden sm:block text-ink-400 text-sm">
                  or <span className="text-violet-400 underline underline-offset-2">click to browse</span>
                  {' '}— <code className="font-mono text-xs bg-ink-800 text-ink-300 px-1.5 py-0.5 rounded">.md</code> files
                </p>

                {/* Mobile: prominent tap-to-browse button */}
                <p className="sm:hidden text-ink-400 text-sm mb-4">Choose your Markdown files to get started</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); open() }}
                  className="sm:hidden w-full py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #c026d3)' }}
                >
                  Browse files
                </button>
              </>
            )}
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink-900/80 border border-ink-700 text-ink-300 text-xs backdrop-blur-sm"
            >
              <span className="font-mono text-violet-400 text-[11px]">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
