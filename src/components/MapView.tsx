'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Item, ItemType } from '@/types'
import { TYPE_CONFIG } from '@/types'

function parseName(name: string) {
  const m = name.match(/^(.*?)\s*[（(]([^（(）)]+)[）)]\s*$/)
  return m ? { main: m[1].trim(), sub: m[2].trim() } : { main: name, sub: null }
}

function MapController({ items, focusedItemId }: { items: Item[]; focusedItemId: string | null }) {
  const map = useMap()
  const listKeyRef = useRef('')

  useEffect(() => {
    const withCoords = items.filter(i => i.lat != null && i.lng != null)
    const key = withCoords.map(i => i.id).join(',')
    if (key === listKeyRef.current || withCoords.length === 0) return
    listKeyRef.current = key
    import('leaflet').then(L => {
      const bounds = L.latLngBounds(withCoords.map(i => [i.lat!, i.lng!] as [number, number]))
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 })
    })
  }, [items, map])

  useEffect(() => {
    if (!focusedItemId) return
    const item = items.find(i => i.id === focusedItemId)
    if (!item?.lat || !item?.lng) return
    map.setView([item.lat, item.lng], Math.max(map.getZoom(), 15), { animate: true })
  }, [focusedItemId, items, map])

  return null
}

export default function MapView({ items, focusedItemId, fullHeight }: { items: Item[]; focusedItemId: string | null; fullHeight?: boolean }) {
  const withCoords = items.filter(i => i.lat != null && i.lng != null)
  const center: [number, number] = withCoords.length > 0 ? [withCoords[0].lat!, withCoords[0].lng!] : [35.158, 129.059]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ width: '100%', height: fullHeight ? 'calc(100vh - 130px)' : 'clamp(340px, calc(100vh - 180px), 900px)', borderRadius: fullHeight ? 0 : 8, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapController items={items} focusedItemId={focusedItemId} />
          {withCoords.map(item => {
            const cfg = TYPE_CONFIG[item.type as ItemType] ?? TYPE_CONFIG['美食']
            const { main, sub } = parseName(item.name)
            return (
              <CircleMarker key={item.id} center={[item.lat!, item.lng!]} radius={8} pathOptions={{ fillColor: cfg.color, fillOpacity: 1, color: '#fff', weight: 3 }}>
                <Popup>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{main}</div>
                    {sub && <div style={{ fontSize: 12, color: '#C85226', marginBottom: 2 }}>{sub}</div>}
                    {item.category && <div style={{ fontSize: 12, color: '#9A8F82' }}>{item.category}</div>}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', paddingLeft: 2, flexShrink: 0 }}>
        {(['美食', '咖啡甜點', '景點', '商店'] as ItemType[]).map(type => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_CONFIG[type].color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)' }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
