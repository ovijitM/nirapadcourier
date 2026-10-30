import { useMemo, useState, type ReactNode } from 'react'
import { Eye } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Button, Empty, Field, Kpis, PageBar, PageTitle, Panel, SelectInput, SplitPopup, StatusPill, Tag, TextInput, TrackingCopy, usePaged } from '../../components/ui.tsx'
import { formatTaka, formatWhen, todayDhaka, dhakaDate } from '../../lib/money.ts'
import { quote, zoneLabel } from '../../lib/pricing.ts'
import { visibleParcels } from '../../lib/scope.ts'
import { FAIL_REASONS, STATUS_LABEL, canAct, reasonLabel } from '../../lib/status.ts'
import { useDemo } from '../../mock/store.ts'
import type { Parcel, ParcelStatus, ServiceType } from '../../mock/types.ts'

export function ParcelTable({ parcels }: { parcels: Parcel[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const merchants = useDemo((state) => state.merchants)
  const branches = useDemo((state) => state.branches)
  const riders = useDemo((state) => state.riders)
  const ordered = [...parcels].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const paged = usePaged(ordered)
  if (parcels.length === 0) return <Empty>No parcels match these filters.</Empty>
  return (
    <>
    <Panel>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E6E8EC] text-xs text-[#5C6570]">
            <tr>
              {['Tracking', 'Booked', 'Merchant', 'Area', 'Zone', 'COD', 'Status', 'Location', 'Rider'].map((label) => (
                <th key={label} className="px-3 py-3 font-medium">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.rows.map((parcel) => (
              <tr key={parcel.id} className="cursor-pointer border-b border-[#E6E8EC] hover:bg-[#F6F7F9]" onClick={() => setOpenId(parcel.trackingId)}>
                <td className="px-3 py-3"><TrackingRow id={parcel.trackingId} /></td>
                <td className="px-3 py-3">{formatWhen(parcel.createdAt)}</td>
                <td className="px-3 py-3">{merchants.find((item) => item.id === parcel.merchantId)?.businessName}</td>
                <td className="px-3 py-3">{parcel.recipient.area}</td>
                <td className="px-3 py-3">{zoneLabel(parcel.deliveryZone)}</td>
                <td className="tabular px-3 py-3">{formatTaka(parcel.codAmount)}</td>
                <td className="px-3 py-3"><StatusPill status={parcel.currentStatus} /></td>
                <td className="px-3 py-3">{branches.find((item) => item.id === parcel.currentBranchId)?.code}</td>
                <td className="px-3 py-3">{riders.find((item) => item.id === (parcel.assignedDeliveryRiderId ?? parcel.assignedPickupRiderId))?.riderCode ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PageBar page={paged.page} pages={paged.pages} total={paged.total} onPage={paged.setPage} />
    </Panel>
    {openId && <ParcelDetailPage trackingId={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}

const parcelViews = {
  all: 'All parcels',
  network: 'In network',
  delivered: 'Delivered',
  cod: 'COD parcels',
  inside: 'Inside Dhaka',
  sub: 'Sub Dhaka',
  outside: 'Outside Dhaka',
} as const

export function ParcelListPage({ view = 'all' }: { view?: keyof typeof parcelViews }) {
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const data = useDemo()
  const [status, setStatus] = useState('all')
  const [zone, setZone] = useState('all')
  const [q, setQ] = useState('')
  const rows = useMemo(() => {
    if (!user) return []
    return visibleParcels(data, user, working).filter((parcel) => {
      if (view === 'network' && ['DELIVERED', 'CANCELLED', 'RETURNED'].includes(parcel.currentStatus)) return false
      if (view === 'delivered' && parcel.currentStatus !== 'DELIVERED') return false
      if (view === 'cod' && parcel.codAmount <= 0) return false
      if (view === 'inside' && parcel.deliveryZone !== 'inside_dhaka') return false
      if (view === 'sub' && parcel.deliveryZone !== 'sub_dhaka') return false
      if (view === 'outside' && parcel.deliveryZone !== 'outside_dhaka') return false
      if (zone !== 'all' && parcel.deliveryZone !== zone) return false
      const merchant = data.merchants.find((item) => item.id === parcel.merchantId)
      const hay = `${parcel.trackingId} ${parcel.recipient.name} ${merchant?.businessName ?? ''}`.toLowerCase()
      if (q && !hay.includes(q.toLowerCase())) return false
      if (status !== 'all' && parcel.currentStatus !== status) return false
      return true
    })
  }, [data, user, working, status, zone, q, view])
  return (
    <div>
      <PageTitle title={parcelViews[view]} action={user && canAct(user.role, 'book') ? <Link to="/app/parcels/new"><Button>New booking</Button></Link> : undefined} />
      <Kpis items={[
        { label: 'Booked today', value: String(rows.filter((parcel) => dhakaDate(parcel.createdAt) === todayDhaka()).length) },
        { label: 'In network', value: String(rows.filter((parcel) => !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(parcel.currentStatus)).length) },
        { label: 'Delivered', value: String(rows.filter((parcel) => parcel.currentStatus === 'DELIVERED').length) },
        { label: 'Failed', value: String(rows.filter((parcel) => parcel.currentStatus === 'DELIVERY_FAILED').length) },
      ]} />
      <div className="my-4 flex gap-2">
        <TextInput placeholder="Search" value={q} onChange={(event) => setQ(event.target.value)} />
        <SelectInput className="max-w-48" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </SelectInput>
        <SelectInput className="max-w-48" value={zone} onChange={(event) => setZone(event.target.value)}>
          <option value="all">All zones</option>
          <option value="inside_dhaka">Inside Dhaka</option>
          <option value="sub_dhaka">Sub Dhaka</option>
          <option value="outside_dhaka">Outside Dhaka</option>
        </SelectInput>
      </div>
      <ParcelTable parcels={rows} />
    </div>
  )
}

export function ParcelDetailPage({ trackingId: trackingProp, onClose }: { trackingId?: string; onClose?: () => void } = {}) {
  const params = useParams()
  const navigate = useNavigate()
  const trackingId = trackingProp ?? params.trackingId ?? ''
  const close = onClose ?? (() => navigate('/app/parcels'))
  const parcel = useDemo((state) => state.parcels.find((item) => item.trackingId === trackingId))
  const merchant = useDemo((state) => state.merchants.find((item) => item.id === parcel?.merchantId))
  const branches = useDemo((state) => state.branches)
  const riders = useDemo((state) => state.riders)
  const users = useDemo((state) => state.users)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const cases = useDemo(useShallow((state) => state.cases.filter((item) => item.parcelId === parcel?.id)))
  const audit = useDemo(useShallow((state) => state.audit.filter((item) => item.entity === trackingId)))
  const cancelParcel = useDemo((state) => state.cancelParcel)
  const overrideStatus = useDemo((state) => state.overrideStatus)
  const createCase = useDemo((state) => state.createCase)
  const [reason, setReason] = useState('customer request')
  const [override, setOverride] = useState<ParcelStatus>('BOOKED')
  const [note, setNote] = useState('')
  if (!parcel || !user) return null
  const place = (id: string) => branches.find((item) => item.id === id)
  const riderName = (id?: string) => riders.find((item) => item.id === id)?.riderCode ?? '—'
  const hubTag = (id: string) => {
    const hub = place(id)
    if (!hub) return id
    return <span className="inline-flex items-center gap-2">{hub.name}<Tag tone={hub.network === 'inside_dhaka' ? 'green' : 'blue'}>{hub.network === 'inside_dhaka' ? 'Inside' : 'Outside'}</Tag></span>
  }
  const money = [
    ['Product', formatTaka(parcel.productPrice)],
    ['Delivery 1%', formatTaka(parcel.charges.deliveryCharge)],
    ['Damage control', formatTaka(parcel.charges.damageControl)],
    ['COD', formatTaka(parcel.codAmount)],
    ['Payable', formatTaka(parcel.payableAmount)],
  ] as const
  return (
    <SplitPopup
      fit
      open
      onClose={close}
      left={
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <TrackingCopy id={parcel.trackingId} />
            <StatusPill status={parcel.currentStatus} />
            <Tag tone={parcel.deliveryZone === 'inside_dhaka' ? 'green' : parcel.deliveryZone === 'sub_dhaka' ? 'amber' : 'blue'}>{zoneLabel(parcel.deliveryZone)}</Tag>
            <span className="text-sm font-medium">{merchant?.businessName}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <section className="rounded-xl border border-[#E6E8EC] bg-white px-3">
              <h3 className="pt-2 text-xs font-medium text-[#5C6570]">Recipient</h3>
              <Fact label="Name" value={parcel.recipient.name} />
              <Fact label="Phone" value={parcel.recipient.phone} />
              <Fact label="Area" value={`${parcel.recipient.area}, ${parcel.recipient.district}`} />
              <Fact label="Street" value={parcel.recipient.street} />
            </section>
            <section className="rounded-xl border border-[#E6E8EC] bg-white px-3">
              <h3 className="pt-2 text-xs font-medium text-[#5C6570]">Money</h3>
              {money.map(([label, value]) => (
                <Fact key={label} label={label} value={<span className={label === 'Payable' ? 'text-[#0F6E56]' : ''}>{value}</span>} />
              ))}
            </section>
          </div>
          <section className="grid grid-cols-2 gap-2">
            <PlaceChip label="Now" value={hubTag(parcel.currentBranchId)} />
            <PlaceChip label="Destination" value={hubTag(parcel.destinationBranchId)} />
            <PlaceChip label="Pickup" value={riderName(parcel.assignedPickupRiderId)} />
            <PlaceChip label="Delivery" value={riderName(parcel.assignedDeliveryRiderId)} />
          </section>
          <div className="flex flex-wrap gap-2">
            <Link to={`/app/parcels/${parcel.trackingId}/label`}><Button className="h-9" variant="secondary">Print label</Button></Link>
            <Button className="h-9" variant="secondary" onClick={() => createCase({ type: 'merchant_complaint', parcelId: parcel.id, note: 'Opened from parcel' })}>Open case</Button>
            {canAct(user.role, 'cancel') && (parcel.currentStatus === 'BOOKED' || parcel.currentStatus === 'PICKUP_ASSIGNED') && (
              <>
                <TextInput className="h-9 max-w-40" value={reason} onChange={(event) => setReason(event.target.value)} />
                <Button className="h-9" variant="danger" onClick={() => cancelParcel(parcel.id, reason)}>Cancel</Button>
              </>
            )}
          </div>
        </div>
      }
      right={
        <div className="space-y-5">
          <div>
            <h3 className="mb-3 text-sm font-medium">Timeline</h3>
            <ol className="space-y-3">
              {parcel.statusHistory.map((event, index) => (
                <li key={`${event.timestamp}-${index}`} className="rounded-xl border border-[#E6E8EC] px-3 py-2">
                  <StatusPill status={event.status} />
                  <div className="mt-1 text-sm text-[#5C6570]">{formatWhen(event.timestamp)} · {users.find((item) => item.id === event.actorId)?.name}</div>
                  {event.note && <div className="text-sm">{event.note}</div>}
                </li>
              ))}
            </ol>
          </div>
          {parcel.deliveryAttempts.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Attempts</h3>
              <div className="flex flex-wrap gap-2">
                {parcel.deliveryAttempts.map((attempt) => (
                  <Tag key={attempt.attemptNumber} tone="red">Attempt {attempt.attemptNumber} · {reasonLabel(attempt.reason)}</Tag>
                ))}
              </div>
            </div>
          )}
          {cases.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Cases</h3>
              <div className="flex flex-wrap gap-2">
                {cases.map((item) => <Tag key={item.id} tone={item.priority === 'high' ? 'red' : 'blue'}>{item.caseNo} · {item.priority}</Tag>)}
              </div>
            </div>
          )}
          {audit.length > 0 && <Tag tone="slate">{audit.length} audit lines</Tag>}
          {user.role === 'super_admin' && (
            <div className="rounded-xl border border-[#E6E8EC] p-3">
              <h3 className="mb-2 text-sm font-medium">Override</h3>
              <div className="flex flex-wrap items-end gap-2">
                <SelectInput className="max-w-48" value={override} onChange={(event) => setOverride(event.target.value as ParcelStatus)}>
                  {Object.keys(STATUS_LABEL).map((key) => <option key={key} value={key}>{STATUS_LABEL[key as ParcelStatus]}</option>)}
                </SelectInput>
                <TextInput className="max-w-xs" placeholder="Override reason" value={note} onChange={(event) => setNote(event.target.value)} />
                <Button variant="danger" onClick={() => overrideStatus(parcel.id, override, note)}>Override</Button>
              </div>
            </div>
          )}
          <div className="hidden">{FAIL_REASONS[0]}</div>
        </div>
      }
    />
  )
}

export function TrackingRow({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="inline-flex items-center gap-0.5">
      <TrackingCopy id={id} />
      <button
        aria-label={`View ${id}`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#5C6570] hover:bg-[#E7F4EF] hover:text-[#0F6E56]"
        title="View parcel"
        type="button"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen(true)
        }}
      >
        <Eye size={14} />
      </button>
      {open && <ParcelDetailPage trackingId={id} onClose={() => setOpen(false)} />}
    </span>
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

function PlaceChip({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E6E8EC] bg-white px-3 py-2">
      <div className="text-xs text-[#5C6570]">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  )
}

export function BookingPage({ listPath }: { listPath: string }) {
  const merchants = useDemo(useShallow((state) => state.merchants.filter((item) => item.status === 'active')))
  const rate = useDemo((state) => state.rate)
  const parcels = useDemo((state) => state.parcels)
  const createParcel = useDemo((state) => state.createParcel)
  const markLabelPrinted = useDemo((state) => state.markLabelPrinted)
  const navigate = useNavigate()
  const [merchantId, setMerchantId] = useState(merchants.find((item) => item.businessName === 'Rangpur Crafts')?.id ?? merchants[0]?.id ?? '')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [district, setDistrict] = useState('Chattogram')
  const [area, setArea] = useState('Halishahar')
  const [street, setStreet] = useState('')
  const [weight, setWeight] = useState('1')
  const [service, setService] = useState<ServiceType>('standard')
  const [productPrice, setProductPrice] = useState('1200')
  const [cod, setCod] = useState('1200')
  const [category, setCategory] = useState('General')
  const merchant = merchants.find((item) => item.id === merchantId)
  const known = parcels.find((parcel) => parcel.recipient.phone === phone)
  const priced = quote({
    district,
    area,
    weightKg: Number(weight) || 0,
    service,
    productPriceTaka: Number(productPrice) || 0,
    codTaka: Number(cod) || 0,
    merchant,
    rate,
  })

  function fillPhone(value: string) {
    setPhone(value)
    const match = parcels.find((parcel) => parcel.recipient.phone === value)
    if (!match) return
    setName(match.recipient.name)
    setDistrict(match.recipient.district)
    setArea(match.recipient.area)
    setStreet(match.recipient.street)
  }

  function submit(print: boolean) {
    const tracking = createParcel({
      merchantId,
      recipient: { name, phone, division: district === 'Dhaka' ? 'Dhaka' : district, district, area, street },
      weightKg: Number(weight) || 0,
      service,
      productPriceTaka: Number(productPrice) || 0,
      codTaka: Number(cod) || 0,
      category,
      description: category,
      itemsCount: 1,
    })
    if (!tracking) return
    if (print) {
      const created = useDemo.getState().parcels.find((parcel) => parcel.trackingId === tracking)
      if (created) markLabelPrinted(created.id)
      navigate(`/app/parcels/${tracking}/label`)
    } else navigate(`/app/parcels/${tracking}`)
  }

  return (
    <div>
      <PageTitle title="New booking" action={<Link to={listPath}><Button variant="secondary">Back</Button></Link>} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,720px)_280px]">
        <div className="space-y-6">
          <Panel className="space-y-3 p-4">
            <h2 className="font-medium">Merchant</h2>
            <Field label="Shop">
              <SelectInput value={merchantId} onChange={(event) => setMerchantId(event.target.value)}>
                {merchants.map((item) => <option key={item.id} value={item.id}>{item.businessName}</option>)}
              </SelectInput>
            </Field>
            <p className="text-sm text-[#5C6570]">Pickup {merchant?.street}, {merchant?.area}</p>
          </Panel>
          <Panel className="space-y-3 p-4">
            <h2 className="font-medium">Recipient</h2>
            <Field label="Phone"><TextInput value={phone} onChange={(event) => fillPhone(event.target.value)} /></Field>
            {known && <p className="text-xs text-[#5C6570]">Known recipient filled from the directory.</p>}
            <Field label="Name"><TextInput value={name} onChange={(event) => setName(event.target.value)} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="District"><TextInput value={district} onChange={(event) => setDistrict(event.target.value)} /></Field>
              <Field label="Area"><TextInput value={area} onChange={(event) => setArea(event.target.value)} /></Field>
            </div>
            <Field label="Street"><TextInput value={street} onChange={(event) => setStreet(event.target.value)} /></Field>
          </Panel>
          <Panel className="space-y-3 p-4">
            <h2 className="font-medium">Parcel</h2>
            <Field label="Service">
              <SelectInput value={service} onChange={(event) => setService(event.target.value as ServiceType)}>
                <option value="standard">Standard</option>
                <option value="express">Express</option>
                <option value="same_day">Same day</option>
              </SelectInput>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Product price (taka)"><TextInput value={productPrice} onChange={(event) => setProductPrice(event.target.value)} /></Field>
              <Field label="COD taka"><TextInput value={cod} onChange={(event) => setCod(event.target.value)} /></Field>
            </div>
            <Field label="Weight kg"><TextInput value={weight} onChange={(event) => setWeight(event.target.value)} /></Field>
            <Field label="Category"><TextInput value={category} onChange={(event) => setCategory(event.target.value)} /></Field>
          </Panel>
        </div>
        <Panel className="h-fit p-4 lg:sticky lg:top-20">
          {'error' in priced ? (
            <p className="text-sm text-red-700">{priced.error}</p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="font-medium">{zoneLabel(priced.zone)}</div>
              <div>Delivery {formatTaka(priced.deliveryCharge)} · 1% of product price</div>
              <div>Damage control {formatTaka(priced.damageControl)}</div>
              <div>Total {formatTaka(priced.totalCharges)}</div>
              <div>Payable {formatTaka(priced.payableAmount)}</div>
              {priced.merchantOwes && <p>No COD. The merchant owes the delivery charge and the ৳ 1 damage cover.</p>}
            </div>
          )}
          <div className="mt-4 flex flex-col gap-2">
            <Button disabled={'error' in priced || !name || !phone} onClick={() => submit(true)}>Create & print label</Button>
            <Button variant="secondary" disabled={'error' in priced || !name || !phone} onClick={() => submit(false)}>Create only</Button>
          </div>
        </Panel>
      </div>
    </div>
  )
}

export function BookingsPage({ view = 'today' }: { view?: 'today' | 'week' | 'cod' | 'unprinted' }) {
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const parcels = useDemo(useShallow((state) => state.parcels.filter((parcel) => parcel.createdBy === user?.id)))
  const [q, setQ] = useState('')
  const [zone, setZone] = useState('all')
  const today = todayDhaka()
  const rows = parcels.filter((parcel) => {
    const booked = dhakaDate(parcel.createdAt)
    if (view === 'today') return booked === today
    if (view === 'week') return Date.now() - new Date(parcel.createdAt).getTime() < 7 * 86400000
    if (view === 'cod') return parcel.codAmount > 0
    return !parcel.labelPrinted
  }).filter((parcel) => (zone === 'all' || parcel.deliveryZone === zone) && `${parcel.trackingId} ${parcel.recipient.name} ${parcel.recipient.area}`.toLowerCase().includes(q.trim().toLowerCase()))
  const title = view === 'today' ? 'Today' : view === 'week' ? 'This week' : view === 'cod' ? 'COD bookings' : 'Not printed'
  return (
    <div>
      <PageTitle title={title} action={<Link to="/app/bookings/new"><Button>New booking</Button></Link>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <TextInput className="max-w-sm" placeholder="Search tracking, name, or area" value={q} onChange={(event) => setQ(event.target.value)} />
        <SelectInput className="max-w-44" value={zone} onChange={(event) => setZone(event.target.value)}>
          <option value="all">All zones</option>
          <option value="inside_dhaka">Inside Dhaka</option>
          <option value="sub_dhaka">Sub Dhaka</option>
          <option value="outside_dhaka">Outside Dhaka</option>
        </SelectInput>
      </div>
      <ParcelTable parcels={rows} />
    </div>
  )
}

export function LabelsPage({ view = 'queue' }: { view?: 'queue' | 'printed' | 'cod' }) {
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const parcels = useDemo(useShallow((state) => state.parcels.filter((parcel) => parcel.createdBy === user?.id)))
  const [q, setQ] = useState('')
  const [zone, setZone] = useState('all')
  const today = todayDhaka()
  const rows = parcels.filter((parcel) => {
    if (view === 'printed') return parcel.labelPrinted && dhakaDate(parcel.createdAt) === today
    if (view === 'cod') return parcel.codAmount > 0 && !parcel.labelPrinted
    return !parcel.labelPrinted
  }).filter((parcel) => (zone === 'all' || parcel.deliveryZone === zone) && `${parcel.trackingId} ${parcel.recipient.area}`.toLowerCase().includes(q.trim().toLowerCase()))
  const title = view === 'printed' ? 'Printed today' : view === 'cod' ? 'COD labels' : 'To print'
  return (
    <div>
      <PageTitle title={title} />
      <div className="mb-3 flex flex-wrap gap-2">
        <TextInput className="max-w-sm" placeholder="Search tracking or area" value={q} onChange={(event) => setQ(event.target.value)} />
        <SelectInput className="max-w-44" value={zone} onChange={(event) => setZone(event.target.value)}>
          <option value="all">All zones</option>
          <option value="inside_dhaka">Inside Dhaka</option>
          <option value="sub_dhaka">Sub Dhaka</option>
          <option value="outside_dhaka">Outside Dhaka</option>
        </SelectInput>
      </div>
      <ParcelTable parcels={rows} />
    </div>
  )
}

export function LabelPage() {
  const { trackingId = '' } = useParams()
  const parcel = useDemo((state) => state.parcels.find((item) => item.trackingId === trackingId))
  const merchant = useDemo((state) => state.merchants.find((item) => item.id === parcel?.merchantId))
  const footer = useDemo((state) => state.settings.labelFooter)
  const markLabelPrinted = useDemo((state) => state.markLabelPrinted)
  const navigate = useNavigate()
  if (!parcel) return <Empty>Label not found.</Empty>
  return (
    <div className="min-h-screen bg-[#F6F7F9] p-8">
      <div className="no-print mb-4 flex gap-2">
        <Button variant="secondary" onClick={() => navigate(`/app/parcels/${parcel.trackingId}`)}>Back to parcel</Button>
        <Button onClick={() => { markLabelPrinted(parcel.id); window.print() }}>Print</Button>
      </div>
      <div className="print-sheet mx-auto w-[100mm] bg-white p-4 text-sm shadow">
        <div className="text-lg font-semibold text-[#0F6E56]">Nirapod</div>
        <div className="mt-3 text-2xl"><TrackingCopy id={parcel.trackingId} /></div>
        <div className="mt-2 h-10 bg-[repeating-linear-gradient(90deg,#121417_0_2px,transparent_2px_4px)]" />
        <div className="mt-4 font-medium">{parcel.recipient.name}</div>
        <div>{parcel.recipient.phone}</div>
        <div>{parcel.recipient.area}, {parcel.recipient.district}</div>
        <div className="mt-3 tabular font-medium">COD {formatTaka(parcel.codAmount)}</div>
        <div className="mt-2 text-xs">{merchant?.businessName} · {parcel.itemsCount} pc · {parcel.serviceType}</div>
        <div className="mt-4 text-xs text-[#5C6570]">{footer}</div>
      </div>
    </div>
  )
}

export function FindPage() {
  return <Empty>Use the search field in the top bar.</Empty>
}
