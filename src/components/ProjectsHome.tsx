import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ThemeToggle } from './ThemeToggle'

interface ProjectMeta {
  id: string
  name: string
  description: string
  fileCount: number
  files: string[]
}

interface Props {
  onOpenProject: (id: string, files: string[]) => void
  onFiles: (files: File[]) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  loading?: boolean
}

export function ProjectsHome({ onOpenProject, onFiles, theme, onToggleTheme, loading }: Props) {
  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [manifestLoading, setManifestLoading] = useState(true)

  useEffect(() => {
    fetch('./projects/manifest.json')
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setManifestLoading(false))
  }, [])

  const onDrop = useCallback(
    (accepted: File[]) => {
      const mdFiles = accepted.filter((f) => f.name.endsWith('.md'))
      if (mdFiles.length > 0) onFiles(mdFiles)
    },
    [onFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/markdown': ['.md'] },
    multiple: true,
  })

  return (
    <div className="min-h-[100dvh] bg-mesh flex flex-col items-center px-6 py-16 sm:py-20 relative">
      {/* Theme toggle */}
      <div className="absolute top-5 right-5">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl">

        {/* Branding */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #c026d3)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Doc<span className="text-gradient">to</span>Dashboard
          </h1>
          <p className="text-ink-400 mt-3 text-base max-w-sm mx-auto leading-relaxed">
            Transform research documents into interactive dashboards.
          </p>
        </div>

        {/* Project grid */}
        {manifestLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-5 w-5 text-violet-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : projects.length > 0 ? (
          <div className="mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 mb-5 px-1">
              Projects
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onOpenProject(p.id, p.files)}
                  disabled={loading}
                  className="group text-left rounded-2xl p-6 transition-all duration-200 border border-ink-700 bg-ink-900/60 hover:bg-ink-800/70 hover:border-violet-700/60 hover:shadow-[0_0_40px_rgba(124,58,237,0.18)] disabled:opacity-50 backdrop-blur-sm"
                >
                  {/* Icon + file count row */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(192,38,211,0.3))', border: '1px solid rgba(124,58,237,0.35)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full text-ink-400 bg-ink-800/80 border border-ink-700">
                      {p.fileCount} {p.fileCount === 1 ? 'file' : 'files'}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="font-semibold text-white text-[15px] leading-snug mb-2.5 group-hover:text-violet-200 transition-colors">
                    {p.name}
                  </div>

                  {/* Description */}
                  {p.description && (
                    <p className="text-ink-500 text-xs leading-relaxed line-clamp-3">
                      {p.description}
                    </p>
                  )}

                  {/* Open arrow */}
                  <div className="mt-5 flex items-center gap-1 text-xs text-violet-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Open project
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Upload zone */}
        <div
          {...getRootProps()}
          className={`
            rounded-2xl px-8 py-7 text-center cursor-pointer transition-all duration-300 border border-dashed
            ${isDragActive
              ? 'bg-violet-600/10 border-violet-500 shadow-[0_0_30px_rgba(124,58,237,0.2)]'
              : 'border-ink-700/70 bg-ink-900/30 hover:bg-ink-800/40 hover:border-ink-600 backdrop-blur-sm'}
          `}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-violet-300 font-semibold">Release to import!</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-ink-500">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-sm">
                {projects.length > 0 ? 'Or drop' : 'Drop'} your own{' '}
                <code className="font-mono text-xs bg-ink-800 text-ink-300 px-1.5 py-0.5 rounded">.md</code>{' '}
                files here
                <span className="hidden sm:inline"> · or <span className="text-violet-400 underline underline-offset-2">click to browse</span></span>
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-ink-900 border border-ink-700">
            <svg className="animate-spin h-4 w-4 text-violet-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-ink-300">Loading project…</span>
          </div>
        </div>
      )}
    </div>
  )
}
