import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: Array<'USER' | 'GARAGE_OWNER' | 'ADMIN'>;
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/user/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'GARAGE_OWNER') {
      return <Navigate to="/garage/dashboard" replace />;
    }
    return <Navigate to="/user/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
