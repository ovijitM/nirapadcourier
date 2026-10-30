import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, DataTable, Field, Kpis, PageTitle, Panel, SelectInput, SplitPopup, Tag, TextInput, toneFor } from '../../components/ui.tsx'
import { TrackingRow } from '../parcels/ParcelPages.tsx'
import { formatTaka, formatWhen } from '../../lib/money.ts'
import { canAct } from '../../lib/status.ts'
import { useDemo } from '../../mock/store.ts'
import type { Branch, PayMethod } from '../../mock/types.ts'

export function FinanceOverviewPage() {
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const settlements = useDemo((state) => state.settlements)
  const merchants = useDemo((state) => state.merchants)
  const handovers = useDemo((state) => state.handovers)
  const collections = useDemo((state) => state.collections)
  const riders = useDemo((state) => state.riders)
  const branches = useDemo((state) => state.branches)
  const [openId, setOpenId] = useState<string | null>(null)
  const branchId = useDemo((state) => state.workingBranchId)
  const setBranchId = useDemo((state) => state.setWorkingBranch)
  if (!user) return null
  const pending = settlements.filter((item) => item.payoutStatus === 'pending_approval' && settlementInBranch(item.merchantId, merchants, branchId))
  const inHand = collections.filter((item) => item.handoverStatus === 'pending' && riderInBranch(riders, item.riderId, branchId)).reduce((sum, item) => sum + item.amountCollected, 0)
  const handoverCount = handovers.filter((item) => item.status === 'pending' && (branchId === 'all' || item.branchId === branchId)).length
  const drafts = settlements.filter((item) => item.payoutStatus === 'draft' && settlementInBranch(item.merchantId, merchants, branchId)).length
  return (
    <div>
      <PageTitle title="Overview" />
      <BranchSelect branches={branches} value={branchId} onChange={setBranchId} />
      <div className="mb-4">
        <DataTable
          columns={['Branch', 'Network', 'COD in hand', 'Handovers', 'Payable']}
          rows={branches.filter((branch) => branchId === 'all' || branch.id === branchId).map((branch) => ({
            id: branch.id,
            onClick: () => setBranchId(branch.id),
            cells: [
              <span className="font-medium">{branch.name}</span>,
              <Tag tone={branch.network === 'inside_dhaka' ? 'green' : 'blue'}>{branch.network === 'inside_dhaka' ? 'Inside' : 'Outside'}</Tag>,
              <span className="tabular">{formatTaka(collections.filter((item) => item.handoverStatus === 'pending' && riderInBranch(riders, item.riderId, branch.id)).reduce((sum, item) => sum + item.amountCollected, 0))}</span>,
              <span className="tabular">{handovers.filter((item) => item.branchId === branch.id && item.status === 'pending').length}</span>,
              <span className="tabular">{formatTaka(settlements.filter((item) => item.payoutStatus !== 'disbursed' && settlementInBranch(item.merchantId, merchants, branch.id)).reduce((sum, item) => sum + item.netPayable, 0))}</span>,
            ],
          }))}
        />
      </div>
      <Kpis items={[
        { label: 'COD in rider hands', value: formatTaka(inHand) },
        { label: 'Handovers to verify', value: String(handoverCount) },
        { label: 'Pending approval', value: String(pending.length) },
        { label: 'Drafts', value: String(drafts) },
      ]} />
      <div className="mt-4">
        <DataTable
          columns={['Merchant', 'Status', 'Payable']}
          rows={pending.map((item) => ({
            id: item.id,
            onClick: () => setOpenId(item.id),
            cells: [
              <span className="font-medium">{merchants.find((merchant) => merchant.id === item.merchantId)?.businessName}</span>,
              <Tag tone="amber">Pending approval</Tag>,
              <span className="tabular">{formatTaka(item.netPayable)}</span>,
            ],
          }))}
        />
      </div>
      {openId && <SettlementDetailPage id={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}

export function CodPage({ view = 'all' }: { view?: 'all' | 'pending' | 'short' | 'reconciled' }) {
  const collections = useDemo((state) => state.collections)
  const parcels = useDemo((state) => state.parcels)
  const riders = useDemo((state) => state.riders)
  const [filter, setFilter] = useState(view)
  const [q, setQ] = useState('')
  const branchId = useDemo((state) => state.workingBranchId)
  const setBranchId = useDemo((state) => state.setWorkingBranch)
  const [openId, setOpenId] = useState<string | null>(null)
  const branches = useDemo((state) => state.branches)
  const rows = collections.filter((item) => {
    if (filter === 'pending') return item.handoverStatus === 'pending'
    if (filter === 'short') return item.amountCollected < item.expected
    if (filter === 'reconciled') return item.handoverStatus === 'reconciled'
    return true
  }).filter((item) => {
    const parcel = parcels.find((row) => row.id === item.parcelId)
    const rider = riders.find((row) => row.id === item.riderId)
    if (!riderInBranch(riders, item.riderId, branchId)) return false
    return `${parcel?.trackingId ?? ''} ${rider?.name ?? ''} ${rider?.riderCode ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())
  }).sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))
  return (
    <div>
      <PageTitle title="COD" />
      <div className="mb-3 flex flex-wrap gap-2">
      <TextInput className="max-w-sm" placeholder="Search tracking or rider" value={q} onChange={(event) => setQ(event.target.value)} />
      <BranchSelect branches={branches} value={branchId} onChange={setBranchId} />
      <SelectInput className="max-w-52" value={filter} onChange={(event) => setFilter(event.target.value as typeof view)}>
        <option value="all">All collections</option>
        <option value="pending">In rider hands</option>
        <option value="short">Short payments</option>
        <option value="reconciled">Reconciled</option>
      </SelectInput>
      </div>
      <Kpis items={[
        { label: 'Expected', value: formatTaka(rows.reduce((sum, item) => sum + item.expected, 0)) },
        { label: 'Collected', value: formatTaka(rows.reduce((sum, item) => sum + item.amountCollected, 0)) },
        { label: 'In rider hands', value: formatTaka(rows.filter((item) => item.handoverStatus === 'pending').reduce((sum, item) => sum + item.amountCollected, 0)) },
        { label: 'Rows', value: String(rows.length) },
      ]} />
      <div className="mt-4">
        <DataTable
          columns={['Branch', 'Tracking', 'Expected', 'Collected', 'Method', 'Rider', 'Handover']}
          rows={rows.map((item) => {
            const parcel = parcels.find((row) => row.id === item.parcelId)
            const short = item.amountCollected < item.expected
            return {
              id: item.id,
              onClick: () => setOpenId(item.id),
              cells: [
                branchLabel(branches, riders.find((rider) => rider.id === item.riderId)?.branchId),
                parcel ? <TrackingRow id={parcel.trackingId} /> : <span>—</span>,
                <span className="tabular">{formatTaka(item.expected)}</span>,
                <span className={short ? 'tabular font-medium text-red-700' : 'tabular'}>{formatTaka(item.amountCollected)}{short && ' short'}</span>,
                item.paymentMethod,
                riders.find((rider) => rider.id === item.riderId)?.riderCode ?? '—',
                <Tag tone={short ? 'red' : toneFor(item.handoverStatus)}>{short ? 'short' : item.handoverStatus.replaceAll('_', ' ')}</Tag>,
              ],
            }
          })}
        />
      </div>
      {openId && <CodPopup id={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}

export function HandoverPage({ view = 'pending' }: { view?: 'pending' | 'verified' | 'disputed' }) {
  const handovers = useDemo((state) => state.handovers)
  const riders = useDemo((state) => state.riders)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const verifyHandover = useDemo((state) => state.verifyHandover)
  const [note, setNote] = useState('Count does not match')
  const [openId, setOpenId] = useState<string | null>(null)
  const [filter, setFilter] = useState(view === 'pending' ? 'all' : view)
  const [q, setQ] = useState('')
  const branchId = useDemo((state) => state.workingBranchId)
  const setBranchId = useDemo((state) => state.setWorkingBranch)
  const branches = useDemo((state) => state.branches)
  const rows = handovers.filter((item) => {
    if (branchId !== 'all' && item.branchId !== branchId) return false
    if (filter !== 'all' && item.status !== filter) return false
    const rider = riders.find((row) => row.id === item.riderId)
    return `${rider?.name ?? ''} ${rider?.riderCode ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())
  })
  return (
    <div>
      <PageTitle title="Handovers" />
      <div className="mb-3 flex flex-wrap gap-2">
      <TextInput className="max-w-sm" placeholder="Search rider" value={q} onChange={(event) => setQ(event.target.value)} />
      <BranchSelect branches={branches} value={branchId} onChange={setBranchId} />
      <SelectInput className="max-w-52" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
        <option value="all">All</option>
        <option value="pending">To verify</option>
        <option value="verified">Verified</option>
        <option value="disputed">Disputed</option>
      </SelectInput>
      </div>
      <DataTable
        columns={['Branch', 'Rider', 'Code', 'Amount', 'Status']}
        rows={rows.map((item) => {
          const rider = riders.find((row) => row.id === item.riderId)
          return {
            id: item.id,
            onClick: () => setOpenId(item.id),
            cells: [
              branchLabel(branches, item.branchId),
              <span className="font-medium">{rider?.name}</span>,
              rider?.riderCode ?? '—',
              <span className="tabular">{formatTaka(item.amount)}</span>,
              <Tag tone={item.status === 'disputed' ? 'red' : toneFor(item.status)}>{item.status}</Tag>,
            ],
          }
        })}
      />
      {openId && (
        <HandoverPopup
          id={openId}
          note={note}
          setNote={setNote}
          canWrite={!!user && canAct(user.role, 'financeWrite')}
          onVerify={(status) => { verifyHandover(openId, status, status === 'disputed' ? note : ''); setOpenId(null) }}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  )
}

export function SettlementListPage({ view = 'all' }: { view?: 'all' | 'draft' | 'pending_approval' | 'approved' | 'disbursed' }) {
  const settlements = useDemo((state) => state.settlements)
  const merchants = useDemo((state) => state.merchants)
  const [filter, setFilter] = useState(view)
  const [q, setQ] = useState('')
  const branchId = useDemo((state) => state.workingBranchId)
  const setBranchId = useDemo((state) => state.setWorkingBranch)
  const branches = useDemo((state) => state.branches)
  const [openId, setOpenId] = useState<string | null>(null)
  const rows = settlements.filter((item) => (filter === 'all' || item.payoutStatus === filter) && settlementInBranch(item.merchantId, merchants, branchId)).filter((item) => (merchants.find((merchant) => merchant.id === item.merchantId)?.businessName ?? '').toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div>
      <PageTitle title="Settlements" />
      <div className="mb-3 flex flex-wrap gap-2">
      <TextInput className="max-w-sm" placeholder="Search merchant" value={q} onChange={(event) => setQ(event.target.value)} />
      <BranchSelect branches={branches} value={branchId} onChange={setBranchId} />
      <SelectInput className="max-w-56" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
        <option value="all">All batches</option>
        <option value="draft">Drafts</option>
        <option value="pending_approval">Awaiting approval</option>
        <option value="approved">Approved</option>
        <option value="disbursed">Disbursed</option>
      </SelectInput>
      </div>
      <DataTable
        columns={['Branch', 'Merchant', 'Period', 'Status', 'Payable']}
        rows={rows.map((item) => ({
          id: item.id,
          onClick: () => setOpenId(item.id),
          cells: [
            branchLabel(branches, merchants.find((merchant) => merchant.id === item.merchantId)?.pickupBranchId),
            <span className="font-medium">{merchants.find((merchant) => merchant.id === item.merchantId)?.businessName}</span>,
            <span className="text-[#5C6570]">{item.periodStart} – {item.periodEnd}</span>,
            <Tag tone={toneFor(item.payoutStatus)}>{item.payoutStatus.replaceAll('_', ' ')}</Tag>,
            <span className="tabular">{formatTaka(item.netPayable)}</span>,
          ],
        }))}
      />
      {openId && <SettlementDetailPage id={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}

export function SettlementDetailPage({ id: idProp, onClose }: { id?: string; onClose?: () => void } = {}) {
  const params = useParams()
  const navigate = useNavigate()
  const id = idProp ?? params.id ?? ''
  const close = onClose ?? (() => navigate('/app/finance/settlements'))
  const row = useDemo((state) => state.settlements.find((item) => item.id === id))
  const merchant = useDemo((state) => state.merchants.find((item) => item.id === row?.merchantId))
  const parcels = useDemo((state) => state.parcels)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const submitSettlement = useDemo((state) => state.submitSettlement)
  const approveSettlement = useDemo((state) => state.approveSettlement)
  const rejectSettlement = useDemo((state) => state.rejectSettlement)
  const disburseSettlement = useDemo((state) => state.disburseSettlement)
  const [reference, setReference] = useState('BKASH-DEMO-1001')
  const [method, setMethod] = useState<PayMethod>('bkash')
  if (!row || !user) return null
  return (
    <SplitPopup
      fit
      open
      onClose={close}
      left={
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{merchant?.businessName ?? 'Settlement'}</h2>
            <Tag tone={toneFor(row.payoutStatus)}>{row.payoutStatus.replaceAll('_', ' ')}</Tag>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <section className="rounded-xl border border-[#E6E8EC] bg-white px-3">
              <h3 className="pt-2 text-xs font-medium text-[#5C6570]">Period</h3>
              <Fact label="From" value={row.periodStart} />
              <Fact label="To" value={row.periodEnd} />
              <Fact label="Parcels" value={String(row.parcelIds.length)} />
            </section>
            <section className="rounded-xl border border-[#E6E8EC] bg-white px-3">
              <h3 className="pt-2 text-xs font-medium text-[#5C6570]">Money</h3>
              <Fact label="COD" value={formatTaka(row.totalCodCollected)} />
              <Fact label="Delivery" value={formatTaka(row.totalDeliveryCharges)} />
              <Fact label="Damage" value={formatTaka(row.totalCodFees)} />
              <Fact label="Payable" value={<span className="text-[#0F6E56]">{formatTaka(row.netPayable)}</span>} />
            </section>
          </div>
          <div className="flex flex-wrap gap-2">
            {row.payoutStatus === 'draft' && canAct(user.role, 'financeWrite') && <Button onClick={() => submitSettlement(row.id)}>Submit for approval</Button>}
            {row.payoutStatus === 'pending_approval' && canAct(user.role, 'approveSettlement') && (
              <>
                <Button onClick={() => approveSettlement(row.id)}>Approve</Button>
                <Button variant="danger" onClick={() => rejectSettlement(row.id, 'Returned')}>Reject</Button>
              </>
            )}
          </div>
          {row.payoutStatus === 'approved' && canAct(user.role, 'disburse') && (
            <div className="grid grid-cols-[1fr_140px_auto] items-end gap-2">
              <Field label="Payment reference"><TextInput value={reference} onChange={(event) => setReference(event.target.value)} /></Field>
              <Field label="Method">
                <SelectInput value={method} onChange={(event) => setMethod(event.target.value as PayMethod)}>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank</option>
                </SelectInput>
              </Field>
              <Button onClick={() => disburseSettlement(row.id, reference, method)}>Disburse</Button>
            </div>
          )}
          {row.paymentReference && <Tag tone="green">Paid {row.paymentReference}</Tag>}
        </div>
      }
      right={
        <div>
          <h3 className="mb-3 text-sm font-medium">Parcels in this batch</h3>
          <div className="space-y-2">
            {row.parcelIds.map((parcelId) => {
              const parcel = parcels.find((item) => item.id === parcelId)
              return (
                <div key={parcelId} className="flex items-center justify-between rounded-xl border border-[#E6E8EC] px-3 py-2 text-sm">
                  {parcel ? <TrackingRow id={parcel.trackingId} /> : parcelId}
                  <span className="text-[#5C6570]">{parcel?.recipient.area}</span>
                  <span className="tabular">{parcel ? formatTaka(parcel.codAmount) : '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
      }
    />
  )
}

export function LedgerPage() {
  const ledger = useDemo((state) => state.ledger)
  const users = useDemo((state) => state.users)
  const [openId, setOpenId] = useState<string | null>(null)
  const parcels = useDemo((state) => state.parcels)
  const branches = useDemo((state) => state.branches)
  const [q, setQ] = useState('')
  const [side, setSide] = useState('all')
  const branchId = useDemo((state) => state.workingBranchId)
  const setBranchId = useDemo((state) => state.setWorkingBranch)
  const branchLedger = ledger.filter((item) => ledgerInBranch(item.parcelId, parcels, branchId))
  const shown = branchLedger.filter((item) => (side === 'all' || item.type === side) && `${item.description} ${item.accountType}`.toLowerCase().includes(q.trim().toLowerCase()))
  const debit = branchLedger.filter((item) => item.type === 'DEBIT').reduce((sum, item) => sum + item.amount, 0)
  const credit = branchLedger.filter((item) => item.type === 'CREDIT').reduce((sum, item) => sum + item.amount, 0)
  const open = ledger.find((item) => item.id === openId)
  return (
    <div>
      <PageTitle title="Ledger" />
      <Kpis items={[
        { label: 'Debits', value: formatTaka(debit) },
        { label: 'Credits', value: formatTaka(credit) },
        { label: 'Lines', value: String(ledger.length) },
        { label: 'Balanced', value: debit === credit ? 'Yes' : 'No' },
      ]} />
      <div className="mb-3 mt-4 flex flex-wrap gap-2">
        <TextInput className="max-w-sm" placeholder="Search account or description" value={q} onChange={(event) => setQ(event.target.value)} />
        <BranchSelect branches={branches} value={branchId} onChange={setBranchId} />
        <SelectInput className="max-w-40" value={side} onChange={(event) => setSide(event.target.value)}>
          <option value="all">Debit and credit</option>
          <option value="DEBIT">Debit</option>
          <option value="CREDIT">Credit</option>
        </SelectInput>
      </div>
      <div>
        <DataTable
          columns={['Branch', 'When', 'Account', 'Side', 'Amount', 'Description']}
          rows={shown.map((item) => ({
            id: item.id,
            onClick: () => setOpenId(item.id),
            cells: [
              branchLabel(branches, parcels.find((parcel) => parcel.id === item.parcelId)?.originBranchId),
              formatWhen(item.createdAt),
              item.accountType.replaceAll('_', ' '),
              <Tag tone={item.type === 'DEBIT' ? 'red' : 'green'}>{item.type}</Tag>,
              <span className="tabular">{formatTaka(item.amount)}</span>,
              item.description,
            ],
          }))}
        />
      </div>
      {open && (
        <SplitPopup
          open
          onClose={() => setOpenId(null)}
          left={
            <div>
              <Tag tone={open.type === 'DEBIT' ? 'red' : 'green'}>{open.type}</Tag>
              <h2 className="mt-2 text-xl font-semibold">{formatTaka(open.amount)}</h2>
              <div className="mt-4 rounded-xl border border-[#E6E8EC] bg-white px-3">
                <Fact label="Account" value={open.accountType.replaceAll('_', ' ')} />
                <Fact label="When" value={formatWhen(open.createdAt)} />
                <Fact label="By" value={users.find((user) => user.id === open.createdBy)?.name ?? '—'} />
                <Fact label="Batch" value={open.batchId} />
              </div>
            </div>
          }
          right={<p className="text-sm">{open.description}</p>}
        />
      )}
    </div>
  )
}

export function AdjustmentsPage() {
  const rows = useDemo((state) => state.adjustments)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const requestAdjustment = useDemo((state) => state.requestAdjustment)
  const approveAdjustment = useDemo((state) => state.approveAdjustment)
  const [amount, setAmount] = useState('100')
  const [description, setDescription] = useState('Goodwill credit')
  const [openId, setOpenId] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const shown = rows.filter((item) => (status === 'all' || item.status === status) && item.description.toLowerCase().includes(q.trim().toLowerCase()))
  const open = shown.find((item) => item.id === openId) ?? rows.find((item) => item.id === openId)
  return (
    <div>
      <PageTitle title="Adjustments" />
      {user && canAct(user.role, 'financeWrite') && (
        <Panel className="mb-4 grid gap-2 p-4 md:grid-cols-[140px_1fr_auto]">
          <TextInput value={amount} onChange={(event) => setAmount(event.target.value)} />
          <TextInput value={description} onChange={(event) => setDescription(event.target.value)} />
          <Button onClick={() => requestAdjustment(Number(amount) || 0, description)}>Request</Button>
        </Panel>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <TextInput className="max-w-sm" placeholder="Search description" value={q} onChange={(event) => setQ(event.target.value)} />
        <SelectInput className="max-w-40" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </SelectInput>
      </div>
      <DataTable
        columns={['When', 'Description', 'Amount', 'Status']}
        rows={shown.map((item) => ({
          id: item.id,
          onClick: () => setOpenId(item.id),
          cells: [
            formatWhen(item.createdAt),
            item.description,
            <span className="tabular">{formatTaka(item.amount)}</span>,
            <Tag tone={toneFor(item.status)}>{item.status}</Tag>,
          ],
        }))}
      />
      {open && (
        <SplitPopup
          open
          onClose={() => setOpenId(null)}
          left={
            <div>
              <Tag tone={toneFor(open.status)}>{open.status}</Tag>
              <h2 className="mt-2 text-xl font-semibold">{formatTaka(open.amount)}</h2>
              <p className="mt-3 text-sm">{open.description}</p>
              {open.status === 'pending' && user?.role === 'super_admin' && <Button className="mt-5" onClick={() => approveAdjustment(open.id)}>Approve</Button>}
            </div>
          }
          right={
            <div className="rounded-xl border border-[#E6E8EC] px-3">
              <Fact label="Requested" value={formatWhen(open.createdAt)} />
              <Fact label="Status" value={open.status} />
            </div>
          }
        />
      )}
    </div>
  )
}

export function AuditPage() {
  const audit = useDemo((state) => state.audit)
  const users = useDemo((state) => state.users)
  const [openId, setOpenId] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const open = audit.find((item) => item.id === openId)
  const shown = audit.filter((item) => {
    if (kind === 'parcel' && !item.action.includes('PARCEL')) return false
    if (kind === 'finance' && !item.action.includes('SETTLEMENT') && !item.action.includes('HANDOVER')) return false
    if (kind === 'people' && !item.action.includes('USER') && !item.action.includes('MERCHANT')) return false
    const who = users.find((user) => user.id === item.actorId)?.name ?? ''
    return `${who} ${item.action} ${item.entity} ${item.summary}`.toLowerCase().includes(q.trim().toLowerCase())
  })
  return (
    <div>
      <PageTitle title="Audit" />
      <div className="mb-3 flex flex-wrap gap-2">
        <TextInput className="max-w-sm" placeholder="Search person, record, or summary" value={q} onChange={(event) => setQ(event.target.value)} />
        <SelectInput className="max-w-44" value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="all">All actions</option>
          <option value="parcel">Parcels</option>
          <option value="finance">Finance</option>
          <option value="people">People</option>
        </SelectInput>
      </div>
      <DataTable
        columns={['When', 'Who', 'Action', 'Record', 'Summary']}
        rows={shown.map((item) => ({
          id: item.id,
          onClick: () => setOpenId(item.id),
          cells: [
            formatWhen(item.timestamp),
            users.find((user) => user.id === item.actorId)?.name ?? '—',
            <Tag tone={actionTone(item.action)}>{item.action.replaceAll('_', ' ')}</Tag>,
            item.entity,
            item.summary,
          ],
        }))}
      />
      {open && (
        <SplitPopup
          open
          onClose={() => setOpenId(null)}
          left={
            <div>
              <Tag tone={actionTone(open.action)}>{open.action.replaceAll('_', ' ')}</Tag>
              <h2 className="mt-2 text-xl font-semibold">{users.find((user) => user.id === open.actorId)?.name ?? 'Staff'}</h2>
              <div className="mt-4 rounded-xl border border-[#E6E8EC] bg-white px-3">
                <Fact label="When" value={formatWhen(open.timestamp)} />
                <Fact label="Record" value={open.entity} />
              </div>
            </div>
          }
          right={
            <div>
              <h3 className="mb-2 text-sm font-medium">What changed</h3>
              <p className="rounded-xl border border-[#E6E8EC] px-3 py-3 text-sm">{open.summary}</p>
            </div>
          }
        />
      )}
    </div>
  )
}

function BranchSelect({ branches, value, onChange }: { branches: Branch[]; value: string; onChange: (value: string) => void }) {
  return (
    <SelectInput className="max-w-52" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="all">All branches</option>
      <optgroup label="Inside Dhaka">
        {branches.filter((branch) => branch.network === 'inside_dhaka').map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
      </optgroup>
      <optgroup label="Outside Dhaka">
        {branches.filter((branch) => branch.network === 'outside_dhaka').map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
      </optgroup>
    </SelectInput>
  )
}

function riderInBranch(riders: { id: string; branchId: string }[], riderId: string, branchId: string) {
  if (branchId === 'all') return true
  return riders.find((rider) => rider.id === riderId)?.branchId === branchId
}

function settlementInBranch(merchantId: string, merchants: { id: string; pickupBranchId: string }[], branchId: string) {
  if (branchId === 'all') return true
  return merchants.find((merchant) => merchant.id === merchantId)?.pickupBranchId === branchId
}

function ledgerInBranch(parcelId: string | undefined, parcels: { id: string; currentBranchId: string; originBranchId: string }[], branchId: string) {
  if (branchId === 'all') return true
  if (!parcelId) return false
  const parcel = parcels.find((item) => item.id === parcelId)
  return parcel?.originBranchId === branchId
}

function branchLabel(branches: Branch[], id?: string) {
  const branch = branches.find((item) => item.id === id)
  if (!branch) return '—'
  return <span className="inline-flex items-center gap-2">{branch.name}<Tag tone={branch.network === 'inside_dhaka' ? 'green' : 'blue'}>{branch.network === 'inside_dhaka' ? 'Inside' : 'Outside'}</Tag></span>
}

function actionTone(action: string): 'red' | 'amber' | 'blue' | 'green' | 'slate' {
  if (action.includes('CANCEL') || action.includes('FAIL') || action.includes('REJECT')) return 'red'
  if (action.includes('SETTLEMENT') || action.includes('HANDOVER') || action.includes('DISBURSE')) return 'amber'
  if (action.includes('SIGN')) return 'slate'
  if (action.includes('STATUS') || action.includes('PARCEL')) return 'blue'
  return 'green'
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#E6E8EC] py-1.5 text-sm last:border-0">
      <span className="text-[#5C6570]">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function CodPopup({ id, onClose }: { id: string; onClose: () => void }) {
  const item = useDemo((state) => state.collections.find((row) => row.id === id))
  const parcel = useDemo((state) => state.parcels.find((row) => row.id === item?.parcelId))
  const rider = useDemo((state) => state.riders.find((row) => row.id === item?.riderId))
  if (!item) return null
  const short = item.amountCollected < item.expected
  return (
    <SplitPopup
      open
      onClose={onClose}
      left={
        <div>
          <Tag tone={short ? 'red' : toneFor(item.handoverStatus)}>{short ? 'short' : item.handoverStatus.replaceAll('_', ' ')}</Tag>
          <h2 className="mt-2 text-xl font-semibold">{formatTaka(item.amountCollected)}</h2>
          <p className="mt-1 text-sm text-[#5C6570]">Expected {formatTaka(item.expected)}</p>
          <div className="mt-4 rounded-xl border border-[#E6E8EC] bg-white px-3">
            <Fact label="Method" value={item.paymentMethod} />
            <Fact label="Rider" value={rider ? `${rider.riderCode} · ${rider.name}` : '—'} />
            <Fact label="Collected" value={formatWhen(item.collectedAt)} />
          </div>
        </div>
      }
      right={
        <div>
          <h3 className="mb-2 text-sm font-medium">Parcel</h3>
          {parcel ? <TrackingRow id={parcel.trackingId} /> : <p className="text-sm">No parcel linked.</p>}
        </div>
      }
    />
  )
}

function HandoverPopup({
  id,
  note,
  setNote,
  canWrite,
  onVerify,
  onClose,
}: {
  id: string
  note: string
  setNote: (value: string) => void
  canWrite: boolean
  onVerify: (status: 'verified' | 'disputed') => void
  onClose: () => void
}) {
  const item = useDemo((state) => state.handovers.find((row) => row.id === id))
  const rider = useDemo((state) => state.riders.find((row) => row.id === item?.riderId))
  const branch = useDemo((state) => state.branches.find((row) => row.id === item?.branchId))
  if (!item) return null
  return (
    <SplitPopup
      open
      onClose={onClose}
      left={
        <div>
          <Tag tone={item.status === 'disputed' ? 'red' : toneFor(item.status)}>{item.status}</Tag>
          <h2 className="mt-2 text-xl font-semibold">{rider?.name ?? 'Rider'}</h2>
          <p className="text-sm text-[#5C6570]">{rider?.riderCode}</p>
          <div className="mt-4 rounded-xl border border-[#E6E8EC] bg-white px-3">
            <Fact label="Amount" value={formatTaka(item.amount)} />
            <Fact label="Hub" value={branch?.name ?? '—'} />
            <Fact label="When" value={formatWhen(item.createdAt)} />
          </div>
        </div>
      }
      right={
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Cash count</h3>
          <p className="text-sm text-[#5C6570]">{item.collectionIds.length} collections in this handover.</p>
          {item.note && <p className="text-sm">{item.note}</p>}
          {item.status === 'pending' && canWrite && (
            <>
              <Field label="Dispute note"><TextInput value={note} onChange={(event) => setNote(event.target.value)} /></Field>
              <div className="flex gap-2">
                <Button onClick={() => onVerify('verified')}>Verify</Button>
                <Button variant="danger" onClick={() => onVerify('disputed')}>Dispute</Button>
              </div>
            </>
          )}
        </div>
      }
    />
  )
}
