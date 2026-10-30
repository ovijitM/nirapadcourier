import type { DemoData, Parcel, RoleId, User } from '../mock/types.ts'

export function sessionBranch(user: User, working: string) {
  if (user.role === 'branch_manager' || user.role === 'hub_manager') return user.branchId ?? working
  return working
}

export function parcelInScope(parcel: Parcel, user: User, working: string) {
  if (user.role === 'booking') return parcel.createdBy === user.id
  const branch = sessionBranch(user, working)
  if (branch === 'all') return true
  return (
    parcel.currentBranchId === branch ||
    parcel.originBranchId === branch ||
    parcel.destinationBranchId === branch
  )
}

export function visibleParcels(data: Pick<DemoData, 'parcels'>, user: User, working: string) {
  return data.parcels.filter((parcel) => parcelInScope(parcel, user, working))
}

export function recordInFocus(branchId: string | null | undefined, user: User | undefined, working: string) {
  const focus = user ? sessionBranch(user, working) : working
  if (focus === 'all') return true
  return branchId === focus
}

export function defaultBranch(role: RoleId, branchId: string | null) {
  if (role === 'branch_manager' || role === 'hub_manager') return branchId ?? 'all'
  return 'all'
}

export function caseVisible(
  type: string,
  parcel: Parcel | undefined,
  user: User,
  working: string,
) {
  if (user.role === 'hub_manager') return type === 'lost_damaged'
  if (user.role === 'accounts') return type === 'cod_dispute'
  if (!parcel) return user.role === 'super_admin' || user.role === 'operations'
  return parcelInScope(parcel, user, working)
}
