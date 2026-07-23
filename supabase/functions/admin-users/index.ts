import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const publishableKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authorization = request.headers.get('Authorization') ?? ''

    const callerClient = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: authorization } } })
    const adminClient = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: { user }, error: authError } = await callerClient.auth.getUser()
    if (authError || !user) return json({ error: 'No autenticado' }, 401)

    const { data: caller } = await adminClient.from('usuarios').select('rol, activo').eq('id', user.id).single()
    if (!caller?.activo || caller.rol !== 'admin') return json({ error: 'Acceso denegado' }, 403)

    const body = await request.json()
    if (body.action !== 'invite') return json({ error: 'Accion no soportada' }, 400)
    if (!body.email || !body.nombre || !['admin', 'negocio', 'cliente'].includes(body.rol)) return json({ error: 'Datos invalidos' }, 400)

    const { data, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(body.email, {
      data: { nombre: body.nombre },
      redirectTo: `${request.headers.get('origin') ?? Deno.env.get('SITE_URL')}/actualizar-contrasena`,
    })
    if (inviteError) return json({ error: inviteError.message }, 400)

    const { error: profileError } = await adminClient.from('usuarios').update({ nombre: body.nombre, rol: body.rol, activo: true }).eq('id', data.user.id)
    if (profileError) return json({ error: profileError.message }, 400)
    return json({ userId: data.user.id }, 201)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error interno' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
