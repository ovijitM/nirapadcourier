import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Button, DataTable, Empty, Field, Kpis, PageBar, PageTitle, Panel, SelectInput, SplitPopup, StatusPill, Tag, TextInput, usePaged, toneFor } from '../../components/ui.tsx'
import { formatTaka, formatWhen } from '../../lib/money.ts'
import { caseVisible, recordInFocus, visibleParcels } from '../../lib/scope.ts'
import { canAct } from '../../lib/status.ts'
import { ParcelTable, TrackingRow } from '../parcels/ParcelPages.tsx'
import { useDemo } from '../../mock/store.ts'
import type { RoleId } from '../../mock/types.ts'

export function MerchantListPage() {
  const merchants = useDemo((state) => state.merchants)
  const parcels = useDemo((state) => state.parcels)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const scoped = merchants.filter((item) => recordInFocus(item.pickupBranchId, user, working))
  const [q, setQ] = useState('')
  const [openCode, setOpenCode] = useState<string | null>(null)
  const [status, setStatus] = useState('all')
  const [volumeOnly, setVolumeOnly] = useState(false)
  const volume = new Map<string, number>()
  parcels.forEach((parcel) => volume.set(parcel.merchantId, (volume.get(parcel.merchantId) ?? 0) + 1))
  const rows = scoped
    .filter((item) => status === 'all' || item.status === status)
    .filter((item) => !volumeOnly || (volume.get(item.id) ?? 0) >= 4)
    .filter((item) => `${item.businessName} ${item.phone} ${item.area}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <div>
      <PageTitle title="Merchants" action={<Link to="/app/merchants/new"><Button>New merchant</Button></Link>} />
      <Kpis items={[
        { label: 'Showing', value: String(rows.length) },
        { label: 'Active', value: String(scoped.filter((item) => item.status === 'active').length) },
        { label: 'Pending', value: String(scoped.filter((item) => item.status === 'pending').length) },
        { label: 'Suspended', value: String(scoped.filter((item) => item.status === 'suspended').length) },
      ]} />
      <div className="my-3 flex flex-wrap gap-2">
        <TextInput className="max-w-xs" placeholder="Search name, phone, or area" value={q} onChange={(event) => setQ(event.target.value)} />
        <SelectInput className="max-w-40" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </SelectInput>
        <label className="flex items-center gap-2 text-sm text-[#5C6570]"><input type="checkbox" checked={volumeOnly} onChange={(event) => setVolumeOnly(event.target.checked)} /> High volume</label>
      </div>
      <div className="mt-3">
        <DataTable
          columns={['Code', 'Shop', 'Status', 'Area', 'Parcels']}
          rows={rows.map((merchant) => {
            const count = volume.get(merchant.id) ?? 0
            return {
              id: merchant.id,
              onClick: () => setOpenCode(merchant.merchantCode),
              cells: [
                <span className="tabular text-[#5C6570]">{merchant.merchantCode}</span>,
                <span className="font-medium">{merchant.businessName}</span>,
                <Tag tone={toneFor(merchant.status)}>{merchant.status}</Tag>,
                merchant.area,
                <span className="inline-flex items-center gap-2"><span className="tabular">{count}</span>{count >= 10 && <Tag tone="violet">High</Tag>}</span>,
              ],
            }
          })}
        />
      </div>
      {openCode && <MerchantDetailPage code={openCode} onClose={() => setOpenCode(null)} />}
    </div>
  )
}

export function MerchantDetailPage({ code: codeProp, onClose }: { code?: string; onClose?: () => void } = {}) {
  const params = useParams()
  const navigate = useNavigate()
  const code = codeProp ?? params.code ?? ''
  const close = onClose ?? (() => navigate('/app/merchants'))
  const merchant = useDemo((state) => state.merchants.find((item) => item.merchantCode === code))
  const parcels = useDemo(useShallow((state) => state.parcels.filter((item) => item.merchantId === merchant?.id)))
  const settlements = useDemo(useShallow((state) => state.settlements.filter((item) => item.merchantId === merchant?.id)))
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const setMerchantStatus = useDemo((state) => state.setMerchantStatus)
  const [tab, setTab] = useState('overview')
  if (!merchant || !user) return null
  return (
    <SplitPopup
      open
      onClose={close}
      left={
        <div>
          <div className="text-xs font-semibold text-[#0F6E56]">{merchant.merchantCode}</div>
          <h2 className="mt-1 text-xl font-semibold">{merchant.businessName}</h2>
          <p className="mt-1 text-sm text-[#5C6570]">{merchant.status}</p>
          <div className="mt-5 space-y-3 text-sm">
            <div><div className="text-[#5C6570]">Contact</div><div className="font-medium">{merchant.contactName}</div><div>{merchant.phone}</div></div>
            <div><div className="text-[#5C6570]">Pickup</div><div>{merchant.street}, {merchant.area}, {merchant.district}</div></div>
            <div><div className="text-[#5C6570]">Payment</div><div>{merchant.paymentMethod}</div></div>
            <div><div className="text-[#5C6570]">Parcels</div><div className="font-medium">{parcels.length}</div></div>
          </div>
          {canAct(user.role, 'merchantWrite') && (
            <div className="mt-6 flex gap-2">
              <Button onClick={() => setMerchantStatus(merchant.id, 'active')}>Verify</Button>
              <Button variant="danger" onClick={() => setMerchantStatus(merchant.id, 'suspended')}>Suspend</Button>
            </div>
          )}
        </div>
      }
      right={
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {['overview', 'rate', 'parcels', 'money', 'activity'].map((item) => (
              <Button key={item} variant={tab === item ? 'primary' : 'secondary'} onClick={() => setTab(item)}>{item}</Button>
            ))}
          </div>
          {tab === 'overview' && <p className="text-sm">{merchant.email || 'No email'}. {merchant.notes || 'No notes.'}</p>}
          {tab === 'rate' && <p className="text-sm">Delivery is 1% of the product price, plus ৳ 1 damage control on every parcel.</p>}
          {tab === 'parcels' && [...parcels].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20).map((parcel) => <div key={parcel.id} className="flex items-center justify-between gap-3 border-b border-[#E6E8EC] py-2 text-sm"><TrackingRow id={parcel.trackingId} /><span className="text-[#5C6570]">{parcel.recipient.area}</span><StatusPill status={parcel.currentStatus} /></div>)}
          {tab === 'money' && (user.role === 'accounts' || user.role === 'super_admin' || user.role === 'operations' ? settlements.map((item) => <div key={item.id} className="flex items-center justify-between border-b border-[#E6E8EC] py-2 text-sm"><Link to={`/app/finance/settlements/${item.id}`}>{formatTaka(item.netPayable)}</Link><Tag tone={toneFor(item.payoutStatus)}>{item.payoutStatus.replaceAll('_', ' ')}</Tag></div>) : <p className="text-sm">Money is hidden for this role.</p>)}
          {tab === 'activity' && <p className="text-sm">Joined {formatWhen(merchant.createdAt)}. Status {merchant.status}.</p>}
        </div>
      }
    />
  )
}

export function NewMerchantPage() {
  const createMerchant = useDemo((state) => state.createMerchant)
  const [form, setForm] = useState({ businessName: '', contactName: '', phone: '', district: 'Dhaka', area: 'Mirpur', street: '' })
  return (
    <div className="max-w-xl space-y-3">
      <PageTitle title="New merchant" />
      {Object.entries(form).map(([key, value]) => (
        <Field key={key} label={key}>
          <TextInput value={value} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
        </Field>
      ))}
      <Button onClick={() => createMerchant(form)}>Save as pending</Button>
    </div>
  )
}

export function RiderListPage({ view = 'roster' }: { view?: 'roster' | 'duty' | 'off' | 'leave' | 'cash' }) {
  const riders = useDemo((state) => state.riders)
  const collections = useDemo((state) => state.collections)
  const branches = useDemo((state) => state.branches)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const [q, setQ] = useState('')
  const [openCode, setOpenCode] = useState<string | null>(null)
  const [duty, setDuty] = useState(view === 'roster' ? 'all' : view)
  const rows = riders.filter((rider) => {
    if (!recordInFocus(rider.branchId, user, working)) return false
    if (duty === 'duty' && !rider.isAvailable) return false
    if (duty === 'off' && (rider.status !== 'active' || rider.isAvailable)) return false
    if (duty === 'leave' && rider.status !== 'on_leave' && rider.status !== 'inactive') return false
    if (duty === 'cash' && !collections.some((item) => item.riderId === rider.id && item.handoverStatus !== 'reconciled')) return false
    const branch = branches.find((item) => item.id === rider.branchId)?.name ?? ''
    return `${rider.name} ${rider.riderCode} ${branch}`.toLowerCase().includes(q.toLowerCase())
  })
  return (
    <div>
      <PageTitle title={view === 'cash' ? 'Cash in hand' : 'Riders'} />
      <div className="mb-3 flex flex-wrap gap-2">
        <TextInput className="max-w-xs" placeholder="Search rider or branch" value={q} onChange={(event) => setQ(event.target.value)} />
        <SelectInput className="max-w-44" value={duty} onChange={(event) => setDuty(event.target.value)}>
          <option value="all">All duty states</option>
          <option value="duty">On duty</option>
          <option value="off">Off duty</option>
          <option value="leave">Leave or inactive</option>
          <option value="cash">Cash in hand</option>
        </SelectInput>
      </div>
      <p className="mb-4 text-sm text-[#5C6570]">Rider completes stops in the rider app. This record is how operations assigns and reviews them.</p>
      <DataTable
        columns={['Code', 'Name', 'Vehicle', 'Duty', 'Cash in hand']}
        rows={rows.map((rider) => {
          const held = collections.filter((item) => item.riderId === rider.id && item.handoverStatus === 'pending').reduce((sum, item) => sum + item.amountCollected, 0)
          const duty = rider.isAvailable ? 'On duty' : rider.status.replaceAll('_', ' ')
          return {
            id: rider.id,
            onClick: () => setOpenCode(rider.riderCode),
            cells: [
              <span className="tabular text-[#5C6570]">{rider.riderCode}</span>,
              <span className="font-medium">{rider.name}</span>,
              rider.vehicleType,
              <Tag tone={toneFor(duty)}>{duty}</Tag>,
              <span className={held > 0 ? 'tabular font-medium text-amber-800' : 'tabular text-[#5C6570]'}>{formatTaka(held)}</span>,
            ],
          }
        })}
      />
      {openCode && <RiderDetailPage code={openCode} onClose={() => setOpenCode(null)} />}
    </div>
  )
}

export function RiderDetailPage({ code: codeProp, onClose }: { code?: string; onClose?: () => void } = {}) {
  const params = useParams()
  const navigate = useNavigate()
  const code = codeProp ?? params.code ?? ''
  const close = onClose ?? (() => navigate('/app/riders'))
  const rider = useDemo((state) => state.riders.find((item) => item.riderCode === code))
  const parcels = useDemo(useShallow((state) => state.parcels.filter((item) => item.assignedDeliveryRiderId === rider?.id || item.assignedPickupRiderId === rider?.id)))
  const collections = useDemo(useShallow((state) => state.collections.filter((item) => item.riderId === rider?.id)))
  const branch = useDemo((state) => state.branches.find((item) => item.id === rider?.branchId))
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const setRiderDuty = useDemo((state) => state.setRiderDuty)
  const assigned = [...parcels].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const paged = usePaged(assigned)
  if (!rider) return null
  const delivered = parcels.filter((item) => item.currentStatus === 'DELIVERED').length
  const failed = parcels.filter((item) => item.currentStatus === 'DELIVERY_FAILED').length
  const cash = collections.filter((item) => item.handoverStatus === 'pending').reduce((sum, item) => sum + item.amountCollected, 0)
  return (
    <SplitPopup
      open
      onClose={close}
      left={
        <div>
          <div className="text-xs font-semibold text-[#0F6E56]">{rider.riderCode}</div>
          <h2 className="mt-1 text-xl font-semibold">{rider.name}</h2>
          <p className="mt-1 text-sm text-[#5C6570]">{rider.isAvailable ? 'On duty' : rider.status}</p>
          <div className="mt-5 space-y-3 text-sm">
            <div><div className="text-[#5C6570]">Phone</div><div>{rider.phone}</div></div>
            <div><div className="text-[#5C6570]">Branch</div><div className="font-medium">{branch?.name}</div></div>
            <div><div className="text-[#5C6570]">Vehicle</div><div>{rider.vehicleType} · {rider.licenseNumber}</div></div>
            <div><div className="text-[#5C6570]">Delivered / failed</div><div className="font-medium">{delivered} / {failed}</div></div>
            <div><div className="text-[#5C6570]">Cash in hand</div><div className="font-medium">{formatTaka(cash)}</div></div>
          </div>
          {user && canAct(user.role, 'assignPickup') && (
            <Button className="mt-6" variant="secondary" onClick={() => setRiderDuty(rider.id, !rider.isAvailable)}>{rider.isAvailable ? 'Mark off duty' : 'Mark on duty'}</Button>
          )}
          <p className="mt-4 text-xs text-[#5C6570]">The rider works in the rider app. This record is how operations assigns and reviews them.</p>
        </div>
      }
      right={
        <div>
          <h3 className="mb-2 text-sm font-medium">Assigned parcels</h3>
          {assigned.length === 0 && <Empty>No assignments.</Empty>}
          {paged.rows.map((parcel) => (
            <Link key={parcel.id} className="flex justify-between border-b border-[#E6E8EC] py-2 text-sm" to={`/app/parcels/${parcel.trackingId}`}>
              <TrackingRow id={parcel.trackingId} />
              <span className="inline-flex items-center gap-2">{parcel.recipient.area}<StatusPill status={parcel.currentStatus} /></span>
            </Link>
          ))}
          <PageBar page={paged.page} pages={paged.pages} total={paged.total} onPage={paged.setPage} />
        </div>
      }
    />
  )
}

export function RecipientListPage({ view = 'all' }: { view?: 'all' | 'repeat' | 'failed' }) {
  const data = useDemo()
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const parcels = user ? visibleParcels(data, user, working) : []
  const phones = new Map<string, { name: string; area: string; count: number; failed: number }>()
  parcels.forEach((parcel) => {
    const current = phones.get(parcel.recipient.phone) ?? { name: parcel.recipient.name, area: parcel.recipient.area, count: 0, failed: 0 }
    current.count += 1
    if (parcel.currentStatus === 'DELIVERY_FAILED') current.failed += 1
    phones.set(parcel.recipient.phone, current)
  })
  const [q, setQ] = useState('')
  const [openPhone, setOpenPhone] = useState<string | null>(null)
  const [only, setOnly] = useState(view === 'all' ? 'all' : view)
  const entries = [...phones.entries()].filter(([, row]) => {
    if (only === 'repeat' && row.count < 2) return false
    if (only === 'failed' && row.failed < 1) return false
    return `${row.name} ${row.area}`.toLowerCase().includes(q.toLowerCase())
  })
  return (
    <div>
      <PageTitle title="Customers" />
      <div className="mb-3 flex flex-wrap gap-2">
        <TextInput className="max-w-xs" placeholder="Search name or area" value={q} onChange={(event) => setQ(event.target.value)} />
        <SelectInput className="max-w-48" value={only} onChange={(event) => setOnly(event.target.value)}>
          <option value="all">All customers</option>
          <option value="repeat">Repeat</option>
          <option value="failed">Failed deliveries</option>
        </SelectInput>
      </div>
      <DataTable
        columns={['Name', 'Phone', 'Area', 'Parcels', 'Failed']}
        rows={entries.map(([phone, row]) => ({
          id: phone,
          onClick: () => setOpenPhone(phone),
          cells: [
            <span className="font-medium">{row.name}</span>,
            <span className="tabular">{phone}</span>,
            row.area,
            <span className="tabular">{row.count}</span>,
            row.failed > 0 ? <Tag tone="red">{row.failed} failed</Tag> : <span className="text-[#5C6570]">0</span>,
          ],
        }))}
      />
      {openPhone && <RecipientDetailPage phone={openPhone} onClose={() => setOpenPhone(null)} />}
    </div>
  )
}

export function RecipientDetailPage({ phone: phoneProp, onClose }: { phone?: string; onClose?: () => void } = {}) {
  const params = useParams()
  const navigate = useNavigate()
  const phone = phoneProp ?? params.phone ?? ''
  const close = onClose ?? (() => navigate('/app/recipients'))
  const parcels = useDemo(useShallow((state) => state.parcels.filter((item) => item.recipient.phone === phone)))
  const merchants = useDemo((state) => state.merchants)
  const ordered = [...parcels].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const paged = usePaged(ordered)
  const first = ordered[0]
  if (!first) return null
  const failed = parcels.filter((parcel) => parcel.currentStatus === 'DELIVERY_FAILED').length
  const shops = [...new Set(parcels.map((parcel) => merchants.find((item) => item.id === parcel.merchantId)?.businessName).filter((name): name is string => Boolean(name)))]
  return (
    <SplitPopup
      fit
      open
      onClose={close}
      left={
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="green">Customer</Tag>
            <h2 className="text-xl font-semibold">{first.recipient.name}</h2>
            {failed > 0 ? <Tag tone="red">{failed} failed</Tag> : <Tag tone="green">No failed</Tag>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <section className="rounded-xl border border-[#E6E8EC] bg-white px-3">
              <h3 className="pt-2 text-xs font-medium text-[#5C6570]">Contact</h3>
              <Fact label="Phone" value={phone} />
              <Fact label="Street" value={first.recipient.street} />
              <Fact label="Area" value={`${first.recipient.area}, ${first.recipient.district}`} />
            </section>
            <section className="rounded-xl border border-[#E6E8EC] bg-white px-3">
              <h3 className="pt-2 text-xs font-medium text-[#5C6570]">Activity</h3>
              <Fact label="Parcels" value={String(parcels.length)} />
              <Fact label="Failed" value={<span className={failed > 0 ? 'text-red-700' : 'text-[#0F6E56]'}>{failed}</span>} />
              <Fact label="Shops" value={String(shops.length)} />
            </section>
          </div>
          <section className="rounded-xl border border-[#E6E8EC] bg-white px-3 py-2">
            <div className="text-xs font-medium text-[#5C6570]">Shops</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {shops.length === 0 && <span className="text-sm text-[#5C6570]">No shops yet</span>}
              {shops.map((shop) => <Tag key={shop} tone="blue">{shop}</Tag>)}
            </div>
          </section>
        </div>
      }
      right={
        <div>
          <h3 className="mb-3 text-sm font-medium">Delivery history</h3>
          <div className="space-y-2">
            {paged.rows.map((parcel) => (
              <Link key={parcel.id} className="grid grid-cols-[1.4fr_1fr_auto_auto] items-center gap-3 rounded-xl border border-[#E6E8EC] px-3 py-2 text-sm hover:bg-[#F6F7F9]" to={`/app/parcels/${parcel.trackingId}`}>
                <TrackingRow id={parcel.trackingId} />
                <span className="text-[#5C6570]">{parcel.recipient.area}</span>
                <StatusPill status={parcel.currentStatus} />
                <span className="tabular">{formatTaka(parcel.codAmount)}</span>
              </Link>
            ))}
            <PageBar page={paged.page} pages={paged.pages} total={paged.total} onPage={paged.setPage} />
          </div>
        </div>
      }
    />
  )
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#E6E8EC] py-1.5 text-sm last:border-0">
      <span className="shrink-0 text-[#5C6570]">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

export function CaseListPage({ status, type: forcedType }: { status: 'open' | 'waiting' | 'resolved' | 'all'; type?: string }) {
  const [params] = useSearchParams()
  const type = forcedType ?? params.get('type')
  const [typeFilter, setTypeFilter] = useState(type ?? 'all')
  const [priority, setPriority] = useState('all')
  const [q, setQ] = useState('')
  const [openNo, setOpenNo] = useState<string | null>(null)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const cases = useDemo((state) => state.cases)
  const parcels = useDemo((state) => state.parcels)
  if (!user) return null
  const rows = cases.filter((item) => {
    if (status !== 'all' && item.status !== status) return false
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    if (priority !== 'all' && item.priority !== priority) return false
    if (q && !`${item.caseNo} ${item.type} ${item.status}`.toLowerCase().includes(q.trim().toLowerCase())) return false
    const parcel = parcels.find((row) => row.id === item.parcelId)
    return caseVisible(item.type, parcel, user, working)
  })
  return (
    <div>
      <PageTitle title={status === 'all' ? 'Cases' : status[0]!.toUpperCase() + status.slice(1)} />
      <div className="mb-3 flex flex-wrap gap-2">
      <TextInput className="max-w-xs" placeholder="Search case number" value={q} onChange={(event) => setQ(event.target.value)} />
      <SelectInput className="max-w-56" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
        <option value="all">All types</option>
        <option value="wrong_address">Address</option>
        <option value="cod_dispute">COD dispute</option>
        <option value="lost_damaged">Damaged</option>
        <option value="merchant_complaint">Complaint</option>
        <option value="failed_delivery">Failed delivery</option>
      </SelectInput>
      <SelectInput className="max-w-40" value={priority} onChange={(event) => setPriority(event.target.value)}>
        <option value="all">All priorities</option>
        <option value="high">High</option>
        <option value="normal">Normal</option>
        <option value="low">Low</option>
      </SelectInput>
      </div>
      <DataTable
        columns={['Case', 'Type', 'Priority', 'Status']}
        rows={rows.map((item) => ({
          id: item.id,
          onClick: () => setOpenNo(item.caseNo),
          cells: [
            <span className="tabular font-medium">{item.caseNo}</span>,
            item.type.replaceAll('_', ' '),
            <Tag tone={item.priority === 'high' ? 'red' : item.priority === 'normal' ? 'blue' : 'slate'}>{item.priority}</Tag>,
            <Tag tone={toneFor(item.status)}>{item.status}</Tag>,
          ],
        }))}
      />
      {openNo && <CaseDetailPage caseNo={openNo} onClose={() => setOpenNo(null)} />}
    </div>
  )
}

export function CaseDetailPage({ caseNo: caseProp, onClose }: { caseNo?: string; onClose?: () => void } = {}) {
  const params = useParams()
  const navigate = useNavigate()
  const caseNo = caseProp ?? params.caseNo ?? ''
  const close = onClose ?? (() => navigate('/app/cases'))
  const item = useDemo((state) => state.cases.find((row) => row.caseNo === caseNo))
  const parcel = useDemo((state) => state.parcels.find((row) => row.id === item?.parcelId))
  const updateCase = useDemo((state) => state.updateCase)
  const users = useDemo((state) => state.users)
  const [note, setNote] = useState('')
  if (!item) return null
  return (
    <SplitPopup
      open
      onClose={close}
      left={
        <div>
          <div className="text-xs font-semibold text-[#0F6E56]">{item.caseNo}</div>
          <h2 className="mt-1 text-xl font-semibold">{item.type.replaceAll('_', ' ')}</h2>
          <p className="mt-1 text-sm text-[#5C6570]">{item.status} · {item.priority}</p>
          {parcel && <div className="mt-4"><TrackingRow id={parcel.trackingId} /></div>}
          <TextInput className="mt-5" placeholder="Resolution note" value={note} onChange={(event) => setNote(event.target.value)} />
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => updateCase(item.id, 'waiting', note || 'Waiting')}>Waiting</Button>
            <Button onClick={() => updateCase(item.id, 'resolved', note)}>Resolve</Button>
          </div>
        </div>
      }
      right={
        <div className="space-y-3 text-sm">
          <h3 className="font-medium">Notes</h3>
          {item.notes.map((entry, index) => <div key={index} className="border-b border-[#E6E8EC] py-2">{formatWhen(entry.at)} · {users.find((user) => user.id === entry.actorId)?.name}: {entry.text}</div>)}
        </div>
      }
    />
  )
}

export function StaffPage({ view = 'all' }: { view?: 'all' | 'active' | 'inactive' | 'booking' | 'hub' | 'branch' }) {
  const users = useDemo((state) => state.users)
  const branches = useDemo((state) => state.branches)
  const me = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const addStaff = useDemo((state) => state.addStaff)
  const [name, setName] = useState('')
  const [role, setRole] = useState<RoleId>('booking')
  const [branchId, setBranchId] = useState('b-mir')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState(view === 'all' ? 'all' : view)
  const rows = users.filter((item) => {
    if (!recordInFocus(item.branchId, me, working)) return false
    if (statusFilter === 'active' && item.status !== 'active') return false
    if (statusFilter === 'inactive' && item.status === 'active') return false
    if (statusFilter === 'booking' && item.role !== 'booking') return false
    if (statusFilter === 'hub' && item.role !== 'hub_manager') return false
    if (statusFilter === 'branch' && item.role !== 'branch_manager') return false
    return `${item.name} ${item.roleLabel}`.toLowerCase().includes(q.toLowerCase())
  })
  const title = view === 'all' ? 'All staff' : view === 'hub' ? 'Hub floor' : view === 'branch' ? 'Branch desk' : view === 'booking' ? 'Booking desk' : view[0]!.toUpperCase() + view.slice(1)
  return (
    <div>
      <PageTitle title={title} />
      <div className="mb-3 flex flex-wrap gap-2">
        <TextInput className="max-w-xs" placeholder="Search staff" value={q} onChange={(event) => setQ(event.target.value)} />
        <SelectInput className="max-w-48" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="booking">Booking desk</option>
          <option value="hub">Hub floor</option>
          <option value="branch">Branch desk</option>
        </SelectInput>
      </div>
      {me && canAct(me.role, 'staffWrite') && (
        <Panel className="my-4 grid gap-2 p-4 md:grid-cols-4">
          <TextInput placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
          <SelectInput value={role} onChange={(event) => setRole(event.target.value as RoleId)}>
            <option value="booking">Booking</option>
            <option value="operations">Operations</option>
            <option value="hub_manager">Hub</option>
            <option value="branch_manager">Branch</option>
            <option value="accounts">Accounts</option>
          </SelectInput>
          <SelectInput value={branchId} onChange={(event) => setBranchId(event.target.value)}>
            <optgroup label="Inside Dhaka">
              {branches.filter((branch) => branch.network === 'inside_dhaka').map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </optgroup>
            <optgroup label="Outside Dhaka">
              {branches.filter((branch) => branch.network === 'outside_dhaka').map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </optgroup>
          </SelectInput>
          <Button onClick={() => name && addStaff({ name, role, branchId })}>Add staff</Button>
        </Panel>
      )}
      <DataTable
        columns={['Name', 'Role', 'Status', 'Branch']}
        rows={rows.map((item) => ({
          id: item.id,
          onClick: () => setOpenId(item.id),
          cells: [
            <span className="font-medium">{item.name}</span>,
            item.roleLabel,
            <Tag tone={toneFor(item.status)}>{item.status}</Tag>,
            branches.find((branch) => branch.id === item.branchId)?.name ?? 'All branches',
          ],
        }))}
      />
      {openId && <StaffDetailPage id={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}

export function StaffDetailPage({ id: idProp, onClose }: { id?: string; onClose?: () => void } = {}) {
  const params = useParams()
  const navigate = useNavigate()
  const id = idProp ?? params.id ?? ''
  const close = onClose ?? (() => navigate('/app/staff'))
  const [riderCode, setRiderCode] = useState<string | null>(null)
  const person = useDemo((state) => state.users.find((item) => item.id === id))
  const branches = useDemo((state) => state.branches)
  const riders = useDemo((state) => state.riders)
  const me = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const updateStaff = useDemo((state) => state.updateStaff)
  const setUserStatus = useDemo((state) => state.setUserStatus)
  if (!person) return null
  const branchRiders = riders.filter((rider) => person.branchId && rider.branchId === person.branchId)
  const canEdit = me ? canAct(me.role, 'staffWrite') : false
  const roles: { id: RoleId; label: string }[] = [
    { id: 'super_admin', label: 'Super Admin' },
    { id: 'operations', label: 'Operations' },
    { id: 'branch_manager', label: 'Branch Manager' },
    { id: 'hub_manager', label: 'Hub Manager' },
    { id: 'booking', label: 'Booking' },
    { id: 'accounts', label: 'Accounts' },
  ]
  return (
    <>
      <SplitPopup
        open
        onClose={close}
        left={
          <div>
            <div className="text-xs font-semibold text-[#0F6E56]">{person.roleLabel}</div>
            <h2 className="mt-1 text-xl font-semibold">{person.name}</h2>
            <p className="mt-1 text-sm text-[#5C6570]">{person.status}</p>
            <div className="mt-5 space-y-3 text-sm">
              <div><div className="text-[#5C6570]">Email</div><div>{person.email}</div></div>
              <div><div className="text-[#5C6570]">Job</div><div>{person.job}</div></div>
              <div><div className="text-[#5C6570]">Branch</div><div>{branches.find((branch) => branch.id === person.branchId)?.name ?? 'All branches'}</div></div>
            </div>
            {canEdit && (
              <Button className="mt-6" variant="secondary" onClick={() => setUserStatus(person.id, person.status === 'active' ? 'inactive' : 'active')}>{person.status === 'active' ? 'Deactivate' : 'Activate'}</Button>
            )}
          </div>
        }
        right={
          <div className="space-y-5">
            {canEdit && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Role">
                  <SelectInput value={person.role} onChange={(event) => {
                    const next = roles.find((item) => item.id === event.target.value)
                    if (next) updateStaff(person.id, { role: next.id, roleLabel: next.label })
                  }}>
                    {roles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Branch">
                  <SelectInput value={person.branchId ?? ''} onChange={(event) => updateStaff(person.id, { branchId: event.target.value || null })}>
                    <option value="">All branches</option>
                    <optgroup label="Inside Dhaka">
                      {branches.filter((branch) => branch.network === 'inside_dhaka').map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </optgroup>
                    <optgroup label="Outside Dhaka">
                      {branches.filter((branch) => branch.network === 'outside_dhaka').map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </optgroup>
                  </SelectInput>
                </Field>
              </div>
            )}
            <div>
              <h3 className="mb-2 text-sm font-medium">Riders at this branch</h3>
              {branchRiders.length === 0 && <Empty>No riders are attached to this branch.</Empty>}
              {branchRiders.map((rider) => (
                <button key={rider.id} className="flex w-full justify-between border-b border-[#E6E8EC] py-2 text-left text-sm hover:bg-[#F6F7F9]" type="button" onClick={() => setRiderCode(rider.riderCode)}>
                  <span>{rider.riderCode} · {rider.name}</span>
                  <span>{rider.isAvailable ? 'On duty' : rider.status}</span>
                </button>
              ))}
            </div>
          </div>
        }
      />
      {riderCode && <RiderDetailPage code={riderCode} onClose={() => setRiderCode(null)} />}
    </>
  )
}

export function RolesPage() {
  const [toast, setToast] = useState('')
  const roles = ['Super Admin', 'Operations', 'Branch Manager', 'Hub Manager', 'Booking', 'Accounts']
  const modules = ['Parcels', 'Merchants', 'Hub', 'Finance', 'Staff']
  return (
    <div>
      <PageTitle title="Roles" />
      <Panel className="overflow-x-auto p-4 text-sm">
        <table className="w-full">
          <thead><tr>{[''].concat(modules).map((item) => <th key={item} className="px-2 py-2 text-left">{item}</th>)}</tr></thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role}>
                <td className="py-2">{role}</td>
                {modules.map((mod) => (
                  <td key={mod} className="px-2"><input type="checkbox" defaultChecked onChange={() => setToast('Permission changes apply when the live system is connected.')} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {toast && <p className="mt-3 text-[#B45309]">{toast}</p>}
      </Panel>
    </div>
  )
}

export function BranchListPage({ kind = 'all' }: { kind?: 'all' | 'hub' | 'sorting_center' | 'sub_branch' }) {
  const branches = useDemo((state) => state.branches)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const addBranch = useDemo((state) => state.addBranch)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [network, setNetwork] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka')
  const [q, setQ] = useState('')
  const [place, setPlace] = useState('all')
  const visible = branches.filter((branch) => recordInFocus(branch.id, user, working)).filter((branch) => kind === 'all' || branch.type === kind).filter((branch) => (place === 'all' || branch.network === place) && `${branch.name} ${branch.code} ${branch.district}`.toLowerCase().includes(q.trim().toLowerCase()))
  const groups = [
    { id: 'inside_dhaka' as const, title: 'Inside Dhaka', note: 'City zones. These hubs do not cover Gazipur, Narayanganj, or other cities.' },
    { id: 'outside_dhaka' as const, title: 'Outside Dhaka', note: 'Each city has its own hub. Parcels here do not land on a Dhaka zone desk.' },
  ]
  return (
    <div>
      <PageTitle title={kind === 'hub' ? 'Hubs' : kind === 'sorting_center' ? 'Sorting centers' : kind === 'sub_branch' ? 'Desks' : 'All branches'} />
      <div className="mb-4 flex flex-wrap gap-2">
        <TextInput className="max-w-sm" placeholder="Search hub, code, or district" value={q} onChange={(event) => setQ(event.target.value)} />
        <SelectInput className="max-w-44" value={place} onChange={(event) => setPlace(event.target.value)}>
          <option value="all">All networks</option>
          <option value="inside_dhaka">Inside Dhaka</option>
          <option value="outside_dhaka">Outside Dhaka</option>
        </SelectInput>
      </div>
      {groups.map((group) => (
        <section key={group.id} className="mb-8">
          <h2 className="text-sm font-semibold">{group.title}</h2>
          <p className="mb-3 text-sm text-[#5C6570]">{group.note}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {visible.filter((branch) => branch.network === group.id).map((branch) => (
              <Link key={branch.id} className="rounded-xl border border-[#E6E8EC] bg-white p-4 hover:border-[#0F6E56]" to={`/app/branches/${branch.code}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{branch.name}</div>
                  <Tag tone={group.id === 'inside_dhaka' ? 'green' : 'blue'}>{group.id === 'inside_dhaka' ? 'Inside' : 'Outside'}</Tag>
                </div>
                <div className="mt-1 text-sm text-[#5C6570]">{branch.code} · {branch.district}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
      {user && canAct(user.role, 'branchWrite') && (
        <Panel className="mt-4 grid gap-2 p-4 md:grid-cols-4">
          <TextInput placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
          <TextInput placeholder="Code" value={code} onChange={(event) => setCode(event.target.value)} />
          <SelectInput value={network} onChange={(event) => setNetwork(event.target.value as typeof network)}>
            <option value="inside_dhaka">Inside Dhaka</option>
            <option value="outside_dhaka">Outside Dhaka</option>
          </SelectInput>
          <Button onClick={() => name && code && addBranch({ name, code, type: 'hub', district: network === 'inside_dhaka' ? 'Dhaka' : 'Chattogram', network })}>Add branch</Button>
        </Panel>
      )}
    </div>
  )
}

export function BranchDetailPage({ section }: { section: 'overview' | 'parcels' | 'riders' | 'manifests' | 'staff' | 'cod' }) {
  const { code = '' } = useParams()
  const branch = useDemo((state) => state.branches.find((item) => item.code === code))
  const parcels = useDemo(useShallow((state) => state.parcels.filter((item) => branch && item.currentBranchId === branch.id)))
  const riders = useDemo(useShallow((state) => state.riders.filter((item) => branch && item.branchId === branch.id)))
  const manifests = useDemo(useShallow((state) => state.manifests.filter((item) => branch && (item.sourceBranchId === branch.id || item.destinationBranchId === branch.id))))
  const users = useDemo(useShallow((state) => state.users.filter((item) => branch && item.branchId === branch.id)))
  const collections = useDemo((state) => state.collections)
  const me = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const [staffId, setStaffId] = useState<string | null>(null)
  const [riderCode, setRiderCode] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [duty, setDuty] = useState('all')
  const canOpenPeople = me ? me.role === 'super_admin' || me.role === 'operations' || me.role === 'branch_manager' || me.role === 'hub_manager' || me.role === 'accounts' : false
  if (!branch) return <Empty>Branch not found.</Empty>
  const needle = q.trim().toLowerCase()
  const staffRows = users.filter((item) => `${item.name} ${item.roleLabel}`.toLowerCase().includes(needle))
  const riderRows = riders.filter((rider) => (duty === 'all' || (duty === 'on' ? rider.isAvailable : !rider.isAvailable)) && `${rider.name} ${rider.riderCode}`.toLowerCase().includes(needle))
  const parcelRows = parcels.filter((parcel) => `${parcel.trackingId} ${parcel.recipient.area}`.toLowerCase().includes(needle))
  const manifestRows = manifests.filter((item) => item.manifestNumber.toLowerCase().includes(needle))
  const branchRiderIds = new Set(riders.map((rider) => rider.id))
  const codRows = collections.filter((item) => branchRiderIds.has(item.riderId))
  return (
    <div>
      <PageTitle title={branch.name} action={<Tag tone={branch.network === 'inside_dhaka' ? 'green' : 'blue'}>{branch.network === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</Tag>} />
      <p className="mb-4 text-sm text-[#5C6570]">{branch.code} · {branch.street}, {branch.district} · {branch.phone}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <TextInput className="max-w-sm" placeholder="Search name, tracking, or code" value={q} onChange={(event) => setQ(event.target.value)} />
        {(section === 'riders' || section === 'overview') && (
          <SelectInput className="max-w-40" value={duty} onChange={(event) => setDuty(event.target.value)}>
            <option value="all">All duty</option>
            <option value="on">On duty</option>
            <option value="off">Off duty</option>
          </SelectInput>
        )}
      </div>
      {section === 'overview' && (
        <div className="space-y-6">
          <Kpis items={[
            { label: 'Parcels here', value: String(parcels.length) },
            { label: 'On duty', value: `${riders.filter((rider) => rider.isAvailable).length}/${riders.length}` },
            { label: 'Staff', value: String(users.filter((item) => item.status === 'active').length) },
            { label: 'Open manifests', value: String(manifests.filter((item) => item.status !== 'received').length) },
          ]} />
          <div className="flex flex-wrap gap-2">
            {(['BOOKED', 'PICKED_UP', 'AT_ORIGIN_HUB', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RETURN_INITIATED'] as const).map((status) => {
              const count = parcels.filter((parcel) => parcel.currentStatus === status).length
              if (count === 0) return null
              return <span key={status} className="inline-flex items-center gap-2 rounded-full border border-[#E6E8EC] bg-white px-2 py-1"><StatusPill status={status} /><span className="tabular text-sm font-medium">{count}</span></span>
            })}
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium">Staff on site</h2>
            <DataTable
              columns={['Name', 'Role', 'Status']}
              rows={staffRows.map((item) => ({
                id: item.id,
                onClick: canOpenPeople ? () => setStaffId(item.id) : undefined,
                cells: [
                  <span className="font-medium">{item.name}</span>,
                  item.roleLabel,
                  <Tag tone={toneFor(item.status)}>{item.status}</Tag>,
                ],
              }))}
            />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium">Riders</h2>
            <DataTable
              columns={['Code', 'Name', 'Duty']}
              rows={riderRows.map((rider) => ({
                id: rider.id,
                onClick: canOpenPeople ? () => setRiderCode(rider.riderCode) : undefined,
                cells: [
                  <span className="tabular">{rider.riderCode}</span>,
                  rider.name,
                  <Tag tone={toneFor(rider.isAvailable ? 'On duty' : rider.status)}>{rider.isAvailable ? 'On duty' : rider.status.replaceAll('_', ' ')}</Tag>,
                ],
              }))}
            />
          </div>
        </div>
      )}
      {section === 'parcels' && <ParcelTable parcels={parcelRows} />}
      {section === 'riders' && (
        <DataTable
          columns={['Code', 'Name', 'Duty']}
          rows={riderRows.map((rider) => ({
            id: rider.id,
            onClick: canOpenPeople ? () => setRiderCode(rider.riderCode) : undefined,
            cells: [
              <span className="tabular font-medium">{rider.riderCode}</span>,
              rider.name,
              <Tag tone={toneFor(rider.isAvailable ? 'On duty' : rider.status)}>{rider.isAvailable ? 'On duty' : rider.status.replaceAll('_', ' ')}</Tag>,
            ],
          }))}
        />
      )}
      {section === 'manifests' && (
        <DataTable
          columns={['Manifest', 'Status', 'Parcels']}
          rows={manifestRows.map((item) => ({
            id: item.id,
            cells: [
              <Link className="tabular font-medium" to={`/app/manifests/${item.manifestNumber}`}>{item.manifestNumber}</Link>,
              <Tag tone={toneFor(item.status)}>{item.status.replaceAll('_', ' ')}</Tag>,
              <span className="tabular">{item.parcelIds.length}</span>,
            ],
          }))}
        />
      )}
      {section === 'staff' && (
        <DataTable
          columns={['Name', 'Role', 'Status']}
          rows={staffRows.map((item) => ({
            id: item.id,
            onClick: canOpenPeople ? () => setStaffId(item.id) : undefined,
            cells: [
              <span className="font-medium">{item.name}</span>,
              item.roleLabel,
              <Tag tone={toneFor(item.status)}>{item.status}</Tag>,
            ],
          }))}
        />
      )}
      {section === 'cod' && (
        <div>
          <p className="mb-3 text-sm">Collected {formatTaka(codRows.reduce((sum, item) => sum + item.amountCollected, 0))}</p>
          <DataTable
            columns={['Handover', 'Amount']}
            rows={codRows.slice(0, 40).map((item) => ({
              id: item.id,
              cells: [
                <Tag tone={toneFor(item.handoverStatus)}>{item.handoverStatus.replaceAll('_', ' ')}</Tag>,
                <span className="tabular">{formatTaka(item.amountCollected)}</span>,
              ],
            }))}
          />
        </div>
      )}
      {staffId && <StaffDetailPage id={staffId} onClose={() => setStaffId(null)} />}
      {riderCode && <RiderDetailPage code={riderCode} onClose={() => setRiderCode(null)} />}
    </div>
  )
}
