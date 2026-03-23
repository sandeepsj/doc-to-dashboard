import { useState } from 'react'
import type { TableSection } from '../../types'

interface Props {
  section: TableSection
}

type SortDir = 'asc' | 'desc' | null

export function TableSection({ section }: Props) {
  const { headers, aligns, rows } = section
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  function handleSort(colIdx: number) {
    if (sortCol === colIdx) {
      if (sortDir === 'asc') setSortDir('desc')
      else { setSortCol(null); setSortDir(null) }
    } else {
      setSortCol(colIdx)
      setSortDir('asc')
    }
  }

  const sortedRows = [...rows].sort((a, b) => {
    if (sortCol === null || sortDir === null) return 0
    const av = a[sortCol] ?? '', bv = b[sortCol] ?? ''
    const numA = parseFloat(av), numB = parseFloat(bv)
    const isNum = !isNaN(numA) && !isNaN(numB)
    const cmp = isNum ? numA - numB : av.localeCompare(bv)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const alignClass = (a: 'left' | 'center' | 'right' | null) => {
    if (a === 'center') return 'text-center'
    if (a === 'right') return 'text-right'
    return 'text-left'
  }

  return (
    <div className="rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse" style={{ minWidth: '480px' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #1c1830 0%, #2a2545 100%)' }}>
              {headers.map((h, i) => (
                <th
                  key={i}
                  onClick={() => handleSort(i)}
                  className={`px-3 md:px-4 py-3 md:py-3.5 font-semibold cursor-pointer select-none text-white/90 first:rounded-tl-2xl last:rounded-tr-2xl hover:bg-white/5 transition-colors ${alignClass(aligns[i])}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {h}
                    <SortIcon col={i} sortCol={sortCol} sortDir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, ri) => (
              <TableRow key={ri} row={row} rowIndex={ri} aligns={aligns} alignClass={alignClass} />
            ))}
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-4 py-10 text-center italic text-sm" style={{ color: 'var(--text-faint)' }}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TableRow({ row, rowIndex, aligns, alignClass }: {
  row: string[]
  rowIndex: number
  aligns: Array<'left' | 'center' | 'right' | null>
  alignClass: (a: 'left' | 'center' | 'right' | null) => string
}) {
  const base = rowIndex % 2 === 0 ? 'var(--table-row-even)' : 'var(--table-row-odd)'
  return (
    <tr
      style={{ borderTop: '1px solid var(--border-row)', background: base }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--table-row-hover)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = base }}
    >
      {row.map((cell, ci) => (
        <td key={ci} className={`px-3 md:px-4 py-2.5 md:py-3 text-[13px] ${alignClass(aligns[ci])}`} style={{ color: 'var(--text-secondary)' }}>
          {cell}
        </td>
      ))}
    </tr>
  )
}

function SortIcon({ col, sortCol, sortDir }: { col: number; sortCol: number | null; sortDir: SortDir }) {
  const isActive = sortCol === col
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" style={{ opacity: isActive ? 1 : 0.3, flexShrink: 0 }}>
      <path d="M5 1L1 5h8L5 1z" fill={isActive && sortDir === 'asc' ? 'white' : 'rgba(255,255,255,0.5)'} />
      <path d="M5 13L1 9h8l-4 4z" fill={isActive && sortDir === 'desc' ? 'white' : 'rgba(255,255,255,0.5)'} />
    </svg>
  )
}
