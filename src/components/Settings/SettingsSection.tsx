import React, { ReactNode } from 'react'
import './SettingsSection.css'

interface SettingsSectionProps {
  title: string
  children: ReactNode
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
  return (
    <div className="settings-section">
      <h2 className="settings-section-title">{title}</h2>
      <div className="settings-section-content">{children}</div>
    </div>
  )
}

export default SettingsSection

