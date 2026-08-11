import type { ParticipantDirectoryRow } from '../repositories/participantRepository'

const quote = (value: string | number | boolean) => `"${String(value).replaceAll('"', '""')}"`

export function exportParticipantContacts(rows: ParticipantDirectoryRow[]) {
  const headers = ['Nombre', 'Apellido', 'Correo', 'Telefono', 'Club', 'Eventos', 'Acepta correo', 'Acepta WhatsApp', 'Ultima inscripcion']
  const lines = rows.map((row) => [row.firstName, row.lastName, row.email, row.phone, row.businessName, row.eventNames.join(' | '), row.acceptsEmail, row.acceptsWhatsApp, row.lastRegistrationAt].map(quote).join(','))
  const blob = new Blob([`\uFEFF${headers.map(quote).join(',')}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `participantes-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
