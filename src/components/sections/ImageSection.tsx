import { useState } from 'react'
import type { ImageSection } from '../../types'

interface Props { section: ImageSection }

export function ImageSection({ section }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <figure className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid var(--border)' }}>
      {!error ? (
        <img
          src={section.url}
          alt={section.alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full max-h-64 sm:max-h-80 md:max-h-[480px] object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'var(--img-bg)' }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-24 md:h-32 gap-2" style={{ background: 'var(--img-bg)', color: 'var(--text-faint)' }}>
          <span className="text-2xl">🖼</span>
          <span className="text-xs">{section.alt || 'Image unavailable'}</span>
        </div>
      )}
      {(section.title || section.alt) && (
        <figcaption className="px-4 py-2 text-xs italic text-center" style={{ background: 'var(--img-caption-bg)', borderTop: '1px solid var(--border)', color: 'var(--text-faint)' }}>
          {section.title || section.alt}
        </figcaption>
      )}
    </figure>
  )
}
