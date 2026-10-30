import type { ParcelStatus, RoleId } from '../mock/types.ts'

export const STATUS_LABEL: Record<ParcelStatus, string> = {
  BOOKED: 'Booked',
  PICKUP_ASSIGNED: 'Pickup assigned',
  PICKED_UP: 'Picked up',
  PICKUP_FAILED: 'Pickup failed',
  AT_ORIGIN_HUB: 'At origin hub',
  IN_TRANSIT: 'In transit',
  AT_DESTINATION_HUB: 'At destination hub',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  DELIVERY_FAILED: 'Delivery failed',
  RETURN_INITIATED: 'Return initiated',
  RETURNING: 'Returning',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
}

export function statusClass(status: ParcelStatus) {
  if (status === 'BOOKED' || status === 'PICKUP_ASSIGNED') return 'bg-slate-100 text-slate-700'
  if (status === 'DELIVERED' || status === 'RETURNED') return 'bg-emerald-100 text-emerald-800'
  if (status === 'CANCELLED' || status === 'DELIVERY_FAILED' || status === 'PICKUP_FAILED') return 'bg-red-100 text-red-800'
  if (status === 'RETURN_INITIATED' || status === 'RETURNING') return 'bg-violet-100 text-violet-800'
  return 'bg-blue-100 text-blue-800'
}

export const FAIL_REASONS = [
  'customer_unreachable',
  'customer_refused',
  'wrong_address',
  'incomplete_address',
  'recipient_rescheduled',
  'hold_at_hub',
] as const

export function reasonLabel(reason: string) {
  return reason.replaceAll('_', ' ')
}

const HUB: RoleId[] = ['super_admin', 'operations', 'branch_manager', 'hub_manager']

export function canAct(role: RoleId, action: string) {
  const map: Record<string, RoleId[]> = {
    book: ['super_admin', 'operations', 'branch_manager', 'booking'],
    cancel: ['super_admin', 'operations', 'branch_manager', 'booking'],
    assignPickup: ['super_admin', 'operations', 'branch_manager'],
    pickupResult: ['super_admin', 'operations', 'branch_manager'],
    receive: HUB,
    dispatch: HUB,
    assignDelivery: ['super_admin', 'operations', 'branch_manager'],
    deliver: ['super_admin', 'operations', 'branch_manager'],
    returns: ['super_admin', 'operations', 'branch_manager', 'hub_manager'],
    override: ['super_admin'],
    merchantWrite: ['super_admin', 'operations'],
    staffWrite: ['super_admin'],
    branchWrite: ['super_admin'],
    rateWrite: ['super_admin'],
    settingsWrite: ['super_admin'],
    financeWrite: ['accounts'],
    approveSettlement: ['super_admin'],
    disburse: ['accounts'],
    auditFinance: ['super_admin', 'operations', 'accounts'],
  }
  return (map[action] ?? []).includes(role)
}

export function canSwitchBranch(role: RoleId) {
  return role === 'super_admin' || role === 'operations' || role === 'accounts'
}
