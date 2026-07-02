export interface List {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export type ItemType = '美食' | '咖啡甜點' | '景點' | '商店'

export interface Item {
  id: string
  list_id: string
  name: string
  type: ItemType
  category: string | null
  area: string | null
  addr_zh: string | null
  addr_kr: string | null
  description: string | null
  source: string | null
  lat: number | null
  lng: number | null
  sort_order: number
  created_at: string
}

export type ItemInput = Omit<Item, 'id' | 'created_at'>

export const TYPE_CONFIG: Record<ItemType, { color: string; bg: string; fg: string; icon: string }> = {
  '美食':    { color: '#C85226', bg: '#F8EDE8', fg: '#8A3215', icon: 'restaurant' },
  '咖啡甜點': { color: '#9C7033', bg: '#F5EDDB', fg: '#6B4D1A', icon: 'local_cafe' },
  '景點':    { color: '#2A8B6A', bg: '#D8EFE8', fg: '#1A5E47', icon: 'photo_camera' },
  '商店':    { color: '#5B6CC0', bg: '#E6E9F5', fg: '#374199', icon: 'shopping_bag' },
}
