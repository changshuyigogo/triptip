'use client'

import { useState } from 'react'
import type { Item, ItemType } from '@/types'
import { TYPE_CONFIG } from '@/types'

interface Props {
  item: Item
  editMode: boolean
  expanded: boolean
  canReorder: boolean
  isFirst: boolean
  isLast: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function parseName(name: string): { main: string; sub: string | null } {
  const m = name.match(/^(.*?)\s*[（(]([^（(）)]+)[）)]\s*$/)
  return m ? { main: m[1].trim(), sub: m[2].trim() } : { main: name, sub: null }
}

function getMapsUrl(item: Item): string {
  if (item.addr_kr) return `https://map.naver.com/p/search/${encodeURIComponent(item.addr_kr)}`
  const m = item.name.match(/[（(]([^（(）)]+)[）)]/)
  const q = m ? m[1].trim() : item.name
  return `https://map.naver.com/p/search/${encodeURIComponent(q)}`
}

export default function ItemCard({ item, editMode, expanded, canReorder, isFirst, isLast, onClick, onEdit, onDelete, onMoveUp, onMoveDown }: Props) {
  const [copied, setCopied] = useState(false)
  const cfg = TYPE_CONFIG[item.type as ItemType] ?? TYPE_CONFIG['美食']
  const { main, sub } = parseName(item.name)

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    if (!item.addr_kr) return
    navigator.clipboard.writeText(item.addr_kr).catch(() => {
      const el = document.createElement('textarea')
      el.value = item.addr_kr!
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    })
    setCopied(true); setTimeout(() => setCopied(false), 1200)
  }

  return (
    <article
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        borderRadius: 10,
        border: `1.5px solid ${expanded ? cfg.color : 'var(--border)'}`,
        boxShadow: expanded ? `0 2px 12px ${cfg.color}22` : 'var(--shadow-card)',
        padding: '11px 14px 11px 16px',
        cursor: 'pointer',
        transition: 'border-color .15s, box-shadow .15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left type bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: cfg.color }} />

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Meta row: type icon + category + area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 3 }}>
            <span className="ms" style={{ fontSize: 14, color: cfg.color, flexShrink: 0 }}>{cfg.icon}</span>
            {item.category && (
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-2)', background: 'var(--bg)', padding: '1px 6px', borderRadius: 3 }}>
                {item.category}
              </span>
            )}
            {item.area && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 400, color: 'var(--ink-3)' }}>
                <span className="ms" style={{ fontSize: 12 }}>place</span>
                {item.area}
              </span>
            )}
          </div>

          {/* Name */}
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 15, lineHeight: 1.3, color: 'var(--ink)', letterSpacing: '-0.025em', wordBreak: 'break-word' }}>{main}</div>
          {sub && <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
        </div>

        {/* Edit controls */}
        {editMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button onClick={e => { e.stopPropagation(); onEdit() }} style={{ width: 30, height: 30, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)' }}>
              <span className="ms" style={{ fontSize: 16 }}>edit</span>
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ width: 30, height: 30, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
              <span className="ms" style={{ fontSize: 16 }}>delete</span>
            </button>
            {canReorder && !isFirst && (
              <button onClick={e => { e.stopPropagation(); onMoveUp() }} style={{ width: 30, height: 24, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
                <span className="ms" style={{ fontSize: 16 }}>arrow_upward</span>
              </button>
            )}
            {canReorder && !isLast && (
              <button onClick={e => { e.stopPropagation(); onMoveDown() }} style={{ width: 30, height: 24, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
                <span className="ms" style={{ fontSize: 16 }}>arrow_downward</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded: description + actions */}
      {expanded && (
        <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
          {item.description && (
            <p style={{ margin: '0 0 9px', fontSize: 13, lineHeight: 1.65, color: 'var(--ink-2)', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
              {item.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {item.addr_kr && (
              <button onClick={handleCopy} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, maxWidth: '100%', padding: '5px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12, color: 'var(--ink-2)' }}>
                <span className="ms" style={{ fontSize: 14, color: 'var(--accent)', flexShrink: 0 }}>content_copy</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{copied ? '已複製 ✓' : item.addr_kr}</span>
              </button>
            )}
            <a href={getMapsUrl(item)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 5, background: 'var(--accent-bg)', color: 'var(--accent-dark)', textDecoration: 'none', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12 }}>
              <span className="ms" style={{ fontSize: 14 }}>near_me</span>導航
            </a>
            {item.source && (
              item.source.startsWith('http') ? (
                <a href={item.source} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 5, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--link)', textDecoration: 'none', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12 }}>
                  <span className="ms" style={{ fontSize: 14 }}>link</span>來源
                </a>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--ink-3)', fontWeight: 500, fontSize: 12 }}>
                  <span className="ms" style={{ fontSize: 13 }}>sell</span>{item.source}
                </span>
              )
            )}
          </div>
        </div>
      )}
    </article>
  )
}
