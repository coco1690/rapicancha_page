import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTwilioTemplate, TwilioRequestError } from '../_shared/twilio.ts'

type WhatsAppJob = {
  id: string
  reserva_id: string
  negocio_id: string
  destinatario: 'cliente' | 'club'
  intentos: number
}

const maxAttempts = 5

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Metodo no soportado.' }, 405)
  if (!hasWorkerAccess(request)) return json({ error: 'No autorizado.' }, 401)

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!secretKey) return json({ error: 'Supabase service role no esta configurado.' }, 500)
    const body = await request.json().catch(() => null) as { limit?: number } | null
    const limit = Math.max(1, Math.min(Number(body?.limit ?? 10), 50))
    const adminClient = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data, error } = await adminClient.rpc('claim_whatsapp_notificaciones', { p_limit: limit })
    if (error) throw new Error(`No se pudo reclamar la cola: ${error.message}`)

    const jobs = (data as WhatsAppJob[] | null) ?? []
    const results: string[] = []
    for (let index = 0; index < jobs.length; index += 4) {
      results.push(...await Promise.all(jobs.slice(index, index + 4).map((job) => processJob(adminClient, job))))
    }
    return json({
      ok: true,
      claimed: results.length,
      queued: results.filter((item) => item === 'queued').length,
      retried: results.filter((item) => item === 'retry').length,
      canceled: results.filter((item) => item === 'canceled').length,
      failed: results.filter((item) => item === 'failed').length,
    }, 200)
  } catch (error) {
    console.error('[send-whatsapp-notifications]', safeError(error))
    return json({ error: error instanceof Error ? error.message : 'Error interno.' }, 500)
  }
})

async function processJob(adminClient: ReturnType<typeof createClient>, job: WhatsAppJob) {
  try {
    const [{ data: reservation, error: reservationError }, { data: business, error: businessError }] = await Promise.all([
      adminClient
        .from('reservas')
        .select('id, cancha_id, referencia_publica, nombre_cliente, telefono_cliente, telefono_cliente_e164, acepta_notificaciones_whatsapp, fecha_local, hora_inicio_local, hora_fin_local, timezone, estado_reserva')
        .eq('id', job.reserva_id)
        .maybeSingle(),
      adminClient
        .from('negocios')
        .select('id, nombre, whatsapp_telefono_e164, whatsapp_notificaciones_activas')
        .eq('id', job.negocio_id)
        .maybeSingle(),
    ])
    if (reservationError || businessError) throw reservationError ?? businessError
    if (!reservation || !business || reservation.estado_reserva !== 'confirmada') {
      await cancelJob(adminClient, job.id, 'Reserva o club no disponible.')
      return 'canceled'
    }

    const { data: court, error: courtError } = await adminClient
      .from('canchas')
      .select('nombre')
      .eq('id', reservation.cancha_id)
      .maybeSingle()
    if (courtError) throw courtError

    const recipient = job.destinatario === 'cliente'
      ? reservation.acepta_notificaciones_whatsapp ? reservation.telefono_cliente_e164 : null
      : business.whatsapp_notificaciones_activas ? business.whatsapp_telefono_e164 : null
    if (!recipient) {
      await cancelJob(adminClient, job.id, 'Destinatario sin consentimiento o configuracion WhatsApp.')
      return 'canceled'
    }

    const date = formatDate(reservation.fecha_local, reservation.timezone)
    const time = `${reservation.hora_inicio_local.slice(0, 5)} - ${reservation.hora_fin_local.slice(0, 5)}`
    const template = job.destinatario === 'cliente'
      ? {
          contentSid: requiredEnv('TWILIO_CUSTOMER_BOOKING_CONTENT_SID'),
          variables: {
            '1': reservation.nombre_cliente,
            '2': reservation.referencia_publica,
            '3': business.nombre,
            '4': court?.nombre ?? 'Cancha',
            '5': date,
            '6': time,
          },
        }
      : {
          contentSid: requiredEnv('TWILIO_CLUB_BOOKING_CONTENT_SID'),
          variables: {
            '1': reservation.referencia_publica,
            '2': reservation.nombre_cliente,
            '3': reservation.telefono_cliente_e164 ?? reservation.telefono_cliente,
            '4': court?.nombre ?? 'Cancha',
            '5': date,
            '6': time,
          },
        }

    const message = await sendTwilioTemplate({ to: recipient, ...template })
    const { error: updateError } = await adminClient.from('whatsapp_notificaciones').update({
      estado: normalizeTwilioStatus(message.status),
      twilio_message_sid: message.sid,
      enviado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
      error_codigo: null,
      error_detalle: null,
    }).eq('id', job.id)
    if (updateError) throw updateError
    return 'queued'
  } catch (error) {
    const permanent = job.intentos >= maxAttempts || (error instanceof TwilioRequestError && error.status >= 400 && error.status < 500 && error.status !== 429)
    const retryAt = new Date(Date.now() + retryDelayMs(job.intentos)).toISOString()
    const { error: updateError } = await adminClient.from('whatsapp_notificaciones').update({
      estado: permanent ? 'failed' : 'pending',
      proximo_intento_en: retryAt,
      actualizado_en: new Date().toISOString(),
      error_codigo: error instanceof TwilioRequestError ? error.code : 'INTERNAL_ERROR',
      error_detalle: safeError(error),
    }).eq('id', job.id)
    if (updateError) console.error('[send-whatsapp-notifications:update]', updateError.message)
    return permanent ? 'failed' : 'retry'
  }
}

async function cancelJob(adminClient: ReturnType<typeof createClient>, id: string, reason: string) {
  const { error } = await adminClient.from('whatsapp_notificaciones').update({
    estado: 'canceled',
    actualizado_en: new Date().toISOString(),
    error_detalle: reason,
  }).eq('id', id)
  if (error) throw error
}

function formatDate(date: string, timezone: string) {
  const value = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone || 'America/Bogota',
  }).format(new Date(`${date}T12:00:00`))
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function normalizeTwilioStatus(status: string) {
  return ['queued', 'sent', 'delivered', 'read'].includes(status) ? status : 'queued'
}

function retryDelayMs(attempt: number) {
  return Math.min(60 * 60 * 1000, Math.max(60 * 1000, (2 ** Math.max(0, attempt - 1)) * 60 * 1000))
}

function hasWorkerAccess(request: Request) {
  const expected = Deno.env.get('WHATSAPP_WORKER_SECRET')?.trim()
  const received = request.headers.get('x-rapicancha-worker-secret')?.trim()
  return Boolean(expected && received && expected === received)
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`${name} no esta configurado.`)
  return value
}

function safeError(error: unknown) {
  return (error instanceof Error ? error.message : 'Error interno.').slice(0, 500)
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
