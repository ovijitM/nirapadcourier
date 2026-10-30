import { Navigate, useNavigate } from 'react-router-dom'
import { useDemo } from '../../mock/store.ts'

export function LoginPage() {
  const navigate = useNavigate()
  const users = useDemo((state) => state.users)
  const login = useDemo((state) => state.login)
  const session = useDemo((state) => state.sessionUserId)
  const personas = users.filter((user) => user.persona)

  if (session) return <Navigate to="/app" replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9] px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="mb-4 text-center">
          <div className="text-sm font-semibold tracking-wide text-[#0F6E56]">Nirapod Operations</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Continue as</h1>
          <p className="mt-1 text-sm text-[#5C6570]">One click opens that role’s dashboard.</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#E6E8EC] bg-white shadow-sm">
          {personas.map((persona, index) => (
            <button
              key={persona.id}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#E7F4EF] ${index > 0 ? 'border-t border-[#E6E8EC]' : ''}`}
              onClick={() => {
                login(persona.id)
                navigate('/app')
              }}
              type="button"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F4EF] text-xs font-semibold text-[#0F6E56]">
                {persona.name
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{persona.roleLabel}</span>
                <span className="block truncate text-sm text-[#5C6570]">{persona.name}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
