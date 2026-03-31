import { useCallback, useEffect, useRef, useState } from 'react'
import { ProjectsHome } from './components/ProjectsHome'
import { Dashboard } from './components/Dashboard'
import { parseMarkdown } from './parsers/markdownParser'
import { useTheme } from './hooks/useTheme'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'
import type { ParsedDocument } from './types'

interface ProjectMeta {
  id: string
  files: string[]
}

function getHashProject(): { type: 'local' | 'drive'; id: string } | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const local = params.get('p')
  if (local) return { type: 'local', id: local }
  const drive = params.get('drive')
  if (drive) return { type: 'drive', id: drive }
  return null
}

function AppInner() {
  const { theme, toggle } = useTheme()
  const { auth, storage } = useAuthContext()
  const [documents, setDocuments] = useState<ParsedDocument[]>([])
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [loadingProject, setLoadingProject] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load a local project by fetching its .md files
  const loadLocalProject = useCallback(async (projectId: string, files: string[]) => {
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
      setActiveProjectId(null)
    } catch (e) {
      console.error('Failed to load project', e)
    } finally {
      setLoadingProject(false)
    }
  }, [])

  // Load a Drive project
  const loadDriveProject = useCallback(async (folderId: string, files: string[]) => {
    setLoadingProject(true)
    try {
      const fetched = await Promise.all(
        files.map(async (f) => {
          const content = await storage.loadDocument(folderId, f)
          return parseMarkdown(content, f)
        })
      )
      setDocuments(fetched)
      setActiveDocId(fetched[0]?.id ?? null)
      setActiveProjectId(folderId)
    } catch (e) {
      console.error('Failed to load Drive project', e)
    } finally {
      setLoadingProject(false)
    }
  }, [storage])

  // Open a project (local or Drive)
  const handleOpenProject = useCallback((projectId: string, files: string[], isDrive?: boolean) => {
    if (isDrive) {
      window.location.hash = `drive=${projectId}`
      loadDriveProject(projectId, files)
    } else {
      window.location.hash = `p=${projectId}`
      loadLocalProject(projectId, files)
    }
  }, [loadLocalProject, loadDriveProject])

  // Handle hash changes (back/forward, direct URL)
  useEffect(() => {
    async function handleHash() {
      const hash = getHashProject()
      if (!hash) {
        setDocuments([])
        setActiveDocId(null)
        setActiveProjectId(null)
        return
      }
      if (hash.type === 'local') {
        try {
          const res = await fetch('./projects/manifest.json')
          const data = await res.json()
          const project: ProjectMeta | undefined = data.projects?.find((p: ProjectMeta) => p.id === hash.id)
          if (project) await loadLocalProject(hash.id, project.files)
        } catch (e) {
          console.error('Failed to load project from hash', e)
        }
      } else if (hash.type === 'drive' && auth.isLoggedIn) {
        try {
          const projects = await storage.listProjects()
          const project = projects.find((p) => p.id === hash.id)
          if (project) await loadDriveProject(hash.id, project.files)
        } catch (e) {
          console.error('Failed to load Drive project from hash', e)
        }
      }
    }

    window.addEventListener('hashchange', handleHash)
    handleHash()
    return () => window.removeEventListener('hashchange', handleHash)
  }, [loadLocalProject, loadDriveProject, auth.isLoggedIn, storage])

  // Ad-hoc file upload
  const handleFiles = useCallback(async (files: File[]) => {
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
    setActiveProjectId(null)
  }, [])

  // Upload to Drive
  const handleDriveUpload = useCallback(async (files: File[], projectName: string) => {
    if (!auth.isLoggedIn) return
    setLoadingProject(true)
    try {
      // Import dynamically to avoid circular deps
      const { DriveStorageProvider } = await import('./backends/driveStorageProvider')
      const driveProvider = new DriveStorageProvider(auth.accessToken!)
      const folderId = await driveProvider.createProject(projectName)

      for (const file of files) {
        const content = await file.text()
        await storage.saveDocument(folderId, file.name, content)
      }

      // Reload as Drive project
      const fileNames = files.map((f) => f.name)
      window.location.hash = `drive=${folderId}`
      await loadDriveProject(folderId, fileNames)
    } catch (e) {
      console.error('Failed to upload to Drive', e)
    } finally {
      setLoadingProject(false)
    }
  }, [auth, storage, loadDriveProject])

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
    setActiveProjectId(null)
  }

  if (documents.length === 0 || activeDocId === null) {
    return (
      <ProjectsHome
        onOpenProject={handleOpenProject}
        onFiles={handleFiles}
        onDriveUpload={handleDriveUpload}
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
        activeProjectId={activeProjectId}
        onChangeActiveDoc={setActiveDocId}
        onAddFiles={handleAddFiles}
        onGoHome={handleGoHome}
        theme={theme}
        onToggleTheme={toggle}
      />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
