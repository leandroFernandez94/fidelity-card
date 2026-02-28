import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { referidosService } from '../services/referidos';
import type { Referido } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UserPlus, Gift, Users, CheckCircle } from 'lucide-react';

export default function Referidos() {
  const { profile } = useAuth();
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    nombre: ''
  });
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [puntosPorReferido] = useState(20);

  useEffect(() => {
    async function loadReferidos() {
      if (!profile) return;
      
      try {
        const data = await referidosService.getByReferente(profile.id);
        setReferidos(data);
      } catch (error) {
        console.error('Error al cargar referidos:', error);
      } finally {
        setLoading(false);
      }
    }
    loadReferidos();
  }, [profile]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMensaje({
        tipo: 'exito',
        texto: '¡Invitación enviada! Cuando tu amiga se registre, recibirás tus puntos.'
      });
      setFormData({ email: '', nombre: '' });
      
      setTimeout(() => setMensaje(null), 5000);
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: 'Error al enviar la invitación. Intenta nuevamente.'
      });
    } finally {
      setEnviando(false);
    }
  }

  function copiarEnlaceReferido() {
    const enlace = `https://tu-app.com/register?ref=${profile?.id}`;
    navigator.clipboard.writeText(enlace);
    setMensaje({
      tipo: 'exito',
      texto: '¡Enlace copiado al portapapeles!'
    });
    setTimeout(() => setMensaje(null), 3000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const puntosGanadosPorReferidos = referidos.reduce((total, ref) => total + ref.puntos_ganados, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Referir Amigas 🎁
          </h1>
          <p className="text-gray-600">
            Gana puntos por cada amiga que se registre con tu invitación
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <span className="text-gray-600 font-medium">Total Referidos</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {referidos.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Gift className="w-6 h-6 text-accent" />
                </div>
                <span className="text-gray-600 font-medium">Puntos Ganados</span>
              </div>
              <div className="text-3xl font-bold text-primary">
                {puntosGanadosPorReferidos}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-secondary" />
                </div>
                <span className="text-gray-600 font-medium">Puntos/Referido</span>
              </div>
              <div className="text-3xl font-bold text-accent">
                +{puntosPorReferido}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus size={24} className="text-primary" />
                Invitar Nueva Amiga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="nombre"
                  label="Nombre de tu amiga"
                  placeholder="María"
                  value={formData.nombre}
                  onChange={handleChange}
                />
                <Input
                  id="email"
                  type="email"
                  label="Email de tu amiga"
                  placeholder="maria@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="submit"
                  loading={enviando}
                  className="w-full"
                >
                  <UserPlus size={18} className="mr-2" />
                  Enviar Invitación
                </Button>
              </form>

              {mensaje && (
                <div
                  className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                    mensaje.tipo === 'exito'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {mensaje.tipo === 'exito' ? (
                    <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                  ) : null}
                  <p className="text-sm">{mensaje.texto}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift size={24} className="text-accent" />
                Compartir Enlace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Comparte este enlace con tus amigas. Cuando se registren, automáticamente recibirás tus puntos.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                <code className="text-sm text-primary break-all">
                  https://tu-app.com/register?ref={profile?.id}
                </code>
              </div>

              <Button onClick={copiarEnlaceReferido} className="w-full">
                <Gift size={18} className="mr-2" />
                Copiar Enlace
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Mis Referidos</CardTitle>
            </CardHeader>
            <CardContent>
              {referidos.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    Aún no has referido a ninguna amiga
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    ¡Invita a tus amigas y empieza a ganar puntos!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referidos.map((referido) => (
                    <div
                      key={referido.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          Referida #{referido.id.slice(0, 8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(referido.fecha).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">
                          +{referido.puntos_ganados} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
