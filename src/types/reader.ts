/** A readable chunk mapped back to its source section index */
export interface ReadableSegment {
  sectionIndex: number
  text: string
}

/** Playback state machine: idle → reading ↔ paused → idle */
export type ReaderStatus = 'idle' | 'reading' | 'paused'

/** Events the backend emits to the hook */
export interface ReaderCallbacks {
  onSegmentAdvance: (segmentIndex: number) => void
  onFinished: () => void
  onError: (error: Error) => void
}

export interface VoiceInfo {
  id: string
  name: string
}

/**
 * Plug-and-play TTS backend interface.
 * Implementations: local TTS server, Web Speech API, etc.
 */
export interface ReaderBackend {
  start(segments: ReadableSegment[], fromIndex: number, callbacks: ReaderCallbacks): void
  pause(): void
  resume(): void
  stop(): void
  /** Set reading speed. 1.0 = normal, 0.5 = half speed, 2.0 = double speed */
  setSpeed(rate: number): void
  /** Set voice by id. Applies to subsequent /speak calls. */
  setVoice(voiceId: string): void
  /** Fetch available voices from the backend */
  getVoices(): Promise<VoiceInfo[]>
  isAvailable(): Promise<boolean>
}
