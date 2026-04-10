import { useRef, useEffect, useState } from 'react'
import { useShareProject } from '../hooks/useShareProject'
import type { DrivePermissionRole } from '../types/drive'

interface Props {
  projectName: string
  folderId: string
  accessToken: string
  onClose: () => void
}

const ROLE_LABELS: Record<DrivePermissionRole, string> = {
  reader: 'Viewer',
  commenter: 'Commenter',
  writer: 'Editor',
}

export function ShareProjectModal({ projectName, folderId, accessToken, onClose }: Props) {
  const { permissions, loading, sharing, error, share, revoke, clearError } = useShareProject(accessToken, folderId)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<DrivePermissionRole>('reader')
  const [notify, setNotify] = useState(true)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleShare = async () => {
    const trimmed = email.trim()
    if (!trimmed) return
    clearError()
    setSuccessMsg(null)
    try {
      await share(trimmed, role, notify)
      setSuccessMsg(`Shared with ${trimmed} as ${ROLE_LABELS[role]}`)
      setEmail('')
    } catch {
      // error is set by hook
    }
  }

  const handleRevoke = async (permId: string, displayEmail?: string) => {
    setSuccessMsg(null)
    clearError()
    try {
      await revoke(permId)
      setSuccessMsg(`Removed access for ${displayEmail ?? 'user'}`)
    } catch {
      // error is set by hook
    }
  }

  // Filter out the owner permission — they can't be removed
  const shareablePermissions = permissions.filter((p) => p.role !== 'owner')

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-label={`Share ${projectName}`}
    >
      <div
        className="rounded-2xl w-full max-w-md shadow-xl"
        style={{ background: '#13111f', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="text-sm font-semibold text-white">
            Share "{projectName}"
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-ink-800 transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Share form */}
        <div className="px-6 pb-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleShare() }}
              placeholder="Email address"
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none min-w-0"
              style={{ background: '#1c1830', color: '#e2e0ed', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as DrivePermissionRole)}
              className="px-2 py-2 rounded-lg text-xs font-medium outline-none cursor-pointer"
              style={{ background: '#1c1830', color: '#e2e0ed', border: '1px solid rgba(255,255,255,0.1)' }}
              aria-label="Permission role"
            >
              <option value="reader">Viewer</option>
              <option value="commenter">Commenter</option>
              <option value="writer">Editor</option>
            </select>
          </div>

          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="rounded accent-violet-500"
              />
              <span className="text-[11px] text-ink-400">Notify via email</span>
            </label>
            <button
              onClick={handleShare}
              disabled={!email.trim() || sharing}
              className="px-4 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-40"
              style={{ background: '#7c3aed', color: '#ffffff' }}
            >
              {sharing ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mb-3 px-3 py-2 rounded-lg text-xs text-red-300 bg-red-900/30 border border-red-800/40">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mb-3 px-3 py-2 rounded-lg text-xs text-green-300 bg-green-900/30 border border-green-800/40">
            {successMsg}
          </div>
        )}

        {/* Current permissions */}
        <div className="px-6 pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500 mb-3">
            People with access
          </p>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <svg className="animate-spin h-4 w-4 text-violet-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : shareablePermissions.length === 0 ? (
            <p className="text-[11px] text-ink-500 py-2">Not shared with anyone yet.</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {shareablePermissions.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-ink-800/40 group">
                  <div className="min-w-0">
                    <p className="text-xs text-white truncate">
                      {p.displayName || p.emailAddress}
                    </p>
                    {p.displayName && p.emailAddress && (
                      <p className="text-[10px] text-ink-500 truncate">{p.emailAddress}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className="text-[10px] text-ink-400 capitalize">
                      {ROLE_LABELS[p.role as DrivePermissionRole] ?? p.role}
                    </span>
                    <button
                      onClick={() => handleRevoke(p.id, p.emailAddress)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-900/40 hover:text-red-300 text-ink-500 transition-all"
                      aria-label={`Remove ${p.emailAddress ?? 'user'}`}
                      title="Remove access"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
