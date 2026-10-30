import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '../lib/cn.ts'
import { STATUS_LABEL, statusClass } from '../lib/status.ts'
import type { ParcelStatus } from '../mock/types.ts'

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'secondary' }) {
  const styles = {
    primary: 'bg-[#0F6E56] text-white hover:bg-[#0c5b47]',
    secondary: 'border border-[#E6E8EC] bg-white hover:bg-[#F6F7F9]',
    ghost: 'hover:bg-[#F6F7F9]',
    danger: 'border border-red-200 text-red-700 hover:bg-red-50',
  }
  return (
    <button
      className={cn('inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium disabled:opacity-50', styles[variant], className)}
      {...props}
    />
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-[#5C6570]">{label}</span>
      {children}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('h-10 w-full rounded-lg border border-[#E6E8EC] px-3 outline-none focus:border-[#0F6E56]', props.className)} />
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn('h-10 w-full rounded-lg border border-[#E6E8EC] bg-white px-3 outline-none focus:border-[#0F6E56]', props.className)} />
}

export function StatusPill({ status }: { status: ParcelStatus }) {
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', statusClass(status))}>{STATUS_LABEL[status]}</span>
}

const tagTone = {
  green: 'bg-[#E7F4EF] text-[#0F6E56]',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-800',
  slate: 'bg-slate-100 text-slate-600',
  violet: 'bg-violet-100 text-violet-800',
} as const

export function Tag({ children, tone = 'slate' }: { children: ReactNode; tone?: keyof typeof tagTone }) {
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize', tagTone[tone])}>{children}</span>
}

export function toneFor(value: string): keyof typeof tagTone {
  const text = value.toLowerCase().replaceAll('_', ' ')
  if (['active', 'on duty', 'delivered', 'returned', 'resolved', 'approved', 'disbursed', 'reconciled', 'received', 'verified'].includes(text)) return 'green'
  if (['pending', 'waiting', 'draft', 'on leave', 'handed over', 'pending approval'].includes(text)) return 'amber'
  if (text === 'high' || ['suspended', 'inactive', 'failed', 'cancelled', 'rejected', 'discrepancy', 'short', 'disputed'].includes(text)) return 'red'
  if (text === 'normal' || text === 'open') return 'blue'
  return 'slate'
}

export const PAGE_SIZE = 20

export function usePaged<T>(items: T[]) {
  const [page, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const mark = `${items.length}:${String((items[0] as { id?: string } | undefined)?.id ?? '')}`
  useEffect(() => { setPage(0) }, [mark])
  return {
    rows: items.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE),
    page: current,
    pages,
    total: items.length,
    setPage,
  }
}

export function PageBar({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (page: number) => void }) {
  if (total <= PAGE_SIZE) return null
  const start = page * PAGE_SIZE + 1
  const end = Math.min(total, (page + 1) * PAGE_SIZE)
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#E6E8EC] px-3 py-2 text-sm">
      <span className="text-[#5C6570]">{start}–{end} of {total}</span>
      <div className="flex gap-2">
        <button className="rounded-lg border border-[#E6E8EC] px-3 py-1 disabled:opacity-40" disabled={page === 0} onClick={() => onPage(page - 1)} type="button">Previous</button>
        <button className="rounded-lg border border-[#E6E8EC] px-3 py-1 disabled:opacity-40" disabled={page >= pages - 1} onClick={() => onPage(page + 1)} type="button">Next</button>
      </div>
    </div>
  )
}

export function TrackingCopy({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <span className="inline-flex items-center gap-1">
      <span className="tabular font-medium">{id}</span>
      <button
        aria-label={copied ? 'Copied' : `Copy ${id}`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#5C6570] hover:bg-[#E7F4EF] hover:text-[#0F6E56]"
        title={copied ? 'Copied' : 'Copy tracking'}
        type="button"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          const finish = () => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1200)
          }
          navigator.clipboard.writeText(id).then(finish).catch(() => {
            const area = document.createElement('textarea')
            area.value = id
            area.style.position = 'fixed'
            area.style.left = '-9999px'
            document.body.appendChild(area)
            area.select()
            document.execCommand('copy')
            area.remove()
            finish()
          })
        }}
      >
        {copied ? <Check size={14} className="text-[#0F6E56]" /> : <Copy size={14} />}
      </button>
    </span>
  )
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: { id: string; cells: ReactNode[]; onClick?: () => void }[]
}) {
  const paged = usePaged(rows)
  if (rows.length === 0) return <Panel><Empty>Nothing to show.</Empty></Panel>
  return (
    <Panel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[#E6E8EC] bg-[#F6F7F9] text-xs text-[#5C6570]">
            <tr>
              {columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-2.5 font-medium">{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {paged.rows.map((row) => (
              <tr key={row.id} className={cn('border-b border-[#E6E8EC] last:border-0', row.onClick && 'cursor-pointer hover:bg-[#F6F7F9]')} onClick={row.onClick}>
                {row.cells.map((cell, index) => <td key={index} className="whitespace-nowrap px-3 py-3 align-middle">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PageBar page={paged.page} pages={paged.pages} total={paged.total} onPage={paged.setPage} />
    </Panel>
  )
}

export function Kpis({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-[#E6E8EC] bg-white px-4 py-3">
          <div className="text-xs text-[#5C6570]">{item.label}</div>
          <div className="tabular mt-1 text-2xl font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-[#E6E8EC] bg-white', className)}>{children}</div>
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="text-[#5C6570]" onClick={onClose} type="button">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SplitPopup({
  open,
  onClose,
  left,
  right,
  fit = false,
}: {
  open: boolean
  onClose: () => void
  left: ReactNode
  right: ReactNode
  fit?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={cn('flex w-full overflow-hidden rounded-2xl bg-white shadow-xl', fit ? 'max-h-[calc(100vh-2rem)] max-w-6xl' : 'h-[min(680px,88vh)] max-w-5xl')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn('shrink-0 border-r border-[#E6E8EC] bg-[#F6F7F9]', fit ? 'w-[62%] p-4' : 'w-[340px] overflow-y-auto p-6')}>{left}</div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex justify-end px-4 pt-3">
            <button className="rounded-lg px-2 py-1 text-sm text-[#5C6570] hover:bg-[#F6F7F9]" onClick={onClose} type="button">Close</button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{right}</div>
        </div>
      </div>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-sm text-[#5C6570]">{children}</div>
}

export function PageTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {action}
    </div>
  )
}
