
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
  
  // Enhanced debug logging
  useEffect(() => {
    console.log('ProtectedRoute mounted/updated:', { 
      isLoading, 
      hasUser: !!user, 
      hasSession: !!session, 
      allowedRoles, 
      currentPath: location.pathname,
      sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'none'
    });
    
    return () => {
      console.log('ProtectedRoute unmounting from path:', location.pathname);
    };
  }, [isLoading, user, session, allowedRoles, location.pathname]);
  
  // If still loading, show loading state
  if (isLoading) {
    console.log('ProtectedRoute: Still loading, showing loading state');
    return <LoadingState />;
  }
  
  // If not logged in, redirect to login
  if (!session) {
    console.log('ProtectedRoute: No session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check role-based access if roles are specified
  if (allowedRoles && allowedRoles.length > 0) {
    // If we don't have user data yet but have a session, use session data
    if (!user && session) {
      console.log('ProtectedRoute: Has session but no user data, redirecting to unauthorized');
      return <Navigate to="/unauthorized" replace />;
    }
    
    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(user?.role as UserRole)) {
      console.log('ProtectedRoute: User role not allowed, redirecting to unauthorized');
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // User is authorized - render the children
  console.log('ProtectedRoute: User is authorized, rendering children');
  return <>{children}</>;
}
