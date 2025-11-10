import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode;
}

export const SubscriptionProtectedRoute: React.FC<SubscriptionProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow admin access regardless of subscription
  if (user.role === 'admin') {
    return <>{children}</>;
  }

  // Check if user has active subscription
  if (!user.hasActiveSubscription) {
    return <Navigate to="/valores" replace />;
  }

  return <>{children}</>;
};
