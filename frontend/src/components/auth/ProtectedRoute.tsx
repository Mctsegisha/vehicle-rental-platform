import { Navigate, Outlet } from 'react-router-dom';
import { UserProfile } from '../../types';

interface ProtectedRouteProps {
  user: UserProfile | null;
}

export default function ProtectedRoute({ user }: ProtectedRouteProps) {
  // If user is not logged in, redirect to home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, render child routes (the Outlet)
  return <Outlet />;
}
