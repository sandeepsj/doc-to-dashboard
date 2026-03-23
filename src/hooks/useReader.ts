import { useCallback, useEffect, useRef, useState } from 'react'
import type { DashboardSection } from '../types'
import type { ReaderBackend, ReaderStatus, ReaderCallbacks, ReadableSegment, VoiceInfo } from '../types/reader'
import { extractReadableSegments } from '../utils/textExtractor'

interface UseReaderOptions {
  backend: ReaderBackend
  sections: DashboardSection[]
  activeDocId: string
}

interface UseReaderReturn {
  status: ReaderStatus
  activeSectionIndex: number | null
  speed: number
  voice: string | null
  voices: VoiceInfo[]
  startReading: (fromSectionIndex?: number) => void
  togglePause: () => void
  stopReading: () => void
  setSpeed: (rate: number) => void
  setVoice: (voiceId: string) => void
  refreshVoices: () => void
}

export function useReader({ backend, sections, activeDocId }: UseReaderOptions): UseReaderReturn {
  const [status, setStatus] = useState<ReaderStatus>('idle')
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null)
  const [speed, setSpeedState] = useState(1.0)
  const [voice, setVoiceState] = useState<string | null>(null)
  const [voices, setVoices] = useState<VoiceInfo[]>([])

  const segmentsRef = useRef<ReadableSegment[]>([])

  // Recompute segments when sections change
  useEffect(() => {
    segmentsRef.current = extractReadableSegments(sections)
  }, [sections])

  // Fetch available voices once on mount
  useEffect(() => {
    backend.getVoices().then(setVoices).catch(() => {})
  }, [backend])

  // Auto-stop on doc change
  useEffect(() => {
    backend.stop()
    setStatus('idle')
    setActiveSectionIndex(null)
  }, [activeDocId, backend])

  // Cleanup on unmount
  useEffect(() => {
    return () => { backend.stop() }
  }, [backend])

  const startReading = useCallback((fromSectionIndex?: number) => {
    const segments = segmentsRef.current
    if (segments.length === 0) return

    let startSegment = 0
    if (fromSectionIndex !== undefined) {
      const idx = segments.findIndex(s => s.sectionIndex >= fromSectionIndex)
      if (idx !== -1) startSegment = idx
    }

    const callbacks: ReaderCallbacks = {
      onSegmentAdvance: (segIdx) => {
        setActiveSectionIndex(segments[segIdx].sectionIndex)
      },
      onFinished: () => {
        setStatus('idle')
        setActiveSectionIndex(null)
      },
      onError: (err) => {
        console.error('Reader error:', err)
        setStatus('idle')
        setActiveSectionIndex(null)
      },
    }

    backend.start(segments, startSegment, callbacks)
    setStatus('reading')
  }, [backend])

  const togglePause = useCallback(() => {
    if (status === 'reading') {
      backend.pause()
      setStatus('paused')
    } else if (status === 'paused') {
      backend.resume()
      setStatus('reading')
    }
  }, [status, backend])

  const stopReading = useCallback(() => {
    backend.stop()
    setStatus('idle')
    setActiveSectionIndex(null)
  }, [backend])

  const setSpeed = useCallback((rate: number) => {
    const clamped = Math.max(0.5, Math.min(2, rate))
    setSpeedState(clamped)
    backend.setSpeed(clamped)
  }, [backend])

  const setVoice = useCallback((voiceId: string) => {
    setVoiceState(voiceId || null)
    backend.setVoice(voiceId)
  }, [backend])

  const refreshVoices = useCallback(() => {
    backend.getVoices().then(setVoices).catch(() => {})
  }, [backend])

  return { status, activeSectionIndex, speed, voice, voices, startReading, togglePause, stopReading, setSpeed, setVoice, refreshVoices }
}
