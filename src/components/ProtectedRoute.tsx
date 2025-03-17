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
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (!user) {
    // Not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    // Not authorized
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
}
