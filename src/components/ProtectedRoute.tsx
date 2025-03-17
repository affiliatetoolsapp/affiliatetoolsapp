
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
  
  // Role-based access control
  if (allowedRoles) {
    // First try to get role from user object if available
    let userRole = user?.role as UserRole | undefined;
    
    // If user object is not available, fallback to session metadata
    if (!userRole) {
      userRole = session.user?.user_metadata?.role as UserRole;
    }
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log(`Role ${userRole} not authorized. Allowed roles:`, allowedRoles);
      return <Navigate to="/unauthorized" replace />;
    }
    
    console.log(`User with role ${userRole} authorized to access this route`);
  }
  
  return <>{children}</>;
}
