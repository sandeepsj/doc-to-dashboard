import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentInput } from '../CommentInput'

// We need userEvent for keyboard testing - install if needed, otherwise use fireEvent
describe('CommentInput', () => {
  const mockSubmit = vi.fn()
  const mockCancel = vi.fn()

  beforeEach(() => {
    mockSubmit.mockClear()
    mockCancel.mockClear()
  })

  it('renders all 4 kind selector buttons', () => {
    render(<CommentInput onSubmit={mockSubmit} onCancel={mockCancel} />)
    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.getByText('Clarification')).toBeInTheDocument()
    expect(screen.getByText('Change Request')).toBeInTheDocument()
    expect(screen.getByText('Mistake')).toBeInTheDocument()
  })

  it('defaults to Note kind', () => {
    render(<CommentInput onSubmit={mockSubmit} onCancel={mockCancel} />)
    expect(screen.getByPlaceholderText('Add a note...')).toBeInTheDocument()
    expect(screen.getByText('Add Note')).toBeInTheDocument()
  })

  it('switches kind when clicking selector button', () => {
    render(<CommentInput onSubmit={mockSubmit} onCancel={mockCancel} />)
    fireEvent.click(screen.getByText('Mistake'))
    expect(screen.getByPlaceholderText('Add a mistake...')).toBeInTheDocument()
    expect(screen.getByText('Add Mistake')).toBeInTheDocument()
  })

  it('submit button is disabled when textarea is empty', () => {
    render(<CommentInput onSubmit={mockSubmit} onCancel={mockCancel} />)
    const submitBtn = screen.getByText('Add Note')
    expect(submitBtn).toHaveAttribute('disabled')
  })

  it('submit button enables when text is entered', () => {
    render(<CommentInput onSubmit={mockSubmit} onCancel={mockCancel} />)
    fireEvent.change(screen.getByPlaceholderText('Add a note...'), { target: { value: 'hello' } })
    expect(screen.getByText('Add Note')).not.toHaveAttribute('disabled')
  })

  it('calls onSubmit with text and kind on click', () => {
    render(<CommentInput onSubmit={mockSubmit} onCancel={mockCancel} />)
    fireEvent.change(screen.getByPlaceholderText('Add a note...'), { target: { value: 'my comment' } })
    fireEvent.click(screen.getByText('Add Note'))
    expect(mockSubmit).toHaveBeenCalledWith('my comment', 'note')
  })

  it('calls onSubmit with selected kind', () => {
    render(<CommentInput onSubmit={mockSubmit} onCancel={mockCancel} />)
    fireEvent.click(screen.getByText('Clarification'))
    fireEvent.change(screen.getByPlaceholderText('Add a clarification...'), { target: { value: 'why?' } })
    fireEvent.click(screen.getByText('Add Clarification'))
    expect(mockSubmit).toHaveBeenCalledWith('why?', 'clarification')
  })

  it('does not submit whitespace-only text', () => {
    render(<CommentInput onSubmit={mockSubmit} onCancel={mockCancel} />)
    fireEvent.change(screen.getByPlaceholderText('Add a note...'), { target: { value: '   ' } })
    fireEvent.click(screen.getByText('Add Note'))
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('calls onCancel when Cancel is clicked', () => {
    render(<CommentInput onSubmit={mockSubmit} onCancel={mockCancel} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockCancel).toHaveBeenCalled()
  })

  it('calls onCancel on Escape key', () => {
    render(<CommentInput onSubmit={mockSubmit} onCancel={mockCancel} />)
    fireEvent.keyDown(screen.getByPlaceholderText('Add a note...'), { key: 'Escape' })
    expect(mockCancel).toHaveBeenCalled()
  })

  it('submits on Ctrl+Enter', () => {
    render(<CommentInput onSubmit={mockSubmit} onCancel={mockCancel} />)
    const textarea = screen.getByPlaceholderText('Add a note...')
    fireEvent.change(textarea, { target: { value: 'test' } })
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })
    expect(mockSubmit).toHaveBeenCalledWith('test', 'note')
  })

  it('submits on Meta+Enter (Mac)', () => {
    render(<CommentInput onSubmit={mockSubmit} onCancel={mockCancel} />)
    const textarea = screen.getByPlaceholderText('Add a note...')
    fireEvent.change(textarea, { target: { value: 'test' } })
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })
    expect(mockSubmit).toHaveBeenCalledWith('test', 'note')
  })
})
