import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ListSection } from '../ListSection'
import type { ListSection as ListSectionType } from '../../../types'

function makeList(overrides: Partial<ListSectionType> = {}): ListSectionType {
  return {
    type: 'list',
    ordered: false,
    items: [
      { text: 'First item', checked: null, children: [] },
      { text: 'Second item', checked: null, children: [] },
    ],
    lineStart: 0,
    ...overrides,
  }
}

describe('ListSection', () => {
  it('renders list items', () => {
    render(<ListSection section={makeList()} />)
    expect(screen.getByText('First item')).toBeInTheDocument()
    expect(screen.getByText('Second item')).toBeInTheDocument()
  })

  it('renders nested children', () => {
    const section = makeList({
      items: [
        {
          text: 'Parent',
          checked: null,
          children: [{ text: 'Child', checked: null, children: [] }],
        },
      ],
    })
    render(<ListSection section={section} />)
    expect(screen.getByText('Parent')).toBeInTheDocument()
    expect(screen.getByText('Child')).toBeInTheDocument()
  })

  it('renders task list with checkboxes', () => {
    const section = makeList({
      items: [
        { text: 'Done task', checked: true, children: [] },
        { text: 'Open task', checked: false, children: [] },
      ],
    })
    const { container } = render(<ListSection section={section} />)

    // Checked task should have line-through
    const doneEl = screen.getByText('Done task')
    expect(doneEl.className).toContain('line-through')

    // Open task should not
    const openEl = screen.getByText('Open task')
    expect(openEl.className).not.toContain('line-through')
  })

  it('renders non-task items without checkboxes', () => {
    const section = makeList({
      items: [{ text: 'Regular item', checked: null, children: [] }],
    })
    const { container } = render(<ListSection section={section} />)

    // Should not have the checkbox span (w-4 h-4)
    const checkboxes = container.querySelectorAll('svg polyline')
    // No check marks for non-task items
    expect(screen.getByText('Regular item').className).not.toContain('line-through')
  })

  it('renders ordered list', () => {
    const section = makeList({ ordered: true })
    const { container } = render(<ListSection section={section} />)
    // Ordered lists show number badges
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('handles empty items', () => {
    const section = makeList({ items: [] })
    const { container } = render(<ListSection section={section} />)
    expect(container.querySelector('ul')).toBeInTheDocument()
  })
})
