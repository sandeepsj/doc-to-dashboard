import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReaderStatus, VoiceInfo } from '../types/reader'

interface Props {
  status: ReaderStatus
  speed: number
  voice: string | null
  voices: VoiceInfo[]
  onStart: () => void
  onTogglePause: () => void
  onStop: () => void
  onSpeedChange: (rate: number) => void
  onVoiceChange: (voiceId: string) => void
  onRefreshVoices: () => void
}

const SPEED_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2]

export function ReadingControls({
  status, speed, voice, voices,
  onStart, onTogglePause, onStop, onSpeedChange, onVoiceChange, onRefreshVoices,
}: Props) {
  const [showSettings, setShowSettings] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; right: number } | null>(null)

  // Recalculate popover position when it opens
  useEffect(() => {
    if (showSettings && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPopoverPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [showSettings])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.altKey && e.key === 'r') {
        e.preventDefault()
        if (status === 'idle') onStart()
      }
      if (e.altKey && e.code === 'Space') {
        e.preventDefault()
        if (status === 'reading' || status === 'paused') onTogglePause()
      }
      if (e.key === 'Escape') {
        if (showSettings) {
          e.preventDefault()
          setShowSettings(false)
        } else if (status !== 'idle') {
          e.preventDefault()
          onStop()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [status, showSettings, onStart, onTogglePause, onStop])

  // Refresh voices when settings panel opens
  useEffect(() => {
    if (showSettings) onRefreshVoices()
  }, [showSettings, onRefreshVoices])

  const speedLabel = speed === 1 ? '1x' : `${speed}x`
  const activeVoiceName = voices.find((v) => v.id === voice)?.name

  return (
    <div className="flex items-center gap-1 relative">
      {/* ── Idle state ── */}
      {status === 'idle' && (
        <>
          <button
            onClick={onStart}
            title="Read for Me (Alt+R)"
            aria-label="Start reading document"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 010 7.07" />
              <path d="M19.07 4.93a10 10 0 010 14.14" />
            </svg>
          </button>

          {/* Settings gear — always visible */}
          <button
            ref={triggerRef}
            onClick={() => setShowSettings((s) => !s)}
            title="Voice & speed settings"
            aria-label="Voice and speed settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
            style={{
              background: showSettings ? 'rgba(124,58,237,0.15)' : 'transparent',
              color: showSettings ? 'var(--text-accent)' : 'var(--text-faint)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </>
      )}

      {/* ── Active state ── */}
      {status !== 'idle' && (
        <>
          {/* Pulsing dot */}
          {status === 'reading' && (
            <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: '#8b5cf6' }} />
          )}

          {/* Pause / Play */}
          <button
            onClick={onTogglePause}
            title={status === 'reading' ? 'Pause (Alt+Space)' : 'Resume (Alt+Space)'}
            aria-label={status === 'reading' ? 'Pause reading' : 'Resume reading'}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--text-accent)' }}
          >
            {status === 'reading' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* Settings toggle */}
          <button
            ref={triggerRef}
            onClick={() => setShowSettings((s) => !s)}
            title="Reading settings"
            aria-label="Reading settings"
            className="h-8 px-1.5 rounded-lg flex items-center gap-1 text-[11px] font-bold font-mono transition-all active:scale-95"
            style={{
              background: showSettings ? 'rgba(124,58,237,0.18)' : 'rgba(124,58,237,0.08)',
              color: 'var(--text-accent)',
              minWidth: '34px',
            }}
          >
            {speedLabel}
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Stop */}
          <button
            onClick={onStop}
            title="Stop (Esc)"
            aria-label="Stop reading"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </button>
        </>
      )}

      {/* ── Settings popover (portalled to body to escape stacking contexts) ── */}
      {showSettings && popoverPos && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setShowSettings(false)} />
          <div
            className="fixed rounded-xl shadow-lg overflow-hidden"
            style={{
              zIndex: 9999,
              top: `${popoverPos.top}px`,
              right: `${popoverPos.right}px`,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              minWidth: '230px',
            }}
          >
            {/* Voice section */}
            <div className="px-4 pt-3 pb-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-faint)' }}>
                Voice
              </label>
              {voices.length > 0 ? (
                <select
                  value={voice ?? ''}
                  onChange={(e) => onVoiceChange(e.target.value)}
                  className="w-full text-[12px] rounded-lg px-2.5 py-2 cursor-pointer"
                  style={{
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    outline: 'none',
                  }}
                >
                  <option value="">Default</option>
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-[11px] italic" style={{ color: 'var(--text-faint)' }}>
                  No voices available — is read-loud running?
                </p>
              )}
              {activeVoiceName && (
                <p className="text-[10px] mt-1 truncate" style={{ color: 'var(--text-faint)' }}>
                  Selected: {activeVoiceName}
                </p>
              )}
            </div>

            {/* Speed section */}
            <div className="px-4 pt-3 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                  Speed
                </span>
                <span className="text-[13px] font-bold font-mono" style={{ color: 'var(--text-accent)' }}>
                  {speedLabel}
                </span>
              </div>

              <input
                type="range"
                min={0.5}
                max={2}
                step={0.25}
                value={speed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="w-full"
                style={{ accentColor: '#8b5cf6' }}
              />

              <div className="flex justify-between mt-1">
                {SPEED_STEPS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSpeedChange(s)}
                    className="text-[10px] font-mono px-1 py-0.5 rounded transition-colors"
                    style={{
                      color: speed === s ? 'var(--text-accent)' : 'var(--text-faint)',
                      fontWeight: speed === s ? 700 : 400,
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
