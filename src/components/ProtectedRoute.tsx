
import React, { useEffect, useState } from 'react';
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
  const [showLoading, setShowLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Debug logging
  console.log('ProtectedRoute:', { 
    isLoading, 
    hasUser: !!user, 
    hasSession: !!session,
    allowedRoles,
    currentPath: location.pathname
  });
  
  // Show loading state only for a short time during initial load
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowLoading(false);
      console.log('Loading timeout reached, proceeding anyway');
    }, 1500); // Reduced from 2000ms to 1500ms
    
    const maxWaitTimeoutId = setTimeout(() => {
      setLoadingTimeout(true);
      console.log('Maximum wait time reached, forcing proceed');
    }, 3000); // Hard limit of 3 seconds
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(maxWaitTimeoutId);
    };
  }, []);
  
  // Handle no session case
  if (!isLoading && !session) {
    console.log('ProtectedRoute: No session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If we're still in initial loading state and within timeout, show loading
  if (isLoading && showLoading && !loadingTimeout) {
    console.log('ProtectedRoute: Still loading, showing loading state');
    return <LoadingState />;
  }
  
  // Check role-based access if we have user data
  if (user && allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    console.log('ProtectedRoute: User role not authorized, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Either the user is authorized or we've hit a timeout
  console.log('ProtectedRoute: Authentication and authorization passed, rendering children');
  return <>{children}</>;
}
