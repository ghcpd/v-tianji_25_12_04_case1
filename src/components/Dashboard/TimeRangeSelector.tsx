import React from 'react'
import './TimeRangeSelector.css'

interface TimeRangeSelectorProps {
  value: 'day' | 'week' | 'month' | 'year'
  onChange: (value: 'day' | 'week' | 'month' | 'year') => void
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
}) => {
  const options: Array<{ value: 'day' | 'week' | 'month' | 'year'; label: string }> = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ]

  return (
    <div className="time-range-selector">
      {options.map((option) => (
        <button
          key={option.value}
          className={`time-range-button ${value === option.value ? 'active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default TimeRangeSelector

