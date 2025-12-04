import React from 'react'
import './ToggleSwitch.css'

interface ToggleSwitchProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  checked,
  onChange,
}) => {
  return (
    <div className="toggle-switch">
      <label className="toggle-label">
        <span className="toggle-text">{label}</span>
        <div className="toggle-container">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="toggle-input"
          />
          <span className="toggle-slider"></span>
        </div>
      </label>
    </div>
  )
}

export default ToggleSwitch

