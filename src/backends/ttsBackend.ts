import type { ReaderBackend } from '../types/reader'
import { LocalServerBackend } from './localServerBackend'
import { RegistryBackend } from './registryBackend'

/**
 * Pick a TTS backend based on env config.
 *
 *   VITE_TTS_BACKEND = 'registry' (default) → models-registry's /v1/audio/speech
 *   VITE_TTS_BACKEND = 'local'              → read-loud's /speak
 *
 * The registry backend also honours VITE_REGISTRY_URL and VITE_TTS_MODEL.
 */
export function createTtsBackend(): ReaderBackend {
  const choice = ((import.meta as any).env?.VITE_TTS_BACKEND as string | undefined)?.toLowerCase()
  if (choice === 'local') return new LocalServerBackend()
  return new RegistryBackend()
}
