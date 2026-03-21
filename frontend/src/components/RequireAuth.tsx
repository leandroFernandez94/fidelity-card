import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
