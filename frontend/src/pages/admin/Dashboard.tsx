import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { citasService } from '../../services/citas';
import { profilesService } from '../../services/profiles';
import { puntosService } from '../../services/puntos';
import type { Cita } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Users, Calendar, Clock, CheckCircle } from 'lucide-react';
import { formatearFecha } from '../../utils';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    totalClientas: 0,
    totalCitas: 0,
    citasHoy: 0,
    citasPendientes: 0,
    topClientas: [] as Array<{ id: string; nombre: string; apellido: string; email: string; puntos: number }>
  });
  const [proximasCitas, setProximasCitas] = useState<Cita[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [clientas, citas, top] = await Promise.all([
          profilesService.getByRol('clienta'),
          citasService.getAll(),
          puntosService.getTopClientas(5)
        ]);

        const hoy = new Date().toISOString().split('T')[0];
        const citasDeHoy = citas.filter(cita =>
          cita.fecha_hora.startsWith(hoy)
        );
        const citasPendientes = citas.filter(cita =>
          ['pendiente', 'confirmada'].includes(cita.estado)
        );
        const proximas = citasPendientes.slice(0, 5);

        setEstadisticas({
          totalClientas: clientas.length,
          totalCitas: citas.length,
          citasHoy: citasDeHoy.length,
          citasPendientes: citasPendientes.length,
          topClientas: top
        });
        setProximasCitas(proximas);
      } catch (error) {
        console.error('Error al cargar dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Bienvenida, {profile?.nombre}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users size={24} className="text-primary" />}
            label="Total Clientas"
            value={estadisticas.totalClientas}
            color="primary"
          />
          <StatCard
            icon={<Calendar size={24} className="text-secondary" />}
            label="Citas Hoy"
            value={estadisticas.citasHoy}
            color="secondary"
          />
          <StatCard
            icon={<Clock size={24} className="text-accent" />}
            label="Citas Pendientes"
            value={estadisticas.citasPendientes}
            color="accent"
          />
          <StatCard
            icon={<CheckCircle size={24} className="text-blue-600" />}
            label="Total Citas"
            value={estadisticas.totalCitas}
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={24} className="text-primary" />
                Próximas Citas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proximasCitas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay citas pendientes
                </div>
              ) : (
                <div className="space-y-3">
                  {proximasCitas.map((cita) => (
                    <div
                      key={cita.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatearFecha(cita.fecha_hora)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          cita.estado === 'confirmada'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {cita.estado}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={24} className="text-accent" />
                Top Clientas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {estadisticas.topClientas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aún no hay clientas registradas
                </div>
              ) : (
                <div className="space-y-3">
                  {estadisticas.topClientas.map((clienta, index) => (
                    <div
                      key={clienta.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0
                              ? 'bg-yellow-400 text-yellow-900'
                              : index === 1
                              ? 'bg-gray-300 text-gray-700'
                              : index === 2
                              ? 'bg-amber-600 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {clienta.nombre} {clienta.apellido}
                          </div>
                          <div className="text-sm text-gray-500">{clienta.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{clienta.puntos} pts</div>
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

function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colors = {
    primary: 'bg-primary/10',
    secondary: 'bg-secondary/10',
    accent: 'bg-accent/10',
    blue: 'bg-blue-100'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={colors[color as keyof typeof colors] + ' p-3 rounded-lg'}>
            {icon}
          </div>
          <span className="text-gray-600 font-medium text-sm">{label}</span>
        </div>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
      </CardContent>
    </Card>
  );
}
