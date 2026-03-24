import { motion } from 'framer-motion'
import type { DashboardSection } from '../types'
import {
  HeadingSection,
  TableSection,
  CodeSection,
  ListSection,
  BlockquoteSection,
  ImageSection,
  ParagraphSection,
  MermaidSection,
  FrontmatterSection,
  MathSection,
  FootnotesSection,
  HtmlSection,
  GlossarySection,
  PlaceholderSection,
} from './sections'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
}

interface Props {
  section: DashboardSection
  index: number
  isBeingRead?: boolean
}

export function SectionRenderer({ section, index, isBeingRead = false }: Props) {
  const content = renderSection(section)
  if (!content) return null

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      style={{
        borderLeft: isBeingRead ? '3px solid var(--text-accent)' : '3px solid transparent',
        paddingLeft: '12px',
        background: isBeingRead ? 'rgba(124,58,237,0.04)' : 'transparent',
        borderRadius: '4px',
        transition: 'border-color 0.3s ease, background 0.3s ease',
      }}
    >
      {content}
    </motion.div>
  )
}

function renderSection(section: DashboardSection) {
  switch (section.type) {
    case 'heading':
      return <HeadingSection section={section} />
    case 'table':
      return <TableSection section={section} />
    case 'code':
      return <CodeSection section={section} />
    case 'list':
      return <ListSection section={section} />
    case 'blockquote':
      return <BlockquoteSection section={section} />
    case 'image':
      return <ImageSection section={section} />
    case 'paragraph':
      return <ParagraphSection section={section} />
    case 'hr':
      return <hr className="border-t my-2" style={{ borderColor: 'var(--border)' }} />
    case 'mermaid':
      return <MermaidSection section={section} />
    case 'frontmatter':
      return <FrontmatterSection section={section} />
    case 'math':
      return <MathSection section={section} />
    case 'footnotes':
      return <FootnotesSection section={section} />
    case 'html':
      return <HtmlSection section={section} />
    case 'glossary':
      return <GlossarySection section={section} />
    case 'placeholder':
      return <PlaceholderSection section={section} />
    default:
      return null
  }
}
