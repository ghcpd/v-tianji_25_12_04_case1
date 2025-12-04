import React from 'react'
import './UserList.css'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  lastLogin: Date | null
}

interface UserListProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
}

const UserList: React.FC<UserListProps> = ({ users, onEdit, onDelete }) => {
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  }

  const getStatusBadge = (status: string) => {
    const statusClass = `status-badge status-${status}`
    return <span className={statusClass}>{status}</span>
  }

  return (
    <div className="user-list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-state">
                No users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td className="user-name">{user.name}</td>
                <td className="user-email">{user.email}</td>
                <td className="user-role">{user.role}</td>
                <td>{getStatusBadge(user.status)}</td>
                <td className="user-last-login">{formatDate(user.lastLogin)}</td>
                <td className="user-actions">
                  <button
                    className="action-button edit-button"
                    onClick={() => onEdit(user)}
                  >
                    Edit
                  </button>
                  <button
                    className="action-button delete-button"
                    onClick={() => onDelete(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default UserList

