import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TableSection } from '../TableSection'
import type { TableSection as TableSectionType } from '../../../types'

function makeTable(overrides: Partial<TableSectionType> = {}): TableSectionType {
  return {
    type: 'table',
    headers: ['Name', 'Age'],
    aligns: [null, null],
    rows: [['Alice', '30'], ['Bob', '25'], ['Charlie', '35']],
    lineStart: 0,
    ...overrides,
  }
}

describe('TableSection', () => {
  it('renders headers', () => {
    render(<TableSection section={makeTable()} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Age')).toBeInTheDocument()
  })

  it('renders all rows', () => {
    render(<TableSection section={makeTable()} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('shows "No data" for empty rows', () => {
    render(<TableSection section={makeTable({ rows: [] })} />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('sorts ascending on first click', () => {
    render(<TableSection section={makeTable()} />)
    fireEvent.click(screen.getByText('Age'))

    const cells = screen.getAllByText(/^\d+$/)
    const values = cells.map((c) => c.textContent)
    expect(values).toEqual(['25', '30', '35'])
  })

  it('sorts descending on second click', () => {
    render(<TableSection section={makeTable()} />)
    fireEvent.click(screen.getByText('Age'))
    fireEvent.click(screen.getByText('Age'))

    const cells = screen.getAllByText(/^\d+$/)
    const values = cells.map((c) => c.textContent)
    expect(values).toEqual(['35', '30', '25'])
  })

  it('resets sort on third click', () => {
    render(<TableSection section={makeTable()} />)
    fireEvent.click(screen.getByText('Age'))
    fireEvent.click(screen.getByText('Age'))
    fireEvent.click(screen.getByText('Age'))

    // Back to original order
    const cells = screen.getAllByText(/^\d+$/)
    const values = cells.map((c) => c.textContent)
    expect(values).toEqual(['30', '25', '35'])
  })

  it('sorts strings alphabetically', () => {
    render(<TableSection section={makeTable()} />)
    fireEvent.click(screen.getByText('Name'))

    const rows = screen.getAllByText(/^(Alice|Bob|Charlie)$/)
    const values = rows.map((r) => r.textContent)
    expect(values).toEqual(['Alice', 'Bob', 'Charlie'])
  })
})
