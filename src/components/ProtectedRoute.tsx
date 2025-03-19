
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingState } from '@/components/LoadingState';
import { UserRole } from '@/types';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, session, isLoading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log('ProtectedRoute:', { 
      isLoading, 
      hasUser: !!user, 
      hasSession: !!session,
      allowedRoles,
      currentPath: location.pathname
    });
  }, [isLoading, user, session, allowedRoles, location]);
  
  // Add a guard to ensure we're not caught in a redirect loop
  if (location.pathname === '/login') {
    console.warn('ProtectedRoute being called on login page, this should not happen');
    return <>{children}</>;
  }
  
  if (isLoading) {
    console.log('ProtectedRoute: Still loading, showing loading state');
    return <LoadingState />;
  }
  
  // Check for session first - this is more reliable than checking the user
  if (!session) {
    console.log('ProtectedRoute: No session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If user data is not loaded yet but we have a session, we'll still render the children
  // This helps prevent the redirect loop if user data is slow to load
  if (!user) {
    console.log('ProtectedRoute: Session exists but no user data yet, proceeding anyway');
    return <>{children}</>;
  }
  
  // Role-based access control
  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    console.log('ProtectedRoute: User role not authorized, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }
  
  console.log('ProtectedRoute: Authentication and authorization passed, rendering children');
  return <>{children}</>;
}
