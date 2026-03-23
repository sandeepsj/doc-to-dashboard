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

export type DashboardSection =
  | HeadingSection
  | TableSection
  | CodeSection
  | ListSection
  | BlockquoteSection
  | ImageSection
  | ParagraphSection
  | HorizontalRuleSection

export interface ParsedDocument {
  id: string
  name: string
  sections: DashboardSection[]
  headings: HeadingSection[]
}
