
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingState } from '@/components/LoadingState';

// Add import for UserRole type
import { UserRole } from '@/types';

// Update allowedRoles to use UserRole type
type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
};

export function ProtectedRoute({ children, allowedRoles, redirectTo = "/login" }: ProtectedRouteProps) {
  const { user, session, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (!session) {
    // Not authenticated
    console.log('ProtectedRoute: No session, redirecting to login');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  // If we have a session but no user (possibly due to RLS issue)
  // Still allow access but with role checking based on session claim
  if (!user && allowedRoles) {
    const sessionRole = session.user?.user_metadata?.role as UserRole;
    console.log('ProtectedRoute: No user profile but have session, checking role from session:', sessionRole);
    
    if (!sessionRole || !allowedRoles.includes(sessionRole)) {
      console.log(`Role ${sessionRole} not authorized. Allowed roles:`, allowedRoles);
      return <Navigate to="/unauthorized" replace />;
    }
  } else if (user && allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    // Normal role check when user profile is available
    console.log(`User role ${user.role} not authorized. Allowed roles:`, allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
}
