import React, { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../contexts/AuthContext'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="loading-container">Loading...</div>
  }

  if (!user) {
    return <div className="auth-required">Authentication required</div>
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Header />
        <main className="layout-content">{children}</main>
      </div>
    </div>
  )
}

export default Layout

