import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true }, 200)
  if (request.method !== 'POST') return json({ error: 'Metodo no soportado.' }, 405)

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!secretKey) return json({ error: 'Supabase service role no esta configurado.' }, 500)

    const body = await request.json().catch(() => null) as { reference?: string } | null
    const reference = body?.reference?.trim()
    if (!reference) return json({ error: 'Referencia requerida.' }, 400)

    const adminClient = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: reservation, error: reservationError } = await adminClient
      .from('reservas')
      .select('id, estado_reserva')
      .eq('referencia_publica', reference)
      .maybeSingle()

    if (reservationError) return json({ error: reservationError.message }, 400)
    if (!reservation?.id) return json({ ok: true, cancelled: false, reason: 'Reserva no encontrada.' }, 200)
    if (reservation.estado_reserva === 'confirmada') return json({ error: 'La reserva ya fue confirmada y no puede cancelarse desde este flujo.' }, 409)

    await Promise.all([
      adminClient.from('reservas').update({ estado_reserva: 'expirada' }).eq('id', reservation.id).eq('estado_reserva', 'pendiente_pago'),
      adminClient.from('pagos').update({ estado: 'failed' }).eq('provider_reference', reference).eq('estado', 'pending'),
    ])

    return json({ ok: true, cancelled: true }, 200)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error interno.' }, 500)
  }
})

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} no esta configurado.`)
  return value
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
