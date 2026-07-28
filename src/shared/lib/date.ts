const dateKeyFormatter = (timeZone: string) => new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  timeZone,
  year: 'numeric',
})

export function dateKeyInTimeZone(timeZone = 'America/Bogota', date = new Date()) {
  const parts = Object.fromEntries(dateKeyFormatter(timeZone).formatToParts(date).map((part) => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function timeKeyInTimeZone(timeZone = 'America/Bogota', date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    timeZone,
  }).formatToParts(date).map((part) => [part.type, part.value]))
  return `${parts.hour}:${parts.minute}`
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days, 12))
  return date.toISOString().slice(0, 10)
}

export function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}
