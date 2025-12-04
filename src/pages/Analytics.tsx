import React, { useState, useEffect } from 'react'
import { analyticsService } from '../services/analyticsService'
import AdvancedChart from '../components/Analytics/AdvancedChart'
import FilterPanel from '../components/Analytics/FilterPanel'
import ExportButton from '../components/Analytics/ExportButton'
import './Analytics.css'

interface AnalyticsData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    color: string
  }>
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [filters])

  const loadAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await analyticsService.getAnalytics(filters)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      await analyticsService.exportData(filters, format)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  if (isLoading) {
    return <div className="analytics-loading">Loading analytics data...</div>
  }

  if (error) {
    return <div className="analytics-error">Error: {error}</div>
  }

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h1>Analytics</h1>
        <ExportButton onExport={handleExport} />
      </div>

      <div className="analytics-content">
        <div className="analytics-sidebar">
          <FilterPanel filters={filters} onChange={handleFilterChange} />
        </div>

        <div className="analytics-main">
          {data && (
            <AdvancedChart
              data={data}
              type="multi-line"
              showLegend={true}
              interactive={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics

