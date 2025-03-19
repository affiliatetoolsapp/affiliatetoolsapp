
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
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // If there's no session, redirect to login
  if (!session && !isLoading) {
    console.log('ProtectedRoute: No session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If we're still in initial loading state and within timeout, show loading
  if (isLoading && showLoading) {
    console.log('ProtectedRoute: Still loading, showing loading state');
    return <LoadingState />;
  }
  
  // If we have a session but no user data, proceed anyway after loading timeout
  if (session && !user) {
    console.log('ProtectedRoute: Session exists but no user data yet, proceeding anyway');
    return <>{children}</>;
  }
  
  // Role-based access control (only if we have user data)
  if (user && allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    console.log('ProtectedRoute: User role not authorized, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }
  
  console.log('ProtectedRoute: Authentication and authorization passed, rendering children');
  return <>{children}</>;
}
