import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from '../shared/layouts/PublicLayout'
import { MarketplacePage } from '../features/marketplace/pages/MarketplacePage'
import { BusinessDetailPage } from '../features/businesses/pages/BusinessDetailPage'
import { GuestCheckoutPage } from '../features/bookings/pages/GuestCheckoutPage'
import { BookingPaymentResultPage } from '../features/bookings/pages/BookingPaymentResultPage'
import { EpaycoResponsePage } from '../features/bookings/pages/EpaycoResponsePage'
import { BusinessDashboardPage } from '../features/business-dashboard/pages/BusinessDashboardPage'
import { NotFoundPage } from '../shared/pages/NotFoundPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { ProtectedRoute } from './ProtectedRoute'
import { BusinessLayout } from '../shared/layouts/BusinessLayout'
import { BusinessProfilePage } from '../features/business-dashboard/pages/BusinessProfilePage'
import { CourtsPage } from '../features/business-dashboard/pages/CourtsPage'
import { ReservationsPage } from '../features/business-dashboard/pages/ReservationsPage'
import { UpdatePasswordPage } from '../features/auth/pages/UpdatePasswordPage'
import { RoleRoute } from './RoleRoute'
import { RoleHomePage } from './RoleHomePage'
import { SuspendedAccountPage } from '../features/auth/pages/SuspendedAccountPage'
import { LoadingScreen } from '../shared/components/LoadingScreen'
import { AuthLayout } from '../shared/layouts/AuthLayout'
import { TermsAndConditionsPage } from '../shared/pages/TermsAndConditionsPage'

const AdminLayout = lazy(() => import('../shared/layouts/AdminLayout').then((module) => ({ default: module.AdminLayout })))
const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })))
const AdminBusinessesPage = lazy(() => import('../features/admin/pages/AdminBusinessesPage').then((module) => ({ default: module.AdminBusinessesPage })))
const AdminPlansPage = lazy(() => import('../features/admin/pages/AdminPlansPage').then((module) => ({ default: module.AdminPlansPage })))
const AdminUsersPage = lazy(() => import('../features/admin/pages/AdminUsersPage').then((module) => ({ default: module.AdminUsersPage })))
const AdminLocationsPage = lazy(() => import('../features/admin/pages/AdminLocationsPage').then((module) => ({ default: module.AdminLocationsPage })))
const AdminSportsPage = lazy(() => import('../features/admin/pages/AdminSportsPage').then((module) => ({ default: module.AdminSportsPage })))
const AdminCompetitionsPage = lazy(() => import('../features/admin/pages/AdminCompetitionsPage').then((module) => ({ default: module.AdminCompetitionsPage })))
const AdminOperationsPage = lazy(() => import('../features/admin/pages/AdminOperationsPage').then((module) => ({ default: module.AdminOperationsPage })))
const AdminPaymentSettingsPage = lazy(() => import('../features/admin/pages/AdminPaymentSettingsPage').then((module) => ({ default: module.AdminPaymentSettingsPage })))
const AdminSupportPage = lazy(() => import('../features/admin/pages/AdminSupportPage').then((module) => ({ default: module.AdminSupportPage })))
const EventsPage = lazy(() => import('../features/events/pages/EventsPage').then((module) => ({ default: module.EventsPage })))
const PublicEventPage = lazy(() => import('../features/events/pages/PublicEventPage').then((module) => ({ default: module.PublicEventPage })))
const EventPaymentResultPage = lazy(() => import('../features/events/pages/EventPaymentResultPage').then((module) => ({ default: module.EventPaymentResultPage })))

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen label="Cargando modulo..." />}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<MarketplacePage />} />
        <Route path="negocios/:slug" element={<BusinessDetailPage />} />
        <Route path="eventos/:businessSlug/:eventSlug" element={<PublicEventPage />} />
        <Route path="eventos/inscripciones/:eventReference/resultado" element={<EventPaymentResultPage />} />
        <Route path="checkout/:bookingReference" element={<GuestCheckoutPage />} />
        <Route path="checkout/:bookingReference/respuesta" element={<BookingPaymentResultPage />} />
        <Route path="pago/respuesta" element={<EpaycoResponsePage />} />
        <Route path="terminos-y-condiciones" element={<TermsAndConditionsPage />} />
        <Route path="404" element={<NotFoundPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="acceso" element={<LoginPage />} />
        <Route path="registro" element={<RegisterPage />} />
        <Route path="recuperar" element={<ResetPasswordPage />} />
        <Route path="actualizar-contrasena" element={<UpdatePasswordPage />} />
        <Route path="cuenta-suspendida" element={<SuspendedAccountPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="panel" element={<RoleHomePage />} />
        <Route element={<RoleRoute allowed={['negocio', 'cliente']} />}>
          <Route path="negocio" element={<BusinessLayout />}>
            <Route index element={<BusinessDashboardPage />} />
            <Route path="perfil" element={<BusinessProfilePage />} />
            <Route path="canchas" element={<CourtsPage />} />
            <Route path="reservas" element={<ReservationsPage />} />
            <Route path="eventos" element={<EventsPage scope="business" />} />
          </Route>
        </Route>
        <Route element={<RoleRoute allowed={['admin']} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="negocios" element={<AdminBusinessesPage />} />
            <Route path="planes" element={<AdminPlansPage />} />
            <Route path="usuarios" element={<AdminUsersPage />} />
            <Route path="ubicaciones" element={<AdminLocationsPage />} />
            <Route path="deportes" element={<AdminSportsPage />} />
            <Route path="competiciones" element={<AdminCompetitionsPage />} />
            <Route path="eventos" element={<EventsPage scope="admin" />} />
            <Route path="operaciones" element={<AdminOperationsPage />} />
            <Route path="comisiones" element={<AdminPaymentSettingsPage />} />
            <Route path="soporte" element={<AdminSupportPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/404" />} />
    </Routes>
    </Suspense>
  )
}
