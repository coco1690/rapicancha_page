import { createClient } from 'npm:@supabase/supabase-js@2'

type PublicSlot = { time: string; endTime: string; label: string; priceMinor: number; currency: string; available: boolean }
type CourtRate = { hora_inicio: string; hora_fin: string; precio_minor: number | null; moneda_codigo: string | null; dias_semana: number[] | null }
type Reservation = { hora_inicio_local: string; hora_fin_local: string; estado_reserva: string; creado_en: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const blockingStatuses = ['pendiente_pago', 'confirmada']
const bookingHoldMinutes = Number(Deno.env.get('BOOKING_HOLD_MINUTES') ?? '7')
const bookingHoldMs = bookingHoldMinutes * 60 * 1000

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true }, 200)
  if (request.method !== 'POST') return json({ error: 'Metodo no soportado.' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !secretKey) return json({ error: 'Supabase no esta configurado.' }, 500)

    const body = await request.json().catch(() => null) as { courtId?: string; date?: string } | null
    const courtId = body?.courtId?.trim()
    const date = body?.date?.trim()
    if (!courtId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'Datos invalidos.' }, 400)

    const adminClient = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } })
    await expireOldPendingBookings(adminClient)
    const { data: court, error: courtError } = await adminClient.from('canchas_publicas').select('*').eq('id', courtId).maybeSingle()
    if (courtError) return json({ error: courtError.message }, 400)
    if (!court?.id || !court.negocio_id) return json({ error: 'Cancha no disponible.' }, 404)

    const [{ data: business, error: businessError }, { data: rates, error: ratesError }, { data: reservations, error: reservationsError }] = await Promise.all([
      adminClient.from('negocios_publicos').select('*').eq('id', court.negocio_id).maybeSingle(),
      adminClient.from('cancha_tarifas').select('hora_inicio, hora_fin, precio_minor, moneda_codigo, dias_semana').eq('cancha_id', court.id).eq('activa', true).order('hora_inicio'),
      adminClient.from('reservas').select('hora_inicio_local, hora_fin_local, estado_reserva, creado_en').eq('cancha_id', court.id).eq('fecha_local', date).in('estado_reserva', blockingStatuses),
    ])
    if (businessError || ratesError || reservationsError) return json({ error: businessError?.message ?? ratesError?.message ?? reservationsError?.message }, 400)
    if (!business?.id) return json({ error: 'Negocio no disponible.' }, 404)

    const slots = buildSlots({
      date,
      timeZone: business.timezone ?? 'America/Bogota',
      rates: rates ?? [],
      reservations: reservations ?? [],
      fallbackStart: business.horario_apertura ?? '06:00',
      fallbackEnd: business.horario_cierre ?? '23:00',
      fallbackPrice: court.precio_por_hora_minor ?? 0,
      fallbackCurrency: court.moneda ?? business.moneda ?? 'COP',
    })

    return json({ courtId: court.id, date, slots }, 200)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error interno.' }, 500)
  }
})

function buildSlots(input: { date: string; timeZone: string; rates: CourtRate[]; reservations: Reservation[]; fallbackStart: string; fallbackEnd: string; fallbackPrice: number; fallbackCurrency: string }): PublicSlot[] {
  const now = localDateTime(input.timeZone)
  if (input.date < now.date) return []
  const weekday = weekdayForDate(input.date)
  const matchingRates = input.rates.filter((rate) => (rate.dias_semana ?? []).includes(weekday))
  const sources = matchingRates.length > 0 ? matchingRates : [{ hora_inicio: input.fallbackStart, hora_fin: input.fallbackEnd, precio_minor: input.fallbackPrice, moneda_codigo: input.fallbackCurrency, dias_semana: [weekday] }]
  const slots = new Map<string, PublicSlot>()

  for (const source of sources) {
    let current = normalizeTime(source.hora_inicio)
    const limit = normalizeTime(source.hora_fin)
    while (current < limit && slots.size < 36) {
      const endTime = addHour(current)
      if (endTime <= limit) {
        if (input.date === now.date && current <= now.time) {
          current = endTime
          continue
        }
        slots.set(current, {
          time: current,
          endTime,
          label: `${current} - ${endTime}`,
          priceMinor: source.precio_minor ?? input.fallbackPrice,
          currency: source.moneda_codigo ?? input.fallbackCurrency,
          available: !overlapsReservation(current, endTime, input.reservations),
        })
      }
      current = endTime
    }
  }

  return Array.from(slots.values()).sort((a, b) => a.time.localeCompare(b.time))
}

function localDateTime(timeZone: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(new Date()).map((part) => [part.type, part.value]))
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  }
}

function overlapsReservation(start: string, end: string, reservations: Reservation[]) {
  const pendingLimit = Date.now() - bookingHoldMs
  return reservations.some((reservation) => {
    const blocks = reservation.estado_reserva === 'confirmada' || (reservation.estado_reserva === 'pendiente_pago' && new Date(reservation.creado_en).getTime() >= pendingLimit)
    return blocks && start < normalizeTime(reservation.hora_fin_local) && end > normalizeTime(reservation.hora_inicio_local)
  })
}

function weekdayForDate(date: string) {
  const day = new Date(`${date}T12:00:00`).getDay()
  return day === 0 ? 7 : day
}

function addHour(time: string) {
  return `${String(Number(time.slice(0, 2)) + 1).padStart(2, '0')}:00`
}

function normalizeTime(time: string) {
  return time.slice(0, 5)
}

async function expireOldPendingBookings(adminClient: ReturnType<typeof createClient>) {
  const cutoff = new Date(Date.now() - bookingHoldMs).toISOString()
  const { data } = await adminClient.from('reservas').select('id').eq('estado_reserva', 'pendiente_pago').lt('creado_en', cutoff)
  const ids = (data ?? []).map((item) => item.id).filter(Boolean)
  if (ids.length === 0) return
  await Promise.all([
    adminClient.from('reservas').update({ estado_reserva: 'expirada' }).in('id', ids),
    adminClient.from('pagos').update({ estado: 'failed' }).in('reserva_id', ids).eq('estado', 'pending'),
  ])
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
