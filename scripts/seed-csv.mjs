import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))

const envPath = join(__dir, '..', '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const BASE = env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1'
const HEADERS = {
  'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'Authorization': 'Bearer ' + env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

async function rpc(method, path, body) {
  const res = await fetch(BASE + path, { method, headers: HEADERS, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

const CSV_PATH = '/Users/shuyi/Downloads/2026 Jul  釜山海雲台西面- 西面餐廳.csv'
const LIST_NAME = '西面餐廳'

function parseLine(line) {
  const fields = []; let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { fields.push(cur); cur = '' }
    else { cur += ch }
  }
  fields.push(cur); return fields
}

function toType(raw) {
  const s = (raw ?? '').trim()
  if (/咖啡|甜點|甜食|麵包|cafe|coffee|bakery/i.test(s)) return '咖啡甜點'
  if (/景點|觀光|公園|海灘|beach/i.test(s)) return '景點'
  if (/購物|商店|shop|store/i.test(s)) return '商店'
  return '美食'
}

function parseCsv(content) {
  const lines = content.split('\n')
  const blocks = []; let cur = []
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
    let desc = (f[5] ?? '').trim()
    let source = f[6]?.trim() || null
    for (let i = 1; i < block.length; i++) {
      const line = block[i]
      const extra = line.trim()
      if (!extra) continue
      if (/^,\s*\S+$/.test(line)) {
        if (!source) source = extra.replace(/^,/, '').trim()
        continue
      }
      const m = extra.match(/^(.*),([^,\n]+)$/)
      if (m && !source) {
        desc += (desc ? '\n' : '') + m[1].trim()
        source = m[2].trim()
      } else {
        desc += (desc ? '\n' : '') + extra
      }
    }
    return {
      name: f[0]?.trim() || '未命名',
      type: toType(f[1] ?? ''),
      category: f[1]?.trim() || null,
      area: f[2]?.trim() || null,
      addr_zh: f[3]?.trim() || null,
      addr_kr: f[4]?.trim() || null,
      description: desc.trim() || null,
      source: source || null,
      lat, lng,
    }
  }).filter(i => i.name !== '未命名' || i.lat != null)
}

async function main() {
  const content = readFileSync(CSV_PATH, 'utf8').replace(/^﻿/, '')
  const parsed = parseCsv(content)
  console.log(`Parsed ${parsed.length} items from CSV\n`)

  // Check if list already exists
  const existing = await rpc('GET', `/lists?name=eq.${encodeURIComponent(LIST_NAME)}&select=id`)
  let listId
  if (existing?.length) {
    listId = existing[0].id
    console.log(`List already exists (${listId}) — clearing items`)
    await rpc('DELETE', `/items?list_id=eq.${listId}`)
  } else {
    const created = await rpc('POST', '/lists', { name: LIST_NAME, sort_order: 0 })
    listId = created[0].id
    console.log(`Created list: ${listId}`)
  }

  const items = parsed.map((item, i) => ({ ...item, list_id: listId, sort_order: i }))
  await rpc('POST', '/items', items)
  console.log(`Inserted ${items.length} items:\n`)
  parsed.forEach((item, i) => console.log(`  ${i + 1}. [${item.type}] ${item.name}`))
}

main().catch(e => { console.error(e.message); process.exit(1) })
