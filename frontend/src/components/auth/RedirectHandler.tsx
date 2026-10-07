import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const RedirectHandler = () => {
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Force refresh auth state if we have tokens but not authenticated
    if (!loading && !isAuthenticated) {
      const accessToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      
      if (accessToken && storedUser) {
        // Page will reload and re-initialize auth
        window.location.reload();
      }
    }
  }, [loading, isAuthenticated]);

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Get default route based on authenticated user
  const getDefaultRoute = () => {
    if (!isAuthenticated || !user) {
      // Check localStorage as fallback
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.role === 'ADMIN') return '/admin/dashboard';
          if (parsedUser.role === 'GARAGE_OWNER') return '/garage/dashboard';
          if (parsedUser.role === 'USER') return '/user/dashboard';
        } catch {
          // Invalid user data
          return '/';
        }
      }
      return '/';
    }

    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'GARAGE_OWNER') return '/garage/dashboard';
    if (user.role === 'USER') return '/user/dashboard';
    
    return '/';
  };

  return <Navigate to={getDefaultRoute()} replace />;
};

export default RedirectHandler;
