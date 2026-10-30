export type RoleId =
  | 'super_admin'
  | 'operations'
  | 'branch_manager'
  | 'hub_manager'
  | 'booking'
  | 'accounts'

export type ParcelStatus =
  | 'BOOKED'
  | 'PICKUP_ASSIGNED'
  | 'PICKED_UP'
  | 'PICKUP_FAILED'
  | 'AT_ORIGIN_HUB'
  | 'IN_TRANSIT'
  | 'AT_DESTINATION_HUB'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'RETURN_INITIATED'
  | 'RETURNING'
  | 'RETURNED'
  | 'CANCELLED'

export type Zone = 'inside_dhaka' | 'sub_dhaka' | 'outside_dhaka'
export type ServiceType = 'standard' | 'express' | 'same_day'
export type PayMethod = 'cash' | 'bkash' | 'nagad' | 'bank'

export interface User {
  id: string
  name: string
  email: string
  role: RoleId
  roleLabel: string
  job: string
  branchId: string | null
  status: 'active' | 'inactive'
  persona: boolean
}

export interface Branch {
  id: string
  name: string
  code: string
  type: 'hub' | 'sorting_center' | 'sub_branch'
  network: 'inside_dhaka' | 'outside_dhaka'
  district: string
  phone: string
  street: string
  isActive: boolean
}

export interface Merchant {
  id: string
  businessName: string
  merchantCode: string
  contactName: string
  phone: string
  email: string
  district: string
  area: string
  street: string
  pickupBranchId: string
  status: 'pending' | 'active' | 'suspended'
  paymentMethod: 'bank' | 'bkash' | 'nagad'
  insideBaseOverride?: number
  notes: string
  createdAt: string
}

export interface Rider {
  id: string
  riderCode: string
  name: string
  phone: string
  branchId: string
  vehicleType: 'bicycle' | 'motorcycle' | 'van'
  licenseNumber: string
  status: 'active' | 'inactive' | 'on_leave'
  isAvailable: boolean
}

export interface Recipient {
  phone: string
  name: string
  division: string
  district: string
  area: string
  street: string
}

export interface StatusEvent {
  status: ParcelStatus
  timestamp: string
  actorId: string
  branchId: string
  note: string
}

export interface DeliveryAttempt {
  attemptNumber: number
  attemptedAt: string
  riderId: string
  reason: string
  note: string
}

export interface Parcel {
  id: string
  trackingId: string
  merchantId: string
  serviceType: ServiceType
  deliveryZone: Zone
  recipient: Recipient
  weightKg: number
  category: string
  description: string
  itemsCount: number
  codAmount: number
  productPrice: number
  charges: {
    deliveryCharge: number
    damageControl: number
    codFee: number
    returnCharge: number
    totalCharges: number
  }
  payableAmount: number
  currentStatus: ParcelStatus
  currentBranchId: string
  originBranchId: string
  destinationBranchId: string
  assignedPickupRiderId?: string
  assignedDeliveryRiderId?: string
  bagBranchId?: string
  statusHistory: StatusEvent[]
  deliveryAttempts: DeliveryAttempt[]
  createdBy: string
  createdAt: string
  labelPrinted: boolean
}

export interface CodCollection {
  id: string
  parcelId: string
  riderId: string
  amountCollected: number
  expected: number
  paymentMethod: 'cash' | 'bkash' | 'nagad'
  collectedAt: string
  handoverStatus: 'pending' | 'handed_over' | 'reconciled'
  handoverId?: string
}

export interface Handover {
  id: string
  riderId: string
  branchId: string
  amount: number
  collectionIds: string[]
  status: 'pending' | 'verified' | 'disputed'
  note?: string
  createdAt: string
}

export type SettlementStatus = 'draft' | 'pending_approval' | 'approved' | 'disbursed'

export interface Settlement {
  id: string
  merchantId: string
  periodStart: string
  periodEnd: string
  parcelIds: string[]
  totalCodCollected: number
  totalDeliveryCharges: number
  totalCodFees: number
  totalAdjustments: number
  netPayable: number
  payoutStatus: SettlementStatus
  paymentReference?: string
  paymentMethod?: string
  preparedBy: string
  approvedBy?: string
  note?: string
}

export interface LedgerEntry {
  id: string
  batchId: string
  accountType: 'merchant_payable' | 'cod_receivable' | 'courier_revenue' | 'cash_in_hand'
  type: 'DEBIT' | 'CREDIT'
  amount: number
  description: string
  parcelId?: string
  createdAt: string
  createdBy: string
}

export interface Adjustment {
  id: string
  amount: number
  description: string
  status: 'pending' | 'approved'
  createdBy: string
  createdAt: string
}

export type CaseType = 'wrong_address' | 'merchant_complaint' | 'cod_dispute' | 'lost_damaged' | 'failed_delivery'

export interface CaseNote {
  at: string
  actorId: string
  text: string
}

export interface CaseItem {
  id: string
  caseNo: string
  type: CaseType
  parcelId: string
  merchantId: string
  ownerId: string
  priority: 'low' | 'normal' | 'high'
  status: 'open' | 'waiting' | 'resolved'
  notes: CaseNote[]
  createdAt: string
}

export interface Manifest {
  id: string
  manifestNumber: string
  sourceBranchId: string
  destinationBranchId: string
  parcelIds: string[]
  status: 'created' | 'in_transit' | 'received' | 'discrepancy'
  dispatchedAt: string
  dispatchedBy: string
  receivedAt?: string
  receivedBy?: string
  note?: string
}

export interface AuditLog {
  id: string
  timestamp: string
  actorId: string
  action: string
  entity: string
  summary: string
}

export interface AlertItem {
  id: string
  roles: RoleId[]
  title: string
  body: string
  href: string
}

export interface CompanySettings {
  name: string
  phone: string
  labelFooter: string
}

export interface RateCard {
  insideBase: number
  insideExtra: number
  subBase: number
  subExtra: number
  outBase: number
  outExtra: number
  deliveryPercent: number
  damageControl: number
  codPercent: number
  minCodInside: number
  minCodSub: number
  minCodOut: number
  returnInside: number
  returnSub: number
  returnOut: number
}

export interface HubRoute {
  id: string
  kind: 'dhaka_zone' | 'outside_city'
  name: string
  covers: string
  hubId: string
}

export interface DemoData {
  users: User[]
  branches: Branch[]
  merchants: Merchant[]
  riders: Rider[]
  parcels: Parcel[]
  collections: CodCollection[]
  handovers: Handover[]
  settlements: Settlement[]
  ledger: LedgerEntry[]
  adjustments: Adjustment[]
  cases: CaseItem[]
  manifests: Manifest[]
  audit: AuditLog[]
  alerts: AlertItem[]
  settings: CompanySettings
  rate: RateCard
  routes: HubRoute[]
}
