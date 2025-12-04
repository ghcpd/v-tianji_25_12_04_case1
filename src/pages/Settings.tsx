import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import SettingsSection from '../components/Settings/SettingsSection'
import ToggleSwitch from '../components/Settings/ToggleSwitch'
import InputField from '../components/Settings/InputField'
import SelectField from '../components/Settings/SelectField'
import './Settings.css'

const Settings: React.FC = () => {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    autoRefresh: true,
    refreshInterval: 30,
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleNestedSettingChange = (
    section: string,
    key: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value,
      },
    }))
  }

  const handleSave = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      alert('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    }
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
        <button className="btn-primary" onClick={handleSave}>
          Save Changes
        </button>
      </div>

      <div className="settings-content">
        <SettingsSection title="Profile">
          <InputField
            label="Name"
            value={user?.name || ''}
            onChange={() => {}}
            disabled
          />
          <InputField
            label="Email"
            value={user?.email || ''}
            onChange={() => {}}
            disabled
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <ToggleSwitch
            label="Email Notifications"
            checked={settings.notifications.email}
            onChange={(checked) =>
              handleNestedSettingChange('notifications', 'email', checked)
            }
          />
          <ToggleSwitch
            label="Push Notifications"
            checked={settings.notifications.push}
            onChange={(checked) =>
              handleNestedSettingChange('notifications', 'push', checked)
            }
          />
          <ToggleSwitch
            label="SMS Notifications"
            checked={settings.notifications.sms}
            onChange={(checked) =>
              handleNestedSettingChange('notifications', 'sms', checked)
            }
          />
        </SettingsSection>

        <SettingsSection title="Preferences">
          <SelectField
            label="Theme"
            value={settings.theme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'auto', label: 'Auto' },
            ]}
            onChange={(value) => handleSettingChange('theme', value)}
          />
          <SelectField
            label="Language"
            value={settings.language}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
            ]}
            onChange={(value) => handleSettingChange('language', value)}
          />
          <SelectField
            label="Timezone"
            value={settings.timezone}
            options={[
              { value: 'UTC', label: 'UTC' },
              { value: 'EST', label: 'Eastern Time' },
              { value: 'PST', label: 'Pacific Time' },
            ]}
            onChange={(value) => handleSettingChange('timezone', value)}
          />
        </SettingsSection>

        <SettingsSection title="Dashboard">
          <ToggleSwitch
            label="Auto Refresh"
            checked={settings.autoRefresh}
            onChange={(checked) => handleSettingChange('autoRefresh', checked)}
          />
          <InputField
            label="Refresh Interval (seconds)"
            type="number"
            value={settings.refreshInterval.toString()}
            onChange={(value) =>
              handleSettingChange('refreshInterval', parseInt(value))
            }
            disabled={!settings.autoRefresh}
          />
        </SettingsSection>
      </div>
    </div>
  )
}

export default Settings

