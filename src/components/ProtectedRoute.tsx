import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';
import type { User } from '@/types';

type UserRole = 'admin' | 'advertiser' | 'affiliate';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { session, user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute: Checking auth state', {
      hasSession: !!session,
      hasUser: !!user,
      isLoading,
      currentPath: location.pathname
    });
  }, [session, user, isLoading, location]);

  // If loading, don't render anything to prevent flash of login page
  if (isLoading) {
    return null;
  }

  // Check if session exists
  if (!session) {
    console.log('ProtectedRoute: No session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no role restrictions, allow access
  if (!allowedRoles) {
    console.log('ProtectedRoute: No role restrictions, allowing access');
    return <>{children}</>;
  }

  // Get user role from either user object or session metadata
  const userRole = user?.role || session.user.user_metadata?.role;
  console.log('ProtectedRoute: User role:', userRole);

  if (!userRole || !allowedRoles.includes(userRole as UserRole)) {
    console.log('ProtectedRoute: Role not allowed, redirecting to unauthorized');
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute: Access granted');
  return <>{children}</>;
};
