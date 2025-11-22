import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { getAuthToken } from '../services/api';
import socketService from '../services/socketService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useTypedSelector((state) => state.auth);
  const location = useLocation();
  const token = getAuthToken();

  // Connect to socket when authenticated
  useEffect(() => {
    if (isAuthenticated && user && !socketService.isConnected()) {
      socketService.connect(user.id);
    }

    return () => {
      // Don't disconnect on unmount, keep socket alive
    };
  }, [isAuthenticated, user]);

  // Check both Redux state and token existence
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based route protection
  const isWarehouseStaff = user?.role === 'warehouse_staff';
  const isManager = user?.role === 'inventory_manager';
  
  // Manager only routes (staff cannot access)
  const managerOnlyRoutes = [
    '/app/settings',
    '/app/staff-management'
  ];

  if (isWarehouseStaff && managerOnlyRoutes.includes(location.pathname)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
};