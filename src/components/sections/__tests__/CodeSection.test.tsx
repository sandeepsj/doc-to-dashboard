import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CodeSection } from '../CodeSection'

describe('CodeSection', () => {
  it('renders code value', () => {
    render(<CodeSection section={{ type: 'code', lang: 'js', value: 'const x = 1', lineStart: 0 }} />)
    expect(screen.getByText('const x = 1')).toBeInTheDocument()
  })

  it('shows language badge when lang is provided', () => {
    render(<CodeSection section={{ type: 'code', lang: 'typescript', value: 'let x', lineStart: 0 }} />)
    expect(screen.getByText('typescript')).toBeInTheDocument()
  })

  it('does not show language badge when lang is null', () => {
    render(<CodeSection section={{ type: 'code', lang: null, value: 'echo hello', lineStart: 0 }} />)
    // No lang badge should exist
    expect(screen.queryByText(/.+/i, { selector: 'span.text-\\[10px\\]' })).not.toBeInTheDocument()
  })

  it('shows Copy button initially', () => {
    render(<CodeSection section={{ type: 'code', lang: 'js', value: 'x', lineStart: 0 }} />)
    expect(screen.getByText('Copy')).toBeInTheDocument()
  })

  it('copies to clipboard and shows Copied feedback', async () => {
    render(<CodeSection section={{ type: 'code', lang: 'js', value: 'const y = 2', lineStart: 0 }} />)

    fireEvent.click(screen.getByText('Copy'))

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const y = 2')
    // Wait for state update
    await vi.waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument()
    })
  })

  it('renders terminal window chrome dots', () => {
    const { container } = render(<CodeSection section={{ type: 'code', lang: 'js', value: 'x', lineStart: 0 }} />)
    // Three dots (red, yellow, green)
    const dots = container.querySelectorAll('span.rounded-full')
    expect(dots.length).toBeGreaterThanOrEqual(3)
  })
})
