'use client'

import { useUser } from '@clerk/nextjs'
import { Role } from '@/lib/permissions'
import { hasPermission, canManageUsers, canManageCourses, canManageQuizzes, canViewAllProgress, canAccessDashboard } from '@/lib/permissions'

interface RBACWrapperProps {
  children: React.ReactNode
  roles?: Role[]
  permissions?: string[]
  requireAll?: boolean // If true, requires all permissions; if false, requires any permission
  fallback?: React.ReactNode
}

/**
 * RBACWrapper component for conditional rendering based on user roles and permissions
 * Following the article's approach for role-based UI components
 */
export function RBACWrapper({
  children,
  roles,
  permissions,
  requireAll = false,
  fallback = null
}: RBACWrapperProps) {
  const { user } = useUser()

  // If user is not loaded or not authenticated, show fallback
  if (!user) {
    return <>{fallback}</>
  }

  const userRole = user.publicMetadata?.role as Role

  // Check role-based access
  if (roles && !roles.includes(userRole)) {
    return <>{fallback}</>
  }

  // Check permission-based access
  if (permissions && permissions.length > 0) {
    const hasRequiredPermission = requireAll
      ? permissions.every(permission => hasPermission(userRole, permission))
      : permissions.some(permission => hasPermission(userRole, permission))

    if (!hasRequiredPermission) {
      return <>{fallback}</>
    }
  }

  // User has required roles/permissions
  return <>{children}</>
}

// Specific wrapper components for common use cases
interface AdminOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  return (
    <RBACWrapper roles={['admin']} fallback={fallback}>
      {children}
    </RBACWrapper>
  )
}

interface TeacherOrAdminProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function TeacherOrAdmin({ children, fallback = null }: TeacherOrAdminProps) {
  return (
    <RBACWrapper roles={['admin', 'teacher']} fallback={fallback}>
      {children}
    </RBACWrapper>
  )
}

interface CanManageUsersProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function CanManageUsers({ children, fallback = null }: CanManageUsersProps) {
  return (
    <RBACWrapper
      permissions={['users:manage-roles']}
      fallback={fallback}
    >
      {children}
    </RBACWrapper>
  )
}

interface CanManageCoursesProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function CanManageCourses({ children, fallback = null }: CanManageCoursesProps) {
  return (
    <RBACWrapper
      permissions={['courses:manage', 'courses:create']}
      requireAll={false}
      fallback={fallback}
    >
      {children}
    </RBACWrapper>
  )
}

interface CanManageQuizzesProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function CanManageQuizzes({ children, fallback = null }: CanManageQuizzesProps) {
  return (
    <RBACWrapper
      permissions={['quizzes:create', 'quizzes:update']}
      requireAll={false}
      fallback={fallback}
    >
      {children}
    </RBACWrapper>
  )
}

interface CanViewAllProgressProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function CanViewAllProgress({ children, fallback = null }: CanViewAllProgressProps) {
  return (
    <RBACWrapper
      permissions={['progress:view-all']}
      fallback={fallback}
    >
      {children}
    </RBACWrapper>
  )
}

interface CanAccessDashboardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function CanAccessDashboard({ children, fallback = null }: CanAccessDashboardProps) {
  return (
    <RBACWrapper
      permissions={['dashboard:access']}
      fallback={fallback}
    >
      {children}
    </RBACWrapper>
  )
}

// Hook for client-side permission checking
export function usePermissions() {
  const { user } = useUser()
  const userRole = user?.publicMetadata?.role as Role

  return {
    role: userRole,
    permissions: {
      canManageUsers: canManageUsers(userRole),
      canManageCourses: canManageCourses(userRole),
      canManageQuizzes: canManageQuizzes(userRole),
      canViewAllProgress: canViewAllProgress(userRole),
      canAccessDashboard: canAccessDashboard(userRole),
      isAdmin: userRole === 'admin',
      isTeacher: userRole === 'teacher' || userRole === 'admin',
      isStudent: userRole === 'student' || !userRole,
    },
    hasPermission: (permission: string) => hasPermission(userRole, permission),
    hasAnyPermission: (permissions: string[]) =>
      permissions.some(permission => hasPermission(userRole, permission)),
    hasAllPermissions: (permissions: string[]) =>
      permissions.every(permission => hasPermission(userRole, permission)),
  }
}