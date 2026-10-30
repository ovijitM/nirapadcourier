import type { HubRoute } from '../mock/types.ts'

export const defaultRoutes = (): HubRoute[] => [
  { id: 'z-mirpur', kind: 'dhaka_zone', name: 'Mirpur', covers: 'Mirpur, Kafrul, Shewrapara', hubId: 'b-mir' },
  { id: 'z-mohammadpur', kind: 'dhaka_zone', name: 'Mohammadpur', covers: 'Mohammadpur, Shankar, Adabor', hubId: 'b-mir' },
  { id: 'z-dhanmondi', kind: 'dhaka_zone', name: 'Dhanmondi', covers: 'Dhanmondi, Lalmatia, Kalabagan', hubId: 'b-dhn' },
  { id: 'z-uttara', kind: 'dhaka_zone', name: 'Uttara', covers: 'Uttara, Khilkhet, Airport', hubId: 'b-utt' },
  { id: 'z-gulshan', kind: 'dhaka_zone', name: 'Gulshan', covers: 'Gulshan, Banani, Baridhara', hubId: 'b-gul' },
  { id: 'z-tejgaon', kind: 'dhaka_zone', name: 'Tejgaon', covers: 'Tejgaon, Mohakhali, Farmgate', hubId: 'b-gul' },
  { id: 'z-motijheel', kind: 'dhaka_zone', name: 'Motijheel', covers: 'Motijheel, Paltan, Wari', hubId: 'b-dhn' },
  { id: 'z-badda', kind: 'dhaka_zone', name: 'Badda', covers: 'Badda, Rampura, Banasree', hubId: 'b-utt' },
  { id: 'c-gazipur', kind: 'outside_city', name: 'Gazipur', covers: 'Gazipur, Tongi', hubId: 'b-gaz' },
  { id: 'c-narayanganj', kind: 'outside_city', name: 'Narayanganj', covers: 'Narayanganj, Fatullah', hubId: 'b-nar' },
  { id: 'c-ctg', kind: 'outside_city', name: 'Chattogram', covers: 'Chattogram, Agrabad, Halishahar', hubId: 'b-ctg' },
  { id: 'c-syl', kind: 'outside_city', name: 'Sylhet', covers: 'Sylhet, Zindabazar', hubId: 'b-syl' },
  { id: 'c-raj', kind: 'outside_city', name: 'Rajshahi', covers: 'Rajshahi, Shaheb Bazar', hubId: 'b-raj' },
  { id: 'c-khl', kind: 'outside_city', name: 'Khulna', covers: 'Khulna, Sonadanga', hubId: 'b-khl' },
  { id: 'c-bar', kind: 'outside_city', name: 'Barishal', covers: 'Barishal Sadar', hubId: 'b-bar' },
  { id: 'c-com', kind: 'outside_city', name: 'Cumilla', covers: 'Cumilla, Kandirpar', hubId: 'b-com' },
  { id: 'c-mym', kind: 'outside_city', name: 'Mymensingh', covers: 'Mymensingh, Ganginarpar', hubId: 'b-mym' },
  { id: 'c-rng', kind: 'outside_city', name: 'Rangpur', covers: 'Rangpur, Modern More', hubId: 'b-rng' },
]

export function hubForPlace(district: string, area: string, routes: HubRoute[]) {
  const text = `${district} ${area}`.toLowerCase()
  const dhaka = district === 'Dhaka'
  const pool = routes.filter((route) => (dhaka ? route.kind === 'dhaka_zone' : route.kind === 'outside_city'))
  const hit = pool.find((route) =>
    route.covers
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .some((part) => part.length > 0 && (text.includes(part) || part.includes(area.toLowerCase()))),
  )
  if (hit) return hit.hubId
  if (dhaka) return routes.find((route) => route.id === 'z-mirpur')?.hubId ?? 'b-mir'
  return routes.find((route) => route.id === 'c-ctg')?.hubId ?? 'b-ctg'
}
