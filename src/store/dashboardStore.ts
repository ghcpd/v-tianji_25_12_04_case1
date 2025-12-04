import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface Metric {
  id: string
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  timestamp: Date
}

interface DashboardState {
  metrics: Metric[]
  selectedTimeRange: 'day' | 'week' | 'month' | 'year'
  filters: Record<string, any>
  isLoading: boolean
  error: string | null
  setMetrics: (metrics: Metric[]) => void
  setTimeRange: (range: 'day' | 'week' | 'month' | 'year') => void
  setFilters: (filters: Record<string, any>) => void
  addMetric: (metric: Metric) => void
  updateMetric: (id: string, updates: Partial<Metric>) => void
  removeMetric: (id: string) => void
  clearError: () => void
  fetchMetrics: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      metrics: [],
      selectedTimeRange: 'week',
      filters: {},
      isLoading: false,
      error: null,

      setMetrics: (metrics) => set({ metrics }),

      setTimeRange: (range) => {
        set({ selectedTimeRange: range })
        get().fetchMetrics()
      },

      setFilters: (filters) => {
        set({ filters })
        get().fetchMetrics()
      },

      addMetric: (metric) =>
        set((state) => ({
          metrics: [...state.metrics, metric],
        })),

      updateMetric: (id, updates) =>
        set((state) => ({
          metrics: state.metrics.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      removeMetric: (id) =>
        set((state) => ({
          metrics: state.metrics.filter((m) => m.id !== id),
        })),

      clearError: () => set({ error: null }),

      fetchMetrics: async () => {
        set({ isLoading: true, error: null })
        try {
          const { selectedTimeRange, filters } = get()
          const response = await fetch('/api/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timeRange: selectedTimeRange, filters }),
          })

          if (!response.ok) throw new Error('Failed to fetch metrics')

          const data = await response.json()
          set({ metrics: data.metrics, isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          })
        }
      },
    }),
    { name: 'DashboardStore' }
  )
)

