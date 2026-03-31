import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MarkdownEditor } from '../MarkdownEditor'

describe('MarkdownEditor', () => {
  const defaultProps = {
    value: '# Hello\n\nWorld',
    onChange: vi.fn(),
    onSave: vi.fn(),
    saving: false,
    dirty: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders textarea with value', () => {
    render(<MarkdownEditor {...defaultProps} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea).toBeInTheDocument()
    expect(textarea.value).toBe('# Hello\n\nWorld')
  })

  it('calls onChange when text is edited', () => {
    render(<MarkdownEditor {...defaultProps} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '# Updated' } })
    expect(defaultProps.onChange).toHaveBeenCalledWith('# Updated')
  })

  it('calls onSave on Ctrl+S', () => {
    render(<MarkdownEditor {...defaultProps} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.keyDown(textarea, { key: 's', ctrlKey: true })
    expect(defaultProps.onSave).toHaveBeenCalled()
  })

  it('calls onSave on Meta+S (Mac)', () => {
    render(<MarkdownEditor {...defaultProps} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.keyDown(textarea, { key: 's', metaKey: true })
    expect(defaultProps.onSave).toHaveBeenCalled()
  })

  it('shows "Unsaved changes" when dirty', () => {
    render(<MarkdownEditor {...defaultProps} dirty={true} />)
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
  })

  it('does not show "Unsaved changes" when clean', () => {
    render(<MarkdownEditor {...defaultProps} dirty={false} />)
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
  })

  it('shows "Saving..." when saving', () => {
    render(<MarkdownEditor {...defaultProps} saving={true} />)
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('save button is disabled when not dirty', () => {
    render(<MarkdownEditor {...defaultProps} dirty={false} />)
    expect(screen.getByText('Save')).toHaveAttribute('disabled')
  })

  it('save button is enabled when dirty', () => {
    render(<MarkdownEditor {...defaultProps} dirty={true} />)
    expect(screen.getByText('Save')).not.toHaveAttribute('disabled')
  })

  it('clicks Save button to trigger onSave', () => {
    render(<MarkdownEditor {...defaultProps} dirty={true} />)
    fireEvent.click(screen.getByText('Save'))
    expect(defaultProps.onSave).toHaveBeenCalled()
  })
})
