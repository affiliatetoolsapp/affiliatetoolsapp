
import React from 'react';
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
  
  // Basic debug logging
  console.log('ProtectedRoute:', { isLoading, hasUser: !!user, hasSession: !!session, allowedRoles, currentPath: location.pathname });
  
  // Show loading state while auth is initializing
  if (isLoading) {
    return <LoadingState />;
  }
  
  // If not logged in, redirect to login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check role-based access if roles are specified
  if (allowedRoles && allowedRoles.length > 0) {
    // If we don't have user data yet but have a session, show loading
    if (!user) {
      return <LoadingState />;
    }
    
    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(user.role as UserRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // User is authorized - render the children
  return <>{children}</>;
}
