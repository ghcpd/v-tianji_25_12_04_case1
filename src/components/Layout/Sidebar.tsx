import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.css'

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { user, hasPermission } = useAuth()

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊', permission: null },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: '📈',
      permission: 'view_analytics',
    },
    { path: '/users', label: 'Users', icon: '👥', permission: 'view_users' },
    {
      path: '/settings',
      label: 'Settings',
      icon: '⚙️',
      permission: 'manage_settings',
    },
  ]

  const filteredItems = menuItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">Enterprise</h1>
      </div>
      <nav className="sidebar-nav">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.name.charAt(0).toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

