import { useEffect, useRef, useState } from 'react'
import hljs from 'highlight.js'
import type { CodeSection } from '../../types'

interface Props {
  section: CodeSection
}

export function CodeSection({ section }: Props) {
  const { lang, value } = section
  const codeRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (codeRef.current) hljs.highlightElement(codeRef.current)
  }, [value, lang])

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #1c1830' }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5"
        style={{ background: '#13111f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex gap-1 md:gap-1.5">
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full" style={{ background: '#febc2e' }} />
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full" style={{ background: '#28c840' }} />
          </div>
          {lang && (
            <span
              className="text-[10px] md:text-[11px] font-mono font-semibold px-1.5 md:px-2 py-0.5 rounded"
              style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}
            >
              {lang}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-all active:scale-95 min-h-[32px]"
          style={{ color: copied ? '#a78bfa' : '#6b6490', background: copied ? 'rgba(139,92,246,0.1)' : 'transparent' }}
        >
          {copied ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      {/* Code */}
      <pre className="overflow-x-auto m-0 rounded-b-2xl" style={{ background: '#0c0a14' }}>
        <code
          ref={codeRef}
          className={lang ? `language-${lang}` : ''}
          style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace', fontSize: '0.78rem', lineHeight: '1.7' }}
        >
          {value}
        </code>
      </pre>
    </div>
  )
}
