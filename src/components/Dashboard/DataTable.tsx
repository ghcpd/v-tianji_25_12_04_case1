import React from 'react'
import './DataTable.css'

interface Metric {
  id: string
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  timestamp: Date
}

interface DataTableProps {
  data: Metric[]
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const formatValue = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↑'
      case 'down':
        return '↓'
      default:
        return '→'
    }
  }

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Change</th>
            <th>Trend</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty-state">
                No data available
              </td>
            </tr>
          ) : (
            data.map((metric) => (
              <tr key={metric.id}>
                <td className="metric-name-cell">{metric.name}</td>
                <td className="metric-value-cell">{formatValue(metric.value)}</td>
                <td className="metric-change-cell">
                  {metric.change > 0 ? '+' : ''}
                  {metric.change.toFixed(2)}%
                </td>
                <td className="metric-trend-cell">{getTrendIcon(metric.trend)}</td>
                <td className="metric-date-cell">{formatDate(metric.timestamp)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable

