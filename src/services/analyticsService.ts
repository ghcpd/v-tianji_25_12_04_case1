interface AnalyticsData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    color: string
  }>
}

class AnalyticsService {
  private baseUrl = '/api/analytics'

  async getAnalytics(filters: Record<string, any>): Promise<AnalyticsData> {
    const response = await fetch(`${this.baseUrl}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters }),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch analytics data')
    }

    return response.json()
  }

  async exportData(
    filters: Record<string, any>,
    format: 'csv' | 'json' | 'pdf'
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters, format }),
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  async getMetrics(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' | 'month'
  ): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, granularity }),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch metrics')
    }

    return response.json()
  }
}

export const analyticsService = new AnalyticsService()

