import React from 'react'
import './MetricCard.css'

interface Metric {
  id: string
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  timestamp: Date
}

interface MetricCardProps {
  metric: Metric
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const formatValue = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }

  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return '↑'
      case 'down':
        return '↓'
      default:
        return '→'
    }
  }

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return '#4caf50'
      case 'down':
        return '#f44336'
      default:
        return '#9e9e9e'
    }
  }

  return (
    <div className="metric-card">
      <div className="metric-header">
        <h3 className="metric-name">{metric.name}</h3>
        <span className="metric-trend" style={{ color: getTrendColor() }}>
          {getTrendIcon()}
        </span>
      </div>
      <div className="metric-value">{formatValue(metric.value)}</div>
      <div className="metric-change" style={{ color: getTrendColor() }}>
        {metric.change > 0 ? '+' : ''}
        {metric.change.toFixed(1)}% from last period
      </div>
    </div>
  )
}

export default MetricCard

