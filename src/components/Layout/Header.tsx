import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './Header.css'

const Header: React.FC = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h2 className="header-title">Dashboard</h2>
        </div>
        <div className="header-right">
          <div className="header-actions">
            <button className="header-button">Notifications</button>
            <button className="header-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

