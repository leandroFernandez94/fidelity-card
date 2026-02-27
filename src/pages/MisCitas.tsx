import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { citasService } from '../services/citas';
import type { Cita } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { formatearFecha, formatearHora, getEstadoCitaColor, esFechaPasada } from '../utils';
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle, Clock as Pending } from 'lucide-react';

export default function MisCitas() {
  const { profile } = useAuth();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCitas() {
      if (!profile) return;
      
      try {
        const data = await citasService.getByClienta(profile.id);
        setCitas(data);
      } catch (error) {
        console.error('Error al cargar citas:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCitas();
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const proximasCitas = citas.filter(cita => !esFechaPasada(cita.fecha_hora));
  const citasPasadas = citas.filter(cita => esFechaPasada(cita.fecha_hora));

  function getEstadoIcon(estado: string) {
    switch (estado) {
      case 'confirmada':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'completada':
        return <CheckCircle size={20} className="text-blue-600" />;
      case 'cancelada':
        return <XCircle size={20} className="text-red-600" />;
      default:
        return <Pending size={20} className="text-yellow-600" />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mis Citas 📅
          </h1>
          <p className="text-gray-600">
            Gestiona tus citas y recordatorios
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={24} className="text-primary" />
              Próximas Citas
              <span className="bg-primary text-white text-sm px-3 py-1 rounded-full">
                {proximasCitas.length}
              </span>
            </h2>

            {proximasCitas.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">
                    No tienes citas próximas
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Agenda tu próxima visita para verla aquí
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {proximasCitas.map((cita) => (
                  <Card key={cita.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoCitaColor(cita.estado)}`}>
                              {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                            </span>
                            {getEstadoIcon(cita.estado)}
                          </div>
                          
                          <div className="flex items-center gap-6 text-gray-600 mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar size={18} />
                              <span className="font-medium">
                                {formatearFecha(cita.fecha_hora)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={18} />
                              <span className="font-medium">
                                {formatearHora(cita.fecha_hora)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Servicios:</span>
                            <span className="font-medium text-gray-900">
                              {cita.servicio_ids.length} servicio{cita.servicio_ids.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          {cita.notas && (
                            <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {cita.notas}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            +{cita.puntos_ganados}
                          </div>
                          <div className="text-xs text-gray-500">puntos</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle size={24} className="text-secondary" />
              Citas Pasadas
              <span className="bg-secondary text-white text-sm px-3 py-1 rounded-full">
                {citasPasadas.length}
              </span>
            </h2>

            {citasPasadas.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">
                    No tienes citas pasadas registradas
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {citasPasadas.map((cita) => (
                  <div
                    key={cita.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatearFecha(cita.fecha_hora)} - {formatearHora(cita.fecha_hora)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                      </div>
                    </div>
                    <div className="text-primary font-semibold">
                      +{cita.puntos_ganados} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
