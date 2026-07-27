import { whatsappAddress } from './phone.ts'

export type TwilioTemplateInput = {
  to: string
  contentSid: string
  variables: Record<string, string>
}

export type TwilioMessageResult = {
  sid: string
  status: string
}

export class TwilioRequestError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'TwilioRequestError'
    this.code = code
    this.status = status
  }
}

export async function sendTwilioTemplate(input: TwilioTemplateInput): Promise<TwilioMessageResult> {
  const accountSid = requiredEnv('TWILIO_ACCOUNT_SID')
  const authToken = requiredEnv('TWILIO_AUTH_TOKEN')
  const from = Deno.env.get('TWILIO_WHATSAPP_FROM')?.trim() ?? ''
  const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID')?.trim() ?? ''
  if (!from && !messagingServiceSid) throw new Error('Configura TWILIO_WHATSAPP_FROM o TWILIO_MESSAGING_SERVICE_SID.')

  const payload = new URLSearchParams({
    To: whatsappAddress(input.to),
    ContentSid: input.contentSid,
    ContentVariables: JSON.stringify(input.variables),
    StatusCallback: statusCallbackUrl(),
  })
  if (messagingServiceSid) payload.set('MessagingServiceSid', messagingServiceSid)
  else payload.set('From', from.startsWith('whatsapp:') ? from : whatsappAddress(from))

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
  })
  const body = await response.json().catch(() => null) as { sid?: string; status?: string; code?: number | string; message?: string } | null
  if (!response.ok || !body?.sid) {
    throw new TwilioRequestError(
      body?.message?.slice(0, 500) || 'Twilio no acepto el mensaje.',
      String(body?.code ?? response.status),
      response.status,
    )
  }
  return { sid: body.sid, status: body.status ?? 'queued' }
}

export async function hasValidTwilioSignature(requestUrl: string, params: URLSearchParams, receivedSignature: string) {
  const authToken = requiredEnv('TWILIO_AUTH_TOKEN')
  const callbackUrl = Deno.env.get('TWILIO_STATUS_CALLBACK_URL')?.trim() || requestUrl
  const sortedEntries = Array.from(params.entries()).sort(([left], [right]) => left.localeCompare(right))
  const source = callbackUrl + sortedEntries.map(([key, value]) => `${key}${value}`).join('')
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(source))
  const expected = btoa(String.fromCharCode(...new Uint8Array(digest)))
  return constantTimeEqual(expected, receivedSignature)
}

export function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`${name} no esta configurado.`)
  return value
}

function statusCallbackUrl() {
  return Deno.env.get('TWILIO_STATUS_CALLBACK_URL')?.trim()
    || `${requiredEnv('SUPABASE_URL')}/functions/v1/twilio-message-status`
}

function constantTimeEqual(left: string, right: string) {
  const encoder = new TextEncoder()
  const leftBytes = encoder.encode(left)
  const rightBytes = encoder.encode(right)
  let difference = leftBytes.length ^ rightBytes.length
  const length = Math.max(leftBytes.length, rightBytes.length)
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0)
  }
  return difference === 0
}
