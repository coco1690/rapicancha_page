import { useEffect, useMemo, type FormEvent } from 'react'
import { PersonAddAltOutlined } from '@mui/icons-material'
import { Avatar, Box, Chip, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { ResponsiveModalForm } from '../../../components/ResponsiveModalForm'
import type { UserRole } from '../../../services/supabase/tables'
import { AdminTableShell } from '../../../shared/components/AdminTableShell'
import { FeedbackAlert } from '../../../shared/components/FeedbackAlert'
import { ModuleHeader } from '../../../shared/components/ModuleHeader'
import { RowActionsMenu } from '../../../shared/components/RowActionsMenu'
import { AppButton, AppInput, AppSelect } from '../../../shared/components/MuiPrimitives'
import { useAdminUsersStore, type UserFilter } from '../../../stores/admin/useAdminUsersStore'
import { useAuthStore } from '../../../stores/useAuthStore'

const roles: Array<{ value: UserFilter; label: string }> = [{ value: 'all', label: 'Todos' }, { value: 'admin', label: 'Admin' }, { value: 'negocio', label: 'Negocio' }, { value: 'cliente', label: 'Cliente' }]

export function AdminUsersPage() {
  const currentUser = useAuthStore((state) => state.user)
  const users = useAdminUsersStore((state) => state.users)
  const open = useAdminUsersStore((state) => state.open)
  const name = useAdminUsersStore((state) => state.name)
  const email = useAdminUsersStore((state) => state.email)
  const role = useAdminUsersStore((state) => state.role)
  const search = useAdminUsersStore((state) => state.search)
  const roleFilter = useAdminUsersStore((state) => state.roleFilter)
  const page = useAdminUsersStore((state) => state.page)
  const rowsPerPage = useAdminUsersStore((state) => state.rowsPerPage)
  const saving = useAdminUsersStore((state) => state.saving)
  const error = useAdminUsersStore((state) => state.error)
  const message = useAdminUsersStore((state) => state.message)
  const load = useAdminUsersStore((state) => state.load)
  const openInvite = useAdminUsersStore((state) => state.openInvite)
  const close = useAdminUsersStore((state) => state.close)
  const setName = useAdminUsersStore((state) => state.setName)
  const setEmail = useAdminUsersStore((state) => state.setEmail)
  const setRole = useAdminUsersStore((state) => state.setRole)
  const setSearch = useAdminUsersStore((state) => state.setSearch)
  const setRoleFilter = useAdminUsersStore((state) => state.setRoleFilter)
  const setPage = useAdminUsersStore((state) => state.setPage)
  const setRowsPerPage = useAdminUsersStore((state) => state.setRowsPerPage)
  const update = useAdminUsersStore((state) => state.update)
  const invite = useAdminUsersStore((state) => state.invite)

  useEffect(() => { void load() }, [load])

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesRole = roleFilter === 'all' || user.rol === roleFilter
    const query = search.trim().toLocaleLowerCase('es')
    return matchesRole && (!query || `${user.nombre} ${user.email}`.toLocaleLowerCase('es').includes(query))
  }), [roleFilter, search, users])
  const visibleUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void invite() }

  return (
    <main className="page-container">
      <ModuleHeader title="Usuarios" />
      <Stack spacing={1.25} sx={{ mb: 2 }}><FeedbackAlert message={!open ? error : ''} /><FeedbackAlert message={message} severity="success" /></Stack>
      <AdminTableShell
        title="Usuarios de la plataforma"
        filters={<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', md: 'center' }, width: { xs: '100%', md: 'auto' } }}><ToggleButtonGroup exclusive onChange={(_, value: UserFilter | null) => value && setRoleFilter(value)} size="small" value={roleFilter} sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 0.25, '& .MuiToggleButton-root': { border: 0, borderRadius: 1, px: { xs: 1.25, sm: 2 }, textTransform: 'none' }, '& .Mui-selected': { bgcolor: 'primary.main !important', color: 'primary.contrastText !important' } }}>{roles.map((item) => <ToggleButton key={item.value} value={item.value}>{item.label}</ToggleButton>)}</ToggleButtonGroup><AppInput aria-label="Buscar usuarios" className="field" placeholder="Buscar por nombre o correo" type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></Stack>}
        actions={<AppButton className="primary-button" type="button" onClick={openInvite}>Crear usuario</AppButton>}
      >
        <TableContainer>
          <Table aria-label="Usuarios" sx={{ minWidth: 780 }}>
            <TableHead><TableRow><TableCell>Usuario</TableCell><TableCell>Rol</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
            <TableBody>
              {visibleUsers.map((user) => {
                const self = user.id === currentUser?.id
                return <TableRow hover key={user.id}><TableCell><Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}><Avatar sx={{ bgcolor: 'secondary.light', color: 'primary.dark', fontSize: 14, fontWeight: 800, height: 34, width: 34 }}>{user.nombre.slice(0, 2).toUpperCase()}</Avatar><Box><Typography sx={{ fontSize: 14, fontWeight: 700 }}>{user.nombre}</Typography><Typography color="text.secondary" sx={{ fontSize: 12 }}>{user.email}</Typography></Box></Stack></TableCell><TableCell><Chip color={user.rol === 'admin' ? 'info' : user.rol === 'negocio' ? 'warning' : 'default'} label={user.rol} size="small" /></TableCell><TableCell><Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}><Switch checked={user.activo} disabled={self} onChange={() => void update(user, { activo: !user.activo })} size="small" slotProps={{ input: { 'aria-label': user.activo ? 'Desactivar usuario' : 'Activar usuario' } }} /><Typography color="text.secondary" sx={{ fontSize: 12 }}>{user.activo ? 'Activo' : 'Suspendido'}</Typography></Stack></TableCell><TableCell align="right"><RowActionsMenu rowId={`user-${user.id}`} actions={(['admin', 'negocio', 'cliente'] as UserRole[]).map((nextRole) => ({ label: `Rol ${nextRole}`, disabled: self || user.rol === nextRole, onClick: () => void update(user, { rol: nextRole }) }))} /></TableCell></TableRow>
              })}
              {!visibleUsers.length && <TableRow><TableCell colSpan={4}><Stack spacing={1} sx={{ alignItems: 'center', py: 5 }}><PersonAddAltOutlined color="disabled" /><Typography color="text.secondary">No hay usuarios para este filtro.</Typography></Stack></TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filteredUsers.length} labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} labelRowsPerPage="Filas por página:" onPageChange={(_, value) => setPage(value)} onRowsPerPageChange={(event) => setRowsPerPage(Number(event.target.value))} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[5, 10, 25]} />
      </AdminTableShell>

      {open && <ResponsiveModalForm title="Invitar usuario" kicker="Administración" size="sm" onClose={close} onSubmit={submit} actions={<><AppButton className="secondary-button" type="button" onClick={close}>Cerrar</AppButton><AppButton className="primary-button" disabled={saving}>{saving ? 'Enviando...' : 'Enviar invitación'}</AppButton></>}><Stack spacing={2.25}><Field label="Nombre"><AppInput className="field" required value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label="Correo"><AppInput className="field" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></Field><Field label="Rol"><AppSelect className="field" value={role} onChange={(event) => setRole(event.target.value as UserRole)}><option value="cliente">Cliente</option><option value="negocio">Negocio</option><option value="admin">Administrador</option></AppSelect></Field><FeedbackAlert message={error} /></Stack></ResponsiveModalForm>}
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <Stack spacing={0.75}><Typography component="label" sx={{ fontSize: 13, fontWeight: 700 }}>{label}</Typography>{children}</Stack>
}
