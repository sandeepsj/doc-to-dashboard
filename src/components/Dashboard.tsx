import { useEffect, useRef, useState } from 'react'
import { Sidebar } from './Sidebar'
import { TableOfContents } from './TableOfContents'
import { SectionRenderer } from './SectionRenderer'
import { MobileToc } from './MobileToc'
import { ThemeToggle } from './ThemeToggle'
import { ReadingControls } from './ReadingControls'
import { useReader } from '../hooks/useReader'
import { LocalServerBackend } from '../backends/localServerBackend'
import type { ParsedDocument } from '../types'

interface Props {
  documents: ParsedDocument[]
  activeDocId: string
  onChangeActiveDoc: (id: string) => void
  onAddFiles: () => void
  onGoHome?: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Dashboard({ documents, activeDocId, onChangeActiveDoc, onAddFiles, onGoHome, theme, onToggleTheme }: Props) {
  const activeDoc = documents.find((d) => d.id === activeDocId)!
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  // Reader — uses local read-loud server directly
  const backendRef = useRef(new LocalServerBackend())
  const { status: readerStatus, activeSectionIndex, speed, voice, voices, startReading, togglePause, stopReading, setSpeed, setVoice, refreshVoices } = useReader({
    backend: backendRef.current,
    sections: activeDoc.sections,
    activeDocId,
  })

  // Scroll-spy
  useEffect(() => {
    const headingIds = activeDoc.headings.map((h) => h.id)
    if (headingIds.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) { setActiveHeadingId(entry.target.id); break }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )
    headingIds.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [activeDoc.id, activeDoc.headings])

  // Reset on doc change
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
    setActiveHeadingId(null)
    setSidebarOpen(false)
    setTocOpen(false)
  }, [activeDocId])

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen || tocOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen, tocOpen])

  // Auto-scroll to the section being read
  useEffect(() => {
    if (activeSectionIndex === null || !mainRef.current) return
    const article = mainRef.current.querySelector('article')
    if (!article) return
    const sectionEl = article.children[activeSectionIndex] as HTMLElement | undefined
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeSectionIndex])

  const currentHeading = activeDoc.headings.find((h) => h.id === activeHeadingId)

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ background: 'var(--bg-page)' }}>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left sidebar */}
      <div className={`fixed xl:static inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0 xl:flex`}>
        <Sidebar
          documents={documents}
          activeDocId={activeDocId}
          onSelectDoc={(id) => { onChangeActiveDoc(id); setSidebarOpen(false) }}
          onAddFiles={() => { onAddFiles(); setSidebarOpen(false) }}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Center column */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header
          className="h-12 flex items-center px-4 md:px-6 flex-shrink-0 backdrop-blur-sm"
          style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }}
        >
          {/* Back to projects — shown when loaded from project library */}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="mr-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/8 flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
              title="Back to projects"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span className="hidden sm:inline">Projects</span>
            </button>
          )}

          {/* Hamburger */}
          <button
            className="xl:hidden mr-3 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-[11px] font-semibold tracking-wide uppercase truncate" style={{ color: 'var(--text-faint)' }}>
              {activeDoc.name}
            </span>
            {currentHeading && (
              <>
                <svg className="hidden sm:block flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="hidden sm:block text-[13px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {currentHeading.text}
                </span>
              </>
            )}
          </div>

          {/* Contents button — mobile */}
          {activeDoc.headings.length > 0 && (
            <button
              className="xl:hidden ml-2 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-accent)', background: 'rgba(124,58,237,0.08)' }}
              onClick={() => setTocOpen(true)}
              aria-label="Open table of contents"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
              </svg>
              <span className="hidden sm:inline">Contents</span>
            </button>
          )}

          <div className="ml-2 flex items-center gap-1.5">
            <span className="hidden sm:block text-[11px] px-2 py-0.5 rounded-full font-mono" style={{ color: 'var(--text-faint)', background: 'var(--bg-subtle)' }}>
              {activeDoc.sections.length} sections
            </span>
            <ReadingControls
              status={readerStatus}
              speed={speed}
              voice={voice}
              voices={voices}
              onStart={() => startReading()}
              onTogglePause={togglePause}
              onStop={stopReading}
              onSpeedChange={setSpeed}
              onVoiceChange={setVoice}
              onRefreshVoices={refreshVoices}
            />
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </header>

        {/* Scrollable content */}
        <div ref={mainRef} className="flex-1 overflow-y-auto bg-canvas">
          <div className="xl:pr-56">
            <article className="max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 space-y-5 md:space-y-6">
              {activeDoc.sections.map((section, i) => (
                <SectionRenderer
                  key={i}
                  section={section}
                  index={i}
                  isBeingRead={activeSectionIndex === i}
                />
              ))}
              <div className="h-16" />
            </article>
          </div>
        </div>

        <TableOfContents headings={activeDoc.headings} activeHeadingId={activeHeadingId} />
      </div>

      <MobileToc open={tocOpen} headings={activeDoc.headings} activeHeadingId={activeHeadingId} onClose={() => setTocOpen(false)} />
    </div>
  )
}
