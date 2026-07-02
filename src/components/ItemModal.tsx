'use client'

import { useState } from 'react'
import type { Item, ItemInput, ItemType } from '@/types'

interface Props {
  item: Item | null
  listId: string
  onSave: (input: ItemInput) => Promise<void>
  onClose: () => void
}

const TYPES: ItemType[] = ['美食', '咖啡甜點', '景點', '商店']

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 5,
  fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 11,
  letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-3)',
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, borderRadius: 6,
  border: '1.5px solid var(--border-strong)', padding: '0 12px',
  fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
  color: 'var(--ink)', background: '#fff', boxSizing: 'border-box',
}

export default function ItemModal({ item, listId, onSave, onClose }: Props) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: item?.name ?? '',
    type: (item?.type ?? '美食') as ItemType,
    category: item?.category ?? '',
    area: item?.area ?? '',
    description: item?.description ?? '',
    addr_kr: item?.addr_kr ?? '',
    addr_zh: item?.addr_zh ?? '',
    source: item?.source ?? '',
    lat: item?.lat != null ? String(item.lat) : '',
    lng: item?.lng != null ? String(item.lng) : '',
  })

  function set(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { window.alert('請至少輸入名稱'); return }
    setSaving(true)
    await onSave({
      list_id: listId,
      name: form.name.trim(),
      type: form.type,
      category: form.category.trim() || null,
      area: form.area.trim() || null,
      description: form.description.trim() || null,
      addr_zh: form.addr_zh.trim() || null,
      addr_kr: form.addr_kr.trim() || null,
      source: form.source.trim() || null,
      lat: form.lat.trim() ? parseFloat(form.lat) : null,
      lng: form.lng.trim() ? parseFloat(form.lng) : null,
      sort_order: item?.sort_order ?? 0,
    })
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', maxWidth: 540, width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: 10, padding: 'clamp(16px,4vw,24px)', boxShadow: 'var(--shadow-pop)', animation: 'pop .18s var(--ease-out)' }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 12 }}>
          <h2 style={{ flex: 1, margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.025em' }}>
            {item ? '編輯地點' : '新增地點'}
          </h2>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 6, background: 'var(--bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)' }}>
            <span className="ms">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>名稱</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} placeholder="例如：嚴湧帛豬肉湯飯 (엄용백돼지국밥)" />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 120px' }}>
              <label style={labelStyle}>大分類</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={labelStyle}>類別標籤</label>
              <input value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle} placeholder="豬肉湯飯" />
            </div>
            <div style={{ flex: '1 1 90px' }}>
              <label style={labelStyle}>地區</label>
              <input value={form.area} onChange={e => set('area', e.target.value)} style={inputStyle} placeholder="海雲台" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>說明</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical', lineHeight: 1.6 }} placeholder="推薦重點…" />
          </div>

          <div>
            <label style={labelStyle}>韓文地址</label>
            <input value={form.addr_kr} onChange={e => set('addr_kr', e.target.value)} style={inputStyle} placeholder="부산 해운대구…" />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={labelStyle}>來源</label>
              <input value={form.source} onChange={e => set('source', e.target.value)} style={inputStyle} placeholder="IG / 金導遊 / https://…" />
            </div>
            <div style={{ flex: '1 1 90px' }}>
              <label style={labelStyle}>緯度 lat</label>
              <input value={form.lat} onChange={e => set('lat', e.target.value)} style={{ ...inputStyle, fontFamily: 'ui-monospace, monospace', fontSize: 13 }} placeholder="35.1607" />
            </div>
            <div style={{ flex: '1 1 90px' }}>
              <label style={labelStyle}>經度 lng</label>
              <input value={form.lng} onChange={e => set('lng', e.target.value)} style={{ ...inputStyle, fontFamily: 'ui-monospace, monospace', fontSize: 13 }} placeholder="129.1585" />
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)' }}>留白也沒關係，有座標才會顯示在地圖上。</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <button type="button" onClick={onClose} style={{ height: 44, padding: '0 18px', borderRadius: 6, border: '1.5px solid var(--border-strong)', background: '#fff', fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 14, color: 'var(--ink-2)', cursor: 'pointer' }}>
              取消
            </button>
            <button type="submit" disabled={saving} style={{ flex: 1, height: 44, borderRadius: 6, border: 'none', background: 'var(--accent)', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? '儲存中…' : item ? '儲存變更' : '加入清單'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
