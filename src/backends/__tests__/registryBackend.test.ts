import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RegistryBackend } from '../registryBackend'
import type { ReadableSegment, ReaderCallbacks } from '../../types/reader'

const BASE = 'http://test-registry:4100'

// Minimal HTMLAudioElement stand-in. jsdom's HTMLMediaElement doesn't
// implement load/play, so we replace `Audio` entirely.
class FakeAudio {
  static instances: FakeAudio[] = []
  src: string
  private listeners = new Map<string, Array<() => void>>()
  paused = true

  constructor(src: string) {
    this.src = src
    FakeAudio.instances.push(this)
  }
  addEventListener(ev: string, fn: () => void) {
    if (!this.listeners.has(ev)) this.listeners.set(ev, [])
    this.listeners.get(ev)!.push(fn)
  }
  removeEventListener(ev: string, fn: () => void) {
    const arr = this.listeners.get(ev)
    if (!arr) return
    const i = arr.indexOf(fn)
    if (i !== -1) arr.splice(i, 1)
  }
  play(): Promise<void> {
    this.paused = false
    return Promise.resolve()
  }
  pause(): void { this.paused = true }
  fire(ev: string) {
    const arr = this.listeners.get(ev) ?? []
    for (const fn of [...arr]) fn()
  }
  finishPlayback() { this.fire('ended') }
}

// jsdom's Blob doesn't implement .stream(), so wrapping Blob in Response
// fails. Hand-roll the Response shape we actually consume.
function makeWavResponse(): Response {
  const blob = { type: 'audio/wav', size: 4 } as unknown as Blob
  return { ok: true, status: 200, blob: () => Promise.resolve(blob) } as unknown as Response
}

function makeJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response
}

function makeCallbacks(): ReaderCallbacks & { advances: number[]; finished: number; errors: Error[] } {
  const advances: number[] = []
  let finished = 0
  const errors: Error[] = []
  return {
    advances, errors,
    get finished() { return finished },
    set finished(v) { finished = v },
    onSegmentAdvance: (i) => { advances.push(i) },
    onFinished: () => { finished++ },
    onError: (e) => { errors.push(e) },
  } as unknown as ReaderCallbacks & { advances: number[]; finished: number; errors: Error[] }
}

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('RegistryBackend', () => {
  let originalAudio: typeof window.Audio
  let originalCreate: typeof URL.createObjectURL
  let originalRevoke: typeof URL.revokeObjectURL

  beforeEach(() => {
    FakeAudio.instances = []
    originalAudio = window.Audio
    originalCreate = URL.createObjectURL
    originalRevoke = URL.revokeObjectURL
    // @ts-expect-error — replacing Audio constructor for tests
    window.Audio = FakeAudio
    URL.createObjectURL = vi.fn(() => 'blob:fake')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.Audio = originalAudio
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
  })

  describe('isAvailable', () => {
    it('returns true on 200 from /v1/health', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse({}))
      vi.stubGlobal('fetch', fetchMock)
      const ok = await new RegistryBackend(BASE).isAvailable()
      expect(ok).toBe(true)
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/v1/health`, expect.any(Object))
    })

    it('returns false when fetch rejects', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
      expect(await new RegistryBackend(BASE).isAvailable()).toBe(false)
    })
  })

  describe('getVoices', () => {
    it('parses an array of strings', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeJsonResponse(['af_heart', 'am_michael'])))
      const voices = await new RegistryBackend(BASE).getVoices()
      expect(voices).toEqual([
        { id: 'af_heart', name: 'af_heart' },
        { id: 'am_michael', name: 'am_michael' },
      ])
    })

    it('parses { voices: [...] } with name objects', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeJsonResponse({ voices: [{ name: 'af_heart' }] })))
      const voices = await new RegistryBackend(BASE).getVoices()
      expect(voices).toEqual([{ id: 'af_heart', name: 'af_heart' }])
    })

    it('returns [] on error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
      expect(await new RegistryBackend(BASE).getVoices()).toEqual([])
    })

    it('hits the kokoro voices passthrough', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse([]))
      vi.stubGlobal('fetch', fetchMock)
      await new RegistryBackend(BASE).getVoices()
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/backends/kokoro/voices`)
    })
  })

  describe('start / playback loop', () => {
    it('synthesizes each segment, plays it, advances, then finishes', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeWavResponse())
      vi.stubGlobal('fetch', fetchMock)

      const segments: ReadableSegment[] = [
        { sectionIndex: 0, text: 'first' },
        { sectionIndex: 2, text: 'second' },
      ]
      const cb = makeCallbacks()
      const backend = new RegistryBackend(BASE, 'kokoro')
      backend.setVoice('af_heart')
      backend.setSpeed(1.5)

      backend.start(segments, 0, cb)

      // Wait for first POST + Audio creation
      await flush(); await flush()
      expect(FakeAudio.instances).toHaveLength(1)
      FakeAudio.instances[0].finishPlayback()

      await flush(); await flush()
      expect(FakeAudio.instances).toHaveLength(2)
      FakeAudio.instances[1].finishPlayback()

      await flush(); await flush()

      expect(cb.advances).toEqual([0, 1])
      expect((cb as unknown as { finished: number }).finished).toBe(1)

      // Verify request body for the first segment
      const firstCall = fetchMock.mock.calls[0]
      expect(firstCall[0]).toBe(`${BASE}/v1/audio/speech`)
      const body = JSON.parse(firstCall[1].body as string)
      expect(body).toMatchObject({
        model: 'kokoro',
        input: 'first',
        response_format: 'wav',
        speed: 1.5,
        voice: 'af_heart',
      })
    })

    it('omits voice when not set', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeWavResponse())
      vi.stubGlobal('fetch', fetchMock)
      const backend = new RegistryBackend(BASE)
      backend.start([{ sectionIndex: 0, text: 'hi' }], 0, makeCallbacks())
      await flush(); await flush()
      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
      expect(body.voice).toBeUndefined()
    })

    it('reports onError when /v1/audio/speech returns non-2xx', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeJsonResponse('nope', 500)))
      const cb = makeCallbacks()
      new RegistryBackend(BASE).start([{ sectionIndex: 0, text: 'hi' }], 0, cb)
      await flush(); await flush(); await flush()
      expect((cb as unknown as { errors: Error[] }).errors).toHaveLength(1)
      expect((cb as unknown as { errors: Error[] }).errors[0].message).toMatch(/500/)
    })

    it('stop() aborts the loop and silences playback without onFinished', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeWavResponse()))
      const cb = makeCallbacks()
      const backend = new RegistryBackend(BASE)
      backend.start(
        [{ sectionIndex: 0, text: 'a' }, { sectionIndex: 1, text: 'b' }],
        0,
        cb,
      )
      await flush(); await flush()
      expect(FakeAudio.instances).toHaveLength(1)

      backend.stop()
      await flush(); await flush()

      expect((cb as unknown as { finished: number }).finished).toBe(0)
      expect((cb as unknown as { errors: Error[] }).errors).toEqual([])
      // Second segment never starts
      expect(FakeAudio.instances).toHaveLength(1)
    })
  })

  describe('setSpeed', () => {
    it('clamps to [0.25, 4]', () => {
      const b = new RegistryBackend(BASE)
      b.setSpeed(0.1); b.setSpeed(99)
      // No public getter; verify via a synthesize call
      const fetchMock = vi.fn().mockResolvedValue(makeWavResponse())
      vi.stubGlobal('fetch', fetchMock)
      b.start([{ sectionIndex: 0, text: 'x' }], 0, makeCallbacks())
      return flush().then(() => flush()).then(() => {
        const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
        expect(body.speed).toBe(4)
      })
    })
  })
})
