import React from 'react'
import './SelectField.css'

interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  onChange,
}) => {
  return (
    <div className="select-field">
      <label className="select-label">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select-control"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default SelectField

