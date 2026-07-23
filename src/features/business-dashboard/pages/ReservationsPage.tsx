import { AppButton, AppInput, AppSelect } from '../../../shared/components/MuiPrimitives'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useBusinessStore } from '../../../stores/useBusinessStore'

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function monthKey(date: Date) {
  return dateKey(date).slice(0, 7)
}

export function ReservationsPage() {
  const business = useBusinessStore((state) => state.business)
  const reservations = useBusinessStore((state) => state.reservations)
  const mode = useBusinessStore((state) => state.reservationMode)
  const setMode = useBusinessStore((state) => state.setReservationMode)
  const selectedMonth = useBusinessStore((state) => state.selectedMonth)
  const selectedCourt = useBusinessStore((state) => state.selectedCourt)
  const setSelectedMonth = useBusinessStore((state) => state.setSelectedMonth)
  const setSelectedCourt = useBusinessStore((state) => state.setSelectedCourt)

  const filtered = useMemo(() => reservations.filter((reservation) => {
    const inMonth = reservation.fecha_local.startsWith(selectedMonth)
    const inCourt = selectedCourt === 'all' || reservation.cancha_id === selectedCourt
    return inMonth && inCourt
  }), [reservations, selectedCourt, selectedMonth])

  const courtOptions = useMemo(() => Array.from(new Map(reservations.map((item) => [item.cancha_id, item.canchas?.nombre ?? 'Cancha'])).entries()), [reservations])

  if (!business) {
    return <main className="page-container"><h1 className="page-title">Reservas</h1><p className="mt-3 text-zinc-600">Primero debes crear el perfil del negocio.</p><Link className="primary-button mt-6 inline-flex" to="/negocio/perfil">Configurar negocio</Link></main>
  }

  return (
    <main className="page-container">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="section-kicker">Agenda</p><h1 className="page-title">Reservas</h1><p className="mt-2 text-zinc-600">Consulta los turnos asociados a tus canchas.</p></div>
        <div className="inline-flex rounded-md border border-zinc-300 bg-white p-1" aria-label="Modo de visualizacion">
          <AppButton className={`rounded px-3 py-1.5 text-sm font-bold ${mode === 'list' ? 'bg-zinc-900 text-white' : 'text-zinc-600'}`} onClick={() => setMode('list')}>Lista</AppButton>
          <AppButton className={`rounded px-3 py-1.5 text-sm font-bold ${mode === 'calendar' ? 'bg-zinc-900 text-white' : 'text-zinc-600'}`} onClick={() => setMode('calendar')}>Calendario</AppButton>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-3 border-y border-zinc-200 py-4">
        <label className="text-sm font-semibold text-zinc-600">Mes<AppInput className="field mt-1 w-auto" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} /></label>
        <label className="text-sm font-semibold text-zinc-600">Cancha<AppSelect className="field mt-1 min-w-48" value={selectedCourt} onChange={(event) => setSelectedCourt(event.target.value)}><option value="all">Todas</option>{courtOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</AppSelect></label>
      </div>

      {mode === 'list' ? <ReservationList reservations={filtered} /> : <ReservationCalendar month={selectedMonth} reservations={filtered} />}
    </main>
  )
}

function ReservationList({ reservations }: { reservations: ReturnType<typeof useBusinessStore.getState>['reservations'] }) {
  return (
    <section className="mt-6 overflow-hidden border-y border-zinc-200 bg-white">
      <div className="hidden grid-cols-[130px_100px_1fr_1fr_130px] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold uppercase text-zinc-500 md:grid"><span>Fecha</span><span>Hora</span><span>Cliente</span><span>Cancha</span><span>Estado</span></div>
      <div className="divide-y divide-zinc-200">
        {reservations.map((reservation) => (
          <article className="grid gap-2 px-4 py-4 md:grid-cols-[130px_100px_1fr_1fr_130px] md:items-center md:gap-4" key={reservation.id}>
            <p className="text-sm font-bold">{reservation.fecha_local}</p>
            <p className="text-sm">{reservation.hora_inicio_local.slice(0, 5)} - {reservation.hora_fin_local.slice(0, 5)}</p>
            <div><p className="font-semibold">{reservation.nombre_cliente}</p><p className="text-xs text-zinc-500">{reservation.telefono_cliente}</p></div>
            <p className="text-sm">{reservation.canchas?.nombre ?? 'Cancha'}</p>
            <span className={`status-badge w-fit ${reservation.estado_reserva === 'confirmada' ? 'status-active' : ''}`}>{reservation.estado_reserva.replace('_', ' ')}</span>
          </article>
        ))}
        {reservations.length === 0 && <p className="px-4 py-12 text-center text-sm text-zinc-500">No hay reservas para los filtros seleccionados.</p>}
      </div>
    </section>
  )
}

function ReservationCalendar({ month, reservations }: { month: string; reservations: ReturnType<typeof useBusinessStore.getState>['reservations'] }) {
  const [year, monthNumber] = month.split('-').map(Number)
  const firstDay = new Date(year, monthNumber - 1, 1)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  const start = new Date(year, monthNumber - 1, 1 - mondayOffset)
  const days = Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index))
  const byDay = new Map<string, typeof reservations>()
  reservations.forEach((reservation) => byDay.set(reservation.fecha_local, [...(byDay.get(reservation.fecha_local) ?? []), reservation]))

  return (
    <section className="mt-6 overflow-x-auto">
      <div className="min-w-[760px] overflow-hidden rounded-md border border-zinc-200 bg-white">
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">{['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day) => <div className="px-2 py-3 text-center text-xs font-bold uppercase text-zinc-500" key={day}>{day}</div>)}</div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = dateKey(day)
            const dayReservations = byDay.get(key) ?? []
            const isCurrentMonth = day.getMonth() === monthNumber - 1
            return (
              <div className={`min-h-28 border-b border-r border-zinc-200 p-2 ${isCurrentMonth ? 'bg-white' : 'bg-zinc-50 text-zinc-400'}`} key={key}>
                <p className="text-right text-xs font-bold">{day.getDate()}</p>
                <div className="mt-2 space-y-1">{dayReservations.slice(0, 3).map((reservation) => <div className="truncate rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800" key={reservation.id} title={`${reservation.hora_inicio_local} ${reservation.nombre_cliente}`}>{reservation.hora_inicio_local.slice(0, 5)} {reservation.canchas?.nombre}</div>)}{dayReservations.length > 3 && <p className="text-xs font-semibold text-zinc-500">+{dayReservations.length - 3} mas</p>}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
