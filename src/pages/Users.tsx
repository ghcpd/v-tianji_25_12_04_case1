import React, { useState, useEffect } from 'react'
import { userService } from '../services/userService'
import UserList from '../components/Users/UserList'
import UserForm from '../components/Users/UserForm'
import SearchBar from '../components/Users/SearchBar'
import Pagination from '../components/Users/Pagination'
import './Users.css'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  lastLogin: Date | null
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, users])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const data = await userService.getUsers()
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    )
    setFilteredUsers(filtered)
    setCurrentPage(1)
  }

  const handleCreateUser = () => {
    setSelectedUser(null)
    setShowForm(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowForm(true)
  }

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      if (selectedUser) {
        await userService.updateUser(selectedUser.id, userData)
      } else {
        await userService.createUser(userData as Omit<User, 'id'>)
      }
      await loadUsers()
      setShowForm(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Failed to save user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      await userService.deleteUser(userId)
      await loadUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize)

  return (
    <div className="users">
      <div className="users-header">
        <h1>User Management</h1>
        <button className="btn-primary" onClick={handleCreateUser}>
          Add User
        </button>
      </div>

      <div className="users-toolbar">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {isLoading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <>
          <UserList
            users={paginatedUsers}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
          />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {showForm && (
        <UserForm
          user={selectedUser}
          onSave={handleSaveUser}
          onCancel={() => {
            setShowForm(false)
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}

export default Users

