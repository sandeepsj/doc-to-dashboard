import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { COMMENT_KINDS } from '../types'
import type { CommentKind } from '../types'

interface Props {
  onSubmit: (text: string, kind: CommentKind) => void
  onCancel: () => void
}

export function CommentInput({ onSubmit, onCancel }: Props) {
  const [text, setText] = useState('')
  const [kind, setKind] = useState<CommentKind>('note')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed, kind)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  const activeKind = COMMENT_KINDS.find((k) => k.value === kind)!

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="mt-3 overflow-hidden"
    >
      <div
        className="rounded-xl p-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Kind selector */}
        <div className="flex gap-1.5 mb-2">
          {COMMENT_KINDS.map((k) => (
            <button
              key={k.value}
              onClick={() => setKind(k.value)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
              style={{
                background: kind === k.value ? `${k.color}18` : 'transparent',
                color: kind === k.value ? k.color : 'var(--text-faint)',
                border: `1px solid ${kind === k.value ? `${k.color}40` : 'transparent'}`,
              }}
            >
              <span className="text-[11px]">{k.icon}</span>
              {k.label}
            </button>
          ))}
        </div>

        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Add a ${activeKind.label.toLowerCase()}...`}
          rows={3}
          className="w-full resize-none text-sm rounded-lg px-3 py-2 outline-none transition-colors"
          style={{
            background: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-family-sans)',
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
            {navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'}+Enter to submit
          </span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-40"
              style={{
                background: text.trim() ? activeKind.color : 'var(--bg-subtle)',
                color: text.trim() ? '#ffffff' : 'var(--text-faint)',
              }}
            >
              Add {activeKind.label}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
