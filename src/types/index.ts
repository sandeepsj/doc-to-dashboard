export type HeadingDepth = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingSection {
  type: 'heading'
  id: string
  depth: HeadingDepth
  text: string
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
}

export interface CodeSection {
  type: 'code'
  lang: string | null
  value: string
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
}

export interface BlockquoteSection {
  type: 'blockquote'
  variant: 'note' | 'warning' | 'tip' | 'important' | 'default'
  content: string
}

export interface ImageSection {
  type: 'image'
  url: string
  alt: string
  title: string | null
}

export interface ParagraphSection {
  type: 'paragraph'
  html: string
}

export interface HorizontalRuleSection {
  type: 'hr'
}

export interface MermaidSection {
  type: 'mermaid'
  lang: string
  value: string
}

export interface FrontmatterSection {
  type: 'frontmatter'
  data: Record<string, unknown>
  raw: string
}

export interface MathSection {
  type: 'math'
  value: string
  display: true
}

export interface FootnotesSection {
  type: 'footnotes'
  items: { id: string; html: string }[]
}

export interface HtmlSection {
  type: 'html'
  value: string
  isTable: boolean
}

export interface GlossarySection {
  type: 'glossary'
  entries: { term: string; definition: string }[]
}

export interface PlaceholderSection {
  type: 'placeholder'
  label: string
  raw: string
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
}
