# Supabase Auth Integration Guide

This document explains how Supabase Authentication is integrated into the attendance system.

## Overview

The application now uses **Supabase Auth** for all authentication operations, including:
- User login
- User registration
- Session management
- Role-based access control
- Protected routes

## Architecture

### 1. Auth Utilities (`lib/auth.ts`)

Core authentication functions:
- `signIn(email, password)` - Sign in with email/password
- `signOut()` - Sign out current user
- `signUp(...)` - Register new user with profile
- `getCurrentUser()` - Get current authenticated user with profile
- `getSession()` - Get current session
- `verifyRole(role)` - Verify user has specific role
- `isAuthenticated()` - Check if user is authenticated

### 2. Auth Hook (`hooks/useAuth.ts`)

React hook for accessing authentication state in components:

```typescript
const { user, loading, signOut, refreshUser } = useAuth();
```

- `user` - Current authenticated user with profile (null if not logged in)
- `loading` - Loading state during auth checks
- `signOut()` - Sign out function
- `refreshUser()` - Manually refresh user data

### 3. Protected Routes (`components/auth/ProtectedRoute.tsx`)

Wrapper component that protects routes based on authentication and role:

```typescript
<ProtectedRoute requiredRole="student">
  {/* Protected content */}
</ProtectedRoute>
```

### 4. Auth Provider (`app/layout.tsx`)

The `AuthProvider` is wrapped around the entire application in the root layout to provide auth context to all components.

## Usage Examples

### Login Page

The login page (`app/(auth)/login/page.tsx`) now:
1. Uses Supabase Auth for sign-in
2. Verifies user role matches selected role
3. Redirects to appropriate dashboard
4. Shows error messages on failure

### Dashboard Layouts

All dashboard layouts now:
1. Use `useAuth()` hook to get current user
2. Use `ProtectedRoute` to ensure authentication and role verification
3. Use `signOut()` from auth hook for logout

Example:
```typescript
const { signOut } = useAuth();

const handleLogout = async () => {
  await signOut(); // This will sign out and redirect to /login
};
```

### Accessing User Data

In any component:

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Welcome, {user.full_name}!</p>
      <p>Role: {user.role}</p>
    </div>
  );
}
```

## Database Integration

### User Profile Storage

When a user signs up:
1. Supabase Auth creates the auth user
2. A record is created in the `users` table with:
   - Same ID as auth user
   - Email, full_name, role
3. Role-specific records are created:
   - `students` table for student role
   - `teachers` table for teacher role

### Row Level Security (RLS)

The database has RLS policies that ensure:
- Users can only access their own data
- Teachers can manage their own sessions
- Students can view their own attendance
- Admins have full access

## Authentication Flow

1. **Login:**
   - User selects role and enters credentials
   - `signIn()` is called with email/password
   - Supabase Auth authenticates
   - User profile is fetched from `users` table
   - Role is verified against selected role
   - User is redirected to appropriate dashboard

2. **Session Management:**
   - Supabase handles session tokens automatically
   - Sessions are stored securely (httpOnly cookies recommended)
   - Session refreshes happen automatically
   - `onAuthStateChange` listener updates auth state

3. **Logout:**
   - `signOut()` is called
   - Supabase clears the session
   - Auth state updates to null
   - User is redirected to login page

## Security Features

1. **Role Verification:** Users can only access dashboards matching their role
2. **Route Protection:** All dashboard routes are protected with `ProtectedRoute`
3. **Database RLS:** Additional security at database level
4. **Session Management:** Secure session handling by Supabase

## Environment Variables

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Next Steps

To complete the integration:

1. **Configure Supabase:**
   - Set up email templates in Supabase Dashboard
   - Configure email confirmation settings (if needed)
   - Set up password reset flows

2. **Add Features (Optional):**
   - Password reset functionality
   - Email verification
   - Social authentication (Google, etc.)
   - Remember me functionality

3. **Testing:**
   - Test login with valid credentials
   - Test login with invalid credentials
   - Test role verification
   - Test logout
   - Test session persistence on page refresh

## Troubleshooting

### "User not authenticated" error
- Check if Supabase credentials are correct in `.env.local`
- Verify user exists in Supabase Auth dashboard
- Check browser console for auth errors

### "Role mismatch" error
- Verify user's role in `users` table matches selected role
- Check if user profile was created correctly during registration

### Session not persisting
- Verify Supabase client is configured correctly
- Check if cookies are enabled in browser
- Verify RLS policies allow user to read their profile
