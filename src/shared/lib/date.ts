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

function zonedParts(date: Date, timeZone: string) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    day: '2-digit', hour: '2-digit', hourCycle: 'h23', minute: '2-digit',
    month: '2-digit', second: '2-digit', timeZone, year: 'numeric',
  }).formatToParts(date).map((part) => [part.type, part.value]))
}

export function isoToZonedDateTimeInput(value: string | null, timeZone: string) {
  if (!value) return ''
  const parts = zonedParts(new Date(value), timeZone)
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function zonedDateTimeInputToIso(value: string, timeZone: string) {
  if (!value) return null
  const [datePart, timePart] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute)
  let instant = desiredUtc

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = zonedParts(new Date(instant), timeZone)
    const representedUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute))
    instant -= representedUtc - desiredUtc
  }

  return new Date(instant).toISOString()
}
