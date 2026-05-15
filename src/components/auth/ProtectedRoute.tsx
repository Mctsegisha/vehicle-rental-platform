import { Navigate, Outlet } from 'react-router-dom';
import { UserProfile, UserRole } from '../../types';

interface ProtectedRouteProps {
  user: UserProfile | null;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  user, 
  allowedRoles, 
  redirectTo = '/' 
}: ProtectedRouteProps) {
  // If not logged in, redirect to login (or home)
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // If role is not allowed, redirect to home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // If everything is fine, render the children
  return <Outlet />;
}
