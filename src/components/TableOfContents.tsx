import { useCallback } from 'react'
import type { HeadingSection } from '../types'

interface Props {
  headings: HeadingSection[]
  activeHeadingId: string | null
}

export function TableOfContents({ headings, activeHeadingId }: Props) {
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (headings.length === 0) return null

  return (
    <div className="flex-1 overflow-y-auto py-8 px-5">
      <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-faint)' }}>
        On this page
      </p>

      <nav className="space-y-px">
        {headings.map((h, i) => {
          const isActive = activeHeadingId === h.id
          const isTopLevel = h.depth === 1
          const topGap = isTopLevel && i > 0 ? 'mt-4' : ''
          const indent = Math.max(0, h.depth - 2) * 10

          return (
            <button
              key={h.id}
              onClick={() => scrollTo(h.id)}
              style={{ paddingLeft: `${indent}px` }}
              className={`group w-full text-left flex items-center gap-1.5 transition-all duration-150 rounded-md pr-1 ${topGap} ${isTopLevel ? 'py-1.5' : 'py-1'}`}
            >
              <span
                className="flex-shrink-0 rounded-full transition-all duration-200"
                style={{
                  width: '2px',
                  height: isActive ? '14px' : '6px',
                  background: isActive ? 'linear-gradient(180deg, #8b5cf6, #d946ef)' : 'transparent',
                  border: isActive ? 'none' : '1px solid transparent',
                }}
              />
              <span
                className="flex-1 truncate transition-colors duration-150 leading-snug"
                style={{
                  fontSize: isTopLevel ? '12px' : '11.5px',
                  fontWeight: isTopLevel ? 600 : isActive ? 500 : 400,
                  color: isActive ? 'var(--toc-active)' : isTopLevel ? 'var(--toc-label)' : 'var(--toc-item)',
                }}
              >
                {h.text}
              </span>
              <svg
                width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0"
                style={{ color: isActive ? '#8b5cf6' : 'var(--text-faint)', transition: 'opacity 150ms, transform 150ms' }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
