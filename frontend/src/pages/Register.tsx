import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import logoBlue from '../assets/logo-blue-bg.png';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, user, profile, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user && profile) {
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from || '/', { replace: true });
    }
  }, [authLoading, user, profile, location.state, navigate]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.nombre,
      formData.apellido,
      formData.telefono
    );
    
    if (error) {
      setError('Error al crear la cuenta. Intenta nuevamente.');
      setLoading(false);
      return;
    }

    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    navigate(from || '/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoBlue} alt="Calixta Lab" className="w-20 h-20 object-contain" />
          </div>
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="nombre"
                label="Nombre"
                placeholder="María"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
              <Input
                id="apellido"
                label="Apellido"
                placeholder="García"
                value={formData.apellido}
                onChange={handleChange}
                required
              />
            </div>
            <Input
              id="telefono"
              label="Teléfono"
              placeholder="11 1234 5678"
              value={formData.telefono}
              onChange={handleChange}
              required
            />
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              id="password"
              type="password"
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Crear Cuenta
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
