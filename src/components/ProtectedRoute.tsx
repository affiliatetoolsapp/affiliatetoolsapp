
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
  
  // If still loading, show loading state
  if (isLoading) {
    console.log('ProtectedRoute: Still loading, showing loading state');
    return <LoadingState />;
  }
  
  // If no session, redirect to login
  if (!session) {
    console.log('ProtectedRoute: No session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // With session available, handle role-based authorization if needed
  if (allowedRoles && allowedRoles.length > 0) {
    // Get role from user data or session metadata
    const userRole = user?.role as UserRole | undefined;
    const sessionRole = session?.user?.user_metadata?.role as UserRole | undefined;
    const role = userRole || sessionRole;
    
    if (role && !allowedRoles.includes(role)) {
      console.log('ProtectedRoute: Role not authorized, redirecting to unauthorized');
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  console.log('ProtectedRoute: Authentication and authorization passed, rendering children');
  return <>{children}</>;
}
