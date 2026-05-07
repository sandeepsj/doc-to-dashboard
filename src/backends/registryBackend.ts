import type { ReadableSegment, ReaderBackend, ReaderCallbacks, VoiceInfo } from '../types/reader'

const DEFAULT_BASE_URL = 'http://localhost:4100'
const DEFAULT_MODEL = 'kokoro'

/**
 * TTS backend that talks to the models-registry's OpenAI-compatible
 * audio endpoint (POST /v1/audio/speech → WAV blob).
 *
 * Per-segment flow:
 *   1. POST /v1/audio/speech with { model, voice, input, response_format, speed }
 *   2. Play the returned WAV via an HTMLAudioElement
 *   3. On `ended`, advance to the next segment
 *
 * Voices come from the Kokoro backend's raw passthrough at
 * /backends/kokoro/voices.
 */
export class RegistryBackend implements ReaderBackend {
  private speed = 1.0
  private voice: string | null = null
  private abortController: AbortController | null = null
  private currentAudio: HTMLAudioElement | null = null

  constructor(
    private readonly baseUrl: string = ((import.meta as any).env?.VITE_REGISTRY_URL as string | undefined) ?? DEFAULT_BASE_URL,
    private readonly model: string = ((import.meta as any).env?.VITE_TTS_MODEL as string | undefined) ?? DEFAULT_MODEL,
  ) {}

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/health`, { signal: AbortSignal.timeout(2000) })
      return res.ok
    } catch {
      return false
    }
  }

  start(segments: ReadableSegment[], fromIndex: number, callbacks: ReaderCallbacks): void {
    this.abort()
    const controller = new AbortController()
    this.abortController = controller
    this.readLoop(segments, fromIndex, callbacks, controller.signal)
  }

  pause(): void {
    this.currentAudio?.pause()
  }

  resume(): void {
    this.currentAudio?.play().catch(() => {})
  }

  stop(): void {
    this.abort()
    if (this.currentAudio) {
      try { this.currentAudio.pause() } catch { /* ignore */ }
      this.currentAudio.src = ''
      this.currentAudio = null
    }
  }

  setSpeed(rate: number): void {
    this.speed = Math.max(0.25, Math.min(4, rate))
  }

  setVoice(voiceId: string): void {
    this.voice = voiceId || null
  }

  async getVoices(): Promise<VoiceInfo[]> {
    try {
      const res = await fetch(`${this.baseUrl}/backends/kokoro/voices`)
      if (!res.ok) return []
      const data = await res.json()
      const list: unknown[] = Array.isArray(data)
        ? data
        : Array.isArray((data as { voices?: unknown }).voices)
          ? (data as { voices: unknown[] }).voices
          : []
      return list
        .map((v) => {
          if (typeof v === 'string') return { id: v, name: v }
          if (typeof v === 'object' && v !== null) {
            const o = v as Record<string, unknown>
            const id = String(o.id ?? o.name ?? '')
            const name = String(o.name ?? o.id ?? '')
            return { id, name }
          }
          return { id: String(v), name: String(v) }
        })
        .filter((v) => v.id)
    } catch {
      return []
    }
  }

  // ── internal ────────────────────────────────────────────────────────

  private abort(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  private async readLoop(
    segments: ReadableSegment[],
    fromIndex: number,
    callbacks: ReaderCallbacks,
    signal: AbortSignal,
  ): Promise<void> {
    try {
      for (let i = fromIndex; i < segments.length; i++) {
        if (signal.aborted) return
        callbacks.onSegmentAdvance(i)

        const wav = await this.synthesize(segments[i].text, signal)
        if (signal.aborted) return

        await this.playBlob(wav, signal)
        if (signal.aborted) return
      }
      if (!signal.aborted) callbacks.onFinished()
    } catch (err) {
      if (signal.aborted) return
      callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  private async synthesize(text: string, signal: AbortSignal): Promise<Blob> {
    const body: Record<string, unknown> = {
      model: this.model,
      input: text,
      response_format: 'wav',
      speed: this.speed,
    }
    if (this.voice) body.voice = this.voice

    const res = await fetch(`${this.baseUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`/v1/audio/speech returned ${res.status}: ${detail}`)
    }
    return res.blob()
  }

  private playBlob(blob: Blob, signal: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      this.currentAudio = audio

      let settled = false
      const cleanup = () => {
        URL.revokeObjectURL(url)
        if (this.currentAudio === audio) this.currentAudio = null
        signal.removeEventListener('abort', onAbort)
      }
      const finish = (err?: Error) => {
        if (settled) return
        settled = true
        cleanup()
        if (err) reject(err)
        else resolve()
      }
      const onAbort = () => {
        try { audio.pause() } catch { /* ignore */ }
        audio.src = ''
        finish()
      }

      if (signal.aborted) { onAbort(); return }
      signal.addEventListener('abort', onAbort, { once: true })

      audio.addEventListener('ended', () => finish())
      audio.addEventListener('error', () => {
        if (signal.aborted) finish()
        else finish(new Error('audio playback failed'))
      })

      audio.play().catch((err) => {
        if (signal.aborted) finish()
        else finish(err instanceof Error ? err : new Error(String(err)))
      })
    })
  }
}
