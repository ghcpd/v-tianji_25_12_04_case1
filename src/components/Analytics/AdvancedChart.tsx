import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './AdvancedChart.css'

interface AnalyticsData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    color: string
  }>
}

interface AdvancedChartProps {
  data: AnalyticsData
  type: 'line' | 'multi-line' | 'area'
  showLegend?: boolean
  interactive?: boolean
}

const AdvancedChart: React.FC<AdvancedChartProps> = ({
  data,
  type,
  showLegend = true,
  interactive = true,
}) => {
  const chartData = data.labels.map((label, index) => {
    const point: Record<string, any> = { name: label }
    data.datasets.forEach((dataset) => {
      point[dataset.label] = dataset.data[index]
    })
    return point
  })

  return (
    <div className="advanced-chart">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          {data.datasets.map((dataset, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={dataset.label}
              stroke={dataset.color || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
              strokeWidth={2}
              dot={interactive}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default AdvancedChart

