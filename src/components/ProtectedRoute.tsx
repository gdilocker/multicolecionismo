import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute:', {
    user: !!user,
    loading,
    pathname: location.pathname,
    adminOnly
  });

  if (loading) {
    console.log('ProtectedRoute: showing loader');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-blue-200">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: redirecting to login from', location.pathname);
    // Only save pathname, not full location to avoid serialization issues
    return <Navigate to="/login" state={{ from: { pathname: location.pathname } }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    console.log('ProtectedRoute: non-admin user, redirecting to dashboard');
    return <Navigate to="/panel/dashboard" replace />;
  }

  console.log('ProtectedRoute: rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;