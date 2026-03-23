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
} from './sections'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
}

interface Props {
  section: DashboardSection
  index: number
}

export function SectionRenderer({ section, index }: Props) {
  const content = renderSection(section)
  if (!content) return null

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
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
      return <hr className="border-t border-gray-200 dark:border-gray-700 my-2" />
    default:
      return null
  }
}
