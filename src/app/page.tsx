'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'

function PasswordModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value) return
    setChecking(true)
    const ok = await verifyPassword(value)
    setChecking(false)
    if (ok) onSuccess()
    else { setError(true); setValue('') }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 360, borderRadius: 10, padding: 28, boxShadow: 'var(--shadow-pop)', animation: 'pop .18s var(--ease-out)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--ink)' }}>進入編輯模式</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--ink-3)' }}>輸入密碼以解鎖編輯功能</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            autoFocus type="password" value={value}
            onChange={e => { setValue(e.target.value); setError(false) }}
            placeholder="密碼"
            style={{ width: '100%', height: 46, padding: '0 12px', borderRadius: 6, boxSizing: 'border-box', border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border-strong)'}`, fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 400, color: 'var(--ink)', transition: 'border-color .15s' }}
          />
          {error && <p style={{ margin: '-2px 0 4px', fontSize: 12.5, color: 'var(--danger)' }}>密碼錯誤，請再試一次</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, height: 44, borderRadius: 6, border: '1.5px solid var(--border-strong)', background: '#fff', fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 14, color: 'var(--ink-2)', cursor: 'pointer' }}>取消</button>
            <button type="submit" disabled={checking || !value} style={{ flex: 2, height: 44, borderRadius: 6, border: 'none', background: 'var(--accent)', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: '#fff', cursor: 'pointer', opacity: checking || !value ? 0.6 : 1, transition: 'opacity .15s' }}>
              {checking ? '確認中…' : '確認'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
import { supabase } from '@/lib/supabase'
import type { List, Item, ItemInput, ItemType } from '@/types'
import { TYPE_CONFIG } from '@/types'
import ItemCard from '@/components/ItemCard'
import ItemModal from '@/components/ItemModal'
import CustomSelect from '@/components/CustomSelect'
import { verifyPassword } from './actions'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

function parseGoogleMapsCsv(content: string): Omit<ItemInput, 'list_id' | 'sort_order'>[] {
  function parseLine(line: string): string[] {
    const fields: string[] = []; let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { fields.push(cur); cur = '' }
      else { cur += ch }
    }
    fields.push(cur); return fields
  }
  function toType(raw: string, name = ''): ItemType {
    const combined = (raw + ' ' + name).toLowerCase()
    const n = name.toLowerCase()
    if (/百貨|超市|藥妝|daiso|大創|換錢|money|伴手禮|禮品|stiikers|專門店|專賣|outlet|mart/.test(combined)) return '商店'
    if (/購物|商店|shop|store/.test(combined)) return '商店'
    if (/[路街]$|商圈$|浦$/.test(n) || /團路|藍線/.test(n)) return '景點'
    if (/咖啡|甜點|甜食|麵包|cafe|coffee|bakery/i.test(combined)) return '咖啡甜點'
    if (/景點|觀光|公園|海灘|beach|寺|廟|宮|塔|水族|博物|美術|museum|sea.?life|spa|市場|廣場|灌籃|列車|拍貼|似顏繪|the.?sky|文化村|文化園|arte/.test(combined)) return '景點'
    if (/飯店|旅館|酒店|民宿|hotel|suite|hostel|residence|stay/.test(combined)) return '景點'
    return '美食'
  }
  const lines = content.split('\n')
  const blocks: string[][] = []; let cur: string[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^"?POINT/.test(line)) { if (cur.length) blocks.push(cur); cur = [line] }
    else if (cur.length && line.trim()) cur.push(line)
  }
  if (cur.length) blocks.push(cur)
  return blocks.map(block => {
    const first = block[0]
    const wkt = first.match(/POINT\s*\(\s*([\d.]+)\s+([\d.]+)\s*\)/)
    const lng = wkt ? parseFloat(wkt[1]) : null
    const lat = wkt ? parseFloat(wkt[2]) : null
    const rest = first.replace(/^"POINT\s*\([^)]+\)",?/, '').replace(/^POINT\s*\([^)]+\),?/, '')
    const f = parseLine(rest)
    // addr_zh may contain ASCII commas (e.g. English addresses), shifting all subsequent fields.
    // Find addr_kr by locating the first field (from index 3) that contains Hangul characters.
    const hasHangul = (s: string) => /[가-힣]/.test(s)
    let addrKrIdx = f.findIndex((v, i) => i >= 3 && hasHangul(v))
    if (addrKrIdx === -1) addrKrIdx = 4
    const addrZh = addrKrIdx > 3 ? f.slice(3, addrKrIdx).join(',').trim() || null : f[3]?.trim() || null
    const addrKr = f[addrKrIdx]?.trim() || null
    let desc = (f[addrKrIdx + 1] ?? '').trim()
    let source = f[addrKrIdx + 2]?.trim() || null
    for (let i = 1; i < block.length; i++) {
      const line = block[i]; const extra = line.trim()
      if (!extra) continue
      if (/^,\s*\S+$/.test(line)) { if (!source) source = extra.replace(/^,/, '').trim(); continue }
      const m = extra.match(/^(.*),([^,\n]+)$/)
      if (m && !source) { desc += (desc ? '\n' : '') + m[1].trim(); source = m[2].trim() }
      else { desc += (desc ? '\n' : '') + extra }
    }
    return {
      name: f[0]?.trim() || '未命名', type: toType(f[1] ?? '', f[0] ?? ''),
      category: f[1]?.trim() || null, area: f[2]?.trim() || null,
      addr_zh: addrZh, addr_kr: addrKr,
      description: desc.trim() || null, source: source || null, lat, lng,
    }
  }).filter(i => i.name !== '未命名' || i.lat != null)
}

export default function HomePage() {
  const [lists, setLists] = useState<List[]>([])
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('全部')
  const [categoryFilter, setCategoryFilter] = useState('全部')
  const [areaFilter, setAreaFilter] = useState('全部')
  const [sourceFilter, setSourceFilter] = useState('全部')
  const [sort, setSort] = useState<'manual' | 'name' | 'area' | 'category'>('manual')
  const [editMode, setEditMode] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const [isMobile, setIsMobile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (localStorage.getItem('travel_unlock')) setUnlocked(true)
    fetchLists()
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!showMenu) return
    function handle() { setShowMenu(false) }
    const t = setTimeout(() => document.addEventListener('mousedown', handle), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handle) }
  }, [showMenu])


const activeList = useMemo(() => lists.find(l => l.id === activeListId), [lists, activeListId])

  const filteredItems = useMemo(() => {
    let r = [...items]
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.addr_kr?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q))
    }
    if (typeFilter !== '全部') r = r.filter(i => i.type === typeFilter)
    if (categoryFilter !== '全部') r = r.filter(i => i.category === categoryFilter)
    if (areaFilter !== '全部') r = r.filter(i => i.area === areaFilter)
    if (sourceFilter !== '全部') r = r.filter(i => i.source === sourceFilter)
    if (sort === 'name') r.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'))
    else if (sort === 'area') r.sort((a, b) => (a.area || '').localeCompare(b.area || '', 'zh-Hant'))
    else if (sort === 'category') r.sort((a, b) => (a.category || '').localeCompare(b.category || '', 'zh-Hant'))
    else r.sort((a, b) => a.sort_order - b.sort_order)
    return r
  }, [items, search, typeFilter, categoryFilter, areaFilter, sourceFilter, sort])

  const categoryOptions = useMemo(() => Array.from(new Set(items.map(i => i.category).filter(Boolean))).sort() as string[], [items])
  const areaOptions = useMemo(() => Array.from(new Set(items.map(i => i.area).filter(Boolean))).sort() as string[], [items])
  const sourceOptions = useMemo(() => Array.from(new Set(items.map(i => i.source).filter(Boolean))).sort() as string[], [items])
  const canReorder = sort === 'manual' && !search && typeFilter === '全部' && categoryFilter === '全部' && areaFilter === '全部' && sourceFilter === '全部'

  async function fetchLists() {
    const { data: ls } = await supabase.from('lists').select('*').order('sort_order')
    const lists = ls || []
    setLists(lists)
    if (lists.length > 0) setActiveListId(lists[0].id)
    setLoading(true)
    const { data: items } = await supabase.from('items').select('*').order('sort_order')
    setItems(items || [])
    setLoading(false)
  }

  function handleUnlock() { setShowPasswordModal(true) }
  function handlePasswordSuccess() {
    localStorage.setItem('travel_unlock', '1')
    setUnlocked(true)
    setShowPasswordModal(false)
  }

  function handleLock() { localStorage.removeItem('travel_unlock'); setUnlocked(false); setEditMode(false) }

  async function handleAddList() {
    const name = window.prompt('新清單名稱')?.trim()
    if (!name) return
    const { data } = await supabase.from('lists').insert({ name, sort_order: lists.length }).select().single()
    if (data) { setLists(p => [...p, data]); setActiveListId(data.id) }
  }

  async function handleRenameList() {
    if (!activeList) return
    const name = window.prompt('新名稱', activeList.name)?.trim()
    if (!name || name === activeList.name) return
    await supabase.from('lists').update({ name }).eq('id', activeList.id)
    setLists(p => p.map(l => l.id === activeList.id ? { ...l, name } : l))
    setShowMenu(false)
  }

  async function handleDeleteList() {
    if (!activeList) return
    if (lists.length <= 1) { window.alert('至少保留一個清單'); return }
    if (!window.confirm(`確定刪除「${activeList.name}」？`)) return
    await supabase.from('lists').delete().eq('id', activeList.id)
    const remaining = lists.filter(l => l.id !== activeList.id)
    setLists(remaining); setActiveListId(remaining[0]?.id ?? null); setShowMenu(false)
  }

  async function handleSaveItem(input: ItemInput) {
    if (editingItem) {
      const { data } = await supabase.from('items').update(input).eq('id', editingItem.id).select().single()
      if (data) setItems(p => p.map(i => i.id === data.id ? data : i))
    } else {
      const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order), -1)
      const { data } = await supabase.from('items').insert({ ...input, sort_order: maxOrder + 1 }).select().single()
      if (data) setItems(p => [...p, data])
    }
    setShowModal(false); setEditingItem(null)
  }

  async function handleDeleteItem(id: string) {
    const item = items.find(i => i.id === id); if (!item) return
    const m = item.name.match(/^(.*?)\s*[（(]/); const mainName = m ? m[1].trim() : item.name
    if (!window.confirm(`確定刪除「${mainName}」？`)) return
    await supabase.from('items').delete().eq('id', id)
    setItems(p => p.filter(i => i.id !== id))
  }

  async function handleMoveItem(id: string, dir: 'up' | 'down') {
    const idx = items.findIndex(i => i.id === id); if (idx < 0) return
    const si = dir === 'up' ? idx - 1 : idx + 1
    if (si < 0 || si >= items.length) return
    const a = items[idx], b = items[si]
    await Promise.all([
      supabase.from('items').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('items').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
    setItems(p => { const n = [...p]; n[idx] = { ...a, sort_order: b.sort_order }; n[si] = { ...b, sort_order: a.sort_order }; return n })
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const content = await file.text()
    const parsed = parseGoogleMapsCsv(content)
    if (parsed.length === 0) { window.alert('沒有解析到任何資料'); return }
    const listName = file.name.replace(/\.[^.]+$/, '')
    const { data: newList } = await supabase.from('lists').insert({ name: listName, sort_order: lists.length }).select().single()
    if (!newList) { window.alert('建立清單失敗'); return }
    await supabase.from('items').insert(parsed.map((p, i) => ({ ...p, list_id: newList.id, sort_order: i })))
    setLists(p => [...p, newList]); setActiveListId(newList.id); setShowMenu(false); e.target.value = ''
  }

  async function handleExportExcel() {
    const XLSX = await import('xlsx')
    const wsData = [
      ['名稱', '大分類', '類別標籤', '地區', '說明', '韓文地址', '來源', '緯度', '經度'],
      ...items.map(i => [i.name, i.type, i.category??'', i.area??'', i.description??'', i.addr_kr??'', i.source??'', i.lat??'', i.lng??''])
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '釜山')
    XLSX.writeFile(wb, '釜山.xlsx')
  }

  const countLabel = filteredItems.length < items.length
    ? `${filteredItems.length} / ${items.length} 個地點`
    : `${items.length} 個地點`

  const typeChips = [
    { value: '全部', label: '全部', count: items.length, icon: null as string | null, color: 'var(--ink-2)' },
    ...(['美食', '咖啡甜點', '景點', '商店'] as ItemType[]).map(t => ({
      value: t, label: t, color: TYPE_CONFIG[t].color, icon: TYPE_CONFIG[t].icon as string | null, count: items.filter(i => i.type === t).length,
    })),
  ]

const menuItemStyle: React.CSSProperties = {
    width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 9,
    padding: '9px 12px', border: 'none', background: 'none', borderRadius: 6,
    cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 13.5, color: 'var(--ink)',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'var(--ink)' }}>

      {/* ─── HEADER ─── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '10px clamp(14px,3vw,24px)', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Row 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'clamp(20px,2vw,24px)', lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
                釜山
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 400, color: 'var(--ink-3)', lineHeight: 1.3, marginTop: 1 }}>{countLabel}</div>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              {/* Export — always visible */}
              <button onClick={handleExportExcel} title="匯出 Excel" style={{ height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5, borderRadius: 6, border: '1.5px solid var(--border-strong)', background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 13, color: 'var(--ink-2)' }}>
                <span className="ms" style={{ fontSize: 17 }}>download</span>匯出
              </button>

              {unlocked ? (
                <>
                  <button onClick={handleLock} title="鎖定" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--ink-2)' }}>
                    <span className="ms">lock_open</span>
                  </button>
                  <button onClick={() => setEditMode(m => !m)} style={{ height: 38, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, border: '1.5px solid var(--border-strong)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 13.5, background: editMode ? 'var(--ink)' : '#fff', color: editMode ? '#fff' : 'var(--ink-2)', transition: 'all .15s' }}>
                    <span className="ms" style={{ fontSize: 18 }}>{editMode ? 'check' : 'edit'}</span>
                    {editMode ? '完成' : '編輯'}
                  </button>
                  <button onClick={() => { setEditingItem(null); setShowModal(true) }} style={{ height: 38, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5, background: 'var(--accent)', color: '#fff' }}>
                    <span className="ms" style={{ fontSize: 18 }}>add</span>新增
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowMenu(m => !m)} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1.5px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--ink-2)' }}>
                      <span className="ms">more_horiz</span>
                    </button>
                    {showMenu && (
                      <div style={{ position: 'absolute', right: 0, top: 46, width: 230, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-pop)', padding: 6, zIndex: 60, animation: 'pop .16s var(--ease-out)' }} onClick={e => e.stopPropagation()}>
                        <button onClick={handleAddList} style={menuItemStyle}><span className="ms" style={{ fontSize: 19, color: 'var(--accent)' }}>playlist_add</span>新增空白清單</button>
                        <button onClick={handleRenameList} style={menuItemStyle}><span className="ms" style={{ fontSize: 19, color: 'var(--ink-2)' }}>edit_note</span>重新命名此清單</button>
                        <div style={{ height: 1, background: 'var(--border)', margin: '4px 2px' }} />
                        <button onClick={() => { fileInputRef.current?.click(); setShowMenu(false) }} style={menuItemStyle}><span className="ms" style={{ fontSize: 19, color: 'var(--ink-2)' }}>upload_file</span>匯入 CSV（新清單）</button>
                        <div style={{ height: 1, background: 'var(--border)', margin: '4px 2px' }} />
                        <button onClick={handleDeleteList} style={{ ...menuItemStyle, color: 'var(--danger)' }}><span className="ms" style={{ fontSize: 19 }}>delete</span>刪除此清單</button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button onClick={handleUnlock} style={{ height: 36, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, border: '1.5px solid var(--border-strong)', background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 13, color: 'var(--ink-2)' }}>
                  <span className="ms" style={{ fontSize: 17 }}>edit</span>編輯
                </button>
              )}
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 160px', maxWidth: 280 }}>
              <span className="ms" style={{ fontSize: 17, position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }}>search</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋…" style={{ width: '100%', height: 34, padding: '0 10px 0 32px', borderRadius: 7, border: '1.5px solid var(--border-strong)', background: '#fff', fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 13.5, color: 'var(--ink)' }} />
            </div>

            {/* Type filter — icon chips */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {typeChips.map(c => {
                const sel = typeFilter === c.value
                return (
                  <button key={c.value} onClick={() => setTypeFilter(c.value)} title={c.label} style={{
                    height: 32, padding: '0 8px',
                    display: 'flex', alignItems: 'center', gap: 3,
                    border: `1.5px solid ${sel ? c.color : 'var(--border-strong)'}`,
                    borderRadius: 7, cursor: 'pointer',
                    background: sel ? (c.color + '18') : '#fff',
                    color: sel ? c.color : 'var(--ink-3)',
                    transition: 'all .14s',
                  }}>
                    {c.icon
                      ? <span className="ms" style={{ fontSize: 14 }}>{c.icon}</span>
                      : <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 12 }}>全部</span>
                    }
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 11, opacity: sel ? 0.8 : 0.5 }}>{c.count}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ flex: 1 }} />

            {areaOptions.length > 0 && (
              <CustomSelect
                value={areaFilter}
                onChange={setAreaFilter}
                options={[{ value: '全部', label: '全部地區' }, ...areaOptions.map(o => ({ value: o, label: o }))]}
              />
            )}
            {categoryOptions.length > 0 && (
              <CustomSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={[{ value: '全部', label: '全部類別' }, ...categoryOptions.map(o => ({ value: o, label: o }))]}
              />
            )}
            {sourceOptions.length > 0 && (
              <CustomSelect
                value={sourceFilter}
                onChange={setSourceFilter}
                options={[{ value: '全部', label: '全部來源' }, ...sourceOptions.map(o => ({ value: o, label: o }))]}
              />
            )}
            <div style={{ display: 'flex', gap: 1, background: 'var(--bg)', borderRadius: 7, padding: 2, border: '1.5px solid var(--border-strong)', flexShrink: 0 }}>
              {([
                { value: 'manual', label: '順序' },
                { value: 'name', label: '名稱' },
                { value: 'area', label: '地區' },
                { value: 'category', label: '類別' },
              ] as { value: typeof sort; label: string }[]).map(opt => (
                <button key={opt.value} onClick={() => setSort(opt.value)}
                  style={{
                    height: 26, padding: '0 8px',
                    border: 'none', borderRadius: 5,
                    background: sort === opt.value ? 'var(--ink)' : 'transparent',
                    color: sort === opt.value ? '#fff' : 'var(--ink-3)',
                    fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 12,
                    cursor: 'pointer', transition: 'all .13s', whiteSpace: 'nowrap',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main style={{ flex: 1, maxWidth: 1440, width: '100%', margin: '0 auto', padding: 'clamp(12px,2vw,20px)', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>

        {/* Items column */}
        <section style={{ flex: '1 1 440px', minWidth: 300, display: isMobile && mobileView === 'map' ? 'none' : 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '48px 0' }}>載入中…</p>
          ) : lists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', background: '#fff', borderRadius: 8, border: '1px dashed var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 6 }}>還沒有清單</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>{unlocked ? '點右上角「⋯」→「新增空白清單」' : '點右上角「解鎖」後可建立清單'}</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 20px', background: '#fff', borderRadius: 8, border: '1px dashed var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 6 }}>
                {items.length === 0 ? '還沒有地點' : '沒有符合的結果'}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>
                {items.length === 0 && unlocked ? '點右上角「新增」加入第一個地點' : items.length === 0 ? '點右上角「解鎖」後可新增' : '試試清除篩選條件'}
              </div>
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <ItemCard
                key={item.id} item={item} editMode={editMode} expanded={expandedItemId === item.id}
                canReorder={canReorder} isFirst={idx === 0} isLast={idx === filteredItems.length - 1}
                onClick={() => {
                  setFocusedItemId(item.id)
                  setExpandedItemId(id => id === item.id ? null : item.id)
                  if (isMobile) setMobileView('map')
                }}
                onEdit={() => { setEditingItem(item); setShowModal(true) }}
                onDelete={() => handleDeleteItem(item.id)}
                onMoveUp={() => handleMoveItem(item.id, 'up')}
                onMoveDown={() => handleMoveItem(item.id, 'down')}
              />
            ))
          )}
        </section>

        {/* Map column */}
        <aside style={{ flex: '1 1 360px', minWidth: 280, display: isMobile && mobileView === 'list' ? 'none' : undefined, position: isMobile ? 'relative' : 'sticky', top: isMobile ? undefined : 138, alignSelf: 'flex-start' }}>
          <MapView items={filteredItems} focusedItemId={focusedItemId} fullHeight={isMobile} visible={!isMobile || mobileView === 'map'} />
        </aside>
      </main>

      {/* Mobile floating toggle */}
      {isMobile && (
        <button
          onClick={() => setMobileView(v => v === 'list' ? 'map' : 'list')}
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
            height: 46, padding: '0 22px', borderRadius: 23,
            border: 'none', background: 'var(--ink)', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 7,
            fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
            boxShadow: '0 4px 24px rgba(27,25,22,0.32)', cursor: 'pointer',
          }}
        >
          <span className="ms" style={{ fontSize: 19 }}>{mobileView === 'list' ? 'map' : 'format_list_bulleted'}</span>
          {mobileView === 'list' ? '地圖' : '清單'}
        </button>
      )}

      {showModal && activeListId && (
        <ItemModal item={editingItem} listId={activeListId} onSave={handleSaveItem} onClose={() => { setShowModal(false); setEditingItem(null) }} />
      )}
      {showPasswordModal && (
        <PasswordModal onSuccess={handlePasswordSuccess} onClose={() => setShowPasswordModal(false)} />
      )}

      <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportFile} />
    </div>
  )
}
