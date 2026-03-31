import { useState } from 'react'
import type { Comment } from '../types'
import { COMMENT_KINDS } from '../types'

interface Props {
  comments: Comment[]
  onResolve: (id: string) => void
  onUnresolve: (id: string) => void
  onDelete: (id: string) => void
  onScrollTo: (sectionIndex: number) => void
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const sectionTypeColors: Record<string, string> = {
  heading: '#8b5cf6',
  paragraph: '#6b6490',
  code: '#10b981',
  list: '#3b82f6',
  table: '#f59e0b',
  blockquote: '#ec4899',
  mermaid: '#06b6d4',
  math: '#f97316',
  image: '#14b8a6',
}

export function CommentsList({ comments, onResolve, onUnresolve, onDelete, onScrollTo }: Props) {
  const [showResolved, setShowResolved] = useState(false)

  const unresolved = comments.filter((c) => !c.resolved)
  const resolved = comments.filter((c) => c.resolved)
  const displayed = showResolved ? [...unresolved, ...resolved] : unresolved

  if (comments.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-xs font-medium" style={{ color: 'var(--text-faint)' }}>No comments yet</p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>Hover over a section and click the comment icon</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
      {resolved.length > 0 && (
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="w-full text-[10px] font-medium px-2 py-1 rounded-md transition-colors text-left"
          style={{ color: 'var(--text-faint)' }}
        >
          {showResolved ? 'Hide' : 'Show'} {resolved.length} resolved
        </button>
      )}

      {displayed.map((comment) => (
        <div
          key={comment.id}
          className="group/card rounded-xl p-3 cursor-pointer transition-all duration-150"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            opacity: comment.resolved ? 0.55 : 1,
          }}
          onClick={() => onScrollTo(comment.sectionIndex)}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5">
            {(() => {
              const kindDef = COMMENT_KINDS.find((k) => k.value === comment.kind) || COMMENT_KINDS[0]
              return (
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-1"
                  style={{ color: kindDef.color, background: `${kindDef.color}15` }}
                >
                  <span className="text-[10px]">{kindDef.icon}</span>
                  {kindDef.label}
                </span>
              )
            })()}
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded-md"
              style={{
                color: sectionTypeColors[comment.sectionType] || 'var(--text-faint)',
                background: `${sectionTypeColors[comment.sectionType] || 'var(--text-faint)'}15`,
              }}
            >
              {comment.sectionType}
            </span>
            {comment.lineNumber > 0 && (
              <span
                className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md"
                style={{ color: 'var(--text-faint)', background: 'var(--bg-subtle)' }}
              >
                Line {comment.lineNumber}
              </span>
            )}
            <span className="text-[10px] ml-auto" style={{ color: 'var(--text-faint)' }}>
              {timeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Section snippet */}
          <p
            className="text-[10.5px] leading-relaxed line-clamp-2 mb-2"
            style={{
              color: 'var(--text-faint)',
              textDecoration: comment.resolved ? 'line-through' : 'none',
            }}
          >
            {comment.sectionSnippet}
          </p>

          {/* Comment text */}
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {comment.text}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                comment.resolved ? onUnresolve(comment.id) : onResolve(comment.id)
              }}
              className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md transition-colors"
              style={{
                color: comment.resolved ? '#10b981' : 'var(--text-muted)',
                background: comment.resolved ? 'rgba(16,185,129,0.1)' : 'var(--bg-subtle)',
              }}
              title={comment.resolved ? 'Unresolve' : 'Resolve'}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {comment.resolved ? 'Resolved' : 'Resolve'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(comment.id)
              }}
              className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md transition-colors"
              style={{ color: 'var(--text-faint)', background: 'var(--bg-subtle)' }}
              title="Delete"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
