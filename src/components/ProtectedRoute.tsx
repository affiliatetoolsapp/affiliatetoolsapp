
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
  
  useEffect(() => {
    console.log('ProtectedRoute:', { 
      isLoading, 
      hasUser: !!user, 
      hasSession: !!session,
      allowedRoles,
      currentPath: location.pathname
    });
    
    // Set a timeout to avoid quick loading flickers
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3000); // Show loading for max 3 seconds to prevent infinite loading
    
    return () => clearTimeout(timer);
  }, [isLoading, user, session, allowedRoles, location]);
  
  // While loading and we haven't exceeded the timeout, show loading state
  if (isLoading && showLoading) {
    console.log('ProtectedRoute: Loading state shown');
    return <LoadingState />;
  }
  
  // If not loading and no session, redirect to login
  if (!isLoading && !session) {
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
