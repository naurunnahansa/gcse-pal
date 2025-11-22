// Permission definitions following the article's RBAC approach
export type Role = 'admin' | 'teacher' | 'student' | 'viewer'

export interface Permission {
  resource: string
  action: string
}

// Define all possible permissions in the system
export const PERMISSIONS = {
  // User management permissions (Admin only)
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage-roles',

  // Course permissions
  COURSES_CREATE: 'courses:create',
  COURSES_READ: 'courses:read',
  COURSES_UPDATE: 'courses:update',
  COURSES_DELETE: 'courses:delete',
  COURSES_MANAGE: 'courses:manage',
  COURSES_VIEW_ALL: 'courses:view-all',

  // Quiz permissions
  QUIZZES_CREATE: 'quizzes:create',
  QUIZZES_READ: 'quizzes:read',
  QUIZZES_UPDATE: 'quizzes:update',
  QUIZZES_DELETE: 'quizzes:delete',
  QUIZZES_GRADE: 'quizzes:grade',
  QUIZZES_VIEW_ALL: 'quizzes:view-all',

  // Progress and analytics permissions
  PROGRESS_VIEW_OWN: 'progress:view-own',
  PROGRESS_VIEW_ALL: 'progress:view-all',
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_VIEW_COURSE: 'analytics:view-course',

  // Content permissions
  CONTENT_CREATE: 'content:create',
  CONTENT_UPDATE: 'content:update',
  CONTENT_DELETE: 'content:delete',
  CONTENT_APPROVE: 'content:approve',

  // System permissions
  SYSTEM_MANAGE: 'system:manage',
  DASHBOARD_ACCESS: 'dashboard:access',
} as const

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS),
  ],

  teacher: [
    // Teacher permissions
    PERMISSIONS.COURSES_CREATE,
    PERMISSIONS.COURSES_READ,
    PERMISSIONS.COURSES_UPDATE,
    PERMISSIONS.COURSES_MANAGE,
    PERMISSIONS.COURSES_VIEW_ALL,

    PERMISSIONS.QUIZZES_CREATE,
    PERMISSIONS.QUIZZES_READ,
    PERMISSIONS.QUIZZES_UPDATE,
    PERMISSIONS.QUIZZES_DELETE,
    PERMISSIONS.QUIZZES_GRADE,
    PERMISSIONS.QUIZZES_VIEW_ALL,

    PERMISSIONS.PROGRESS_VIEW_ALL,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW_COURSE,

    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_DELETE,

    PERMISSIONS.DASHBOARD_ACCESS,
  ],

  student: [
    // Student permissions
    PERMISSIONS.COURSES_READ,
    PERMISSIONS.QUIZZES_READ,
    PERMISSIONS.PROGRESS_VIEW_OWN,
    PERMISSIONS.CONTENT_CREATE, // For answering questions, submitting assignments
  ],

  viewer: [
    // Viewer (guest) permissions - read-only
    PERMISSIONS.COURSES_READ,
  ],
}

// Helper function to check if a role has a specific permission
export function hasPermission(role: Role | undefined, permission: string): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) || false
}

// Helper function to check if a role has any of the specified permissions
export function hasAnyPermission(role: Role | undefined, permissions: string[]): boolean {
  if (!role) return false
  return permissions.some(permission => hasPermission(role, permission))
}

// Helper function to check if a role has all of the specified permissions
export function hasAllPermissions(role: Role | undefined, permissions: string[]): boolean {
  if (!role) return false
  return permissions.every(permission => hasPermission(role, permission))
}

// Permission guards for common use cases
export const canManageUsers = (role: Role | undefined) => hasPermission(role, PERMISSIONS.USERS_MANAGE_ROLES)
export const canManageCourses = (role: Role | undefined) => hasAnyPermission(role, [PERMISSIONS.COURSES_MANAGE, PERMISSIONS.COURSES_CREATE])
export const canManageQuizzes = (role: Role | undefined) => hasAnyPermission(role, [PERMISSIONS.QUIZZES_CREATE, PERMISSIONS.QUIZZES_UPDATE])
export const canViewAllProgress = (role: Role | undefined) => hasPermission(role, PERMISSIONS.PROGRESS_VIEW_ALL)
export const canAccessDashboard = (role: Role | undefined) => hasPermission(role, PERMISSIONS.DASHBOARD_ACCESS)
export const canViewAnalytics = (role: Role | undefined) => hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)

// Role hierarchy for promotion/demotion
export const ROLE_HIERARCHY: Record<Role, number> = {
  viewer: 0,
  student: 1,
  teacher: 2,
  admin: 3,
}

// Function to check if a role can promote another role
export function canPromoteRole(currentRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[currentRole] > ROLE_HIERARCHY[targetRole]
}

// Function to get all roles that can be assigned by a given role
export function getAssignableRoles(currentRole: Role): Role[] {
  const currentLevel = ROLE_HIERARCHY[currentRole]
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level < currentLevel)
    .map(([role, _]) => role as Role)
}