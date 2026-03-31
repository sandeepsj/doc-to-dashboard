import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  message: string | null
  type?: 'error' | 'success' | 'info'
  onDismiss: () => void
  duration?: number
}

const colors = {
  error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5' },
  success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7' },
  info: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', text: '#c4b5fd' },
}

export function Toast({ message, type = 'info', onDismiss, duration = 4000 }: Props) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onDismiss])

  const c = colors[type]

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm"
          style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
