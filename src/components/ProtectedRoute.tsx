
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
  
  // Show loading state only if we're still determining auth
  if (isLoading) {
    console.log('ProtectedRoute: Still loading, showing loading state');
    return <LoadingState />;
  }
  
  // Always prioritize session check, which is more reliable than user data
  if (!session) {
    console.log('ProtectedRoute: No session, redirecting to login');
    // Use replace: true to prevent breaking the back button
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // With session available, handle role-based authorization
  if (allowedRoles) {
    // If we have user data, use it for role check
    if (user && !allowedRoles.includes(user.role as UserRole)) {
      console.log('ProtectedRoute: User role not authorized, redirecting to unauthorized');
      return <Navigate to="/unauthorized" replace />;
    }
    
    // If no user data but session exists, use role from session metadata as fallback
    if (!user && session) {
      const sessionRole = session.user.user_metadata?.role || 'affiliate';
      console.log('ProtectedRoute: No user data but session exists, using role from session:', sessionRole);
      
      if (!allowedRoles.includes(sessionRole as UserRole)) {
        console.log('ProtectedRoute: Role from session not authorized, redirecting to unauthorized');
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }
  
  console.log('ProtectedRoute: Authentication and authorization passed, rendering children');
  return <>{children}</>;
}
