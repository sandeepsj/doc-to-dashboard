import { motion, AnimatePresence } from 'framer-motion'
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
import { CommentInput } from './CommentInput'
import type { CommentKind } from '../types'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
}

interface Props {
  section: DashboardSection
  index: number
  isBeingRead?: boolean
  commentCount?: number
  onAddComment?: () => void
  isCommentTarget?: boolean
  onSubmitComment?: (text: string, kind: CommentKind) => void
  onCancelComment?: () => void
}

export function SectionRenderer({
  section,
  index,
  isBeingRead = false,
  commentCount = 0,
  onAddComment,
  isCommentTarget = false,
  onSubmitComment,
  onCancelComment,
}: Props) {
  const content = renderSection(section)
  if (!content) return null

  const hasComments = commentCount > 0
  const borderColor = isBeingRead
    ? 'var(--text-accent)'
    : hasComments
      ? 'var(--comment-indicator)'
      : 'transparent'
  const bgColor = isBeingRead
    ? 'rgba(124,58,237,0.04)'
    : hasComments
      ? 'var(--comment-bg)'
      : 'transparent'

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="group relative"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        paddingLeft: '12px',
        background: bgColor,
        borderRadius: '4px',
        transition: 'border-color 0.3s ease, background 0.3s ease',
      }}
    >
      {/* Comment action button */}
      {onAddComment && (
        <button
          onClick={onAddComment}
          className="absolute top-1 right-1 flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-all duration-150 z-10"
          style={{
            color: hasComments ? 'var(--comment-badge-text)' : 'var(--text-faint)',
            background: hasComments ? 'var(--comment-badge-bg)' : 'var(--bg-subtle)',
          }}
          title="Add comment"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {hasComments && <span>{commentCount}</span>}
        </button>
      )}

      {content}

      {/* Inline comment form */}
      <AnimatePresence>
        {isCommentTarget && onSubmitComment && onCancelComment && (
          <CommentInput onSubmit={onSubmitComment} onCancel={onCancelComment} />
        )}
      </AnimatePresence>
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
