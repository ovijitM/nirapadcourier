import type { RoleId } from '../mock/types.ts'

export interface SectionDef {
  label: string
  to: string
  roles?: RoleId[]
  exact?: boolean
  group?: string
}

export interface ModuleDef {
  id: string
  title: string
  access: string
  test: (path: string) => boolean
  sections: SectionDef[] | ((path: string) => SectionDef[])
}

const financeRoles = {
  overview: ['super_admin', 'operations'] as RoleId[],
  cod: ['super_admin', 'operations', 'accounts', 'branch_manager'] as RoleId[],
  handovers: ['super_admin', 'operations', 'accounts', 'branch_manager'] as RoleId[],
  settlements: ['super_admin', 'operations', 'accounts'] as RoleId[],
  ledger: ['super_admin', 'operations', 'accounts'] as RoleId[],
  adjustments: ['super_admin', 'accounts'] as RoleId[],
  audit: ['super_admin', 'operations', 'accounts'] as RoleId[],
}

export const modules: ModuleDef[] = [
  {
    id: 'branch-detail',
    title: 'Branch',
    access: 'branch',
    test: (path) => /^\/app\/branches\/(?!zones$|cities$)[^/]+/.test(path),
    sections: (path) => {
      const code = path.split('/')[3] ?? ''
      const base = `/app/branches/${code}`
      return [
        { label: 'Overview', to: base, exact: true, group: 'Branch' },
        { label: 'Parcels here', to: `${base}/parcels`, group: 'Work' },
        { label: 'Staff', to: `${base}/staff`, group: 'Work' },
        { label: 'Riders', to: `${base}/riders`, group: 'Work' },
        { label: 'Manifests', to: `${base}/manifests`, group: 'Work' },
        { label: 'COD', to: `${base}/cod`, group: 'Money' },
      ]
    },
  },
  {
    id: 'branches',
    title: 'Branches',
    access: 'branches',
    test: (path) => path === '/app/branches' || path === '/app/branches/zones' || path === '/app/branches/cities',
    sections: [
      { label: 'All branches', to: '/app/branches', exact: true, group: 'Network' },
      { label: 'Dhaka zones', to: '/app/branches/zones', group: 'Routing' },
      { label: 'Outside cities', to: '/app/branches/cities', group: 'Routing' },
    ],
  },
  {
    id: 'staff',
    title: 'Staff',
    access: 'staff',
    test: (path) => path.startsWith('/app/staff'),
    sections: [
      { label: 'Directory', to: '/app/staff', exact: true },
      { label: 'Roles', to: '/app/staff/roles', roles: ['super_admin'] },
    ],
  },
  {
    id: 'merchants',
    title: 'Merchants',
    access: 'merchants',
    test: (path) => path.startsWith('/app/merchants'),
    sections: [
      { label: 'Directory', to: '/app/merchants', exact: true },
      { label: 'New merchant', to: '/app/merchants/new', roles: ['super_admin', 'operations'] },
    ],
  },
  {
    id: 'riders',
    title: 'Riders',
    access: 'riders',
    test: (path) => path.startsWith('/app/riders'),
    sections: [
      { label: 'Roster', to: '/app/riders', exact: true },
      { label: 'Cash in hand', to: '/app/riders/cash', roles: ['accounts', 'super_admin', 'operations'] },
    ],
  },
  {
    id: 'recipients',
    title: 'Recipients',
    access: 'recipients',
    test: (path) => path.startsWith('/app/recipients'),
    sections: [{ label: 'Directory', to: '/app/recipients', exact: true }],
  },
  {
    id: 'cases',
    title: 'Cases',
    access: 'cases',
    test: (path) => path.startsWith('/app/cases'),
    sections: [
      { label: 'Open', to: '/app/cases/open' },
      { label: 'Waiting', to: '/app/cases/waiting' },
      { label: 'Resolved', to: '/app/cases/resolved' },
    ],
  },
  {
    id: 'parcels',
    title: 'Parcels',
    access: 'parcels',
    test: (path) => path.startsWith('/app/parcels'),
    sections: [
      { label: 'All parcels', to: '/app/parcels', exact: true },
      { label: 'New booking', to: '/app/parcels/new', roles: ['super_admin', 'operations', 'branch_manager'] },
    ],
  },
  {
    id: 'bookings',
    title: 'Bookings',
    access: 'bookings',
    test: (path) => path.startsWith('/app/bookings'),
    sections: [
      { label: 'Today', to: '/app/bookings', exact: true },
      { label: 'New booking', to: '/app/bookings/new' },
    ],
  },
  {
    id: 'labels',
    title: 'Labels',
    access: 'labels',
    test: (path) => path.startsWith('/app/labels'),
    sections: [
      { label: 'To print', to: '/app/labels', exact: true },
      { label: 'Printed today', to: '/app/labels/printed' },
    ],
  },
  {
    id: 'pickups',
    title: 'Pickups',
    access: 'pickups',
    test: (path) => path.startsWith('/app/pickups'),
    sections: [
      { label: 'Unassigned', to: '/app/pickups', exact: true, group: 'Queue' },
      { label: 'Assigned', to: '/app/pickups/assigned', group: 'Queue' },
      { label: 'Failed', to: '/app/pickups/failed', group: 'Queue' },
      { label: 'Aging', to: '/app/pickups/aging', group: 'Watch' },
    ],
  },
  {
    id: 'deliveries',
    title: 'Deliveries',
    access: 'deliveries',
    test: (path) => path.startsWith('/app/deliveries'),
    sections: [
      { label: 'Ready at hub', to: '/app/deliveries/ready', group: 'Last mile' },
      { label: 'Out for delivery', to: '/app/deliveries', exact: true, group: 'Last mile' },
      { label: 'Failed', to: '/app/deliveries/failed', group: 'Exceptions' },
      { label: 'Repeat attempts', to: '/app/deliveries/repeat', group: 'Exceptions' },
    ],
  },
  {
    id: 'returns',
    title: 'Returns',
    access: 'returns',
    test: (path) => path.startsWith('/app/returns'),
    sections: [
      { label: 'Initiated', to: '/app/returns', exact: true, group: 'Returns' },
      { label: 'On the way back', to: '/app/returns/returning', group: 'Returns' },
      { label: 'Returned', to: '/app/returns/returned', group: 'Returns' },
    ],
  },
  {
    id: 'hub',
    title: 'Hub floor',
    access: 'hub',
    test: (path) => path === '/app/hub' || path.startsWith('/app/hub/'),
    sections: [
      { label: 'Receive', to: '/app/hub', exact: true, group: 'Floor' },
      { label: 'On the floor', to: '/app/hub/floor', group: 'Floor' },
      { label: 'Sort', to: '/app/hub/sort', group: 'Floor' },
      { label: 'Dispatch', to: '/app/hub/dispatch', group: 'Floor' },
    ],
  },
  {
    id: 'manifests',
    title: 'Manifests',
    access: 'manifests',
    test: (path) => path.startsWith('/app/manifests'),
    sections: [
      { label: 'All', to: '/app/manifests', exact: true, group: 'Transfers' },
      { label: 'In transit', to: '/app/manifests/transit', group: 'Transfers' },
      { label: 'Received', to: '/app/manifests/received', group: 'Transfers' },
      { label: 'Discrepancy', to: '/app/manifests/discrepancy', group: 'Exceptions' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    access: 'finance',
    test: (path) => path.startsWith('/app/finance'),
    sections: [
      { label: 'Overview', to: '/app/finance', exact: true, roles: financeRoles.overview },
      { label: 'COD', to: '/app/finance/cod', roles: financeRoles.cod },
      { label: 'Handovers', to: '/app/finance/handovers', roles: financeRoles.handovers },
      { label: 'Settlements', to: '/app/finance/settlements', roles: financeRoles.settlements },
      { label: 'Ledger', to: '/app/finance/ledger', roles: financeRoles.ledger },
      { label: 'Adjustments', to: '/app/finance/adjustments', roles: financeRoles.adjustments },
      { label: 'Audit', to: '/app/finance/audit', roles: financeRoles.audit },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing',
    access: 'pricing',
    test: (path) => path.startsWith('/app/pricing'),
    sections: [{ label: 'Rate card', to: '/app/pricing', exact: true }],
  },
  {
    id: 'settings',
    title: 'Settings',
    access: 'settings',
    test: (path) => path.startsWith('/app/settings'),
    sections: [
      { label: 'Company', to: '/app/settings', exact: true },
      { label: 'Audit', to: '/app/settings/audit', roles: ['super_admin'] },
    ],
  },
]

export interface HomeCard {
  label: string
  href: string
  access: string
  stat: string
}

export const roleCards: Record<RoleId, HomeCard[]> = {
  super_admin: [
    { label: 'Branches', href: '/app/branches', access: 'branches', stat: 'branches' },
    { label: 'Staff', href: '/app/staff', access: 'staff', stat: 'staff' },
    { label: 'Merchants', href: '/app/merchants', access: 'merchants', stat: 'merchantsPending' },
    { label: 'Riders', href: '/app/riders', access: 'riders', stat: 'ridersOnDuty' },
    { label: 'Parcels', href: '/app/parcels', access: 'parcels', stat: 'parcelsLive' },
    { label: 'Hub', href: '/app/hub', access: 'hub', stat: 'hubWaiting' },
    { label: 'Cases', href: '/app/cases/open', access: 'cases', stat: 'casesOpen' },
    { label: 'Finance', href: '/app/finance', access: 'finance', stat: 'financeUrgent' },
    { label: 'Pricing', href: '/app/pricing', access: 'pricing', stat: 'pricing' },
    { label: 'Settings', href: '/app/settings', access: 'settings', stat: 'settings' },
  ],
  operations: [
    { label: 'Pickups', href: '/app/pickups', access: 'pickups', stat: 'pickupsWaiting' },
    { label: 'Deliveries', href: '/app/deliveries', access: 'deliveries', stat: 'outForDelivery' },
    { label: 'Parcels', href: '/app/parcels', access: 'parcels', stat: 'parcelsLive' },
    { label: 'Hub', href: '/app/hub', access: 'hub', stat: 'hubWaiting' },
    { label: 'Returns', href: '/app/returns', access: 'returns', stat: 'returns' },
    { label: 'Merchants', href: '/app/merchants', access: 'merchants', stat: 'merchantsPending' },
    { label: 'Riders', href: '/app/riders', access: 'riders', stat: 'ridersOnDuty' },
    { label: 'Cases', href: '/app/cases/open', access: 'cases', stat: 'casesOpen' },
    { label: 'Branches', href: '/app/branches', access: 'branches', stat: 'branches' },
    { label: 'Finance', href: '/app/finance', access: 'finance', stat: 'financeUrgent' },
  ],
  branch_manager: [
    { label: 'Branch', href: '/app/branches/DHK-MIR', access: 'branch', stat: 'branchName' },
    { label: 'Staff', href: '/app/staff', access: 'staff', stat: 'staff' },
    { label: 'Riders', href: '/app/riders', access: 'riders', stat: 'ridersOnDuty' },
    { label: 'Pickups', href: '/app/pickups', access: 'pickups', stat: 'pickupsWaiting' },
    { label: 'Deliveries', href: '/app/deliveries', access: 'deliveries', stat: 'outForDelivery' },
    { label: 'Parcels', href: '/app/parcels', access: 'parcels', stat: 'parcelsLive' },
    { label: 'Hub', href: '/app/hub', access: 'hub', stat: 'hubWaiting' },
    { label: 'Merchants', href: '/app/merchants', access: 'merchants', stat: 'merchantsActive' },
    { label: 'Cases', href: '/app/cases/open', access: 'cases', stat: 'casesOpen' },
    { label: 'COD', href: '/app/finance/cod', access: 'finance', stat: 'codInHand' },
  ],
  hub_manager: [
    { label: 'Hub floor', href: '/app/hub', access: 'hub', stat: 'hubWaiting' },
    { label: 'Manifests', href: '/app/manifests', access: 'manifests', stat: 'manifestsTransit' },
    { label: 'Parcels', href: '/app/parcels', access: 'parcels', stat: 'parcelsLive' },
    { label: 'Returns', href: '/app/returns', access: 'returns', stat: 'returns' },
    { label: 'Riders', href: '/app/riders', access: 'riders', stat: 'ridersOnDuty' },
    { label: 'Incidents', href: '/app/cases/open?type=lost_damaged', access: 'cases', stat: 'incidents' },
  ],
  booking: [
    { label: 'Bookings', href: '/app/bookings', access: 'bookings', stat: 'bookedToday' },
    { label: 'Labels', href: '/app/labels', access: 'labels', stat: 'labelsToPrint' },
    { label: 'Recipients', href: '/app/recipients', access: 'recipients', stat: 'recipients' },
  ],
  accounts: [
    { label: 'COD', href: '/app/finance/cod', access: 'finance', stat: 'codInHand' },
    { label: 'Handovers', href: '/app/finance/handovers', access: 'finance', stat: 'handoversPending' },
    { label: 'Settlements', href: '/app/finance/settlements', access: 'finance', stat: 'settlementsDraft' },
    { label: 'Ledger', href: '/app/finance/ledger', access: 'finance', stat: 'ledger' },
    { label: 'Merchants', href: '/app/merchants', access: 'merchants', stat: 'merchantPayable' },
    { label: 'Riders', href: '/app/riders/cash', access: 'riders', stat: 'ridersCash' },
  ],
}

export function moduleForPath(path: string) {
  return modules.find((mod) => mod.test(path))
}

export function sectionsFor(path: string, role: RoleId) {
  const mod = moduleForPath(path)
  if (!mod) return []
  const list = typeof mod.sections === 'function' ? mod.sections(path) : mod.sections
  return list.filter((section) => !section.roles || section.roles.includes(role))
}

export function roleCanOpen(role: RoleId, path: string) {
  if (path === '/app' || path.startsWith('/app/find') || path.startsWith('/app/alerts')) return true
  const mod = moduleForPath(path)
  if (!mod) return false
  const cards = roleCards[role]
  const allowed =
    cards.some((card) => card.access === mod.access) ||
    (mod.access === 'branch' && cards.some((card) => card.access === 'branches' || card.access === 'branch')) ||
    (mod.id === 'parcels' && cards.some((card) => ['parcels', 'bookings', 'labels', 'pickups', 'deliveries', 'hub', 'returns'].includes(card.access))) ||
    (mod.access === 'manifests' && cards.some((card) => card.access === 'hub' || card.access === 'manifests'))
  if (!allowed) return false
  const bare = path.split('?')[0] ?? path
  if (/^\/app\/parcels\/(?!new$)[^/]+$/.test(bare)) return true
  const sections = sectionsFor(bare, role)
  if (sections.length === 0) return false
  if (mod.id === 'finance' || mod.id === 'staff' || mod.id === 'merchants' || mod.id === 'riders' || mod.id === 'settings') {
    const hit = sections.some((section) => (section.exact ? bare === section.to : bare === section.to || bare.startsWith(`${section.to}/`)))
    if (hit) return true
    const known = new Set(sections.map((section) => section.to))
    const isRecord =
      (/^\/app\/merchants\/[^/]+$/.test(bare) && !known.has(bare)) ||
      (/^\/app\/riders\/[^/]+$/.test(bare) && !known.has(bare)) ||
      (/^\/app\/staff\/(?!roles$)[^/]+$/.test(bare) && !known.has(bare)) ||
      (/^\/app\/finance\/settlements\/[^/]+$/.test(bare) && !known.has(bare))
    return isRecord
  }
  return true
}

export function sectionActive(path: string, section: SectionDef, all: SectionDef[]) {
  const bare = path.split('?')[0] ?? path
  if (section.exact) {
    if (bare === section.to) return true
    const longer = all.some((other) => other.to !== section.to && (bare === other.to || bare.startsWith(`${other.to}/`)))
    if (longer) return false
    return bare.startsWith(`${section.to}/`)
  }
  return bare === section.to || bare.startsWith(`${section.to}/`)
}
