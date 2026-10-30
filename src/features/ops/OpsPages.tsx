import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, DataTable, Kpis, Modal, PageTitle, SelectInput, StatusPill, Tag, TextInput } from '../../components/ui.tsx'
import { TrackingRow } from '../parcels/ParcelPages.tsx'
import { formatTaka } from '../../lib/money.ts'
import { visibleParcels } from '../../lib/scope.ts'
import { FAIL_REASONS, canAct, reasonLabel } from '../../lib/status.ts'
import { useDemo } from '../../mock/store.ts'
import type { Branch, Parcel } from '../../mock/types.ts'

function NetworkFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <SelectInput className="max-w-44" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="all">All networks</option>
      <option value="inside_dhaka">Inside Dhaka</option>
      <option value="outside_dhaka">Outside Dhaka</option>
    </SelectInput>
  )
}

function matchesQuery(parcel: Parcel, query: string, branches: Branch[], network = 'all') {
  const hubs = branches.filter((item) => item.id === parcel.originBranchId || item.id === parcel.currentBranchId || item.id === parcel.destinationBranchId)
  if (network !== 'all' && !hubs.some((item) => item.network === network)) return false
  const q = query.trim().toLowerCase()
  if (!q) return true
  return `${parcel.trackingId} ${parcel.recipient.name} ${parcel.recipient.area} ${hubs.map((item) => item.name).join(' ')}`.toLowerCase().includes(q)
}

export function PickupsPage({ mode }: { mode: 'unassigned' | 'assigned' | 'failed' | 'aging' }) {
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const data = useDemo()
  const riders = useDemo((state) => state.riders)
  const assignPickupRider = useDemo((state) => state.assignPickupRider)
  const markPickedUp = useDemo((state) => state.markPickedUp)
  const failPickup = useDemo((state) => state.failPickup)
  const [target, setTarget] = useState<Parcel | null>(null)
  const [riderId, setRiderId] = useState('')
  const [q, setQ] = useState('')
  const [network, setNetwork] = useState('all')
  const rows = (user ? visibleParcels(data, user, working) : []).filter((parcel) => {
    if (mode === 'unassigned') return parcel.currentStatus === 'BOOKED'
    if (mode === 'assigned') return parcel.currentStatus === 'PICKUP_ASSIGNED'
    if (mode === 'aging') return parcel.currentStatus === 'BOOKED' && Date.now() - new Date(parcel.createdAt).getTime() > 86400000
    return parcel.currentStatus === 'PICKUP_FAILED'
  }).filter((parcel) => matchesQuery(parcel, q, data.branches, network)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (!user) return null
  const title = mode === 'unassigned' ? 'Unassigned' : mode === 'assigned' ? 'Assigned' : mode === 'aging' ? 'Aging pickups' : 'Failed'
  return (
    <div>
      <PageTitle title={title} />
      <Kpis items={[
        { label: 'Unassigned', value: String(visibleParcels(data, user, working).filter((parcel) => parcel.currentStatus === 'BOOKED').length) },
        { label: 'Assigned', value: String(visibleParcels(data, user, working).filter((parcel) => parcel.currentStatus === 'PICKUP_ASSIGNED').length) },
        { label: 'Failed', value: String(visibleParcels(data, user, working).filter((parcel) => parcel.currentStatus === 'PICKUP_FAILED').length) },
        { label: 'Showing', value: String(rows.length) },
      ]} />
      <div className="mt-4 flex flex-wrap gap-2">
        <TextInput className="max-w-sm" placeholder="Search tracking, area, or hub" value={q} onChange={(event) => setQ(event.target.value)} />
        <NetworkFilter value={network} onChange={setNetwork} />
      </div>
      <div className="mt-4">
        <DataTable
          columns={['Tracking', 'Area', 'Hub', 'Network', 'Status', 'Action']}
          rows={rows.map((parcel) => {
            const hub = data.branches.find((item) => item.id === parcel.originBranchId)
            const options = riders.filter((rider) => rider.isAvailable && rider.branchId === parcel.originBranchId)
            return {
              id: parcel.id,
              cells: [
                <TrackingRow id={parcel.trackingId} />,
                parcel.recipient.area,
                hub?.name ?? '—',
                <Tag tone={hub?.network === 'inside_dhaka' ? 'green' : 'blue'}>{hub?.network === 'inside_dhaka' ? 'Inside' : 'Outside'}</Tag>,
                <span className="inline-flex items-center gap-2"><StatusPill status={parcel.currentStatus} />{mode === 'aging' && <Tag tone="amber">Aging</Tag>}</span>,
                <span className="flex gap-2">
                  {canAct(user.role, 'assignPickup') && mode !== 'failed' && <Button className="h-9" onClick={() => { setTarget(parcel); setRiderId(options[0]?.id ?? '') }}>Assign</Button>}
                  {mode === 'assigned' && canAct(user.role, 'pickupResult') && (
                    <>
                      <Button className="h-9" variant="secondary" onClick={() => markPickedUp(parcel.id)}>Picked up</Button>
                      <Button className="h-9" variant="danger" onClick={() => failPickup(parcel.id, 'customer_unreachable')}>Failed</Button>
                    </>
                  )}
                </span>,
              ],
            }
          })}
        />
      </div>
      <Modal open={!!target} title="Assign pickup rider" onClose={() => setTarget(null)}>
        <SelectInput value={riderId} onChange={(event) => setRiderId(event.target.value)}>
          <option value="">Select rider</option>
          {riders.filter((rider) => rider.isAvailable && rider.branchId === target?.originBranchId).map((rider) => {
            const assigned = data.parcels.filter((parcel) => parcel.assignedPickupRiderId === rider.id && parcel.currentStatus === 'PICKUP_ASSIGNED').length
            return <option key={rider.id} value={rider.id}>{rider.riderCode} · {rider.name} · {assigned} assigned</option>
          })}
        </SelectInput>
        <Button className="mt-4" disabled={!riderId || !target} onClick={() => { if (target) assignPickupRider(target.id, riderId); setTarget(null) }}>Confirm</Button>
      </Modal>
    </div>
  )
}

export function DeliveriesPage({ mode }: { mode: 'ready' | 'out' | 'failed' | 'repeat' }) {
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const data = useDemo()
  const riders = useDemo((state) => state.riders)
  const assignDeliveryRider = useDemo((state) => state.assignDeliveryRider)
  const markDelivered = useDemo((state) => state.markDelivered)
  const failDelivery = useDemo((state) => state.failDelivery)
  const startReturn = useDemo((state) => state.startReturn)
  const [assign, setAssign] = useState<Parcel | null>(null)
  const [deliver, setDeliver] = useState<Parcel | null>(null)
  const [riderId, setRiderId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'cash' | 'bkash' | 'nagad'>('cash')
  const [reason, setReason] = useState<(typeof FAIL_REASONS)[number]>('customer_unreachable')
  const [q, setQ] = useState('')
  const [network, setNetwork] = useState('all')
  const scoped = user ? visibleParcels(data, user, working) : []
  const ready = scoped.filter((parcel) => parcel.currentStatus === 'AT_DESTINATION_HUB')
  const out = scoped.filter((parcel) => parcel.currentStatus === 'OUT_FOR_DELIVERY')
  const failedRows = scoped.filter((parcel) => parcel.currentStatus === 'DELIVERY_FAILED')
  const repeatRows = scoped.filter((parcel) => parcel.deliveryAttempts.length >= 2 && (parcel.currentStatus === 'OUT_FOR_DELIVERY' || parcel.currentStatus === 'DELIVERY_FAILED'))
  const rows = (mode === 'ready' ? ready : mode === 'failed' ? failedRows : mode === 'repeat' ? repeatRows : out).filter((parcel) => matchesQuery(parcel, q, data.branches, network)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (!user) return null
  const title = mode === 'ready' ? 'Ready at hub' : mode === 'failed' ? 'Failed' : mode === 'repeat' ? 'Repeat attempts' : 'Out for delivery'
  return (
    <div>
      <PageTitle title={title} />
      <div className="mb-4 flex flex-wrap gap-2">
        <TextInput className="max-w-sm" placeholder="Search tracking, name, or hub" value={q} onChange={(event) => setQ(event.target.value)} />
        <NetworkFilter value={network} onChange={setNetwork} />
      </div>
      <DataTable
        columns={['Tracking', 'Recipient', 'Hub', 'Network', 'Rider', 'Attempts', 'Action']}
        rows={rows.map((parcel) => {
          const hub = data.branches.find((item) => item.id === parcel.currentBranchId)
          const rider = riders.find((item) => item.id === parcel.assignedDeliveryRiderId)
          return {
            id: parcel.id,
            cells: [
              <TrackingRow id={parcel.trackingId} />,
              parcel.recipient.name,
              hub?.name ?? '—',
              <Tag tone={hub?.network === 'inside_dhaka' ? 'green' : 'blue'}>{hub?.network === 'inside_dhaka' ? 'Inside' : 'Outside'}</Tag>,
              rider?.riderCode ?? '—',
              <Tag tone={parcel.deliveryAttempts.length >= 3 ? 'red' : parcel.deliveryAttempts.length > 0 ? 'amber' : 'slate'}>{parcel.deliveryAttempts.length}</Tag>,
              <span className="flex gap-2">
                {mode === 'ready' && canAct(user.role, 'assignDelivery') && <Button className="h-9" onClick={() => { setAssign(parcel); setRiderId(riders.find((item) => item.branchId === parcel.destinationBranchId && item.isAvailable)?.id ?? '') }}>Assign</Button>}
                {mode === 'out' && canAct(user.role, 'deliver') && (
                  <>
                    <Button className="h-9" onClick={() => { setDeliver(parcel); setAmount(String(parcel.codAmount / 100)) }}>Delivered</Button>
                    <Button className="h-9" variant="danger" onClick={() => failDelivery(parcel.id, reason)}>Failed</Button>
                  </>
                )}
                {(mode === 'failed' || mode === 'repeat') && canAct(user.role, 'returns') && (
                  <Button className="h-9" variant={parcel.deliveryAttempts.length >= 3 ? 'primary' : 'secondary'} onClick={() => startReturn(parcel.id)}>Start return</Button>
                )}
              </span>,
            ],
          }
        })}
      />
      {mode === 'out' && (
        <SelectInput className="mt-3 max-w-xs" value={reason} onChange={(event) => setReason(event.target.value as (typeof FAIL_REASONS)[number])}>
          {FAIL_REASONS.map((item) => <option key={item} value={item}>{reasonLabel(item)}</option>)}
        </SelectInput>
      )}
      <Modal open={!!assign} title="Assign delivery rider" onClose={() => setAssign(null)}>
        <SelectInput value={riderId} onChange={(event) => setRiderId(event.target.value)}>
          {riders.filter((rider) => rider.isAvailable && rider.branchId === assign?.destinationBranchId).map((rider) => {
            const assigned = data.parcels.filter((parcel) => parcel.assignedDeliveryRiderId === rider.id && (parcel.currentStatus === 'OUT_FOR_DELIVERY' || parcel.currentStatus === 'AT_DESTINATION_HUB')).length
            return <option key={rider.id} value={rider.id}>{rider.riderCode} · {rider.name} · {assigned} assigned</option>
          })}
        </SelectInput>
        <Button className="mt-4" disabled={!assign || !riderId} onClick={() => { if (assign) assignDeliveryRider(assign.id, riderId); setAssign(null) }}>Confirm</Button>
      </Modal>
      <Modal open={!!deliver} title="Collect COD" onClose={() => setDeliver(null)}>
        <p className="mb-2 text-sm">Expected {deliver ? formatTaka(deliver.codAmount) : ''}</p>
        <input className="h-10 w-full rounded-lg border border-[#E6E8EC] px-3" value={amount} onChange={(event) => setAmount(event.target.value)} />
        <SelectInput className="mt-2" value={method} onChange={(event) => setMethod(event.target.value as 'cash' | 'bkash' | 'nagad')}>
          <option value="cash">Cash</option>
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
        </SelectInput>
        <Button className="mt-4" onClick={() => { if (deliver) markDelivered(deliver.id, Number(amount) || 0, method); setDeliver(null) }}>Confirm delivery</Button>
      </Modal>
    </div>
  )
}

export function ReturnsPage({ stage }: { stage: 'initiated' | 'returning' | 'returned' }) {
  const navigate = useNavigate()
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const data = useDemo()
  const advanceReturn = useDemo((state) => state.advanceReturn)
  const [q, setQ] = useState('')
  const [network, setNetwork] = useState('all')
  const status = stage === 'initiated' ? 'RETURN_INITIATED' : stage === 'returning' ? 'RETURNING' : 'RETURNED'
  const rows = (user ? visibleParcels(data, user, working) : []).filter((parcel) => parcel.currentStatus === status).filter((parcel) => matchesQuery(parcel, q, data.branches, network)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (!user) return null
  return (
    <div>
      <PageTitle title={stage === 'initiated' ? 'Initiated' : stage === 'returning' ? 'On the way back' : 'Returned'} />
      <div className="mb-4 flex flex-wrap gap-2">
        <TextInput className="max-w-sm" placeholder="Search tracking, area, or hub" value={q} onChange={(event) => setQ(event.target.value)} />
        <NetworkFilter value={network} onChange={setNetwork} />
      </div>
      <DataTable
        columns={['Tracking', 'Area', 'Hub', 'Network', 'Status', 'Return charge', 'Action']}
        rows={rows.map((parcel) => {
          const hub = data.branches.find((item) => item.id === parcel.currentBranchId)
          return {
            id: parcel.id,
            onClick: () => navigate(`/app/parcels/${parcel.trackingId}`),
            cells: [
              <TrackingRow id={parcel.trackingId} />,
              parcel.recipient.area,
              hub?.name ?? '—',
              <Tag tone={hub?.network === 'inside_dhaka' ? 'green' : 'blue'}>{hub?.network === 'inside_dhaka' ? 'Inside' : 'Outside'}</Tag>,
              <StatusPill status={parcel.currentStatus} />,
              <span className="tabular">{formatTaka(parcel.charges.returnCharge)}</span>,
              stage !== 'returned' && canAct(user.role, 'returns') ? <Button className="h-9" onClick={(event) => { event.stopPropagation(); advanceReturn(parcel.id) }}>{parcel.currentStatus === 'RETURN_INITIATED' ? 'Dispatch back' : 'Received'}</Button> : null,
            ],
          }
        })}
      />
    </div>
  )
}
