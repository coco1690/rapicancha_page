import { create } from 'zustand'
import { bookingRepository, type CityOption, type MarketplaceBusinessResult, type MarketplaceCourtWithLogo } from '../services/repositories/bookingRepository'

type BookingFilters = {
  city: string
  sport: string
  date: string
}

type BookingStore = {
  filters: BookingFilters
  cityOptions: CityOption[]
  marketplaceCourts: MarketplaceCourtWithLogo[]
  filteredCourts: MarketplaceCourtWithLogo[]
  filteredBusinesses: MarketplaceBusinessResult[]
  resultsOpen: boolean
  loading: boolean
  error: string
  selectedCountryCode: string
  loadMarketplace: () => Promise<void>
  setFilter: (field: keyof BookingFilters, value: string) => void
  setFilters: (filters: Partial<BookingFilters>) => void
  search: () => void
  closeResults: () => void
  resetFilters: () => void
}

const initialFilters: BookingFilters = {
  city: '',
  sport: 'Todos',
  date: '',
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'No se pudo cargar el buscador.'

export const useBookingStore = create<BookingStore>((set, get) => ({
  filters: initialFilters,
  cityOptions: [],
  marketplaceCourts: [],
  filteredCourts: [],
  filteredBusinesses: [],
  resultsOpen: false,
  loading: false,
  error: '',
  selectedCountryCode: 'CO',
  loadMarketplace: async () => {
    if (get().loading || get().marketplaceCourts.length > 0) return
    set({ loading: true, error: '' })
    try {
      const [marketplaceCourts, cityOptions] = await Promise.all([
        bookingRepository.fetchMarketplace(),
        bookingRepository.fetchCitiesByCountry(get().selectedCountryCode),
      ])
      const filteredCourts = bookingRepository.filterMarketplace(marketplaceCourts, get().filters)
      set({ marketplaceCourts, filteredCourts, filteredBusinesses: bookingRepository.groupBusinesses(filteredCourts), cityOptions, loading: false })
    } catch (error) {
      set({ error: errorMessage(error), loading: false })
    }
  },
  setFilter: (field, value) =>
    set((state) => ({
      filters: { ...state.filters, [field]: value },
      filteredCourts: bookingRepository.filterMarketplace(state.marketplaceCourts, { ...state.filters, [field]: value }),
      filteredBusinesses: bookingRepository.groupBusinesses(bookingRepository.filterMarketplace(state.marketplaceCourts, { ...state.filters, [field]: value })),
    })),
  setFilters: (nextFilters) => set((state) => {
    const filters = { ...state.filters, ...nextFilters }
    const filteredCourts = bookingRepository.filterMarketplace(state.marketplaceCourts, filters)
    return { filters, filteredCourts, filteredBusinesses: bookingRepository.groupBusinesses(filteredCourts) }
  }),
  search: () => set((state) => {
    const filteredCourts = bookingRepository.filterMarketplace(state.marketplaceCourts, state.filters)
    return { filteredCourts, filteredBusinesses: bookingRepository.groupBusinesses(filteredCourts), resultsOpen: true }
  }),
  closeResults: () => set({ resultsOpen: false }),
  resetFilters: () => set((state) => {
    const filteredCourts = bookingRepository.filterMarketplace(state.marketplaceCourts, initialFilters)
    return { filters: initialFilters, filteredCourts, filteredBusinesses: bookingRepository.groupBusinesses(filteredCourts), resultsOpen: false }
  }),
}))
