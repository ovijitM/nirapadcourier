import { Building2, FileText, Package, Printer, RotateCcw, Settings, Store, Truck, Users, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatTaka, todayDhaka, dhakaDate } from '../../lib/money.ts'
import { visibleParcels } from '../../lib/scope.ts'
import { roleCards } from '../../nav/modules.ts'
import { useDemo } from '../../mock/store.ts'
import type { DemoState } from '../../mock/store.ts'
import type { User } from '../../mock/types.ts'

const palette = [
  { card: 'bg-[#E7F4EF] text-[#0F6E56]', icon: 'bg-white text-[#0F6E56]' },
  { card: 'bg-blue-100 text-blue-900', icon: 'bg-white text-blue-700' },
  { card: 'bg-violet-100 text-violet-900', icon: 'bg-white text-violet-700' },
  { card: 'bg-amber-100 text-amber-950', icon: 'bg-white text-amber-700' },
  { card: 'bg-cyan-100 text-cyan-950', icon: 'bg-white text-cyan-700' },
  { card: 'bg-rose-100 text-rose-900', icon: 'bg-white text-rose-700' },
  { card: 'bg-emerald-100 text-emerald-950', icon: 'bg-white text-emerald-700' },
  { card: 'bg-orange-100 text-orange-950', icon: 'bg-white text-orange-700' },
  { card: 'bg-indigo-100 text-indigo-950', icon: 'bg-white text-indigo-700' },
  { card: 'bg-pink-100 text-pink-950', icon: 'bg-white text-pink-700' },
  { card: 'bg-teal-100 text-teal-950', icon: 'bg-white text-teal-700' },
  { card: 'bg-lime-100 text-lime-950', icon: 'bg-white text-lime-800' },
]

const icons: Record<string, typeof Package> = {
  Branches: Building2,
  Branch: Building2,
  Staff: Users,
  Merchants: Store,
  Riders: Truck,
  Parcels: Package,
  Hub: Package,
  'Hub floor': Package,
  Cases: FileText,
  Incidents: FileText,
  Finance: Wallet,
  Pricing: FileText,
  Settings: Settings,
  Pickups: Truck,
  Deliveries: Truck,
  Returns: RotateCcw,
  Bookings: Package,
  Labels: Printer,
  Recipients: Users,
  COD: Wallet,
  Handovers: Wallet,
  Settlements: Wallet,
  Ledger: FileText,
  Manifests: FileText,
}

export function HomePage() {
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const state = useDemo()
  const navigate = useNavigate()
  if (!user) return null
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const scope = user.branchId ? state.branches.find((branch) => branch.id === user.branchId)?.name : state.workingBranchId === 'all' ? 'All branches' : state.branches.find((branch) => branch.id === state.workingBranchId)?.name
  const cards = roleCards[user.role]
  const figures = summary(user, state)

  return (
    <div>
      <h1 className="text-2xl font-semibold">
        {hello}, {user.name.split(' ')[0]}
      </h1>
      <p className="mt-1 text-sm text-[#5C6570]">
        {user.roleLabel} · {scope}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {figures.map((item) => (
          <div key={item.label} className="rounded-xl border border-[#E6E8EC] bg-white px-4 py-3">
            <div className="text-xs text-[#5C6570]">{item.label}</div>
            <div className="tabular mt-1 text-2xl font-semibold">{item.value}</div>
          </div>
        ))}
      </div>
      <h2 className="mb-3 mt-8 text-sm font-medium text-[#5C6570]">Modules</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = icons[card.label] ?? Package
          const tone = palette[index % palette.length]!
          const stat = cardStat(card.stat, user, state)
          return (
            <button
              key={card.href + card.label}
              className={`rounded-xl border border-black p-4 text-left hover:brightness-95 ${tone.card}`}
              onClick={() => navigate(card.href)}
              type="button"
            >
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone.icon}`}>
                <Icon size={18} />
              </span>
              <div className="mt-3 font-semibold">{card.label}</div>
              <div className="tabular mt-1 text-xl">{stat.figure}</div>
              <div className="text-sm opacity-70">{stat.hint}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function scoped(user: User, state: DemoState) {
  return visibleParcels(state, user, state.workingBranchId)
}

function summary(user: User, state: DemoState) {
  const parcels = scoped(user, state)
  const today = todayDhaka()
  if (user.role === 'super_admin') {
    return [
      { label: 'Booked today', value: String(parcels.filter((parcel) => dhakaDate(parcel.createdAt) === today).length) },
      { label: 'In network', value: String(parcels.filter((parcel) => !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(parcel.currentStatus)).length) },
      { label: 'Settlements to approve', value: String(state.settlements.filter((item) => item.payoutStatus === 'pending_approval' && settlementHere(state, item.merchantId)).length) },
      { label: 'Open cases', value: String(state.cases.filter((item) => item.status === 'open').length) },
    ]
  }
  if (user.role === 'operations' || user.role === 'branch_manager') {
    return [
      { label: 'Pickups waiting', value: String(parcels.filter((parcel) => parcel.currentStatus === 'BOOKED').length) },
      { label: user.role === 'branch_manager' ? 'Out for delivery' : 'At a hub', value: String(parcels.filter((parcel) => (user.role === 'branch_manager' ? parcel.currentStatus === 'OUT_FOR_DELIVERY' : parcel.currentStatus === 'AT_ORIGIN_HUB' || parcel.currentStatus === 'AT_DESTINATION_HUB')).length) },
      { label: user.role === 'branch_manager' ? 'Parcels at Mirpur' : 'Out for delivery', value: String(parcels.filter((parcel) => (user.role === 'branch_manager' ? parcel.currentBranchId === 'b-mir' : parcel.currentStatus === 'OUT_FOR_DELIVERY')).length) },
      { label: user.role === 'branch_manager' ? 'Open cases' : 'Failed today', value: String(user.role === 'branch_manager' ? state.cases.filter((item) => item.status === 'open').length : parcels.filter((parcel) => parcel.currentStatus === 'DELIVERY_FAILED').length) },
    ]
  }
  if (user.role === 'hub_manager') {
    const hub = user.branchId
    return [
      { label: 'To receive', value: String(parcels.filter((parcel) => parcel.currentStatus === 'PICKED_UP' && parcel.originBranchId === hub).length) },
      { label: 'To sort', value: String(parcels.filter((parcel) => (parcel.currentStatus === 'AT_ORIGIN_HUB' || parcel.currentStatus === 'AT_DESTINATION_HUB') && !parcel.bagBranchId).length) },
      { label: 'Bags open', value: String(new Set(parcels.filter((parcel) => parcel.bagBranchId).map((parcel) => parcel.bagBranchId)).size) },
      { label: 'Manifests in transit', value: String(state.manifests.filter((item) => item.status === 'in_transit').length) },
    ]
  }
  if (user.role === 'booking') {
    const mine = parcels.filter((parcel) => parcel.createdBy === user.id)
    return [
      { label: 'Booked by me today', value: String(mine.filter((parcel) => dhakaDate(parcel.createdAt) === today).length) },
      { label: 'Labels to print', value: String(mine.filter((parcel) => !parcel.labelPrinted).length) },
      { label: 'COD bookings', value: String(mine.filter((parcel) => parcel.codAmount > 0).length) },
      { label: 'Active merchants', value: String(state.merchants.filter((item) => item.status === 'active').length) },
    ]
  }
  const inHand = state.collections.filter((item) => item.handoverStatus === 'pending' && cashHere(state, item.riderId)).reduce((sum, item) => sum + item.amountCollected, 0)
  return [
    { label: 'COD in rider hands', value: formatTaka(inHand) },
    { label: 'Handovers to verify', value: String(state.handovers.filter((item) => item.status === 'pending' && here(state, item.branchId)).length) },
    { label: 'Net payable', value: formatTaka(state.settlements.filter((item) => (item.payoutStatus === 'draft' || item.payoutStatus === 'approved') && settlementHere(state, item.merchantId)).reduce((sum, item) => sum + item.netPayable, 0)) },
    { label: 'Awaiting approval', value: String(state.settlements.filter((item) => item.payoutStatus === 'pending_approval' && settlementHere(state, item.merchantId)).length) },
  ]
}

function focusBranch(user: User, state: DemoState) {
  return user.branchId ?? state.workingBranchId
}

function here(state: DemoState, branchId: string | undefined) {
  return state.workingBranchId === 'all' || branchId === state.workingBranchId
}

function cashHere(state: DemoState, riderId: string) {
  return here(state, state.riders.find((rider) => rider.id === riderId)?.branchId)
}

function settlementHere(state: DemoState, merchantId: string) {
  return here(state, state.merchants.find((merchant) => merchant.id === merchantId)?.pickupBranchId)
}

function cardStat(key: string, user: User, state: DemoState) {
  const parcels = scoped(user, state)
  const branch = focusBranch(user, state)
  const atBranch = (id: string | null | undefined) => branch === 'all' || id === branch
  const map: Record<string, { figure: string; hint: string }> = {
    branches: { figure: String(state.branches.filter((item) => item.isActive).length), hint: 'Active locations' },
    branchName: { figure: 'Mirpur Hub', hint: 'Your branch' },
    staff: { figure: String(state.users.filter((item) => item.status === 'active' && atBranch(item.branchId)).length), hint: 'Active staff' },
    merchantsPending: { figure: String(state.merchants.filter((item) => item.status === 'pending' && atBranch(item.pickupBranchId)).length), hint: 'Pending verification' },
    merchantsActive: { figure: String(state.merchants.filter((item) => item.status === 'active' && atBranch(item.pickupBranchId)).length), hint: 'Active shops' },
    ridersOnDuty: { figure: String(state.riders.filter((item) => item.isAvailable && atBranch(item.branchId)).length), hint: 'On duty' },
    ridersCash: { figure: String(new Set(state.collections.filter((item) => item.handoverStatus === 'pending' && cashHere(state, item.riderId)).map((item) => item.riderId)).size), hint: 'Riders with cash' },
    parcelsLive: { figure: String(parcels.filter((parcel) => !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(parcel.currentStatus)).length), hint: 'Live parcels' },
    hubWaiting: { figure: String(parcels.filter((parcel) => parcel.currentStatus === 'AT_ORIGIN_HUB' || parcel.currentStatus === 'AT_DESTINATION_HUB' || parcel.currentStatus === 'PICKED_UP').length), hint: 'Waiting on the floor' },
    casesOpen: { figure: String(state.cases.filter((item) => item.status === 'open').length), hint: 'Open cases' },
    incidents: { figure: String(state.cases.filter((item) => item.type === 'lost_damaged' && item.status === 'open').length), hint: 'Open incidents' },
    financeUrgent: { figure: String(state.settlements.filter((item) => item.payoutStatus === 'pending_approval' && settlementHere(state, item.merchantId)).length), hint: 'Waiting for approval' },
    pricing: { figure: 'Standard 2026', hint: 'Active rate card' },
    settings: { figure: state.settings.name, hint: 'Company profile' },
    pickupsWaiting: { figure: String(parcels.filter((parcel) => parcel.currentStatus === 'BOOKED').length), hint: 'Waiting for a rider' },
    outForDelivery: { figure: String(parcels.filter((parcel) => parcel.currentStatus === 'OUT_FOR_DELIVERY').length), hint: `${parcels.filter((parcel) => parcel.currentStatus === 'DELIVERY_FAILED').length} failed` },
    returns: { figure: String(parcels.filter((parcel) => parcel.currentStatus === 'RETURN_INITIATED' || parcel.currentStatus === 'RETURNING').length), hint: 'In progress' },
    bookedToday: { figure: String(parcels.filter((parcel) => dhakaDate(parcel.createdAt) === todayDhaka()).length), hint: 'Booked today' },
    labelsToPrint: { figure: String(parcels.filter((parcel) => !parcel.labelPrinted).length), hint: 'Not printed' },
    recipients: { figure: String(new Set(state.parcels.map((parcel) => parcel.recipient.phone)).size), hint: 'Known phones' },
    codInHand: { figure: formatTaka(state.collections.filter((item) => item.handoverStatus === 'pending' && cashHere(state, item.riderId)).reduce((sum, item) => sum + item.amountCollected, 0)), hint: 'Still with riders' },
    handoversPending: { figure: String(state.handovers.filter((item) => item.status === 'pending' && here(state, item.branchId)).length), hint: 'To verify' },
    settlementsDraft: { figure: String(state.settlements.filter((item) => item.payoutStatus === 'draft' && settlementHere(state, item.merchantId)).length), hint: 'Drafts' },
    ledger: { figure: ledgerLabel(state), hint: branch === 'all' ? 'All branches' : 'This branch' },
    merchantPayable: { figure: formatTaka(state.settlements.filter((item) => item.payoutStatus !== 'disbursed' && settlementHere(state, item.merchantId)).reduce((sum, item) => sum + item.netPayable, 0)), hint: 'Not yet paid' },
    manifestsTransit: { figure: String(state.manifests.filter((item) => item.status === 'in_transit' && (branch === 'all' || item.sourceBranchId === branch || item.destinationBranchId === branch)).length), hint: 'In transit' },
  }
  return map[key] ?? { figure: '—', hint: '' }
}

function ledgerLabel(state: DemoState) {
  const lines = state.ledger.filter((item) => {
    if (state.workingBranchId === 'all') return true
    const parcel = state.parcels.find((row) => row.id === item.parcelId)
    return parcel?.originBranchId === state.workingBranchId
  })
  const debit = lines.filter((item) => item.type === 'DEBIT').reduce((sum, item) => sum + item.amount, 0)
  const credit = lines.filter((item) => item.type === 'CREDIT').reduce((sum, item) => sum + item.amount, 0)
  return debit === credit ? 'Balanced' : formatTaka(Math.abs(debit - credit))
}
