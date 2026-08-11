import { create } from 'zustand'
import { exportParticipantContacts } from '../services/participants/exportParticipantContacts'
import { participantRepository, type ParticipantDirectoryRow } from '../services/repositories/participantRepository'

export type ParticipantChannelFilter = 'all' | 'email' | 'whatsapp'

type State = {
  rows: ParticipantDirectoryRow[]; search: string; channelFilter: ParticipantChannelFilter
  page: number; rowsPerPage: number; loading: boolean; error: string
  load: (businessId?: string) => Promise<void>; subscribe: (businessId?: string) => () => void
  setSearch: (value: string) => void; setChannelFilter: (value: ParticipantChannelFilter) => void
  setPage: (value: number) => void; setRowsPerPage: (value: number) => void
  exportRows: (rows: ParticipantDirectoryRow[]) => void; clear: () => void
}

const failure = (error: unknown) => error instanceof Error ? error.message : 'No se pudieron cargar los participantes.'

export const useParticipantsStore = create<State>((set, get) => ({
  rows: [], search: '', channelFilter: 'all', page: 0, rowsPerPage: 10, loading: false, error: '',
  load: async (businessId) => {
    set({ loading: true, error: '' })
    try { set({ rows: await participantRepository.fetchDirectory(businessId), loading: false }) }
    catch (error) { set({ loading: false, error: failure(error) }) }
  },
  subscribe: (businessId) => participantRepository.subscribe(businessId, () => { void get().load(businessId) }),
  setSearch: (search) => set({ search, page: 0 }),
  setChannelFilter: (channelFilter) => set({ channelFilter, page: 0 }),
  setPage: (page) => set({ page }),
  setRowsPerPage: (rowsPerPage) => set({ rowsPerPage, page: 0 }),
  exportRows: exportParticipantContacts,
  clear: () => set({ rows: [], search: '', channelFilter: 'all', page: 0, loading: false, error: '' }),
}))
