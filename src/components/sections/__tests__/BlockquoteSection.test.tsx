import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BlockquoteSection } from '../BlockquoteSection'

describe('BlockquoteSection', () => {
  it('renders note variant with label', () => {
    render(<BlockquoteSection section={{ type: 'blockquote', variant: 'note', content: 'A note here', lineStart: 0 }} />)
    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.getByText('A note here')).toBeInTheDocument()
  })

  it('renders warning variant with label', () => {
    render(<BlockquoteSection section={{ type: 'blockquote', variant: 'warning', content: 'Be careful', lineStart: 0 }} />)
    expect(screen.getByText('Warning')).toBeInTheDocument()
    expect(screen.getByText('Be careful')).toBeInTheDocument()
  })

  it('renders tip variant with label', () => {
    render(<BlockquoteSection section={{ type: 'blockquote', variant: 'tip', content: 'Pro tip', lineStart: 0 }} />)
    expect(screen.getByText('Tip')).toBeInTheDocument()
    expect(screen.getByText('Pro tip')).toBeInTheDocument()
  })

  it('renders important variant with label', () => {
    render(<BlockquoteSection section={{ type: 'blockquote', variant: 'important', content: 'Critical info', lineStart: 0 }} />)
    expect(screen.getByText('Important')).toBeInTheDocument()
    expect(screen.getByText('Critical info')).toBeInTheDocument()
  })

  it('renders default variant with quote mark, no label', () => {
    render(<BlockquoteSection section={{ type: 'blockquote', variant: 'default', content: 'A plain quote', lineStart: 0 }} />)
    expect(screen.getByText('"')).toBeInTheDocument()
    expect(screen.getByText('A plain quote')).toBeInTheDocument()
    // Should NOT have a variant label
    expect(screen.queryByText('Note')).not.toBeInTheDocument()
    expect(screen.queryByText('Warning')).not.toBeInTheDocument()
  })

  it('renders HTML content correctly', () => {
    render(<BlockquoteSection section={{ type: 'blockquote', variant: 'note', content: '<strong>Bold</strong> text', lineStart: 0 }} />)
    expect(screen.getByText('Bold')).toBeInTheDocument()
  })
})
