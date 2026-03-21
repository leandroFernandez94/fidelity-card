import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { citasService } from '../services/citas';
import type { Cita } from '../types';
import { Card, CardContent } from '../components/Card';
import { formatearFecha, formatearHora, getEstadoCitaColor, esFechaPasada } from '../utils';
import { ApiError } from '../services/api';
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle, Clock as Pending } from 'lucide-react';

export default function MisCitas() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCitas() {
      if (authLoading) return;

      if (!user || !profile) {
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await citasService.getByClienta(profile.id);
        if (!active) return;
        setCitas(data);
      } catch (error) {
        if (!active) return;
        console.error('Error al cargar citas:', error);
        setError('No se pudieron cargar tus citas. Intenta nuevamente.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCitas();

    return () => {
      active = false;
    };
  }, [authLoading, user, profile, reloadKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Citas 📅</h1>
            <p className="text-gray-600">Gestiona tus citas y recordatorios</p>
          </div>

          <Card>
            <CardContent className="py-10 text-center">
              <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
              <p className="text-gray-900 font-medium">{error}</p>
              <button
                type="button"
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-light transition-colors"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Reintentar
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Citas 📅</h1>
            <p className="text-gray-600">Gestiona tus citas y recordatorios</p>
          </div>

          <Card>
            <CardContent className="py-10 text-center">
              <AlertCircle size={40} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-900 font-medium">Necesitas iniciar sesion para ver tus citas.</p>
              <button
                type="button"
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-light transition-colors"
                onClick={() => navigate('/login')}
              >
                Ir al login
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const proximasCitas = citas.filter(cita => !esFechaPasada(cita.fecha_hora));
  const citasPasadas = citas.filter(cita => esFechaPasada(cita.fecha_hora));

  async function actualizarEstado(citaId: string, nuevoEstado: Cita['estado']) {
    try {
      setUpdatingId(citaId);
      await citasService.update(citaId, { estado: nuevoEstado });
      await refreshProfile();
      setReloadKey((value) => value + 1);
    } catch (error) {
      console.error('Error al actualizar cita:', error);
      if (error instanceof ApiError) {
        const details = error.details;
        const code = typeof details === 'object' && details !== null
          ? (details as Record<string, unknown>).error
          : null;

        if (code === 'final_state') {
          setError('La cita ya esta finalizada y no se puede modificar.');
          return;
        }
        if (code === 'no_state_change') {
          setError('La cita ya esta en ese estado.');
          return;
        }
        if (code === 'forbidden_transition') {
          setError('No podes cambiar el estado desde la situacion actual.');
          return;
        }
      }

      setError('No se pudo actualizar la cita. Intenta nuevamente.');
    } finally {
      setUpdatingId((current) => (current === citaId ? null : current));
    }
  }

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

                          {cita.estado === 'pendiente' && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={updatingId === cita.id}
                                onClick={() => actualizarEstado(cita.id, 'confirmada')}
                                className="inline-flex items-center justify-center rounded-lg bg-secondary text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                              >
                                <CheckCircle size={16} className="mr-2" />
                                Confirmar
                              </button>
                              <button
                                type="button"
                                disabled={updatingId === cita.id}
                                onClick={() => actualizarEstado(cita.id, 'cancelada')}
                                className="inline-flex items-center justify-center rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                              >
                                <XCircle size={16} className="mr-2" />
                                Cancelar
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            +{cita.puntos_ganados}
                          </div>
                          <div className="text-xs text-gray-500">puntos ganados</div>
                          {cita.puntos_utilizados > 0 && (
                            <div className="mt-2 text-xl font-bold text-red-500">
                              -{cita.puntos_utilizados}
                              <div className="text-[10px] text-gray-500 uppercase tracking-tight font-normal">canjeados</div>
                            </div>
                          )}
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
