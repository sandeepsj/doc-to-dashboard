import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExportCommentsButton } from '../ExportCommentsButton'

describe('ExportCommentsButton', () => {
  it('returns null when commentCount is 0', () => {
    const { container } = render(
      <ExportCommentsButton onExport={() => ''} commentCount={0} docName="test.md" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders when commentCount > 0', () => {
    render(
      <ExportCommentsButton onExport={() => ''} commentCount={3} docName="test.md" />
    )
    expect(screen.getByTitle('Export comments')).toBeInTheDocument()
  })

  it('shows dropdown with two options on click', () => {
    render(
      <ExportCommentsButton onExport={() => ''} commentCount={1} docName="test.md" />
    )
    fireEvent.click(screen.getByTitle('Export comments'))
    expect(screen.getByText('Export unresolved')).toBeInTheDocument()
    expect(screen.getByText('Export all')).toBeInTheDocument()
  })

  it('calls onExport with true for unresolved export', () => {
    const mockExport = vi.fn().mockReturnValue('line 1')
    const createObjectURL = vi.fn().mockReturnValue('blob:url')
    const revokeObjectURL = vi.fn()
    vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectURL)
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectURL)

    const origCreate = document.createElement.bind(document)
    const clickSpy = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
      const el = origCreate(tag, options)
      if (tag === 'a') el.click = clickSpy
      return el
    })

    render(
      <ExportCommentsButton onExport={mockExport} commentCount={1} docName="report.md" />
    )
    fireEvent.click(screen.getByTitle('Export comments'))
    fireEvent.click(screen.getByText('Export unresolved'))
    expect(mockExport).toHaveBeenCalledWith(true)
    expect(clickSpy).toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  it('calls onExport with false for export all', () => {
    const mockExport = vi.fn().mockReturnValue('line 1')
    const createObjectURL = vi.fn().mockReturnValue('blob:url')
    const revokeObjectURL = vi.fn()
    vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectURL)
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectURL)

    const origCreate = document.createElement.bind(document)
    const clickSpy = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
      const el = origCreate(tag, options)
      if (tag === 'a') el.click = clickSpy
      return el
    })

    render(
      <ExportCommentsButton onExport={mockExport} commentCount={1} docName="report.md" />
    )
    fireEvent.click(screen.getByTitle('Export comments'))
    fireEvent.click(screen.getByText('Export all'))
    expect(mockExport).toHaveBeenCalledWith(false)

    vi.restoreAllMocks()
  })
})
