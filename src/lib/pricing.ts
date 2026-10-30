import { takaToPoisha } from './money.ts'
import { defaultRoutes, hubForPlace } from './routing.ts'
import type { HubRoute, Merchant, RateCard, ServiceType, Zone } from '../mock/types.ts'

const INSIDE_AREAS = ['Dhanmondi', 'Gulshan', 'Mirpur', 'Uttara', 'Banani', 'Mohammadpur', 'Motijheel', 'Tejgaon', 'Badda', 'Mohakhali']
const SUB_DISTRICTS = ['Gazipur', 'Narayanganj', 'Narsingdi', 'Manikganj']
const SUB_AREAS = ['Savar', 'Keraniganj', 'Tongi']

export function zoneFor(district: string, area: string): Zone {
  if (SUB_DISTRICTS.includes(district) || SUB_AREAS.includes(area)) return 'sub_dhaka'
  if (district === 'Dhaka' || INSIDE_AREAS.includes(area)) return 'inside_dhaka'
  return 'outside_dhaka'
}

export function zoneLabel(zone: Zone) {
  if (zone === 'inside_dhaka') return 'Inside Dhaka'
  if (zone === 'sub_dhaka') return 'Sub Dhaka'
  return 'Outside Dhaka'
}

export interface Quote {
  zone: Zone
  productPrice: number
  deliveryCharge: number
  damageControl: number
  codFee: number
  returnCharge: number
  totalCharges: number
  payableAmount: number
  merchantOwes: boolean
}

export function quote(input: {
  district: string
  area: string
  weightKg: number
  service: ServiceType
  productPriceTaka: number
  codTaka: number
  merchant: Merchant | undefined
  rate: RateCard
}): Quote | { error: string } {
  const zone = zoneFor(input.district, input.area)
  if (input.service === 'same_day' && zone !== 'inside_dhaka') {
    return { error: 'Same day is available inside Dhaka only.' }
  }
  if (input.productPriceTaka <= 0) {
    return { error: 'Enter the product price. Delivery is 1% of that price.' }
  }

  const productPrice = takaToPoisha(input.productPriceTaka)
  const percent = input.rate.deliveryPercent || 1
  const deliveryCharge = Math.round((productPrice * percent) / 100)
  const damageControl = input.rate.damageControl || takaToPoisha(1)
  const totalCharges = deliveryCharge + damageControl
  const codPoisha = takaToPoisha(input.codTaka)
  const payableAmount = codPoisha > 0 ? codPoisha - totalCharges : 0

  return {
    zone,
    productPrice,
    deliveryCharge,
    damageControl,
    codFee: damageControl,
    returnCharge: 0,
    totalCharges,
    payableAmount,
    merchantOwes: codPoisha === 0,
  }
}

export function destinationBranchId(district: string, area: string, routes: HubRoute[] = defaultRoutes()) {
  return hubForPlace(district, area, routes)
}
