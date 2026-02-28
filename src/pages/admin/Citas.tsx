import { useState, useEffect } from 'react';
import { citasService } from '../../services/citas';
import { profilesService } from '../../services/profiles';
import type { Cita, Profile } from '../../types';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Calendar, Clock, User, Plus, Filter, CheckCircle, XCircle } from 'lucide-react';
import { formatearFecha, formatearHora, getEstadoCitaColor, esFechaPasada } from '../../utils';

type CitaEstado = Cita['estado'];

export default function AdminCitas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientas, setClientas] = useState<Profile[]>([]);
  const [filteredCitas, setFilteredCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<{ estado: CitaEstado | ''; fecha: string }>({ estado: '', fecha: '' });

  useEffect(() => {
    async function loadData() {
      try {
        const [citasData, clientasData] = await Promise.all([
          citasService.getAll(),
          profilesService.getByRol('clienta')
        ]);
        setCitas(citasData);
        setFilteredCitas(citasData);
        setClientas(clientasData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    let filtered = citas;

    if (filtro.estado) {
      filtered = filtered.filter((cita) => cita.estado === filtro.estado);
    }

    if (filtro.fecha) {
      filtered = filtered.filter(cita => 
        cita.fecha_hora.startsWith(filtro.fecha)
      );
    }

    setFilteredCitas(filtered);
  }, [filtro, citas]);

  function getClientaById(id: string) {
    return clientas.find(c => c.id === id);
  }

  function handleFiltroChange(key: 'estado' | 'fecha', value: string) {
    if (key === 'estado') {
      setFiltro((prev) => ({ ...prev, estado: (value || '') as CitaEstado | '' }));
      return;
    }

    setFiltro((prev) => ({ ...prev, fecha: value }));
  }

  function limpiarFiltros() {
    setFiltro({ estado: '', fecha: '' });
  }

  async function actualizarEstado(citaId: string, nuevoEstado: CitaEstado) {
    try {
      await citasService.update(citaId, { estado: nuevoEstado });
      const updated = citas.map((cita) => (cita.id === citaId ? { ...cita, estado: nuevoEstado } : cita));
      setCitas(updated);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const proximasCitas = filteredCitas.filter(c => !esFechaPasada(c.fecha_hora));
  const citasPasadas = filteredCitas.filter(c => esFechaPasada(c.fecha_hora));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Citas
            </h1>
            <p className="text-gray-600">
              Administra todas las citas del salón
            </p>
          </div>
          <Button>
            <Plus size={18} className="mr-2" />
            Nueva Cita
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Filter size={20} className="text-gray-400" />
              <div className="flex-1">
                <Select
                  id="estado"
                  options={[
                    { value: 'pendiente', label: 'Pendiente' },
                    { value: 'confirmada', label: 'Confirmada' },
                    { value: 'completada', label: 'Completada' },
                    { value: 'cancelada', label: 'Cancelada' }
                  ]}
                  value={filtro.estado}
                  onChange={(e) => handleFiltroChange('estado', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  id="fecha"
                  type="date"
                  placeholder="Filtrar por fecha"
                  value={filtro.fecha}
                  onChange={(e) => handleFiltroChange('fecha', e.target.value)}
                />
              </div>
              {(filtro.estado || filtro.fecha) && (
                <Button variant="outline" onClick={limpiarFiltros}>
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={24} className="text-primary" />
              Próximas Citas ({proximasCitas.length})
            </h2>

            {proximasCitas.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    {filtro.estado || filtro.fecha
                      ? 'No hay citas que coincidan con los filtros'
                      : 'No hay citas próximas'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {proximasCitas.map((cita) => {
                  const clienta = getClientaById(cita.clienta_id);
                  return (
                    <Card key={cita.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoCitaColor(cita.estado)}`}>
                                {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                              </span>
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

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User size={16} />
                              <span className="font-medium text-gray-900">
                                {clienta ? `${clienta.nombre} ${clienta.apellido}` : 'Clienta no encontrada'}
                              </span>
                            </div>

                            <div className="text-sm text-gray-500 mt-2">
                              {cita.servicio_ids.length} servicio{cita.servicio_ids.length > 1 ? 's' : ''}
                            </div>

                            {cita.notas && (
                              <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                {cita.notas}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            {cita.estado === 'pendiente' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => actualizarEstado(cita.id, 'confirmada')}
                                >
                                  <CheckCircle size={16} className="mr-2" />
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => actualizarEstado(cita.id, 'cancelada')}
                                >
                                  <XCircle size={16} className="mr-2" />
                                  Cancelar
                                </Button>
                              </>
                            )}
                            {cita.estado === 'confirmada' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => actualizarEstado(cita.id, 'completada')}
                              >
                                <CheckCircle size={16} className="mr-2" />
                                Completar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {citasPasadas.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle size={24} className="text-secondary" />
                Citas Pasadas ({citasPasadas.length})
              </h2>

              <Card>
                <CardContent>
                  <div className="space-y-3">
                    {citasPasadas.slice(0, 10).map((cita) => {
                      const clienta = getClientaById(cita.clienta_id);
                      return (
                        <div
                          key={cita.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {clienta ? `${clienta.nombre} ${clienta.apellido}` : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatearFecha(cita.fecha_hora)} - {formatearHora(cita.fecha_hora)}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoCitaColor(cita.estado)}`}>
                              {cita.estado}
                            </span>
                            <span className="font-bold text-primary">
                              +{cita.puntos_ganados} pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
