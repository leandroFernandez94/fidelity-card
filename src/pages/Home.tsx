import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        return;
      }
      if (profile.rol === 'admin') {
        navigate('/admin');
      } else {
        navigate('/citas');
      }
    }
  }, [loading, user, profile, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bienvenida a Manicura Premium
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Sistema de fidelización para clientas
        </p>
        <div className="space-x-4">
          <a
            href="/login"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-light transition-colors"
          >
            Iniciar Sesión
          </a>
          <a
            href="/register"
            className="inline-block bg-white text-primary px-6 py-3 rounded-lg font-medium border-2 border-primary hover:bg-pink-50 transition-colors"
          >
            Crear Cuenta
          </a>
        </div>
      </div>
    </div>
  );
}
