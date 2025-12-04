import React, { useState } from 'react'
import './FilterPanel.css'

interface FilterPanelProps {
  filters: Record<string, any>
  onChange: (filters: Record<string, any>) => void
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onChange }) => {
  const [localFilters, setLocalFilters] = useState(filters)

  const handleChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onChange(newFilters)
  }

  const handleClear = () => {
    const cleared = {}
    setLocalFilters(cleared)
    onChange(cleared)
  }

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>Filters</h3>
        <button className="clear-button" onClick={handleClear}>
          Clear
        </button>
      </div>

      <div className="filter-content">
        <div className="filter-group">
          <label>Date Range</label>
          <select
            value={localFilters.dateRange || ''}
            onChange={(e) => handleChange('dateRange', e.target.value)}
          >
            <option value="">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Category</label>
          <select
            value={localFilters.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="revenue">Revenue</option>
            <option value="users">Users</option>
            <option value="engagement">Engagement</option>
            <option value="performance">Performance</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={localFilters.includeInactive || false}
              onChange={(e) => handleChange('includeInactive', e.target.checked)}
            />
            Include Inactive
          </label>
        </div>
      </div>
    </div>
  )
}

export default FilterPanel

