import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector'
import { canAct } from '../lib/status.ts'
import { defaultBranch } from '../lib/scope.ts'
import { destinationBranchId, quote } from '../lib/pricing.ts'
import { takaToPoisha } from '../lib/money.ts'
import { createSeed } from './seed.ts'
import type {
  CaseType,
  DemoData,
  Parcel,
  ParcelStatus,
  PayMethod,
  RateCard,
  Recipient,
  ServiceType,
  User,
} from './types.ts'

export interface DemoState extends DemoData {
  sessionUserId: string | null
  workingBranchId: string
  toast: string | null
  seenAlertIds: string[]
  login: (userId: string) => void
  logout: () => void
  resetDemo: () => void
  clearToast: () => void
  setWorkingBranch: (branchId: string) => void
  seeAlerts: () => void
  createParcel: (input: {
    merchantId: string
    recipient: Recipient
    weightKg: number
    service: ServiceType
    productPriceTaka: number
    codTaka: number
    category: string
    description: string
    itemsCount: number
  }) => string | null
  cancelParcel: (id: string, reason: string) => void
  assignPickupRider: (parcelId: string, riderId: string) => void
  assignDeliveryRider: (parcelId: string, riderId: string) => void
  markPickedUp: (id: string) => void
  failPickup: (id: string, reason: string) => void
  receiveAtHub: (trackingId: string) => string
  bagParcel: (parcelId: string, destBranchId: string) => void
  dispatchBag: (destBranchId: string) => string | null
  receiveManifest: (manifestId: string) => void
  flagManifestDiscrepancy: (manifestId: string) => void
  markDelivered: (id: string, amountTaka: number, method: 'cash' | 'bkash' | 'nagad') => void
  failDelivery: (id: string, reason: string) => void
  startReturn: (id: string) => void
  advanceReturn: (id: string) => void
  overrideStatus: (id: string, status: ParcelStatus, reason: string) => void
  markLabelPrinted: (id: string) => void
  createMerchant: (input: { businessName: string; contactName: string; phone: string; district: string; area: string; street: string }) => void
  setMerchantStatus: (id: string, status: 'pending' | 'active' | 'suspended') => void
  createCase: (input: { type: CaseType; parcelId: string; note: string }) => void
  updateCase: (id: string, status: 'open' | 'waiting' | 'resolved', note: string) => void
  addStaff: (input: { name: string; role: User['role']; branchId: string | null }) => void
  setUserStatus: (id: string, status: 'active' | 'inactive') => void
  updateStaff: (id: string, patch: { role?: User['role']; branchId?: string | null; status?: 'active' | 'inactive'; roleLabel?: string }) => void
  setRiderDuty: (id: string, available: boolean) => void
  setRouteHub: (routeId: string, hubId: string) => void
  addBranch: (input: { name: string; code: string; type: 'hub' | 'sorting_center' | 'sub_branch'; district: string; network: 'inside_dhaka' | 'outside_dhaka' }) => void
  updateRate: (rate: RateCard) => void
  updateSettings: (patch: Partial<DemoData['settings']>) => void
  verifyHandover: (id: string, status: 'verified' | 'disputed', note: string) => void
  submitSettlement: (id: string) => void
  approveSettlement: (id: string) => void
  rejectSettlement: (id: string, note: string) => void
  disburseSettlement: (id: string, reference: string, method: PayMethod) => void
  requestAdjustment: (amountTaka: number, description: string) => void
  approveAdjustment: (id: string) => void
}

function me(state: DemoState) {
  return state.users.find((user) => user.id === state.sessionUserId) ?? null
}

let seq = 100

function nid(prefix: string) {
  seq += 1
  return `${prefix}-${seq}`
}

const demoStore = createStore<DemoState>()(
  persist(
    (set, get) => ({
      ...createSeed(),
      sessionUserId: null,
      workingBranchId: 'all',
      toast: null,
      seenAlertIds: [],

      login: (userId) => {
        const user = get().users.find((item) => item.id === userId)
        if (!user) return
        set({ sessionUserId: userId, workingBranchId: defaultBranch(user.role, user.branchId), toast: null })
      },
      logout: () => set({ sessionUserId: null }),
      resetDemo: () => {
        const current = me(get())
        const fresh = createSeed()
        set({
          ...fresh,
          sessionUserId: current?.id ?? null,
          workingBranchId: current ? defaultBranch(current.role, current.branchId) : 'all',
          toast: 'Demo data restored',
          seenAlertIds: [],
        })
      },
      clearToast: () => set({ toast: null }),
      setWorkingBranch: (branchId) => {
        const user = me(get())
        if (!user || (user.role !== 'super_admin' && user.role !== 'operations' && user.role !== 'accounts')) return
        set({ workingBranchId: branchId })
      },
      seeAlerts: () => {
        const user = me(get())
        if (!user) return
        const ids = get().alerts.filter((alert) => alert.roles.includes(user.role)).map((alert) => alert.id)
        set({ seenAlertIds: ids })
      },

      createParcel: (input) => {
        const state = get()
        const user = me(state)
        if (!user || !canAct(user.role, 'book')) {
          set({ toast: 'Not available for this role' })
          return null
        }
        const merchant = state.merchants.find((item) => item.id === input.merchantId && item.status === 'active')
        if (!merchant) {
          set({ toast: 'Choose an active merchant' })
          return null
        }
        const priced = quote({
          district: input.recipient.district,
          area: input.recipient.area,
          weightKg: input.weightKg,
          service: input.service,
          productPriceTaka: input.productPriceTaka,
          codTaka: input.codTaka,
          merchant,
          rate: state.rate,
        })
        if ('error' in priced) {
          set({ toast: priced.error })
          return null
        }
        const trackingId = `NC-202610-${String(9000 + state.parcels.length)}`
        const now = new Date().toISOString()
        const parcel: Parcel = {
          id: nid('p'),
          trackingId,
          merchantId: merchant.id,
          serviceType: input.service,
          deliveryZone: priced.zone,
          recipient: input.recipient,
          weightKg: input.weightKg,
          category: input.category,
          description: input.description,
          itemsCount: input.itemsCount,
          codAmount: takaToPoisha(input.codTaka),
          productPrice: priced.productPrice,
          charges: {
            deliveryCharge: priced.deliveryCharge,
            damageControl: priced.damageControl,
            codFee: priced.codFee,
            returnCharge: priced.returnCharge,
            totalCharges: priced.totalCharges,
          },
          payableAmount: priced.payableAmount,
          currentStatus: 'BOOKED',
          currentBranchId: merchant.pickupBranchId,
          originBranchId: merchant.pickupBranchId,
          destinationBranchId: destinationBranchId(input.recipient.district, input.recipient.area, state.routes),
          statusHistory: [{ status: 'BOOKED', timestamp: now, actorId: user.id, branchId: merchant.pickupBranchId, note: 'Booked' }],
          deliveryAttempts: [],
          createdBy: user.id,
          createdAt: now,
          labelPrinted: false,
        }
        set({
          parcels: [parcel, ...state.parcels],
          toast: `Booked ${trackingId}`,
          audit: [{ id: nid('a'), timestamp: now, actorId: user.id, action: 'PARCEL_BOOKED', entity: trackingId, summary: `Created ${trackingId}` }, ...state.audit],
        })
        return trackingId
      },

      cancelParcel: (id, reason) => {
        const state = get()
        const user = me(state)
        const parcel = state.parcels.find((item) => item.id === id)
        if (!user || !parcel || !canAct(user.role, 'cancel')) return set({ toast: 'Not available for this role' })
        if (parcel.currentStatus !== 'BOOKED' && parcel.currentStatus !== 'PICKUP_ASSIGNED') {
          return set({ toast: 'This parcel can no longer be cancelled' })
        }
        move(set, get, parcel, 'CANCELLED', reason)
      },

      assignPickupRider: (parcelId, riderId) => {
        const state = get()
        const user = me(state)
        const parcel = state.parcels.find((item) => item.id === parcelId)
        const rider = state.riders.find((item) => item.id === riderId)
        if (!user || !parcel || !rider || !canAct(user.role, 'assignPickup')) return set({ toast: 'Not available for this role' })
        if (parcel.currentStatus !== 'BOOKED' && parcel.currentStatus !== 'PICKUP_ASSIGNED') return set({ toast: 'Pickup cannot be assigned now' })
        const now = new Date().toISOString()
        set({
          parcels: state.parcels.map((item) =>
            item.id === parcelId
              ? {
                  ...item,
                  assignedPickupRiderId: riderId,
                  currentStatus: 'PICKUP_ASSIGNED' as ParcelStatus,
                  statusHistory: [...item.statusHistory, { status: 'PICKUP_ASSIGNED' as ParcelStatus, timestamp: now, actorId: user.id, branchId: item.originBranchId, note: `Assigned ${rider.riderCode}` }],
                }
              : item,
          ),
          toast: `Pickup assigned to ${rider.riderCode}`,
          audit: [{ id: nid('a'), timestamp: now, actorId: user.id, action: 'PICKUP_ASSIGNED', entity: parcel.trackingId, summary: `Rider ${rider.riderCode}` }, ...state.audit],
        })
      },

      assignDeliveryRider: (parcelId, riderId) => {
        const state = get()
        const user = me(state)
        const parcel = state.parcels.find((item) => item.id === parcelId)
        const rider = state.riders.find((item) => item.id === riderId)
        if (!user || !parcel || !rider || !canAct(user.role, 'assignDelivery')) return set({ toast: 'Not available for this role' })
        if (parcel.currentStatus !== 'AT_DESTINATION_HUB' && parcel.currentStatus !== 'OUT_FOR_DELIVERY') {
          return set({ toast: 'Delivery rider can be assigned at the destination hub' })
        }
        const now = new Date().toISOString()
        set({
          parcels: state.parcels.map((item) =>
            item.id === parcelId
              ? {
                  ...item,
                  assignedDeliveryRiderId: riderId,
                  currentStatus: 'OUT_FOR_DELIVERY',
                  currentBranchId: item.destinationBranchId,
                  statusHistory: [...item.statusHistory, { status: 'OUT_FOR_DELIVERY' as ParcelStatus, timestamp: now, actorId: user.id, branchId: item.destinationBranchId, note: `Out with ${rider.riderCode}` }],
                }
              : item,
          ),
          toast: `Out for delivery with ${rider.riderCode}`,
          audit: [{ id: nid('a'), timestamp: now, actorId: user.id, action: 'DELIVERY_ASSIGNED', entity: parcel.trackingId, summary: `Rider ${rider.riderCode}` }, ...state.audit],
        })
      },

      markPickedUp: (id) => {
        const parcel = get().parcels.find((item) => item.id === id)
        const user = me(get())
        if (!user || !parcel || !canAct(user.role, 'pickupResult')) return set({ toast: 'Not available for this role' })
        if (parcel.currentStatus !== 'PICKUP_ASSIGNED') return set({ toast: 'Assign a rider before pickup' })
        move(set, get, parcel, 'PICKED_UP', 'Picked up')
      },

      failPickup: (id, reason) => {
        const parcel = get().parcels.find((item) => item.id === id)
        const user = me(get())
        if (!user || !parcel || !canAct(user.role, 'pickupResult')) return set({ toast: 'Not available for this role' })
        if (parcel.currentStatus !== 'PICKUP_ASSIGNED') return set({ toast: 'No assigned pickup' })
        move(set, get, parcel, 'PICKUP_FAILED', reason)
      },

      receiveAtHub: (trackingId) => {
        const state = get()
        const user = me(state)
        if (!user || !canAct(user.role, 'receive')) return 'Not available for this role'
        const hub = state.workingBranchId
        if (hub === 'all') return 'Select a hub in the branch switcher before receiving.'
        const parcel = state.parcels.find((item) => item.trackingId.toLowerCase() === trackingId.trim().toLowerCase())
        const hubName = state.branches.find((item) => item.id === hub)?.name ?? 'this hub'
        if (!parcel) return 'Tracking ID not found'
        if (parcel.currentStatus === 'PICKED_UP' && parcel.originBranchId === hub) {
          move(set, get, parcel, 'AT_ORIGIN_HUB', `Received at ${hubName}`)
          return ''
        }
        if (parcel.currentStatus === 'IN_TRANSIT' && parcel.destinationBranchId === hub) {
          move(set, get, parcel, 'AT_DESTINATION_HUB', `Received at ${hubName}`)
          return ''
        }
        return `Not expected at ${hubName}`
      },

      bagParcel: (parcelId, destBranchId) => {
        const state = get()
        const user = me(state)
        const parcel = state.parcels.find((item) => item.id === parcelId)
        if (!user || !parcel || !canAct(user.role, 'dispatch')) return set({ toast: 'Not available for this role' })
        if (parcel.currentStatus !== 'AT_ORIGIN_HUB' && parcel.currentStatus !== 'AT_DESTINATION_HUB') {
          return set({ toast: 'Parcel is not on the floor' })
        }
        set({
          parcels: state.parcels.map((item) => (item.id === parcelId ? { ...item, bagBranchId: destBranchId } : item)),
          toast: 'Added to bag',
        })
      },

      dispatchBag: (destBranchId) => {
        const state = get()
        const user = me(state)
        if (!user || !canAct(user.role, 'dispatch')) {
          set({ toast: 'Not available for this role' })
          return null
        }
        const hub = user.role === 'hub_manager' || user.role === 'branch_manager' ? user.branchId : state.workingBranchId
        if (!hub || hub === 'all') {
          set({ toast: 'Select the working hub first' })
          return null
        }
        const bag = state.parcels.filter((item) => item.bagBranchId === destBranchId && item.currentBranchId === hub && (item.currentStatus === 'AT_ORIGIN_HUB' || item.currentStatus === 'AT_DESTINATION_HUB'))
        if (bag.length === 0) {
          set({ toast: 'That bag is empty' })
          return null
        }
        const now = new Date().toISOString()
        const manifestNumber = `MF-${2400 + state.manifests.length + 1}`
        const id = nid('mf')
        set({
          manifests: [
            {
              id,
              manifestNumber,
              sourceBranchId: hub,
              destinationBranchId: destBranchId,
              parcelIds: bag.map((item) => item.id),
              status: 'in_transit',
              dispatchedAt: now,
              dispatchedBy: user.id,
            },
            ...state.manifests,
          ],
          parcels: state.parcels.map((item) =>
            bag.some((row) => row.id === item.id)
              ? {
                  ...item,
                  currentStatus: 'IN_TRANSIT' as ParcelStatus,
                  bagBranchId: undefined,
                  statusHistory: [...item.statusHistory, { status: 'IN_TRANSIT' as ParcelStatus, timestamp: now, actorId: user.id, branchId: hub, note: manifestNumber }],
                }
              : item,
          ),
          toast: `Dispatched ${manifestNumber}`,
          audit: [{ id: nid('a'), timestamp: now, actorId: user.id, action: 'MANIFEST_DISPATCHED', entity: manifestNumber, summary: `${bag.length} pieces` }, ...state.audit],
        })
        return manifestNumber
      },

      receiveManifest: (manifestId) => {
        const state = get()
        const user = me(state)
        const manifest = state.manifests.find((item) => item.id === manifestId)
        if (!user || !manifest || !canAct(user.role, 'receive')) return set({ toast: 'Not available for this role' })
        const hub = user.role === 'hub_manager' || user.role === 'branch_manager' ? user.branchId : state.workingBranchId
        if (manifest.destinationBranchId !== hub) return set({ toast: 'Set the branch switcher to the destination hub' })
        if (manifest.status === 'received') return set({ toast: 'Already received' })
        const now = new Date().toISOString()
        set({
          manifests: state.manifests.map((item) => (item.id === manifestId ? { ...item, status: 'received', receivedAt: now, receivedBy: user.id } : item)),
          parcels: state.parcels.map((item) =>
            manifest.parcelIds.includes(item.id)
              ? {
                  ...item,
                  currentStatus: 'AT_DESTINATION_HUB' as ParcelStatus,
                  currentBranchId: manifest.destinationBranchId,
                  statusHistory: [...item.statusHistory, { status: 'AT_DESTINATION_HUB' as ParcelStatus, timestamp: now, actorId: user.id, branchId: manifest.destinationBranchId, note: 'Manifest received' }],
                }
              : item,
          ),
          toast: `${manifest.manifestNumber} received`,
          audit: [{ id: nid('a'), timestamp: now, actorId: user.id, action: 'MANIFEST_RECEIVED', entity: manifest.manifestNumber, summary: 'Received in full' }, ...state.audit],
        })
      },

      flagManifestDiscrepancy: (manifestId) => {
        const state = get()
        const user = me(state)
        const manifest = state.manifests.find((item) => item.id === manifestId)
        if (!user || !manifest) return
        const now = new Date().toISOString()
        const parcel = state.parcels.find((item) => item.id === manifest.parcelIds[0])
        set({
          manifests: state.manifests.map((item) => (item.id === manifestId ? { ...item, status: 'discrepancy', note: 'Missing piece' } : item)),
          cases: [
            {
              id: nid('case'),
              caseNo: `CS-${1100 + state.cases.length}`,
              type: 'lost_damaged',
              parcelId: parcel?.id ?? '',
              merchantId: parcel?.merchantId ?? '',
              ownerId: user.id,
              priority: 'high',
              status: 'open',
              notes: [{ at: now, actorId: user.id, text: 'Manifest discrepancy' }],
              createdAt: now,
            },
            ...state.cases,
          ],
          toast: 'Discrepancy recorded',
        })
      },

      markDelivered: (id, amountTaka, method) => {
        const state = get()
        const user = me(state)
        const parcel = state.parcels.find((item) => item.id === id)
        if (!user || !parcel || !canAct(user.role, 'deliver')) return set({ toast: 'Not available for this role' })
        if (parcel.currentStatus !== 'OUT_FOR_DELIVERY') return set({ toast: 'Parcel is not out for delivery' })
        if (state.collections.some((item) => item.parcelId === id)) return set({ toast: 'COD already recorded' })
        const collected = takaToPoisha(amountTaka)
        if (parcel.codAmount > 0 && amountTaka < 0) return set({ toast: 'Enter the collected amount' })
        const now = new Date().toISOString()
        const riderId = parcel.assignedDeliveryRiderId ?? ''
        const collection =
          parcel.codAmount > 0
            ? {
                id: nid('c'),
                parcelId: id,
                riderId,
                amountCollected: collected,
                expected: parcel.codAmount,
                paymentMethod: method,
                collectedAt: now,
                handoverStatus: 'pending' as const,
              }
            : null
        const short = parcel.codAmount > 0 && collected < parcel.codAmount
        const ledger =
          collection && collected === parcel.codAmount
            ? [
                { id: nid('l'), batchId: nid('batch'), accountType: 'cod_receivable' as const, type: 'DEBIT' as const, amount: collected, description: `COD ${parcel.trackingId}`, parcelId: id, createdAt: now, createdBy: user.id },
                { id: nid('l'), batchId: 'same', accountType: 'merchant_payable' as const, type: 'CREDIT' as const, amount: parcel.payableAmount, description: `Payable ${parcel.trackingId}`, parcelId: id, createdAt: now, createdBy: user.id },
                { id: nid('l'), batchId: 'same', accountType: 'courier_revenue' as const, type: 'CREDIT' as const, amount: parcel.charges.totalCharges, description: `Charges ${parcel.trackingId}`, parcelId: id, createdAt: now, createdBy: user.id },
              ]
            : []
        const batch = ledger[0]?.batchId
        const balanced = ledger.map((entry, index) => (index === 0 ? entry : { ...entry, batchId: batch ?? entry.batchId }))
        set({
          parcels: state.parcels.map((item) =>
            item.id === id
              ? {
                  ...item,
                  currentStatus: 'DELIVERED',
                  statusHistory: [...item.statusHistory, { status: 'DELIVERED' as ParcelStatus, timestamp: now, actorId: user.id, branchId: item.currentBranchId, note: method }],
                }
              : item,
          ),
          collections: collection ? [collection, ...state.collections] : state.collections,
          ledger: [...balanced, ...state.ledger],
          cases: short
            ? [
                {
                  id: nid('case'),
                  caseNo: `CS-${1200 + state.cases.length}`,
                  type: 'cod_dispute' as const,
                  parcelId: id,
                  merchantId: parcel.merchantId,
                  ownerId: user.id,
                  priority: 'high' as const,
                  status: 'open' as const,
                  notes: [{ at: now, actorId: user.id, text: 'Collected less than expected COD' }],
                  createdAt: now,
                },
                ...state.cases,
              ]
            : state.cases,
          toast: short ? 'Delivered with a short COD. A dispute case is open.' : 'Marked delivered',
          audit: [{ id: nid('a'), timestamp: now, actorId: user.id, action: 'DELIVERED', entity: parcel.trackingId, summary: `Collected ${amountTaka}` }, ...state.audit],
        })
      },

      failDelivery: (id, reason) => {
        const state = get()
        const user = me(state)
        const parcel = state.parcels.find((item) => item.id === id)
        if (!user || !parcel || !canAct(user.role, 'deliver')) return set({ toast: 'Not available for this role' })
        if (parcel.currentStatus !== 'OUT_FOR_DELIVERY') return set({ toast: 'Parcel is not out for delivery' })
        const now = new Date().toISOString()
        const attempt = parcel.deliveryAttempts.length + 1
        const failed = attempt >= 3
        set({
          parcels: state.parcels.map((item) =>
            item.id === id
              ? {
                  ...item,
                  currentStatus: failed ? 'DELIVERY_FAILED' : item.currentStatus,
                  deliveryAttempts: [...item.deliveryAttempts, { attemptNumber: attempt, attemptedAt: now, riderId: item.assignedDeliveryRiderId ?? '', reason, note: '' }],
                  statusHistory: failed
                    ? [...item.statusHistory, { status: 'DELIVERY_FAILED' as ParcelStatus, timestamp: now, actorId: user.id, branchId: item.currentBranchId, note: reason }]
                    : item.statusHistory,
                }
              : item,
          ),
          toast: failed ? 'Third attempt failed' : 'Attempt recorded',
          audit: [{ id: nid('a'), timestamp: now, actorId: user.id, action: 'DELIVERY_FAILED', entity: parcel.trackingId, summary: reason }, ...state.audit],
        })
      },

      startReturn: (id) => {
        const parcel = get().parcels.find((item) => item.id === id)
        const user = me(get())
        if (!user || !parcel || !canAct(user.role, 'returns')) return set({ toast: 'Not available for this role' })
        if (parcel.currentStatus !== 'DELIVERY_FAILED' && parcel.currentStatus !== 'AT_DESTINATION_HUB' && parcel.currentStatus !== 'AT_ORIGIN_HUB') {
          return set({ toast: 'Return cannot start from this status' })
        }
        move(set, get, parcel, 'RETURN_INITIATED', 'Return to merchant')
      },

      advanceReturn: (id) => {
        const parcel = get().parcels.find((item) => item.id === id)
        const user = me(get())
        if (!user || !parcel || !canAct(user.role, 'returns')) return set({ toast: 'Not available for this role' })
        if (parcel.currentStatus === 'RETURN_INITIATED') move(set, get, parcel, 'RETURNING', 'On the way back')
        else if (parcel.currentStatus === 'RETURNING') move(set, get, parcel, 'RETURNED', 'Merchant received the return')
        else set({ toast: 'Nothing to advance' })
      },

      overrideStatus: (id, status, reason) => {
        const parcel = get().parcels.find((item) => item.id === id)
        const user = me(get())
        if (!user || !parcel || !canAct(user.role, 'override')) return set({ toast: 'Only Super Admin can override' })
        if (!reason.trim()) return set({ toast: 'A reason is required' })
        move(set, get, parcel, status, `Override: ${reason}`)
      },

      markLabelPrinted: (id) => {
        set({ parcels: get().parcels.map((item) => (item.id === id ? { ...item, labelPrinted: true } : item)) })
      },

      createMerchant: (input) => {
        const user = me(get())
        if (!user || !canAct(user.role, 'merchantWrite')) return set({ toast: 'Not available for this role' })
        const now = new Date().toISOString()
        const code = `M-${200 + get().merchants.length}`
        set({
          merchants: [
            {
              id: nid('m'),
              businessName: input.businessName,
              merchantCode: code,
              contactName: input.contactName,
              phone: input.phone,
              email: '',
              district: input.district,
              area: input.area,
              street: input.street,
              pickupBranchId: 'b-mir',
              status: 'pending',
              paymentMethod: 'bkash',
              notes: '',
              createdAt: now,
            },
            ...get().merchants,
          ],
          toast: `${input.businessName} is pending verification`,
        })
      },

      setMerchantStatus: (id, status) => {
        const user = me(get())
        if (!user || !canAct(user.role, 'merchantWrite')) return set({ toast: 'Not available for this role' })
        const merchant = get().merchants.find((item) => item.id === id)
        set({
          merchants: get().merchants.map((item) => (item.id === id ? { ...item, status } : item)),
          toast: `Merchant ${status}`,
          audit: [{ id: nid('a'), timestamp: new Date().toISOString(), actorId: user.id, action: 'MERCHANT_STATUS', entity: merchant?.merchantCode ?? id, summary: status }, ...get().audit],
        })
      },

      createCase: (input) => {
        const state = get()
        const user = me(state)
        const parcel = state.parcels.find((item) => item.id === input.parcelId)
        if (!user || !parcel) return
        const now = new Date().toISOString()
        set({
          cases: [
            {
              id: nid('case'),
              caseNo: `CS-${1300 + state.cases.length}`,
              type: input.type,
              parcelId: parcel.id,
              merchantId: parcel.merchantId,
              ownerId: user.id,
              priority: 'normal',
              status: 'open',
              notes: [{ at: now, actorId: user.id, text: input.note }],
              createdAt: now,
            },
            ...state.cases,
          ],
          toast: 'Case opened',
        })
      },

      updateCase: (id, status, note) => {
        const user = me(get())
        if (!user) return
        if (status === 'resolved' && !note.trim()) return set({ toast: 'Add a resolution note' })
        const now = new Date().toISOString()
        set({
          cases: get().cases.map((item) =>
            item.id === id ? { ...item, status, notes: [...item.notes, { at: now, actorId: user.id, text: note || status }] } : item,
          ),
          toast: status === 'resolved' ? 'Case resolved' : 'Case updated',
        })
      },

      addStaff: (input) => {
        const user = me(get())
        if (!user || !canAct(user.role, 'staffWrite')) return set({ toast: 'Not available for this role' })
        set({
          users: [
            ...get().users,
            {
              id: nid('u'),
              name: input.name,
              email: `${input.name.split(' ')[0]?.toLowerCase() ?? 'staff'}@nirapod.test`,
              role: input.role,
              roleLabel: input.role,
              job: 'Added in the demo',
              branchId: input.branchId,
              status: 'active',
              persona: false,
            },
          ],
          toast: 'Staff added',
        })
      },

      setUserStatus: (id, status) => {
        const user = me(get())
        if (!user || !canAct(user.role, 'staffWrite')) return set({ toast: 'Not available for this role' })
        set({ users: get().users.map((item) => (item.id === id ? { ...item, status } : item)) })
      },

      updateStaff: (id, patch) => {
        const user = me(get())
        if (!user || !canAct(user.role, 'staffWrite')) return set({ toast: 'Not available for this role' })
        if (id === user.id && patch.role && patch.role !== user.role) return set({ toast: 'You cannot change your own role' })
        set({
          users: get().users.map((item) => (item.id === id ? { ...item, ...patch } : item)),
          toast: 'Staff record updated',
        })
      },

      setRiderDuty: (id, available) => {
        const user = me(get())
        if (!user || !canAct(user.role, 'assignPickup')) return set({ toast: 'Not available for this role' })
        set({
          riders: get().riders.map((item) => (item.id === id ? { ...item, isAvailable: available, status: available ? 'active' : item.status } : item)),
          toast: available ? 'Rider is on duty' : 'Rider is off duty',
        })
      },

      setRouteHub: (routeId, hubId) => {
        const user = me(get())
        const route = get().routes.find((item) => item.id === routeId)
        const hub = get().branches.find((item) => item.id === hubId)
        if (!user || !canAct(user.role, 'branchWrite')) return set({ toast: 'Only Super Admin can change hub routing' })
        if (!route || !hub) return
        const inside = route.kind === 'dhaka_zone'
        if (inside && hub.network !== 'inside_dhaka') return set({ toast: 'A Dhaka zone stays on a Dhaka hub' })
        if (!inside && hub.network !== 'outside_dhaka') return set({ toast: 'An outside city stays on an outside hub' })
        set({
          routes: get().routes.map((item) => (item.id === routeId ? { ...item, hubId } : item)),
          toast: 'Hub routing updated',
        })
      },

      addBranch: (input) => {
        const user = me(get())
        if (!user || !canAct(user.role, 'branchWrite')) return set({ toast: 'Not available for this role' })
        set({
          branches: [...get().branches, { id: nid('b'), name: input.name, code: input.code, type: input.type, network: input.network, district: input.district, phone: '', street: '', isActive: true }],
          toast: 'Branch added',
        })
      },

      updateRate: (rate) => {
        const user = me(get())
        if (!user || !canAct(user.role, 'rateWrite')) return set({ toast: 'Not available for this role' })
        set({ rate, toast: 'Rate card saved' })
      },

      updateSettings: (patch) => {
        const user = me(get())
        if (!user || !canAct(user.role, 'settingsWrite')) return set({ toast: 'Not available for this role' })
        set({ settings: { ...get().settings, ...patch }, toast: 'Settings saved' })
      },

      verifyHandover: (id, status, note) => {
        const state = get()
        const user = me(state)
        const handover = state.handovers.find((item) => item.id === id)
        if (!user || !handover || !canAct(user.role, 'financeWrite')) return set({ toast: 'Not available for this role' })
        if (status === 'disputed' && !note.trim()) return set({ toast: 'A dispute needs a note' })
        const now = new Date().toISOString()
        const parcel = state.parcels.find((item) => state.collections.some((collection) => collection.handoverId === id && collection.parcelId === item.id))
        set({
          handovers: state.handovers.map((item) => (item.id === id ? { ...item, status, note } : item)),
          collections: state.collections.map((item) =>
            item.handoverId === id ? { ...item, handoverStatus: status === 'verified' ? 'reconciled' : item.handoverStatus } : item,
          ),
          cases:
            status === 'disputed'
              ? [
                  {
                    id: nid('case'),
                    caseNo: `CS-${1400 + state.cases.length}`,
                    type: 'cod_dispute' as const,
                    parcelId: parcel?.id ?? '',
                    merchantId: parcel?.merchantId ?? '',
                    ownerId: user.id,
                    priority: 'high' as const,
                    status: 'open' as const,
                    notes: [{ at: now, actorId: user.id, text: note }],
                    createdAt: now,
                  },
                  ...state.cases,
                ]
              : state.cases,
          toast: status === 'verified' ? 'Handover verified' : 'Handover disputed',
          audit: [{ id: nid('a'), timestamp: now, actorId: user.id, action: 'HANDOVER', entity: id, summary: status }, ...state.audit],
        })
      },

      submitSettlement: (id) => {
        const user = me(get())
        const row = get().settlements.find((item) => item.id === id)
        if (!user || !row || !canAct(user.role, 'financeWrite')) return set({ toast: 'Not available for this role' })
        if (row.payoutStatus !== 'draft') return set({ toast: 'Only a draft can be submitted' })
        const now = new Date().toISOString()
        set({
          settlements: get().settlements.map((item) => (item.id === id ? { ...item, payoutStatus: 'pending_approval' } : item)),
          toast: 'Submitted for approval',
          audit: [{ id: nid('a'), timestamp: now, actorId: user.id, action: 'SETTLEMENT_SUBMITTED', entity: id, summary: 'Pending approval' }, ...get().audit],
        })
      },

      approveSettlement: (id) => {
        const user = me(get())
        if (!user || !canAct(user.role, 'approveSettlement')) return set({ toast: 'Only Super Admin can approve' })
        const now = new Date().toISOString()
        set({
          settlements: get().settlements.map((item) => (item.id === id ? { ...item, payoutStatus: 'approved', approvedBy: user.id } : item)),
          toast: 'Settlement approved',
          audit: [{ id: nid('a'), timestamp: now, actorId: user.id, action: 'SETTLEMENT_APPROVED', entity: id, summary: 'Approved' }, ...get().audit],
        })
      },

      rejectSettlement: (id, note) => {
        const user = me(get())
        if (!user || !canAct(user.role, 'approveSettlement')) return set({ toast: 'Only Super Admin can reject' })
        set({
          settlements: get().settlements.map((item) => (item.id === id ? { ...item, payoutStatus: 'draft', note } : item)),
          toast: 'Returned to draft',
        })
      },

      disburseSettlement: (id, reference, method) => {
        const state = get()
        const user = me(state)
        const row = state.settlements.find((item) => item.id === id)
        if (!user || !row || !canAct(user.role, 'disburse')) return set({ toast: 'Not available for this role' })
        if (row.payoutStatus !== 'approved') return set({ toast: 'Approve the settlement first' })
        if (!reference.trim()) return set({ toast: 'A payment reference is required' })
        const now = new Date().toISOString()
        const batch = nid('batch')
        set({
          settlements: state.settlements.map((item) =>
            item.id === id ? { ...item, payoutStatus: 'disbursed', paymentReference: reference, paymentMethod: method } : item,
          ),
          ledger: [
            { id: nid('l'), batchId: batch, accountType: 'merchant_payable', type: 'DEBIT', amount: row.netPayable, description: `Payout ${reference}`, createdAt: now, createdBy: user.id },
            { id: nid('l'), batchId: batch, accountType: 'cash_in_hand', type: 'CREDIT', amount: row.netPayable, description: `Payout ${reference}`, createdAt: now, createdBy: user.id },
            ...state.ledger,
          ],
          toast: 'Payout recorded',
          audit: [{ id: nid('a'), timestamp: now, actorId: user.id, action: 'SETTLEMENT_DISBURSED', entity: reference, summary: method }, ...state.audit],
        })
      },

      requestAdjustment: (amountTaka, description) => {
        const user = me(get())
        if (!user || !canAct(user.role, 'financeWrite')) return set({ toast: 'Not available for this role' })
        set({
          adjustments: [
            { id: nid('adj'), amount: takaToPoisha(amountTaka), description, status: 'pending', createdBy: user.id, createdAt: new Date().toISOString() },
            ...get().adjustments,
          ],
          toast: 'Adjustment requested',
        })
      },

      approveAdjustment: (id) => {
        const state = get()
        const user = me(state)
        const row = state.adjustments.find((item) => item.id === id)
        if (!user || !row || !canAct(user.role, 'override')) return set({ toast: 'Only Super Admin can approve' })
        const now = new Date().toISOString()
        const batch = nid('batch')
        set({
          adjustments: state.adjustments.map((item) => (item.id === id ? { ...item, status: 'approved' } : item)),
          ledger: [
            { id: nid('l'), batchId: batch, accountType: 'merchant_payable', type: 'DEBIT', amount: row.amount, description: row.description, createdAt: now, createdBy: user.id },
            { id: nid('l'), batchId: batch, accountType: 'courier_revenue', type: 'CREDIT', amount: row.amount, description: row.description, createdAt: now, createdBy: user.id },
            ...state.ledger,
          ],
          toast: 'Adjustment posted',
          audit: [{ id: nid('a'), timestamp: now, actorId: user.id, action: 'ADJUSTMENT', entity: id, summary: row.description }, ...state.audit],
        })
      },
    }),
    {
      name: 'nirapod-operations-demo',
      version: 7,
      migrate: () => createSeed(),
      partialize: (state) => ({
        users: state.users,
        branches: state.branches,
        merchants: state.merchants,
        riders: state.riders,
        parcels: state.parcels,
        collections: state.collections,
        handovers: state.handovers,
        settlements: state.settlements,
        ledger: state.ledger,
        adjustments: state.adjustments,
        cases: state.cases,
        manifests: state.manifests,
        audit: state.audit,
        alerts: state.alerts,
        settings: state.settings,
        rate: state.rate,
        routes: state.routes,
        sessionUserId: state.sessionUserId,
        workingBranchId: state.workingBranchId,
        seenAlertIds: state.seenAlertIds,
      }),
    },
  ),
)

const selectState = (state: DemoState) => state

export function useDemo(): DemoState
export function useDemo<T>(selector: (state: DemoState) => T): T
export function useDemo<T>(selector?: (state: DemoState) => T): T {
  return useSyncExternalStoreWithSelector(
    demoStore.subscribe,
    demoStore.getState,
    demoStore.getState,
    selector ?? (selectState as (state: DemoState) => T),
  )
}

useDemo.getState = demoStore.getState

function move(
  set: (partial: Partial<DemoState>) => void,
  get: () => DemoState,
  parcel: Parcel,
  status: ParcelStatus,
  note: string,
) {
  const state = get()
  const user = me(state)
  if (!user) return
  const now = new Date().toISOString()
  set({
    parcels: state.parcels.map((item) =>
      item.id === parcel.id
        ? {
            ...item,
            currentStatus: status,
            statusHistory: [...item.statusHistory, { status, timestamp: now, actorId: user.id, branchId: item.currentBranchId, note }],
          }
        : item,
    ),
    toast: note,
    audit: [{ id: nid('a'), timestamp: now, actorId: user.id, action: 'PARCEL_STATUS_UPDATE', entity: parcel.trackingId, summary: `${parcel.currentStatus} → ${status}` }, ...state.audit],
  })
}
