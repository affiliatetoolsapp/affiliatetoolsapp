
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
  
  if (isLoading) {
    console.log('ProtectedRoute: Still loading, showing loading state');
    return <LoadingState />;
  }
  
  // Check for session first - this is more reliable than checking the user
  if (!session) {
    console.log('ProtectedRoute: No session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If we have a session but no user data (profile fetch might have failed)
  // We can still allow access but check roles from session claims if needed
  if (!user && allowedRoles) {
    // Extract role from session claims/user metadata as fallback
    const sessionRole = session.user.user_metadata?.role || 'affiliate';
    console.log('ProtectedRoute: No user data but session exists, using role from session:', sessionRole);
    
    if (!allowedRoles.includes(sessionRole as UserRole)) {
      console.log('ProtectedRoute: Role from session not authorized, redirecting to unauthorized');
      return <Navigate to="/unauthorized" replace />;
    }
  } else if (user && allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    // Normal role check if we have user data
    console.log('ProtectedRoute: User role not authorized, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }
  
  console.log('ProtectedRoute: Authentication and authorization passed, rendering children');
  return <>{children}</>;
}
