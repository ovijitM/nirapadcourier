import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { Button } from '../ui.tsx'
import { TrackingRow } from '../../features/parcels/ParcelPages.tsx'
import { formatTaka } from '../../lib/money.ts'
import { canSwitchBranch } from '../../lib/status.ts'
import { moduleForPath, roleCanOpen, sectionActive, sectionsFor } from '../../nav/modules.ts'
import { useDemo } from '../../mock/store.ts'

export function Shell() {
  const location = useLocation()
  const navigate = useNavigate()
  const sessionUserId = useDemo((state) => state.sessionUserId)
  const users = useDemo((state) => state.users)
  const user = users.find((item) => item.id === sessionUserId)
  const path = location.pathname
  const allowed = user ? roleCanOpen(user.role, path) : false

  if (!user) return <Navigate to="/login" replace />

  const mod = moduleForPath(path)
  const sections = mod ? sectionsFor(path, user.role) : []

  return (
    <div className="flex h-full min-h-screen flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        {mod && sections.length > 0 && (
          <aside className="no-print flex min-h-0 w-60 shrink-0 flex-col overflow-hidden border-r border-[#E6E8EC] bg-white">
            <button className="mx-2 mt-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#0F6E56] hover:bg-[#E7F4EF]" onClick={() => navigate('/app')} type="button">
              ← Modules
            </button>
            <div className="px-5 pb-2 pt-4 text-xs font-semibold tracking-wide text-[#5C6570]">{mod.title.toUpperCase()}</div>
            <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-6">
              {sections.map((section, index) => {
                const active = sectionActive(path, section, sections)
                const showGroup = section.group && section.group !== sections[index - 1]?.group
                return (
                  <div key={section.to}>
                    {showGroup && <div className="px-3 pb-1 pt-3 text-[11px] font-semibold tracking-wide text-[#5C6570]">{section.group}</div>}
                    <NavLink
                      to={section.to}
                      className={`block rounded-lg px-3 py-2 text-sm ${active ? 'bg-[#E7F4EF] font-medium text-[#0F6E56]' : 'text-[#121417] hover:bg-[#F6F7F9]'}`}
                    >
                      {section.label}
                    </NavLink>
                  </div>
                )
              })}
            </nav>
          </aside>
        )}
        <main className="min-w-0 flex-1 overflow-auto px-6 py-6 md:px-8">
          {allowed ? <Outlet /> : <div className="text-sm text-[#5C6570]">Not available for this role.</div>}
        </main>
      </div>
      <Toasts />
    </div>
  )
}

function TopBar() {
  const navigate = useNavigate()
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const branches = useDemo((state) => state.branches)
  const working = useDemo((state) => state.workingBranchId)
  const setWorkingBranch = useDemo((state) => state.setWorkingBranch)
  const alerts = useDemo((state) => state.alerts)
  const seen = useDemo((state) => state.seenAlertIds)
  const seeAlerts = useDemo((state) => state.seeAlerts)
  const login = useDemo((state) => state.login)
  const logout = useDemo((state) => state.logout)
  const resetDemo = useDemo((state) => state.resetDemo)
  const personas = useDemo((state) => state.users).filter((item) => item.persona)
  const [openFind, setOpenFind] = useState(false)
  const [openBell, setOpenBell] = useState(false)
  const [openUser, setOpenUser] = useState(false)
  const mine = user ? alerts.filter((alert) => alert.roles.includes(user.role)) : []
  const unread = mine.filter((alert) => !seen.includes(alert.id)).length

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpenFind(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!user) return null
  const branchLabel = user.branchId ? branches.find((item) => item.id === user.branchId)?.name : working === 'all' ? 'All branches' : branches.find((item) => item.id === working)?.name

  return (
    <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#E6E8EC] bg-white px-4">
      <button className="text-left" onClick={() => navigate('/app')} type="button">
        <div className="text-sm font-semibold text-[#0F6E56]">Nirapod</div>
        <div className="text-[11px] text-[#5C6570]">Operations</div>
      </button>
      <button className="ml-4 flex h-9 min-w-48 items-center gap-2 rounded-lg border border-[#E6E8EC] px-3 text-sm text-[#5C6570]" onClick={() => setOpenFind(true)} type="button">
        <Search size={16} /> Search tracking, merchant, phone…
      </button>
      <div className="ml-auto flex items-center gap-2">
        {canSwitchBranch(user.role) ? (
          <select className="h-9 rounded-lg border border-[#E6E8EC] bg-white px-2 text-sm" value={working} onChange={(event) => setWorkingBranch(event.target.value)}>
            <option value="all">All branches</option>
            <optgroup label="Inside Dhaka">
              {branches.filter((branch) => branch.network === 'inside_dhaka').map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </optgroup>
            <optgroup label="Outside Dhaka">
              {branches.filter((branch) => branch.network === 'outside_dhaka').map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </optgroup>
          </select>
        ) : (
          <span className="text-sm text-[#5C6570]">{branchLabel}</span>
        )}
        <button
          className="relative rounded-lg p-2 hover:bg-[#F6F7F9]"
          onClick={() => {
            setOpenBell((value) => !value)
            seeAlerts()
          }}
          type="button"
        >
          <Bell size={18} />
          {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#B45309]" />}
        </button>
        <button className="rounded-lg px-2 py-1 text-left hover:bg-[#F6F7F9]" onClick={() => setOpenUser((value) => !value)} type="button">
          <span className="block text-sm font-medium leading-4">{user.name.split(' ')[0]}</span>
          <span className="block text-[11px] leading-4 text-[#5C6570]">{user.roleLabel}</span>
        </button>
      </div>
      {openBell && (
        <div className="absolute right-16 top-14 w-80 rounded-xl border border-[#E6E8EC] bg-white p-2 shadow-lg">
          {mine.map((alert) => (
            <button
              key={alert.id}
              className="block w-full rounded-lg px-3 py-2 text-left hover:bg-[#F6F7F9]"
              onClick={() => {
                setOpenBell(false)
                navigate(alert.href)
              }}
              type="button"
            >
              <div className="text-sm font-medium">{alert.title}</div>
              <div className="text-xs text-[#5C6570]">{alert.body}</div>
            </button>
          ))}
        </div>
      )}
      {openUser && (
        <div className="absolute right-4 top-14 w-72 rounded-xl border border-[#E6E8EC] bg-white p-2 shadow-lg">
          <div className="px-3 py-2 text-xs font-medium text-[#5C6570]">Switch account</div>
          {personas.map((persona) => {
            const initials = persona.name.split(' ').map((part) => part[0]).slice(0, 2).join('')
            const current = persona.id === user.id
            return (
              <button
                key={persona.id}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F6F7F9] ${current ? 'bg-[#E7F4EF]' : ''}`}
                onClick={() => {
                  login(persona.id)
                  setOpenUser(false)
                  navigate('/app')
                }}
                type="button"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E7F4EF] text-xs font-semibold text-[#0F6E56]">{initials}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{persona.name}</span>
                  <span className="block truncate text-xs text-[#5C6570]">{persona.roleLabel}</span>
                </span>
              </button>
            )
          })}
          <button
            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F6F7F9]"
            onClick={() => {
              resetDemo()
              setOpenUser(false)
              navigate('/app')
            }}
            type="button"
          >
            Reset demo data
          </button>
          <button
            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F6F7F9]"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            type="button"
          >
            Sign out
          </button>
        </div>
      )}
      {openFind && <FindPalette onClose={() => setOpenFind(false)} />}
    </header>
  )
}

function FindPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const parcels = useDemo((state) => state.parcels)
  const merchants = useDemo((state) => state.merchants)
  const riders = useDemo((state) => state.riders)
  const cases = useDemo((state) => state.cases)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const working = useDemo((state) => state.workingBranchId)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !user) return []
    const hits: { label: string; href: string }[] = []
    parcels
      .filter((parcel) => {
        const merchant = merchants.find((item) => item.id === parcel.merchantId)
        return (
          parcel.trackingId.toLowerCase().includes(q) ||
          parcel.recipient.phone.includes(q) ||
          parcel.recipient.name.toLowerCase().includes(q) ||
          merchant?.businessName.toLowerCase().includes(q)
        )
      })
      .slice(0, 6)
      .forEach((parcel) => hits.push({ label: parcel.trackingId, href: `/app/parcels/${parcel.trackingId}` }))
    riders
      .filter((rider) => rider.name.toLowerCase().includes(q) || rider.riderCode.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((rider) => hits.push({ label: rider.riderCode, href: `/app/riders/${rider.riderCode}` }))
    cases
      .filter((item) => item.caseNo.toLowerCase().includes(q))
      .forEach((item) => hits.push({ label: item.caseNo, href: `/app/cases/${item.caseNo}` }))
    void working
    return hits
  }, [query, parcels, merchants, riders, cases, user, working])

  return (
    <div className="absolute inset-x-0 top-16 z-40 mx-auto w-full max-w-xl px-4">
      <div className="rounded-xl border border-[#E6E8EC] bg-white p-3 shadow-xl">
        <input autoFocus className="h-10 w-full rounded-lg border border-[#E6E8EC] px-3" placeholder="Tracking ID, phone, merchant, rider, case" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="mt-2">
          {results.map((result) => (
            <button
              key={result.href + result.label}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F6F7F9]"
              onClick={() => {
                navigate(result.href)
                onClose()
              }}
              type="button"
            >
              {result.label.startsWith('NC-') ? <TrackingRow id={result.label} /> : result.label}
            </button>
          ))}
          {query && results.length === 0 && <div className="px-3 py-4 text-sm text-[#5C6570]">No matches in your scope.</div>}
        </div>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

function Toasts() {
  const toast = useDemo((state) => state.toast)
  const clearToast = useDemo((state) => state.clearToast)
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => clearToast(), 2800)
    return () => window.clearTimeout(timer)
  }, [toast, clearToast])
  if (!toast) return null
  return <div className="no-print fixed bottom-4 right-4 z-50 rounded-lg bg-[#121417] px-4 py-3 text-sm text-white shadow-lg">{toast}</div>
}

export function moneyHint(poisha: number) {
  return formatTaka(poisha)
}
