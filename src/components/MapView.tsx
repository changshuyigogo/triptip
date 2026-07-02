'use client'

import { useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Item, ItemType } from '@/types'
import { TYPE_CONFIG } from '@/types'

function parseName(name: string) {
  const m = name.match(/^(.*?)\s*[（(]([^（(）)]+)[）)]\s*$/)
  return m ? { main: m[1].trim(), sub: m[2].trim() } : { main: name, sub: null }
}

function MapController({ items, focusedItemId, visible, markerRefs }: {
  items: Item[]
  focusedItemId: string | null
  visible: boolean
  markerRefs: React.RefObject<Map<string, L.Marker>>
}) {
  const map = useMap()
  const listKeyRef = useRef('')
  const focusedItemIdRef = useRef(focusedItemId)
  const itemsRef = useRef(items)

  useEffect(() => { focusedItemIdRef.current = focusedItemId }, [focusedItemId])
  useEffect(() => { itemsRef.current = items }, [items])

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => {
      map.invalidateSize()
      const fid = focusedItemIdRef.current
      if (fid) {
        const item = itemsRef.current.find(i => i.id === fid)
        if (item?.lat && item?.lng) {
          map.setView([item.lat, item.lng], Math.max(map.getZoom(), 15), { animate: true })
          markerRefs.current?.get(fid)?.openPopup()
        }
      }
    }, 60)
    return () => clearTimeout(t)
  }, [visible, map, markerRefs])

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
    markerRefs.current?.get(focusedItemId)?.openPopup()
  }, [focusedItemId, items, map, markerRefs])

  return null
}

export default function MapView({ items, focusedItemId, fullHeight, visible = true }: { items: Item[]; focusedItemId: string | null; fullHeight?: boolean; visible?: boolean }) {
  const withCoords = items.filter(i => i.lat != null && i.lng != null)
  const center: [number, number] = withCoords.length > 0 ? [withCoords[0].lat!, withCoords[0].lng!] : [35.158, 129.059]

  const markerRefs = useRef<Map<string, L.Marker>>(new Map())

  const typeIcons = useMemo(() => {
    const result: Partial<Record<string, L.DivIcon>> = {}
    for (const [type, cfg] of Object.entries(TYPE_CONFIG)) {
      result[type] = L.divIcon({
        className: '',
        html: `<div style="width:30px;height:30px;background:${cfg.color};border:2.5px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.28)"><span style="font-family:'Material Symbols Rounded';font-size:14px;color:#fff;font-style:normal;font-weight:400;line-height:1;display:inline-block;user-select:none">${cfg.icon}</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -20],
      })
    }
    return result
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ width: '100%', height: fullHeight ? 'calc(100vh - 130px)' : 'clamp(340px, calc(100vh - 180px), 900px)', borderRadius: fullHeight ? 0 : 8, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapController items={items} focusedItemId={focusedItemId} visible={visible} markerRefs={markerRefs} />
          {withCoords.map(item => {
            const cfg = TYPE_CONFIG[item.type as ItemType] ?? TYPE_CONFIG['美食']
            const icon = typeIcons[item.type] ?? typeIcons['美食']!
            const { main, sub } = parseName(item.name)
            return (
              <Marker
                key={item.id}
                position={[item.lat!, item.lng!]}
                icon={icon}
                ref={(el: L.Marker | null) => {
                  if (el) markerRefs.current.set(item.id, el)
                  else markerRefs.current.delete(item.id)
                }}
              >
                <Popup>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{main}</div>
                    {sub && <div style={{ fontSize: 12, color: cfg.color, marginBottom: 2 }}>{sub}</div>}
                    {item.category && <div style={{ fontSize: 12, color: '#9A8F82' }}>{item.category}</div>}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingLeft: 2, flexShrink: 0 }}>
        {(['美食', '咖啡甜點', '景點', '商店'] as ItemType[]).map(type => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="ms" style={{ fontSize: 13, color: TYPE_CONFIG[type].color }}>{TYPE_CONFIG[type].icon}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
