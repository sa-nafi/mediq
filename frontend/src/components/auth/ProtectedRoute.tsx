import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated()) {
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    if (!allowedRoles.includes(user.role)) {
      // User is authenticated but doesn't have the right role
      if (user.role === 'patient') return <Navigate to="/patient" replace />;
      if (user.role === 'doctor') return <Navigate to="/doctor" replace />;
      if (user.role === 'receptionist') return <Navigate to="/receptionist" replace />;
      if (user.role === 'lab_tech') return <Navigate to="/lab-tech" replace />;
      if (user.role === 'admin') return <Navigate to="/admin" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
