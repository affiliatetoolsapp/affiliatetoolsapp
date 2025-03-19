
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
  
  console.log('ProtectedRoute:', { 
    isLoading, 
    hasUser: !!user, 
    hasSession: !!session,
    allowedRoles,
    currentPath: location.pathname
  });
  
  // Show loading state only during initial load
  if (isLoading) {
    console.log('ProtectedRoute: Still loading, showing loading state');
    return <LoadingState />;
  }
  
  // If there's no session, redirect to login
  if (!session) {
    console.log('ProtectedRoute: No session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If we have a session but no user data, still proceed
  // This helps when user data is slow to load but session is valid
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
