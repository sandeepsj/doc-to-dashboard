import { useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  saving: boolean
  dirty: boolean
}

export function MarkdownEditor({ value, onChange, onSave, saving, dirty }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd+S to save
    if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSave()
    }

    // Tab inserts spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = ref.current!
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)
      // Restore cursor position
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
            MARKDOWN
          </span>
          {dirty && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: 'var(--comment-indicator)', background: 'var(--comment-bg)' }}>
              Unsaved changes
            </span>
          )}
          {saving && (
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-faint)' }}>
              Saving...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
            {navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'}+S to save
          </span>
          <button
            onClick={onSave}
            disabled={!dirty || saving}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-40"
            style={{
              background: dirty ? 'var(--text-accent)' : 'var(--bg-subtle)',
              color: dirty ? '#ffffff' : 'var(--text-faint)',
            }}
          >
            Save
          </button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full resize-none px-6 py-4 outline-none"
        style={{
          background: 'var(--bg-page)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-family-mono)',
          fontSize: '13px',
          lineHeight: '1.8',
          tabSize: 2,
        }}
        spellCheck={false}
      />
    </div>
  )
}
