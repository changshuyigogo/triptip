'use client'

import { useState, useEffect, useRef } from 'react'

interface Option { value: string; label: string }

interface Props {
  value: string
  onChange: (v: string) => void
  options: Option[]
  accent?: boolean
}

export default function CustomSelect({ value, onChange, options, accent }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handle), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handle) }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          height: 36, padding: '0 30px 0 11px', borderRadius: 6,
          border: `1.5px solid ${accent ? 'var(--accent)' : 'var(--border-strong)'}`,
          background: '#fff',
          fontFamily: 'var(--font-body)', fontWeight: accent ? 500 : 400, fontSize: 13,
          color: accent ? 'var(--accent-dark)' : 'var(--ink)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
          backgroundImage: 'var(--sel-chevron)', backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
        }}
      >
        {selected?.label ?? '—'}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          minWidth: '100%', background: '#fff',
          border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: 'var(--shadow-pop)', padding: 4,
          zIndex: 55, animation: 'pop .14s var(--ease-out)',
          maxHeight: 260, overflowY: 'auto',
        }}>
          {options.map(o => {
            const sel = o.value === value
            return (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '8px 10px', border: 'none', borderRadius: 5,
                  background: sel ? 'var(--accent-bg)' : 'transparent',
                  color: sel ? 'var(--accent-dark)' : 'var(--ink)',
                  fontFamily: 'var(--font-body)', fontWeight: sel ? 500 : 400,
                  fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {o.label}
                {sel && <span className="ms" style={{ fontSize: 14, color: 'var(--accent)', flexShrink: 0 }}>check</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
