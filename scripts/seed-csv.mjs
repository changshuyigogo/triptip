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

const CSV_PATH = process.argv[2] ?? '/Users/shuyi/Developer/triptip/design_handoff_travel_list/2026 Jul 釜山海雲台西面- 海雲台餐廳.csv'
const LIST_NAME = process.argv[3] ?? '釜山'

function parseLine(line) {
  const fields = []; let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { fields.push(cur); cur = '' }
    else { cur += ch }
  }
  fields.push(cur); return fields
}

function toType(raw, name = '') {
  const combined = ((raw ?? '') + ' ' + (name ?? '')).toLowerCase()
  const n = (name ?? '').toLowerCase()
  // Shops first (before café to avoid 田浦咖啡街; before 市場 to prioritize 超市/藥妝)
  if (/百貨|超市|藥妝|daiso|大創|換錢|money|伴手禮|禮品|stiikers|專門店|專賣|outlet|mart/.test(combined)) return '商店'
  if (/購物|商店|shop|store/.test(combined)) return '商店'
  // Streets/districts → attraction (catches 田浦咖啡街 before café check)
  if (/[路街]$|商圈$|浦$/.test(n) || /團路|藍線/.test(n)) return '景點'
  // Café & dessert
  if (/咖啡|甜點|甜食|麵包|cafe|coffee|bakery/i.test(combined)) return '咖啡甜點'
  // Attractions
  if (/景點|觀光|公園|海灘|beach|寺|廟|宮|塔|水族|博物|美術|museum|sea.?life|spa|市場|廣場|灌籃|列車|拍貼|似顏繪|the.?sky|文化村|文化園|arte/.test(combined)) return '景點'
  // Hotels/accommodations → 景點
  if (/飯店|旅館|酒店|民宿|hotel|suite|hostel|residence|stay/.test(combined)) return '景點'
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
    // addr_zh may contain ASCII commas (e.g. English addresses), shifting all subsequent fields.
    // Find addr_kr by locating the first field (from index 3) that contains Hangul characters.
    const hasHangul = (s) => /[가-힣]/.test(s)
    let addrKrIdx = f.findIndex((v, i) => i >= 3 && hasHangul(v))
    if (addrKrIdx === -1) addrKrIdx = 4
    const addrZh = addrKrIdx > 3 ? f.slice(3, addrKrIdx).join(',').trim() || null : f[3]?.trim() || null
    const addrKr = f[addrKrIdx]?.trim() || null
    let desc = (f[addrKrIdx + 1] ?? '').trim()
    let source = f[addrKrIdx + 2]?.trim() || null
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
      type: toType(f[1] ?? '', f[0] ?? ''),
      category: f[1]?.trim() || null,
      area: f[2]?.trim() || null,
      addr_zh: addrZh,
      addr_kr: addrKr,
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
