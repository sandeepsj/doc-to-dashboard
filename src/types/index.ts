export type HeadingDepth = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingSection {
  type: 'heading'
  id: string
  depth: HeadingDepth
  text: string
  lineStart: number
}

export interface TableCell {
  value: string
  align: 'left' | 'center' | 'right' | null
}

export interface TableSection {
  type: 'table'
  headers: string[]
  aligns: Array<'left' | 'center' | 'right' | null>
  rows: string[][]
  lineStart: number
}

export interface CodeSection {
  type: 'code'
  lang: string | null
  value: string
  lineStart: number
}

export interface ListItem {
  text: string
  checked: boolean | null
  children: ListItem[]
}

export interface ListSection {
  type: 'list'
  ordered: boolean
  items: ListItem[]
  lineStart: number
}

export interface BlockquoteSection {
  type: 'blockquote'
  variant: 'note' | 'warning' | 'tip' | 'important' | 'default'
  content: string
  lineStart: number
}

export interface ImageSection {
  type: 'image'
  url: string
  alt: string
  title: string | null
  lineStart: number
}

export interface ParagraphSection {
  type: 'paragraph'
  html: string
  lineStart: number
}

export interface HorizontalRuleSection {
  type: 'hr'
  lineStart: number
}

export interface MermaidSection {
  type: 'mermaid'
  lang: string
  value: string
  lineStart: number
}

export interface FrontmatterSection {
  type: 'frontmatter'
  data: Record<string, unknown>
  raw: string
  lineStart: number
}

export interface MathSection {
  type: 'math'
  value: string
  display: true
  lineStart: number
}

export interface FootnotesSection {
  type: 'footnotes'
  items: { id: string; html: string }[]
  lineStart: number
}

export interface HtmlSection {
  type: 'html'
  value: string
  isTable: boolean
  lineStart: number
}

export interface GlossarySection {
  type: 'glossary'
  entries: { term: string; definition: string }[]
  lineStart: number
}

export interface PlaceholderSection {
  type: 'placeholder'
  label: string
  raw: string
  lineStart: number
}

export type DashboardSection =
  | HeadingSection
  | TableSection
  | CodeSection
  | ListSection
  | BlockquoteSection
  | ImageSection
  | ParagraphSection
  | HorizontalRuleSection
  | MermaidSection
  | FrontmatterSection
  | MathSection
  | FootnotesSection
  | HtmlSection
  | GlossarySection
  | PlaceholderSection

export interface ParsedDocument {
  id: string
  name: string
  sections: DashboardSection[]
  headings: HeadingSection[]
  rawMarkdown?: string
}

export type CommentKind = 'note' | 'clarification' | 'change-request' | 'mistake'

export const COMMENT_KINDS: { value: CommentKind; label: string; color: string; icon: string }[] = [
  { value: 'note', label: 'Note', color: '#6b6490', icon: '📝' },
  { value: 'clarification', label: 'Clarification', color: '#3b82f6', icon: '❓' },
  { value: 'change-request', label: 'Change Request', color: '#f59e0b', icon: '✏️' },
  { value: 'mistake', label: 'Mistake', color: '#ef4444', icon: '⚠️' },
]

export interface Comment {
  id: string
  docId: string
  sectionIndex: number
  lineNumber: number
  sectionType: DashboardSection['type']
  sectionSnippet: string
  kind: CommentKind
  text: string
  resolved: boolean
  createdAt: string
  resolvedAt: string | null
}
