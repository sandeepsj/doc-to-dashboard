import type { ListSection, ListItem } from '../../types'

interface Props {
  section: ListSection
}

export function ListSection({ section }: Props) {
  return (
    <div className="rounded-2xl px-4 md:px-5 py-3.5 md:py-4 shadow-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <ListItems items={section.items} ordered={section.ordered} startIndex={1} depth={0} />
    </div>
  )
}

function ListItems({ items, ordered, startIndex, depth }: {
  items: ListItem[]; ordered: boolean; startIndex: number; depth: number
}) {
  return (
    <ul className={`space-y-2 ${depth > 0 ? 'mt-2 ml-4 md:ml-5' : ''}`}>
      {items.map((item, i) => (
        <ListItemRow key={i} item={item} index={startIndex + i} ordered={ordered} depth={depth} />
      ))}
    </ul>
  )
}

function ListItemRow({ item, index, ordered, depth }: {
  item: ListItem; index: number; ordered: boolean; depth: number
}) {
  const isTask = item.checked !== null
  return (
    <li className="flex items-start gap-2 md:gap-2.5">
      {isTask ? (
        <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded flex items-center justify-center" style={{
          background: item.checked ? 'linear-gradient(135deg, #8b5cf6, #d946ef)' : 'var(--bg-card)',
          border: item.checked ? 'none' : '2px solid var(--border)',
        }}>
          {item.checked && (
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2 6 5 9 10 3" />
            </svg>
          )}
        </span>
      ) : ordered ? (
        <span className="flex-shrink-0 w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center mt-0.5 text-white"
          style={{ background: depth === 0 ? 'linear-gradient(135deg, #8b5cf6, #d946ef)' : 'var(--text-faint)' }}>
          {index}
        </span>
      ) : (
        <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full"
          style={{ background: depth === 0 ? 'linear-gradient(135deg, #8b5cf6, #d946ef)' : 'var(--text-faint)' }} />
      )}
      <div className="flex-1 min-w-0">
        <span
          className={`text-[13px] md:text-[13.5px] leading-relaxed ${isTask && item.checked ? 'line-through' : ''}`}
          style={{ color: isTask && item.checked ? 'var(--text-faint)' : 'var(--text-secondary)' }}
          dangerouslySetInnerHTML={{ __html: item.text }}
        />
        {item.children.length > 0 && (
          <ListItems items={item.children} ordered={ordered} startIndex={1} depth={depth + 1} />
        )}
      </div>
    </li>
  )
}
