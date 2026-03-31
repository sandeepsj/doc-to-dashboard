import { useState } from 'react'
import { TableOfContents } from './TableOfContents'
import { CommentsList } from './CommentsList'
import type { HeadingSection, Comment } from '../types'

interface Props {
  headings: HeadingSection[]
  activeHeadingId: string | null
  comments: Comment[]
  onResolve: (id: string) => void
  onUnresolve: (id: string) => void
  onDelete: (id: string) => void
  onScrollToSection: (sectionIndex: number) => void
}

type Tab = 'contents' | 'comments'

export function RightPanel({ headings, activeHeadingId, comments, onResolve, onUnresolve, onDelete, onScrollToSection }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('contents')
  const unresolvedCount = comments.filter((c) => !c.resolved).length

  return (
    <aside
      className="hidden xl:flex flex-col fixed top-12 right-0 bottom-0 w-64 z-10"
      style={{
        background: 'var(--toc-bg)',
        borderLeft: '1px solid var(--toc-border)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: 'var(--toc-border)' }}>
        <button
          onClick={() => setActiveTab('contents')}
          className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors relative"
          style={{ color: activeTab === 'contents' ? 'var(--toc-active)' : 'var(--text-faint)' }}
        >
          Contents
          {activeTab === 'contents' && (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #8b5cf6, #d946ef)' }} />
          )}
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors relative flex items-center justify-center gap-1.5"
          style={{ color: activeTab === 'comments' ? 'var(--toc-active)' : 'var(--text-faint)' }}
        >
          Comments
          {unresolvedCount > 0 && (
            <span
              className="text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1"
              style={{ background: 'var(--comment-badge-bg)', color: 'var(--comment-badge-text)' }}
            >
              {unresolvedCount}
            </span>
          )}
          {activeTab === 'comments' && (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #8b5cf6, #d946ef)' }} />
          )}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'contents' ? (
        <TableOfContents headings={headings} activeHeadingId={activeHeadingId} />
      ) : (
        <CommentsList
          comments={comments}
          onResolve={onResolve}
          onUnresolve={onUnresolve}
          onDelete={onDelete}
          onScrollTo={onScrollToSection}
        />
      )}
    </aside>
  )
}
