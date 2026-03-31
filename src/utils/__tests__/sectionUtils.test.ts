import { describe, it, expect } from 'vitest'
import { getSectionText, getSectionSnippet } from '../sectionUtils'
import type { DashboardSection } from '../../types'

describe('getSectionText', () => {
  it('extracts text from heading', () => {
    expect(getSectionText({ type: 'heading', id: 'h1', depth: 1, text: 'Hello World', lineStart: 0 })).toBe('Hello World')
  })

  it('strips HTML from paragraph', () => {
    expect(getSectionText({ type: 'paragraph', html: '<b>bold</b> and <em>italic</em>', lineStart: 0 })).toBe('bold and italic')
  })

  it('returns value from code section', () => {
    expect(getSectionText({ type: 'code', lang: 'ts', value: 'const x = 1', lineStart: 0 })).toBe('const x = 1')
  })

  it('flattens list items', () => {
    const section: DashboardSection = {
      type: 'list',
      ordered: false,
      lineStart: 0,
      items: [
        { text: 'first', checked: null, children: [] },
        { text: 'second', checked: null, children: [{ text: 'nested', checked: null, children: [] }] },
      ],
    }
    expect(getSectionText(section)).toBe('first; second nested')
  })

  it('strips HTML from blockquote', () => {
    expect(getSectionText({ type: 'blockquote', variant: 'note', content: '<p>Important note</p>', lineStart: 0 })).toBe('Important note')
  })

  it('joins table headers and rows', () => {
    const section: DashboardSection = {
      type: 'table',
      headers: ['Name', 'Age'],
      aligns: [null, null],
      rows: [['Alice', '30'], ['Bob', '25']],
      lineStart: 0,
    }
    expect(getSectionText(section)).toBe('Name | Age\nAlice | 30\nBob | 25')
  })

  it('returns alt text from image', () => {
    expect(getSectionText({ type: 'image', url: 'http://img.png', alt: 'A cat', title: null, lineStart: 0 })).toBe('A cat')
  })

  it('falls back to URL when image alt is empty', () => {
    expect(getSectionText({ type: 'image', url: 'http://img.png', alt: '', title: null, lineStart: 0 })).toBe('http://img.png')
  })

  it('returns value from mermaid section', () => {
    expect(getSectionText({ type: 'mermaid', lang: 'mermaid', value: 'graph TD;A-->B', lineStart: 0 })).toBe('graph TD;A-->B')
  })

  it('returns value from math section', () => {
    expect(getSectionText({ type: 'math', value: 'x^2 + y^2', display: true, lineStart: 0 })).toBe('x^2 + y^2')
  })

  it('returns raw from frontmatter section', () => {
    expect(getSectionText({ type: 'frontmatter', data: { title: 'X' }, raw: 'title: X', lineStart: 0 })).toBe('title: X')
  })

  it('joins footnotes', () => {
    const section: DashboardSection = {
      type: 'footnotes',
      lineStart: 0,
      items: [
        { id: '1', html: '<p>First note</p>' },
        { id: '2', html: '<p>Second note</p>' },
      ],
    }
    expect(getSectionText(section)).toBe('First note; Second note')
  })

  it('strips HTML from html section', () => {
    expect(getSectionText({ type: 'html', value: '<div>Hello <b>World</b></div>', isTable: false, lineStart: 0 })).toBe('Hello World')
  })

  it('formats glossary entries', () => {
    const section: DashboardSection = {
      type: 'glossary',
      lineStart: 0,
      entries: [
        { term: 'API', definition: 'Application Programming Interface' },
        { term: 'SDK', definition: 'Software Development Kit' },
      ],
    }
    expect(getSectionText(section)).toBe('API: Application Programming Interface; SDK: Software Development Kit')
  })

  it('returns label from placeholder', () => {
    expect(getSectionText({ type: 'placeholder', label: 'Unsupported', raw: '...', lineStart: 0 })).toBe('Unsupported')
  })

  it('returns --- for hr', () => {
    expect(getSectionText({ type: 'hr', lineStart: 0 })).toBe('---')
  })
})

describe('getSectionSnippet', () => {
  it('returns full text when under maxLength', () => {
    expect(getSectionSnippet({ type: 'heading', id: 'h1', depth: 1, text: 'Short', lineStart: 0 })).toBe('Short')
  })

  it('truncates text over 120 chars with ellipsis', () => {
    const longText = 'a'.repeat(200)
    const snippet = getSectionSnippet({ type: 'code', lang: null, value: longText, lineStart: 0 })
    expect(snippet).toHaveLength(123) // 120 + '...'
    expect(snippet.endsWith('...')).toBe(true)
  })

  it('returns exact text at 120 chars without ellipsis', () => {
    const exactText = 'b'.repeat(120)
    const snippet = getSectionSnippet({ type: 'code', lang: null, value: exactText, lineStart: 0 })
    expect(snippet).toBe(exactText)
    expect(snippet).toHaveLength(120)
  })

  it('respects custom maxLength', () => {
    const snippet = getSectionSnippet({ type: 'code', lang: null, value: 'abcdefghij', lineStart: 0 }, 5)
    expect(snippet).toBe('abcde...')
  })
})
