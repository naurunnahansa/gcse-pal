'use client'

import { useState, useEffect } from 'react'
import { removeRole, setRole } from './actions'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, User, Crown, GraduationCap, BookOpen, Eye, Loader2 } from 'lucide-react'
import { AdminOnly } from '@/components/RBACWrapper'
import { Role, getAssignableRoles } from '@/lib/permissions'

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  role: Role | null
}

export default function AdminDashboard({
  searchParams
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (query) {
      searchUsers()
    }
  }, [query])

  const searchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: Role | null) => {
    switch (role) {
      case 'admin': return Crown
      case 'teacher': return GraduationCap
      case 'student': return BookOpen
      default: return Eye
    }
  }

  const getRoleColor = (role: Role | null) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100 border-red-200'
      case 'teacher': return 'text-blue-600 bg-blue-100 border-blue-200'
      case 'student': return 'text-green-600 bg-green-100 border-green-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const assignableRoles = getAssignableRoles('admin') // This would be dynamic based on current user

  const handleRoleUpdate = async (userId: string, newRole: Role) => {
    try {
      const formData = new FormData()
      formData.append('id', userId)
      formData.append('role', newRole)
      await setRole(formData)

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ))
    } catch (error) {
      console.error('Error updating role:', error)
    }
  }

  const handleRoleRemoval = async (userId: string) => {
    try {
      const formData = new FormData()
      formData.append('id', userId)
      await removeRole(formData)

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: null } : u
      ))
    } catch (error) {
      console.error('Error removing role:', error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-grow p-4">
        <AdminOnly>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Role Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="search" className="text-sm font-medium">
                    Search for users to manage their roles
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="search"
                      type="text"
                      placeholder="Enter name or email..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="flex-grow"
                    />
                    <Button onClick={searchUsers} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {users.map((user) => {
            const RoleIcon = getRoleIcon(user.role)

            return (
              <Card key={user.id} className="mb-4">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="mt-2">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                            <RoleIcon className="h-3 w-3" />
                            {user.role || 'viewer'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {assignableRoles.map((role) => (
                        <Button
                          key={role}
                          size="sm"
                          variant={user.role === role ? "default" : "outline"}
                          onClick={() => handleRoleUpdate(user.id, role)}
                        >
                          Make {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Button>
                      ))}

                      {user.role && user.role !== 'viewer' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRoleRemoval(user.id)}
                        >
                          Remove Role
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {query && users.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found matching "{query}"</p>
              </CardContent>
            </Card>
          )}

          {!query && (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Search for users above to manage their roles and permissions
                </p>
              </CardContent>
            </Card>
          )}
        </AdminOnly>
      </main>
    </div>
  )
}