export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

/** "HH:MM" 24-hour; both null = closed. Index 0 = Sunday. A close at or before open means closing after midnight. */
export interface DayHours { open: string | null; close: string | null }
export interface Status { open: boolean; dayIndex: number; next: string }

const DAY_MIN = 24 * 60

const toMin = (hhmm: string) => {
  const [hh, mm] = hhmm.split(':').map(Number)
  return hh! * 60 + (mm ?? 0)
}

export function manilaNow(date: Date): { dayIndex: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(date)
  const wd = parts.find(p => p.type === 'weekday')!.value
  const hour = Number(parts.find(p => p.type === 'hour')!.value) % 24
  const minute = Number(parts.find(p => p.type === 'minute')!.value)
  return { dayIndex: WEEKDAYS.indexOf(wd as (typeof WEEKDAYS)[number]), minutes: hour * 60 + minute }
}

export function fmtTime(hhmm: string): string {
  const total = toMin(hhmm)
  const h = Math.floor(total / 60)
  const m = String(total % 60).padStart(2, '0')
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`
}

export function isOpenDay(d: DayHours | undefined): d is { open: string; close: string } {
  return !!d && !!d.open && !!d.close && toMin(d.close) !== toMin(d.open)
}

/** [open, close] in minutes from the day's midnight; close may exceed 24:00 for overnight hours. */
function span(d: { open: string; close: string }): [number, number] {
  const o = toMin(d.open)
  const c = toMin(d.close)
  return [o, c <= o ? c + DAY_MIN : c]
}

export function rangeLabel(d: DayHours | undefined): string {
  return isOpenDay(d) ? `${fmtTime(d.open)} – ${fmtTime(d.close)}` : 'Closed'
}

export function computeStatus(hours: DayHours[], now: Date): Status {
  const { dayIndex, minutes: t } = manilaNow(now)
  // Still inside yesterday's overnight opening?
  const yesterday = hours[(dayIndex + 6) % 7]
  if (isOpenDay(yesterday)) {
    const [, yc] = span(yesterday)
    if (yc > DAY_MIN && t < yc - DAY_MIN) return { open: true, dayIndex, next: `· until ${fmtTime(yesterday.close)}` }
  }
  const today = hours[dayIndex]
  if (isOpenDay(today)) {
    const [o, c] = span(today)
    if (t >= o && t < c) return { open: true, dayIndex, next: `· until ${fmtTime(today.close)}` }
    if (t < o) return { open: false, dayIndex, next: `· back at ${fmtTime(today.open)}` }
  }
  for (let k = 1; k <= 7; k++) {
    const i = (dayIndex + k) % 7
    const d = hours[i]
    if (isOpenDay(d)) return { open: false, dayIndex, next: `· back ${k === 1 ? 'tomorrow' : WEEKDAYS[i]} ${fmtTime(d.open)}` }
  }
  return { open: false, dayIndex, next: '' }
}
