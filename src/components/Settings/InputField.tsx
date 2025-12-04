import React from 'react'
import './InputField.css'

interface InputFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  disabled?: boolean
  placeholder?: string
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
  placeholder,
}) => {
  return (
    <div className="input-field">
      <label className="input-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="input-control"
      />
    </div>
  )
}

export default InputField

