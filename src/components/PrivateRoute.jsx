import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const PrivateRoute = ({ children, roles = [], redirectTo = '/login' }) => {
  const { isAuthenticated, hasAnyRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    // Redirect to login with return URL
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has any of the required roles
  if (roles.length > 0 && !hasAnyRole(roles)) {
    // Redirect to unauthorized page or dashboard based on user role
    const userRole = hasAnyRole(['admin']) ? '/admin/dashboard' : 
                    hasAnyRole(['restaurant_owner']) ? '/owner/dashboard' :
                    hasAnyRole(['delivery_person']) ? '/delivery/dashboard' :
                    '/user/dashboard';
    return <Navigate to={userRole} replace />;
  }

  return children;
};

export const PublicRoute = ({ children, redirectTo = '/user/dashboard' }) => {
  const { isAuthenticated, hasAnyRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated()) {
    // Redirect authenticated users to appropriate dashboard
    const userRole = hasAnyRole(['admin']) ? '/admin/dashboard' : 
                    hasAnyRole(['restaurant_owner']) ? '/owner/dashboard' :
                    hasAnyRole(['delivery_person']) ? '/delivery/dashboard' :
                    redirectTo;
    return <Navigate to={userRole} replace />;
  }

  return children;
}; 