export function takaToPoisha(taka: number) {
  return Math.round(taka * 100)
}

export function formatTaka(poisha: number) {
  const taka = poisha / 100
  const formatted = taka.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `৳ ${formatted}`
}

export function dhakaDate(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

export function todayDhaka() {
  return dhakaDate(new Date().toISOString())
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function daysAgo(n: number, hour = 10) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, 15, 0, 0)
  return d.toISOString()
}
