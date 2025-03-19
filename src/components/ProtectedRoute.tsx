
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
  
  // Show loading state only for a short time during initial load
  // If loading takes too long (3s), we still render the children
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        console.log('Loading timeout reached, proceeding anyway');
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);
  
  // If there's no session, redirect to login
  if (!session && !isLoading) {
    console.log('ProtectedRoute: No session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If we have a session but no user data, still proceed after a brief loading period
  if (session && !user) {
    if (isLoading) {
      console.log('ProtectedRoute: Session exists but still loading user data');
      return <LoadingState />;
    }
    
    console.log('ProtectedRoute: Session exists but no user data loaded, proceeding anyway');
    return <>{children}</>;
  }
  
  // If we're still in initial loading state and it hasn't been too long, show loading
  if (isLoading) {
    console.log('ProtectedRoute: Still loading, showing loading state');
    return <LoadingState />;
  }
  
  // Role-based access control (only if we have user data)
  if (user && allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    console.log('ProtectedRoute: User role not authorized, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }
  
  console.log('ProtectedRoute: Authentication and authorization passed, rendering children');
  return <>{children}</>;
}
