import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionRenderer } from '../SectionRenderer'
import type { DashboardSection } from '../../types'

describe('SectionRenderer', () => {
  it('renders heading section content', () => {
    const section: DashboardSection = { type: 'heading', id: 'test-h', depth: 1, text: 'My Title', lineStart: 0 }
    render(<SectionRenderer section={section} index={0} />)
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('renders paragraph section content', () => {
    const section: DashboardSection = { type: 'paragraph', html: 'Hello world', lineStart: 0 }
    render(<SectionRenderer section={section} index={0} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('returns null for hr section type', () => {
    const section: DashboardSection = { type: 'hr', lineStart: 0 }
    const { container } = render(<SectionRenderer section={section} index={0} />)
    expect(container.querySelector('hr')).toBeInTheDocument()
  })

  it('shows comment button when onAddComment is provided', () => {
    const section: DashboardSection = { type: 'heading', id: 'h1', depth: 1, text: 'Title', lineStart: 0 }
    render(<SectionRenderer section={section} index={0} onAddComment={vi.fn()} />)
    expect(screen.getByTitle('Add comment')).toBeInTheDocument()
  })

  it('does not show comment button when onAddComment is not provided', () => {
    const section: DashboardSection = { type: 'heading', id: 'h1', depth: 1, text: 'Title', lineStart: 0 }
    render(<SectionRenderer section={section} index={0} />)
    expect(screen.queryByTitle('Add comment')).not.toBeInTheDocument()
  })

  it('shows comment count badge when commentCount > 0', () => {
    const section: DashboardSection = { type: 'heading', id: 'h1', depth: 1, text: 'Title', lineStart: 0 }
    render(<SectionRenderer section={section} index={0} commentCount={3} onAddComment={vi.fn()} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not show badge when commentCount is 0', () => {
    const section: DashboardSection = { type: 'heading', id: 'h1', depth: 1, text: 'Title', lineStart: 0 }
    render(<SectionRenderer section={section} index={0} commentCount={0} onAddComment={vi.fn()} />)
    // The button exists but no number badge
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('calls onAddComment when comment button is clicked', () => {
    const onAdd = vi.fn()
    const section: DashboardSection = { type: 'heading', id: 'h1', depth: 1, text: 'Title', lineStart: 0 }
    render(<SectionRenderer section={section} index={0} onAddComment={onAdd} />)
    fireEvent.click(screen.getByTitle('Add comment'))
    expect(onAdd).toHaveBeenCalled()
  })

  it('renders CommentInput when isCommentTarget is true', () => {
    const section: DashboardSection = { type: 'heading', id: 'h1', depth: 1, text: 'Title', lineStart: 0 }
    render(
      <SectionRenderer
        section={section}
        index={0}
        isCommentTarget={true}
        onSubmitComment={vi.fn()}
        onCancelComment={vi.fn()}
      />
    )
    expect(screen.getByPlaceholderText('Add a note...')).toBeInTheDocument()
  })

  it('does not render CommentInput when isCommentTarget is false', () => {
    const section: DashboardSection = { type: 'heading', id: 'h1', depth: 1, text: 'Title', lineStart: 0 }
    render(<SectionRenderer section={section} index={0} isCommentTarget={false} />)
    expect(screen.queryByPlaceholderText('Add a note...')).not.toBeInTheDocument()
  })
})
