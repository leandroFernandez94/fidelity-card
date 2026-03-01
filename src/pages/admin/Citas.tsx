import { useState, useEffect } from 'react';
import { citasService } from '../../services/citas';
import { profilesService } from '../../services/profiles';
import { serviciosService } from '../../services/servicios';
import type { Cita, Profile, Servicio } from '../../types';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { ApiError } from '../../services/api';
import { Calendar, Clock, User, Plus, Filter, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatearFecha, formatearHora, getEstadoCitaColor, esFechaPasada } from '../../utils';

type CitaEstado = Cita['estado'];

export default function AdminCitas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientas, setClientas] = useState<Profile[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [filteredCitas, setFilteredCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<{ estado: CitaEstado | ''; fecha: string }>({ estado: '', fecha: '' });

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    clienta_id: string;
    fecha_hora: string;
    items: { servicio_id: string; tipo: 'comprado' | 'canjeado' }[];
    notas: string;
  }>({
    clienta_id: '',
    fecha_hora: '',
    items: [],
    notas: ''
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [citasData, clientasData, serviciosData] = await Promise.all([
          citasService.getAll(),
          profilesService.getByRol('clienta'),
          serviciosService.getAll()
        ]);
        setCitas(citasData);
        setFilteredCitas(citasData);
        setClientas(clientasData);
        setServicios(serviciosData);
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

  function toDateTimeLocalValue(date: Date) {
    const tzOffsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  }

  function openModal() {
    const base = new Date();
    base.setMinutes(0, 0, 0);
    base.setHours(base.getHours() + 1);

    setModalError(null);
    setFormData({
      clienta_id: '',
      fecha_hora: toDateTimeLocalValue(base),
      items: [],
      notas: ''
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSubmitting(false);
    setModalError(null);
  }

  function toggleServicio(servicioId: string) {
    setFormData((prev) => {
      const exists = prev.items.find((it) => it.servicio_id === servicioId);
      return {
        ...prev,
        items: exists
          ? prev.items.filter((it) => it.servicio_id !== servicioId)
          : [...prev.items, { servicio_id: servicioId, tipo: 'comprado' }]
      };
    });
  }

  function setItemTipo(servicioId: string, tipo: 'comprado' | 'canjeado') {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.servicio_id === servicioId ? { ...it, tipo } : it))
    }));
  }

  function getPuntosGanados(items: { servicio_id: string; tipo: 'comprado' | 'canjeado' }[]) {
    return items.reduce((acc, it) => {
      if (it.tipo !== 'comprado') return acc;
      const servicio = servicios.find((s) => s.id === it.servicio_id);
      return acc + (servicio?.puntos_otorgados ?? 0);
    }, 0);
  }

  function getPuntosUtilizados(items: { servicio_id: string; tipo: 'comprado' | 'canjeado' }[]) {
    return items.reduce((acc, it) => {
      if (it.tipo !== 'canjeado') return acc;
      const servicio = servicios.find((s) => s.id === it.servicio_id);
      return acc + (servicio?.puntos_requeridos ?? 0);
    }, 0);
  }

  async function handleCreateCita(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setModalError(null);

    try {
      if (!formData.clienta_id) {
        setModalError('Selecciona una clienta.');
        return;
      }
      if (formData.items.length === 0) {
        setModalError('Selecciona al menos un servicio.');
        return;
      }
      if (!formData.fecha_hora) {
        setModalError('Selecciona fecha y hora.');
        return;
      }

      const clienta = getClientaById(formData.clienta_id);
      const puntos_utilizados = getPuntosUtilizados(formData.items);

      if (puntos_utilizados > (clienta?.puntos ?? 0)) {
        setModalError('La clienta no tiene suficientes puntos para este canje.');
        return;
      }

      await citasService.create({
        clienta_id: formData.clienta_id,
        items: formData.items,
        fecha_hora: new Date(formData.fecha_hora).toISOString(),
        notas: formData.notas.trim() ? formData.notas.trim() : undefined
      });

      const citasData = await citasService.getAll();
      setCitas(citasData);
      closeModal();
    } catch (error) {
      console.error('Error al crear cita:', error);
      setModalError('No se pudo crear la cita. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  function resolvePatchErrorMessage(error: unknown) {
    if (!(error instanceof ApiError)) return 'No se pudo actualizar la cita. Intenta nuevamente.';

    const details = error.details;
    const code = typeof details === 'object' && details !== null
      ? (details as Record<string, unknown>).error
      : null;

    if (code === 'final_state') return 'La cita ya esta finalizada y no se puede modificar.';
    if (code === 'no_state_change') return 'La cita ya esta en ese estado.';
    if (code === 'forbidden_transition') return 'No se puede cambiar el estado desde la situacion actual.';
    if (code === 'conflict') return 'La cita se actualizo recientemente. Recarga e intenta de nuevo.';
    if (code === 'forbidden_notas') return 'No tienes permisos para editar notas.';
    if (code === 'unauthorized') return 'Necesitas iniciar sesion para continuar.';

    return error.message || 'No se pudo actualizar la cita. Intenta nuevamente.';
  }

  async function actualizarEstado(citaId: string, nuevoEstado: CitaEstado) {
    try {
      setUpdatingId(citaId);
      setUpdateError(null);
      const updatedCita = await citasService.update(citaId, { estado: nuevoEstado });
      setCitas((prev) => prev.map((cita) => (cita.id === citaId ? updatedCita : cita)));
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      setUpdateError(resolvePatchErrorMessage(error));
    } finally {
      setUpdatingId((current) => (current === citaId ? null : current));
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
          <Button onClick={openModal}>
            <Plus size={18} className="mr-2" />
            Nueva Cita
          </Button>
        </div>

        {updateError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {updateError}
          </div>
        )}

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
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <AlertCircle size={14} className="text-yellow-600" />
                                Esperando confirmación de la clienta
                              </div>
                            )}

                            {(cita.estado === 'pendiente' || cita.estado === 'confirmada') && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => actualizarEstado(cita.id, 'completada')}
                                disabled={updatingId === cita.id}
                              >
                                <CheckCircle size={16} className="mr-2" />
                                Completar
                              </Button>
                            )}

                            {(cita.estado === 'pendiente' || cita.estado === 'confirmada') && (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => actualizarEstado(cita.id, 'cancelada')}
                                disabled={updatingId === cita.id}
                              >
                                <XCircle size={16} className="mr-2" />
                                Cancelar
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
                            {cita.puntos_utilizados > 0 && (
                              <span className="font-bold text-red-500">
                                -{cita.puntos_utilizados} pts
                              </span>
                            )}
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

        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Nueva Cita</h2>
                    <p className="text-sm text-gray-500">Crea una cita para una clienta</p>
                  </div>
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Cerrar
                  </Button>
                </div>

                <form onSubmit={handleCreateCita} className="space-y-4">
                  {modalError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {modalError}
                    </div>
                  )}

                  <Select
                    id="clienta_id"
                    label="Clienta"
                    options={clientas.map((c) => ({
                      value: c.id,
                      label: `${c.nombre} ${c.apellido}`
                    }))}
                    value={formData.clienta_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, clienta_id: e.target.value }))}
                    required
                  />

                  <Input
                    id="fecha_hora"
                    type="datetime-local"
                    label="Fecha y Hora"
                    value={formData.fecha_hora}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fecha_hora: e.target.value }))}
                    required
                  />

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Resumen de puntos</label>
                      <div className="text-xs text-gray-500">
                        Disponibles: <span className="font-semibold">{formData.clienta_id ? getClientaById(formData.clienta_id)?.puntos ?? 0 : 0} pts</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Puntos a descontar (canjes):</span>
                      <span className="font-bold text-red-600">-{getPuntosUtilizados(formData.items)} pts</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Puntos a ganar (compras):</span>
                      <span className="font-bold text-primary">+{getPuntosGanados(formData.items)} pts</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 italic">
                      Los puntos se actualizarán en la cuenta de la clienta al completar la cita.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Servicios</label>
                    </div>
                    <div className="space-y-2">
                      {servicios.map((servicio) => {
                        const item = formData.items.find(it => it.servicio_id === servicio.id);
                        const checked = !!item;
                        
                        return (
                          <div
                            key={servicio.id}
                            className={
                              'flex flex-col gap-2 rounded-lg border p-3 transition-colors ' +
                              (checked
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:bg-gray-50')
                            }
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleServicio(servicio.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{servicio.nombre}</div>
                                <div className="text-xs text-gray-500">
                                  {servicio.puntos_otorgados} pts otorgados
                                  {servicio.puntos_requeridos && ` | ${servicio.puntos_requeridos} pts para canje`}
                                </div>
                              </div>
                            </div>
                            
                            {checked && (
                              <div className="flex gap-2 ml-7 mt-1">
                                <button
                                  type="button"
                                  onClick={() => setItemTipo(servicio.id, 'comprado')}
                                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                    item.tipo === 'comprado'
                                      ? 'bg-primary text-white border-primary'
                                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  Comprado
                                </button>
                                {servicio.puntos_requeridos ? (
                                  <button
                                    type="button"
                                    onClick={() => setItemTipo(servicio.id, 'canjeado')}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                      item.tipo === 'canjeado'
                                        ? 'bg-accent text-white border-accent'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                  >
                                    Canjeado ({servicio.puntos_requeridos} pts)
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-gray-400 self-center">No canjeable</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {servicios.length === 0 && (
                      <div className="text-sm text-gray-500">No hay servicios cargados.</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                    <textarea
                      id="notas"
                      rows={3}
                      value={formData.notas}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notas: e.target.value }))}
                      placeholder="Ej: traer diseño de referencia..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
                      Cancelar
                    </Button>
                    <Button type="submit" loading={submitting}>
                      Crear Cita
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
