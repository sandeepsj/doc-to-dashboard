import type { ReadableSegment, ReaderBackend, ReaderCallbacks, VoiceInfo } from '../types/reader'

const BASE_URL = 'http://localhost:5050'
const POLL_INTERVAL = 300 // ms
const BASE_RATE = 175 // default WPM at 1x speed

/**
 * TTS backend using the read-loud local HTTP server.
 *
 * Per-segment flow (matches the JS example in the README):
 *   1. POST /speak with { text, rate, request_id }
 *   2. Poll GET /requests/<request_id> until status = "completed" | "stopped"
 *   3. Advance to next segment
 */
export class LocalServerBackend implements ReaderBackend {
  private speed = 1.0
  private voice: string | null = null
  private abortController: AbortController | null = null

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(2000) })
      if (!res.ok) return false
      const data = await res.json()
      return data.ok === true
    } catch {
      return false
    }
  }

  start(segments: ReadableSegment[], fromIndex: number, callbacks: ReaderCallbacks): void {
    // Abort any previous reading loop
    this.abort()

    const controller = new AbortController()
    this.abortController = controller

    // Fire-and-forget the async reading loop
    this.readLoop(segments, fromIndex, callbacks, controller.signal)
  }

  pause(): void {
    fetch(`${BASE_URL}/pause`, { method: 'POST' }).catch(() => {})
  }

  resume(): void {
    fetch(`${BASE_URL}/resume`, { method: 'POST' }).catch(() => {})
  }

  stop(): void {
    this.abort()
    fetch(`${BASE_URL}/stop`, { method: 'POST' }).catch(() => {})
  }

  setSpeed(rate: number): void {
    this.speed = Math.max(0.25, Math.min(3, rate))
  }

  setVoice(voiceId: string): void {
    this.voice = voiceId || null
  }

  async getVoices(): Promise<VoiceInfo[]> {
    try {
      const res = await fetch(`${BASE_URL}/voices`)
      if (!res.ok) return []
      const data = await res.json()
      // Response is { backend, voices: [...] }
      const list: unknown[] = Array.isArray(data) ? data : Array.isArray(data.voices) ? data.voices : []
      return list.map((v: unknown) => {
        if (typeof v === 'string') return { id: v, name: v }
        if (typeof v === 'object' && v !== null) {
          const obj = v as Record<string, unknown>
          const name = String(obj.name ?? '')
          return { id: name, name }
        }
        return { id: String(v), name: String(v) }
      }).filter((v) => v.id)
    } catch {
      return []
    }
  }

  // ── Internal ────────────────────────────────────────────────────────

  private abort(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /**
   * Async loop: send one segment at a time, wait for completion, then next.
   * Cancellable via AbortSignal.
   */
  private async readLoop(
    segments: ReadableSegment[],
    fromIndex: number,
    callbacks: ReaderCallbacks,
    signal: AbortSignal,
  ): Promise<void> {
    try {
      for (let i = fromIndex; i < segments.length; i++) {
        if (signal.aborted) return

        const segment = segments[i]
        const requestId = `seg-${i}-${Date.now()}`

        callbacks.onSegmentAdvance(i)

        // POST /speak
        const speakRes = await fetch(`${BASE_URL}/speak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: segment.text,
            rate: Math.round(BASE_RATE * this.speed),
            request_id: requestId,
            ...(this.voice ? { voice: this.voice } : {}),
          }),
          signal,
        })

        if (!speakRes.ok) {
          const body = await speakRes.text().catch(() => '')
          throw new Error(`/speak returned ${speakRes.status}: ${body}`)
        }

        // Poll GET /requests/<request_id> until completed or stopped
        const status = await this.waitForCompletion(requestId, signal)

        if (status === 'stopped' || signal.aborted) return
      }

      // All segments done
      if (!signal.aborted) {
        callbacks.onFinished()
      }
    } catch (err) {
      if (signal.aborted) return // Expected — stop() or new start() was called
      callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  /**
   * Poll GET /requests/<requestId> until status is "completed" or "stopped".
   * Returns the final status string.
   */
  private async waitForCompletion(requestId: string, signal: AbortSignal): Promise<string> {
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
      if (signal.aborted) return 'stopped'

      const res = await fetch(`${BASE_URL}/requests/${requestId}`, { signal })
      if (!res.ok) continue // Retry on transient errors

      const data = await res.json()
      if (data.status === 'completed' || data.status === 'stopped') {
        return data.status
      }
      // status is "queued" or "speaking" — keep polling
    }
  }
}
