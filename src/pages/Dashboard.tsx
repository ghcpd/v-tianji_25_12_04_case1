import React, { useEffect } from 'react'
import { useDashboardStore } from '../store/dashboardStore'
import MetricCard from '../components/Dashboard/MetricCard'
import ChartWidget from '../components/Dashboard/ChartWidget'
import DataTable from '../components/Dashboard/DataTable'
import TimeRangeSelector from '../components/Dashboard/TimeRangeSelector'
import './Dashboard.css'

const Dashboard: React.FC = () => {
  const {
    metrics,
    selectedTimeRange,
    isLoading,
    error,
    fetchMetrics,
    setTimeRange,
  } = useDashboardStore()

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const handleTimeRangeChange = (range: 'day' | 'week' | 'month' | 'year') => {
    setTimeRange(range)
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <TimeRangeSelector
          value={selectedTimeRange}
          onChange={handleTimeRangeChange}
        />
      </div>

      {isLoading ? (
        <div className="loading">Loading metrics...</div>
      ) : (
        <>
          <div className="metrics-grid">
            {metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>

          <div className="dashboard-widgets">
            <div className="widget-row">
              <ChartWidget
                title="Revenue Trend"
                data={metrics}
                type="line"
                height={300}
              />
              <ChartWidget
                title="Performance Metrics"
                data={metrics}
                type="bar"
                height={300}
              />
            </div>
          </div>

          <div className="dashboard-table">
            <DataTable data={metrics} />
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard

