interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  lastLogin: Date | null
}

class UserService {
  private baseUrl = '/api/users'

  async getUsers(): Promise<User[]> {
    const response = await fetch(this.baseUrl)

    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }

    const data = await response.json()
    return data.users.map((user: any) => ({
      ...user,
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
    }))
  }

  async getUserById(id: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/${id}`)

    if (!response.ok) {
      throw new Error('Failed to fetch user')
    }

    const data = await response.json()
    return {
      ...data.user,
      lastLogin: data.user.lastLogin ? new Date(data.user.lastLogin) : null,
    }
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      throw new Error('Failed to create user')
    }

    const data = await response.json()
    return {
      ...data.user,
      lastLogin: data.user.lastLogin ? new Date(data.user.lastLogin) : null,
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error('Failed to update user')
    }

    const data = await response.json()
    return {
      ...data.user,
      lastLogin: data.user.lastLogin ? new Date(data.user.lastLogin) : null,
    }
  }

  async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete user')
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`)

    if (!response.ok) {
      throw new Error('Failed to search users')
    }

    const data = await response.json()
    return data.users.map((user: any) => ({
      ...user,
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
    }))
  }
}

export const userService = new UserService()

