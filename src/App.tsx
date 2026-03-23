import { useCallback, useRef, useState } from 'react'
import { FileDropzone } from './components/FileDropzone'
import { Dashboard } from './components/Dashboard'
import { parseMarkdown } from './parsers/markdownParser'
import { useTheme } from './hooks/useTheme'
import type { ParsedDocument } from './types'

export default function App() {
  const { theme, toggle } = useTheme()
  const [documents, setDocuments] = useState<ParsedDocument[]>([])
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: File[]) => {
    const newDocs: ParsedDocument[] = []
    for (const file of files) {
      const content = await file.text()
      const doc = parseMarkdown(content, file.name)
      newDocs.push(doc)
    }
    setDocuments((prev) => {
      // Avoid duplicate file names — replace existing
      const names = new Set(newDocs.map((d) => d.name))
      const filtered = prev.filter((d) => !names.has(d.name))
      return [...filtered, ...newDocs]
    })
    setActiveDocId((prev) => prev ?? newDocs[0]?.id ?? null)
  }, [])

  function handleAddFiles() {
    fileInputRef.current?.click()
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) handleFiles(files)
    // reset so same file can be re-imported
    e.target.value = ''
  }

  if (documents.length === 0 || activeDocId === null) {
    return <FileDropzone onFiles={handleFiles} theme={theme} onToggleTheme={toggle} />
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
        theme={theme}
        onToggleTheme={toggle}
      />
    </>
  )
}
