import { useCallback, useEffect, useRef, useState } from 'react'
import { ProjectsHome } from './components/ProjectsHome'
import { Dashboard } from './components/Dashboard'
import { parseMarkdown } from './parsers/markdownParser'
import { useTheme } from './hooks/useTheme'
import type { ParsedDocument } from './types'

interface ProjectMeta {
  id: string
  files: string[]
}

function getHashProject(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return params.get('p')
}

export default function App() {
  const { theme, toggle } = useTheme()
  const [documents, setDocuments] = useState<ParsedDocument[]>([])
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [loadingProject, setLoadingProject] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load a project by fetching its .md files and parsing them
  const loadProject = useCallback(async (projectId: string, files: string[]) => {
    setLoadingProject(true)
    try {
      const fetched = await Promise.all(
        files.map(async (f) => {
          const res = await fetch(`./projects/${projectId}/${f}`)
          const text = await res.text()
          return parseMarkdown(text, f)
        })
      )
      setDocuments(fetched)
      setActiveDocId(fetched[0]?.id ?? null)
    } catch (e) {
      console.error('Failed to load project', e)
    } finally {
      setLoadingProject(false)
    }
  }, [])

  // Called when user clicks a project card — sets hash, which triggers loadProject
  const handleOpenProject = useCallback((projectId: string, files: string[]) => {
    window.location.hash = `p=${projectId}`
    loadProject(projectId, files)
  }, [loadProject])

  // Handle hash changes (back/forward, direct URL)
  useEffect(() => {
    async function handleHash() {
      const pid = getHashProject()
      if (!pid) {
        setDocuments([])
        setActiveDocId(null)
        return
      }
      // Fetch manifest to resolve file list (needed when navigating via URL directly)
      try {
        const res = await fetch('./projects/manifest.json')
        const data = await res.json()
        const project: ProjectMeta | undefined = data.projects?.find((p: ProjectMeta) => p.id === pid)
        if (project) await loadProject(pid, project.files)
      } catch (e) {
        console.error('Failed to load project from hash', e)
      }
    }

    window.addEventListener('hashchange', handleHash)
    handleHash() // run on mount (handles direct URL access)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [loadProject])

  // Ad-hoc file upload
  const handleFiles = useCallback(async (files: File[]) => {
    // Clear any project hash when uploading ad-hoc files
    if (window.location.hash) window.location.hash = ''
    const newDocs: ParsedDocument[] = []
    for (const file of files) {
      const content = await file.text()
      newDocs.push(parseMarkdown(content, file.name))
    }
    setDocuments((prev) => {
      const names = new Set(newDocs.map((d) => d.name))
      return [...prev.filter((d) => !names.has(d.name)), ...newDocs]
    })
    setActiveDocId((prev) => prev ?? newDocs[0]?.id ?? null)
  }, [])

  function handleAddFiles() {
    fileInputRef.current?.click()
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) handleFiles(files)
    e.target.value = ''
  }

  function handleGoHome() {
    window.location.hash = ''
    setDocuments([])
    setActiveDocId(null)
  }

  if (documents.length === 0 || activeDocId === null) {
    return (
      <ProjectsHome
        onOpenProject={handleOpenProject}
        onFiles={handleFiles}
        theme={theme}
        onToggleTheme={toggle}
        loading={loadingProject}
      />
    )
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
      <Dashboard
        documents={documents}
        activeDocId={activeDocId}
        onChangeActiveDoc={setActiveDocId}
        onAddFiles={handleAddFiles}
        onGoHome={handleGoHome}
        theme={theme}
        onToggleTheme={toggle}
      />
    </>
  )
}
