import { useState } from 'react'
import { DataTable, PageTitle, SelectInput, Tag, TextInput } from '../../components/ui.tsx'
import { recordInFocus } from '../../lib/scope.ts'
import { canAct } from '../../lib/status.ts'
import { useDemo } from '../../mock/store.ts'

export function RoutingPage({ kind }: { kind: 'dhaka_zone' | 'outside_city' }) {
  const routes = useDemo((state) => state.routes)
  const branches = useDemo((state) => state.branches)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const setRouteHub = useDemo((state) => state.setRouteHub)
  const [q, setQ] = useState('')
  const [hubId, setHubId] = useState('all')
  const rows = routes.filter((route) => recordInFocus(route.hubId, user, working)).filter((route) => route.kind === kind).filter((route) => (hubId === 'all' || route.hubId === hubId) && `${route.name} ${route.covers}`.toLowerCase().includes(q.trim().toLowerCase()))
  const hubs = branches.filter((branch) => branch.network === (kind === 'dhaka_zone' ? 'inside_dhaka' : 'outside_dhaka'))
  const canEdit = user ? canAct(user.role, 'branchWrite') : false
  return (
    <div>
      <PageTitle title={kind === 'dhaka_zone' ? 'Dhaka zones' : 'Outside cities'} />
      <p className="mb-4 max-w-2xl text-sm text-[#5C6570]">
        {kind === 'dhaka_zone'
          ? 'Zones inside Dhaka each route to a city hub. This is separate from inter-city routing.'
          : 'Cities outside Dhaka each route to their own hub. A Chattogram parcel does not pass through a Dhaka zone hub.'}
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        <TextInput className="max-w-sm" placeholder={kind === 'dhaka_zone' ? 'Search zone' : 'Search city'} value={q} onChange={(event) => setQ(event.target.value)} />
        <SelectInput className="max-w-52" value={hubId} onChange={(event) => setHubId(event.target.value)}>
          <option value="all">All hubs</option>
          {hubs.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </SelectInput>
      </div>
      <DataTable
        columns={[kind === 'dhaka_zone' ? 'Zone' : 'City', 'Covers', 'Hub']}
        rows={rows.map((route) => {
          const hub = branches.find((branch) => branch.id === route.hubId)
          return {
            id: route.id,
            cells: [
              <span className="font-medium">{route.name}</span>,
              <span className="text-[#5C6570]">{route.covers}</span>,
              canEdit ? (
                <span className="flex items-center gap-2">
                  <Tag tone={hub?.network === 'inside_dhaka' ? 'green' : 'blue'}>{hub?.network === 'inside_dhaka' ? 'Inside' : 'Outside'}</Tag>
                  <SelectInput className="max-w-52" value={route.hubId} onChange={(event) => setRouteHub(route.id, event.target.value)}>
                    {hubs.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </SelectInput>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">{hub?.name}<Tag tone={hub?.network === 'inside_dhaka' ? 'green' : 'blue'}>{hub?.network === 'inside_dhaka' ? 'Inside' : 'Outside'}</Tag></span>
              ),
            ],
          }
        })}
      />
    </div>
  )
}
