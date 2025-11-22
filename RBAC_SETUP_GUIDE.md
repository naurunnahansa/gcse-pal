# Role-Based Access Control (RBAC) Setup Guide

This guide walks you through setting up the complete RBAC system following the article's approach.

## Overview

Your application now has a complete RBAC system with:
- **4 Roles**: Admin, Teacher, Student, Viewer
- **Granular Permissions**: 25+ specific permissions
- **Role-Based UI Components**: Conditional rendering based on roles
- **Admin Dashboard**: User role management interface
- **Middleware Protection**: Route-based access control

## Step 1: Configure Clerk for RBAC

### 1.1 Update Clerk Session Token

In your Clerk Dashboard:
1. Go to **Sessions** → **Customize session token**
2. Add the following JSON to include metadata in tokens:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

### 1.2 Set Initial Admin Role

1. Go to **Users** in Clerk Dashboard
2. Select your user account
3. Scroll to **Public Metadata** → **Edit**
4. Add this JSON:

```json
{
  "role": "admin"
}
```

## Step 2: Test the RBAC System

### 2.1 Test Middleware Route Protection

Access these URLs to test route protection:

```bash
# Should redirect to sign-in if not authenticated
https://your-app.com/dashboard

# Should show "Access Denied" for non-admins
https://your-app.com/dashboard/admin/overview

# Should work for teachers and admins
https://your-app.com/courses
```

### 2.2 Test Role-Based Navigation

1. **As a logged-out user**: Should see only "Courses" and sign-in options
2. **As a student**: Should see "Courses" but no "Dashboard" or "Admin"
3. **As a teacher**: Should see "Courses" and "Dashboard"
4. **As an admin**: Should see "Courses", "Dashboard", and "Admin"

### 2.3 Test Role Management

1. **Navigate to**: `/dashboard/admin/settings`
2. **Scroll to**: "Role Management" section
3. **Search for users** by name or email
4. **Change roles** using the buttons
5. **Verify changes** are reflected immediately

## Step 3: Verify Components Work

### 3.1 Test RBAC Wrapper Components

```tsx
// Test AdminOnly component
<AdminOnly>
  <p>Only admins should see this</p>
</AdminOnly>

// Test TeacherOrAdmin component
<TeacherOrAdmin>
  <p>Teachers and admins should see this</p>
</TeacherOrAdmin>

// Test permission-based component
<RBACWrapper permissions={['users:manage-roles']}>
  <p>Only users with user management permissions see this</p>
</RBACWrapper>
```

### 3.2 Test Permission Hook

```tsx
// In any component
const { permissions } = usePermissions();

console.log(permissions.isAdmin);     // true/false
console.log(permissions.canManageUsers);  // true/false
console.log(permissions.hasPermission('courses:create')); // true/false
```

## Step 4: API Endpoints

Your RBAC system includes these protected endpoints:

### Admin Endpoints
- `POST /api/admin/update-role` - Update user roles
- `GET /api/admin/stats` - Admin dashboard stats
- `GET /api/admin/users?search=query` - Search users

### Permission-Based Endpoints
- `GET /api/admin/courses` - Requires admin/teacher
- `POST /api/courses` - Requires course creation permission
- `GET /api/students` - Requires student view permission

## Step 5: Common Test Scenarios

### Scenario 1: Student Role Test
```bash
1. Set user role to "student" in Clerk Dashboard
2. Sign in as this user
3. Verify:
   - Can see /courses
   - Cannot see /dashboard
   - Cannot see /admin pages
   - Header shows no "Dashboard" or "Admin" links
```

### Scenario 2: Teacher Role Test
```bash
1. Set user role to "teacher" in Clerk Dashboard
2. Sign in as this user
3. Verify:
   - Can see /courses and /dashboard
   - Cannot see /admin pages
   - Header shows "Dashboard" but not "Admin"
```

### Scenario 3: Admin Role Test
```bash
1. Set user role to "admin" in Clerk Dashboard
2. Sign in as this user
3. Verify:
   - Can access all pages
   - Header shows all navigation options
   - Can manage other users' roles in admin settings
```

## Step 6: Role Hierarchy Test

The role hierarchy prevents privilege escalation:

```bash
Test these rules:
- Student cannot promote to teacher/admin
- Teacher cannot promote to admin
- Admin can demote any role
- Users cannot change their own role
```

## Step 7: Database Sync Test

Verify role synchronization:

```bash
1. Change role in Clerk Dashboard
2. Check that role updates in your database
3. Verify UI reflects change immediately
4. Test that permissions work correctly
```

## Troubleshooting

### Common Issues

1. **"Access Denied" on admin pages**
   - Verify user has admin role in Clerk metadata
   - Check that session token includes metadata
   - Ensure middleware is properly configured

2. **Role changes not reflecting**
   - Clerk metadata may take a moment to sync
   - Try signing out and back in
   - Check browser localStorage for cached sessions

3. **Permission checks failing**
   - Verify role is properly typed as `Role`
   - Check permission definitions in `lib/permissions.ts`
   - Ensure RBACWrapper components have correct props

### Debug Steps

```tsx
// Add this to debug user role
const { user } = useUser();
console.log('User role:', user?.publicMetadata?.role);
console.log('User permissions:', usePermissions().permissions);
```

## Security Notes

✅ **Implemented Security Features:**
- Route-level protection via middleware
- Component-level access control
- Role hierarchy enforcement
- Permission-based API protection
- Database and Clerk metadata sync

⚠️ **Important Security Considerations:**
- Always validate permissions on both client and server
- Use HTTPS in production
- Implement rate limiting on role-change endpoints
- Log all role changes for audit trails

## Next Steps

1. **Add More Granular Permissions**: Customize for your specific needs
2. **Implement Audit Logging**: Track role changes and access attempts
3. **Add Role-Based API Rate Limiting**: Different limits per role
4. **Create Role Management UI**: Build dedicated admin interfaces
5. **Add Permission Inheritance**: Allow custom role combinations

Your RBAC system is now fully functional and follows the article's best practices!