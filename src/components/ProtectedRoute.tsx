
import React, { useState } from 'react';
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
  
  // Debug logging
  console.log('ProtectedRoute:', { 
    isLoading, 
    hasUser: !!user, 
    hasSession: !!session,
    allowedRoles,
    currentPath: location.pathname
  });
  
  // If we're still loading, show loading state
  if (isLoading) {
    console.log('ProtectedRoute: Loading state active');
    return <LoadingState />;
  }
  
  // If not loading and no session, redirect to login
  if (!session) {
    console.log('ProtectedRoute: No session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check role-based access if roles are specified and we have user data
  if (user && allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    console.log('ProtectedRoute: User role not authorized, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }
  
  // User is authorized - render the children
  console.log('ProtectedRoute: Authentication and authorization passed, rendering children');
  return <>{children}</>;
}
