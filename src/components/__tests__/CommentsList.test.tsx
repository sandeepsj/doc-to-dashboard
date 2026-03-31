import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommentsList } from '../CommentsList'
import type { Comment } from '../../types'

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'c1',
    docId: 'doc-1',
    sectionIndex: 0,
    lineNumber: 10,
    sectionType: 'paragraph',
    sectionSnippet: 'Some text...',
    kind: 'note',
    text: 'This needs work',
    resolved: false,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    ...overrides,
  }
}

describe('CommentsList', () => {
  const defaultProps = {
    onResolve: vi.fn(),
    onUnresolve: vi.fn(),
    onDelete: vi.fn(),
    onScrollTo: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no comments', () => {
    render(<CommentsList comments={[]} {...defaultProps} />)
    expect(screen.getByText('No comments yet')).toBeInTheDocument()
  })

  it('renders comment text', () => {
    render(<CommentsList comments={[makeComment()]} {...defaultProps} />)
    expect(screen.getByText('This needs work')).toBeInTheDocument()
  })

  it('renders section snippet', () => {
    render(<CommentsList comments={[makeComment()]} {...defaultProps} />)
    expect(screen.getByText('Some text...')).toBeInTheDocument()
  })

  it('renders comment kind badge', () => {
    render(<CommentsList comments={[makeComment({ kind: 'mistake' })]} {...defaultProps} />)
    expect(screen.getByText('Mistake')).toBeInTheDocument()
  })

  it('renders section type badge', () => {
    render(<CommentsList comments={[makeComment({ sectionType: 'code' })]} {...defaultProps} />)
    expect(screen.getByText('code')).toBeInTheDocument()
  })

  it('shows "just now" for recent comments', () => {
    render(<CommentsList comments={[makeComment()]} {...defaultProps} />)
    expect(screen.getByText('just now')).toBeInTheDocument()
  })

  it('shows time ago for older comments', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    render(<CommentsList comments={[makeComment({ createdAt: twoHoursAgo })]} {...defaultProps} />)
    expect(screen.getByText('2h ago')).toBeInTheDocument()
  })

  it('hides resolved comments by default', () => {
    const comments = [
      makeComment({ id: '1', text: 'unresolved' }),
      makeComment({ id: '2', text: 'resolved one', resolved: true, resolvedAt: new Date().toISOString() }),
    ]
    render(<CommentsList comments={comments} {...defaultProps} />)
    expect(screen.getByText('unresolved')).toBeInTheDocument()
    expect(screen.queryByText('resolved one')).not.toBeInTheDocument()
  })

  it('shows toggle for resolved comments', () => {
    const comments = [
      makeComment({ id: '1' }),
      makeComment({ id: '2', resolved: true }),
    ]
    render(<CommentsList comments={comments} {...defaultProps} />)
    expect(screen.getByText('Show 1 resolved')).toBeInTheDocument()
  })

  it('reveals resolved comments when toggle clicked', () => {
    const comments = [
      makeComment({ id: '1', text: 'open' }),
      makeComment({ id: '2', text: 'done', resolved: true }),
    ]
    render(<CommentsList comments={comments} {...defaultProps} />)
    fireEvent.click(screen.getByText('Show 1 resolved'))
    expect(screen.getByText('done')).toBeInTheDocument()
  })

  it('calls onScrollTo when card is clicked', () => {
    render(<CommentsList comments={[makeComment({ sectionIndex: 5 })]} {...defaultProps} />)
    fireEvent.click(screen.getByText('This needs work'))
    expect(defaultProps.onScrollTo).toHaveBeenCalledWith(5)
  })

  it('calls onResolve when resolve button clicked', () => {
    render(<CommentsList comments={[makeComment({ id: 'abc' })]} {...defaultProps} />)
    fireEvent.click(screen.getByText('Resolve'))
    expect(defaultProps.onResolve).toHaveBeenCalledWith('abc')
  })

  it('calls onDelete when delete button clicked', () => {
    render(<CommentsList comments={[makeComment({ id: 'abc' })]} {...defaultProps} />)
    fireEvent.click(screen.getByTitle('Delete'))
    expect(defaultProps.onDelete).toHaveBeenCalledWith('abc')
  })
})
