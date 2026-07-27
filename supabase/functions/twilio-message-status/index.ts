import { createClient } from 'npm:@supabase/supabase-js@2'
import { hasValidTwilioSignature } from '../_shared/twilio.ts'

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Metodo no soportado.' }, 405)

  try {
    const signature = request.headers.get('x-twilio-signature')?.trim() ?? ''
    const rawBody = await request.text()
    const params = new URLSearchParams(rawBody)
    if (!signature || !(await hasValidTwilioSignature(request.url, params, signature))) {
      return json({ error: 'Firma Twilio invalida.' }, 403)
    }

    const messageSid = params.get('MessageSid')?.trim() ?? ''
    const messageStatus = normalizeStatus(params.get('MessageStatus') ?? params.get('SmsStatus') ?? '')
    if (!/^SM[a-zA-Z0-9]{32}$/.test(messageSid) || !messageStatus) {
      return json({ error: 'Callback Twilio invalido.' }, 400)
    }

    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!secretKey) return json({ error: 'Supabase service role no esta configurado.' }, 500)
    const adminClient = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const now = new Date().toISOString()
    const values: Record<string, string | null> = {
      estado: messageStatus,
      actualizado_en: now,
      error_codigo: params.get('ErrorCode')?.slice(0, 64) || null,
      error_detalle: params.get('ErrorMessage')?.slice(0, 500) || null,
    }
    if (['delivered', 'read'].includes(messageStatus)) values.entregado_en = now
    if (messageStatus === 'read') values.leido_en = now

    const { error } = await adminClient
      .from('whatsapp_notificaciones')
      .update(values)
      .eq('twilio_message_sid', messageSid)
    if (error) throw error
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[twilio-message-status]', error instanceof Error ? error.message.slice(0, 500) : 'Error interno.')
    return json({ error: error instanceof Error ? error.message : 'Error interno.' }, 500)
  }
})

function normalizeStatus(value: string) {
  const status = value.trim().toLowerCase()
  return ['queued', 'sent', 'delivered', 'read', 'failed', 'undelivered', 'canceled'].includes(status)
    ? status
    : ''
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`${name} no esta configurado.`)
  return value
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
