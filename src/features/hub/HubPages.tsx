import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, DataTable, Empty, PageTitle, Panel, SelectInput, StatusPill, Tag, TextInput, toneFor } from '../../components/ui.tsx'
import { TrackingRow } from '../parcels/ParcelPages.tsx'
import { formatWhen } from '../../lib/money.ts'
import { recordInFocus, visibleParcels } from '../../lib/scope.ts'
import { useDemo } from '../../mock/store.ts'
import type { Branch, Parcel } from '../../mock/types.ts'

function ListFilters({ q, setQ, network, setNetwork, placeholder }: { q: string; setQ: (value: string) => void; network: string; setNetwork: (value: string) => void; placeholder: string }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      <TextInput className="max-w-sm" placeholder={placeholder} value={q} onChange={(event) => setQ(event.target.value)} />
      <SelectInput className="max-w-44" value={network} onChange={(event) => setNetwork(event.target.value)}>
        <option value="all">All networks</option>
        <option value="inside_dhaka">Inside Dhaka</option>
        <option value="outside_dhaka">Outside Dhaka</option>
      </SelectInput>
    </div>
  )
}

function parcelQuery(parcel: Parcel, query: string, network: string, branches: Branch[]) {
  const dest = branches.find((item) => item.id === parcel.destinationBranchId)
  const here = branches.find((item) => item.id === parcel.currentBranchId)
  if (network !== 'all' && dest?.network !== network && here?.network !== network) return false
  const q = query.trim().toLowerCase()
  if (!q) return true
  return `${parcel.trackingId} ${parcel.recipient.area} ${parcel.recipient.name} ${dest?.name ?? ''}`.toLowerCase().includes(q)
}

export function ReceivePage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const receiveAtHub = useDemo((state) => state.receiveAtHub)
  const branch = useDemo((state) => state.branches.find((item) => item.id === state.workingBranchId))
  return (
    <div>
      <PageTitle title="Receive" />
      <Panel className="max-w-lg p-4">
        <p className="mb-3 text-sm text-[#5C6570]">Working hub: {branch?.name ?? 'Select a hub in the top bar'}</p>
        <TextInput autoFocus placeholder="Tracking ID" value={code} onChange={(event) => setCode(event.target.value)} onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          const message = receiveAtHub(code)
          setError(message)
          if (!message) setCode('')
        }} />
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </Panel>
    </div>
  )
}

export function SortPage() {
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const data = useDemo()
  const branches = useDemo((state) => state.branches)
  const bagParcel = useDemo((state) => state.bagParcel)
  const [q, setQ] = useState('')
  const [network, setNetwork] = useState('all')
  if (!user) return null
  const hub = user.branchId && (user.role === 'hub_manager' || user.role === 'branch_manager') ? user.branchId : working
  const rows = visibleParcels(data, user, working).filter((parcel) => (parcel.currentStatus === 'AT_ORIGIN_HUB' || parcel.currentStatus === 'AT_DESTINATION_HUB') && (hub === 'all' || parcel.currentBranchId === hub)).filter((parcel) => parcelQuery(parcel, q, network, branches)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <div>
      <PageTitle title="Sort" />
      <ListFilters q={q} setQ={setQ} network={network} setNetwork={setNetwork} placeholder="Search tracking or area" />
      <DataTable
        columns={['Tracking', 'Status', 'Bag', 'Destination']}
        rows={rows.map((parcel) => ({
          id: parcel.id,
          cells: [
            <TrackingRow id={parcel.trackingId} />,
            <StatusPill status={parcel.currentStatus} />,
            parcel.bagBranchId ? <Tag tone="blue">{branches.find((item) => item.id === parcel.bagBranchId)?.code}</Tag> : <Tag>Not bagged</Tag>,
            <SelectInput className="max-w-56" value={parcel.bagBranchId ?? ''} onChange={(event) => bagParcel(parcel.id, event.target.value)}>
              <option value="">Choose destination</option>
              <optgroup label="Inside Dhaka">
                {branches.filter((item) => item.network === 'inside_dhaka' && item.id !== parcel.currentBranchId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </optgroup>
              <optgroup label="Outside Dhaka">
                {branches.filter((item) => item.network === 'outside_dhaka' && item.id !== parcel.currentBranchId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </optgroup>
            </SelectInput>,
          ],
        }))}
      />
    </div>
  )
}

export function DispatchPage() {
  const branches = useDemo((state) => state.branches)
  const parcels = useDemo((state) => state.parcels)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const dispatchBag = useDemo((state) => state.dispatchBag)
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [network, setNetwork] = useState('all')
  const hub = user && (user.role === 'hub_manager' || user.role === 'branch_manager') ? user.branchId : working
  const bags = branches
    .map((branch) => ({
      branch,
      count: parcels.filter((parcel) => parcel.bagBranchId === branch.id && (hub === 'all' || parcel.currentBranchId === hub)).length,
    }))
    .filter((bag) => bag.count > 0)
    .filter((bag) => (network === 'all' || bag.branch.network === network) && bag.branch.name.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div>
      <PageTitle title="Dispatch" />
      <ListFilters q={q} setQ={setQ} network={network} setNetwork={setNetwork} placeholder="Search destination hub" />
      <DataTable
        columns={['Destination', 'Network', 'Pieces', 'Action']}
        rows={bags.map((bag) => ({
          id: bag.branch.id,
          cells: [
            <span className="font-medium">{bag.branch.name}</span>,
            <Tag tone={bag.branch.network === 'inside_dhaka' ? 'green' : 'blue'}>{bag.branch.network === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</Tag>,
            <span className="tabular">{bag.count}</span>,
            <Button onClick={() => { const number = dispatchBag(bag.branch.id); if (number) navigate('/app/manifests/transit') }}>Dispatch</Button>,
          ],
        }))}
      />
    </div>
  )
}

export function FloorPage() {
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const data = useDemo()
  const branches = useDemo((state) => state.branches)
  const [q, setQ] = useState('')
  const [network, setNetwork] = useState('all')
  if (!user) return null
  const hub = user.branchId && (user.role === 'hub_manager' || user.role === 'branch_manager') ? user.branchId : working
  const rows = visibleParcels(data, user, working).filter((parcel) => (hub === 'all' || parcel.currentBranchId === hub) && ['AT_ORIGIN_HUB', 'AT_DESTINATION_HUB', 'PICKED_UP'].includes(parcel.currentStatus)).filter((parcel) => parcelQuery(parcel, q, network, branches)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <div>
      <PageTitle title="On the floor" />
      <ListFilters q={q} setQ={setQ} network={network} setNetwork={setNetwork} placeholder="Search tracking or area" />
      <DataTable
        columns={['Tracking', 'Area', 'Status', 'Destination']}
        rows={rows.map((parcel) => {
          const destination = branches.find((item) => item.id === parcel.destinationBranchId)
          return {
            id: parcel.id,
            cells: [
              <TrackingRow id={parcel.trackingId} />,
              parcel.recipient.area,
              <StatusPill status={parcel.currentStatus} />,
              <span className="inline-flex items-center gap-2">{destination?.code}<Tag tone={destination?.network === 'inside_dhaka' ? 'green' : 'blue'}>{destination?.network === 'inside_dhaka' ? 'Inside' : 'Outside'}</Tag></span>,
            ],
          }
        })}
      />
    </div>
  )
}

export function ManifestListPage({ filter }: { filter: 'all' | 'in_transit' | 'received' | 'discrepancy' }) {
  const navigate = useNavigate()
  const manifests = useDemo((state) => state.manifests)
  const branches = useDemo((state) => state.branches)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const [q, setQ] = useState('')
  const [network, setNetwork] = useState('all')
  const name = (id: string) => branches.find((item) => item.id === id)?.name ?? id
  const rows = manifests.filter((item) => recordInFocus(item.sourceBranchId, user, working) || recordInFocus(item.destinationBranchId, user, working)).filter((item) => filter === 'all' || item.status === filter).filter((item) => {
    const from = branches.find((branch) => branch.id === item.sourceBranchId)
    const to = branches.find((branch) => branch.id === item.destinationBranchId)
    if (network !== 'all' && from?.network !== network && to?.network !== network) return false
    const text = `${item.manifestNumber} ${from?.name ?? ''} ${to?.name ?? ''}`.toLowerCase()
    return text.includes(q.trim().toLowerCase())
  })
  return (
    <div>
      <PageTitle title={filter === 'all' ? 'All manifests' : filter === 'in_transit' ? 'In transit' : filter === 'received' ? 'Received' : 'Discrepancy'} />
      <ListFilters q={q} setQ={setQ} network={network} setNetwork={setNetwork} placeholder="Search manifest or hub" />
      <DataTable
        columns={['Manifest', 'From', 'To', 'Parcels', 'Status', 'Dispatched']}
        rows={rows.map((manifest) => ({
          id: manifest.id,
          onClick: () => navigate(`/app/manifests/${manifest.manifestNumber}`),
          cells: [
            <span className="tabular font-medium">{manifest.manifestNumber}</span>,
            name(manifest.sourceBranchId),
            name(manifest.destinationBranchId),
            <span className="tabular">{manifest.parcelIds.length}</span>,
            <Tag tone={toneFor(manifest.status)}>{manifest.status.replaceAll('_', ' ')}</Tag>,
            formatWhen(manifest.dispatchedAt),
          ],
        }))}
      />
    </div>
  )
}

export function ManifestDetailPage() {
  const { manifestNo = '' } = useParams()
  const manifest = useDemo((state) => state.manifests.find((item) => item.manifestNumber === manifestNo || item.id === manifestNo))
  const parcels = useDemo((state) => state.parcels)
  const branches = useDemo((state) => state.branches)
  const users = useDemo((state) => state.users)
  const receiveManifest = useDemo((state) => state.receiveManifest)
  const flagManifestDiscrepancy = useDemo((state) => state.flagManifestDiscrepancy)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  if (!manifest) return <Empty>Manifest not found.</Empty>
  const hub = user && (user.role === 'hub_manager' || user.role === 'branch_manager') ? user.branchId : working
  const name = (id: string) => branches.find((item) => item.id === id)?.name ?? id
  return (
    <div>
      <PageTitle title={manifest.manifestNumber} action={<Tag tone={toneFor(manifest.status)}>{manifest.status.replaceAll('_', ' ')}</Tag>} />
      <p className="mb-4 text-sm text-[#5C6570]">{name(manifest.sourceBranchId)} → {name(manifest.destinationBranchId)} · {users.find((item) => item.id === manifest.dispatchedBy)?.name}</p>
      {manifest.status === 'in_transit' && hub === manifest.destinationBranchId && (
        <div className="mb-4 flex gap-2">
          <Button onClick={() => receiveManifest(manifest.id)}>Receive all</Button>
          <Button variant="danger" onClick={() => flagManifestDiscrepancy(manifest.id)}>Missing piece</Button>
        </div>
      )}
      <DataTable
        columns={['Tracking', 'Area', 'Status']}
        rows={manifest.parcelIds.map((id) => {
          const parcel = parcels.find((item) => item.id === id)
          return {
            id,
            cells: [
              parcel ? <TrackingRow id={parcel.trackingId} /> : <span className="tabular">{id}</span>,
              parcel?.recipient.area ?? '—',
              parcel ? <StatusPill status={parcel.currentStatus} /> : <Tag>Missing</Tag>,
            ],
          }
        })}
      />
    </div>
  )
}
