import { motion, AnimatePresence } from 'framer-motion'
import { CommentsList } from './CommentsList'
import type { Comment } from '../types'

interface Props {
  open: boolean
  comments: Comment[]
  onResolve: (id: string) => void
  onUnresolve: (id: string) => void
  onDelete: (id: string) => void
  onScrollToSection: (sectionIndex: number) => void
  onClose: () => void
}

export function MobileComments({ open, comments, onResolve, onUnresolve, onDelete, onScrollToSection, onClose }: Props) {
  const handleScrollTo = (sectionIndex: number) => {
    onScrollToSection(sectionIndex)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="comments-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm xl:hidden"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="comments-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 xl:hidden rounded-t-3xl overflow-hidden flex flex-col"
            style={{ background: '#0c0a14', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '70dvh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Title bar */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#9d98bb' }}>
                Comments ({comments.filter((c) => !c.resolved).length})
              </p>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: '#6b6490', background: 'rgba(255,255,255,0.05)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(70dvh - 88px)' }}>
              <CommentsList
                comments={comments}
                onResolve={onResolve}
                onUnresolve={onUnresolve}
                onDelete={onDelete}
                onScrollTo={handleScrollTo}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
