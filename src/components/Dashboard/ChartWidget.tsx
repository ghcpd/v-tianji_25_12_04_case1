import React from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './ChartWidget.css'

interface Metric {
  id: string
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  timestamp: Date
}

interface ChartWidgetProps {
  title: string
  data: Metric[]
  type: 'line' | 'bar'
  height?: number
}

const ChartWidget: React.FC<ChartWidgetProps> = ({
  title,
  data,
  type,
  height = 300,
}) => {
  const chartData = data.map((metric) => ({
    name: metric.name,
    value: metric.value,
    change: metric.change,
  }))

  return (
    <div className="chart-widget">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
      </div>
      <div className="chart-content" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4a9eff"
                strokeWidth={2}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#4a9eff" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ChartWidget

