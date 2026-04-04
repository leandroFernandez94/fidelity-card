import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profilesService } from '../../services/profiles';
import { serviciosService } from '../../services/servicios';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import type { Cita, Profile, Servicio } from '@fidelity-card/shared';

export type CitaFormData = {
  clienta_id: string;
  fecha_hora: string;
  items: { servicio_id: string; tipo: 'comprado' | 'canjeado' }[];
  notas: string;
};

interface CitaFormProps {
  initialData?: Cita | null;
  initialItems?: { servicio_id: string; tipo: 'comprado' | 'canjeado' }[];
  onSubmit: (data: CitaFormData) => Promise<void>;
  submitting: boolean;
  error: string | null;
}

function toDateTimeLocalValue(date: Date) {
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function getDefaultFechaHora() {
  const base = new Date();
  base.setMinutes(0, 0, 0);
  base.setHours(base.getHours() + 1);
  return toDateTimeLocalValue(base);
}

export default function CitaForm({ initialData, initialItems, onSubmit, submitting, error }: CitaFormProps) {
  const navigate = useNavigate();

  const [clientas, setClientas] = useState<Profile[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  const [clientaId, setClientaId] = useState(initialData?.clienta_id ?? '');
  const [fechaHora, setFechaHora] = useState(
    initialData?.fecha_hora ? toDateTimeLocalValue(new Date(initialData.fecha_hora)) : getDefaultFechaHora()
  );
  const [selectedServicios, setSelectedServicios] = useState<Map<string, 'comprado' | 'canjeado'>>(
    initialItems
      ? new Map(initialItems.map((it) => [it.servicio_id, it.tipo]))
      : new Map()
  );
  const [notas, setNotas] = useState(initialData?.notas ?? '');

  const isEditMode = !!initialData;

  useEffect(() => {
    async function loadData() {
      try {
        const [clientasData, serviciosData] = await Promise.all([
          profilesService.getByRol('clienta'),
          serviciosService.getAll()
        ]);
        setClientas(clientasData);
        setServicios(serviciosData);
      } catch (error) {
        console.error('Error al cargar datos del formulario:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function getClientaById(id: string) {
    return clientas.find((c) => c.id === id);
  }

  function toggleServicio(servicioId: string) {
    setSelectedServicios((prev) => {
      const next = new Map(prev);
      if (next.has(servicioId)) {
        next.delete(servicioId);
      } else {
        next.set(servicioId, 'comprado');
      }
      return next;
    });
  }

  function setItemTipo(servicioId: string, tipo: 'comprado' | 'canjeado') {
    setSelectedServicios((prev) => {
      const next = new Map(prev);
      next.set(servicioId, tipo);
      return next;
    });
  }

  const itemsArray = Array.from(selectedServicios.entries()).map(([servicio_id, tipo]) => ({
    servicio_id,
    tipo
  }));

  function getPuntosGanados() {
    return itemsArray.reduce((acc, it) => {
      if (it.tipo !== 'comprado') return acc;
      const servicio = servicios.find((s) => s.id === it.servicio_id);
      return acc + (servicio?.puntos_otorgados ?? 0);
    }, 0);
  }

  function getPuntosUtilizados() {
    return itemsArray.reduce((acc, it) => {
      if (it.tipo !== 'canjeado') return acc;
      const servicio = servicios.find((s) => s.id === it.servicio_id);
      return acc + (servicio?.puntos_requeridos ?? 0);
    }, 0);
  }

  function getPrecioTotal() {
    return itemsArray.reduce((acc, it) => {
      if (it.tipo !== 'comprado') return acc;
      const servicio = servicios.find((s) => s.id === it.servicio_id);
      return acc + (servicio?.precio ?? 0);
    }, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    await onSubmit({
      clienta_id: clientaId,
      fecha_hora: new Date(fechaHora).toISOString(),
      items: itemsArray,
      notas: notas.trim() ? notas.trim() : ''
    });
  }

  function handleCancel() {
    navigate('/admin/citas');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const clienta = getClientaById(clientaId);
  const puntosDisponibles = clienta?.puntos ?? 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Select
        id="clienta_id"
        label="Clienta"
        options={clientas.map((c) => ({
          value: c.id,
          label: `${c.nombre} ${c.apellido}`
        }))}
        value={clientaId}
        onChange={(e) => setClientaId(e.target.value)}
        required
      />

      <Input
        id="fecha_hora"
        type="datetime-local"
        label="Fecha y Hora"
        value={fechaHora}
        onChange={(e) => setFechaHora(e.target.value)}
        required
      />

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Resumen de la cita</label>
          <div className="text-xs text-gray-500">
            Puntos disponibles: <span className="font-semibold">{puntosDisponibles} pts</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Puntos a descontar (canjes):</span>
            <span data-testid="puntos-descontar" className="font-bold text-red-600">-{getPuntosUtilizados()} pts</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Puntos a ganar (compras):</span>
            <span data-testid="puntos-ganar" className="font-bold text-primary">+{getPuntosGanados()} pts</span>
          </div>
          <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200">
            <span className="font-medium text-gray-900">Total a pagar:</span>
            <span data-testid="precio-total" className="font-bold text-gray-900">${getPrecioTotal()}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500 italic">
          Los puntos se actualizarán en la cuenta de la clienta al completar la cita.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Servicios</label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="servicios-list-container" data-testid="servicios-list">
          {servicios.map((servicio) => {
            const tipo = selectedServicios.get(servicio.id);
            const checked = !!tipo;

            return (
              <div
                key={servicio.id}
                data-testid={`servicio-item-${servicio.nombre}`}
                className={
                  'flex flex-col gap-2 rounded-lg border p-3 transition-colors ' +
                  (checked
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:bg-gray-50')
                }
              >
                <div className="flex items-center gap-3">
                  <input
                    id={`check-${servicio.id}`}
                    data-testid={`check-${servicio.nombre}`}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleServicio(servicio.id)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label
                    htmlFor={`check-${servicio.id}`}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-gray-900 truncate" data-testid="servicio-nombre">
                        {servicio.nombre}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 shrink-0">
                        ${servicio.precio}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {servicio.puntos_otorgados} pts otorgados
                      {servicio.puntos_requeridos && ` | ${servicio.puntos_requeridos} pts req`}
                    </div>
                  </label>
                </div>

                {checked && tipo && (
                  <div className="flex gap-2 ml-7 mt-1">
                    <button
                      type="button"
                      data-testid="btn-comprado"
                      onClick={() => setItemTipo(servicio.id, 'comprado')}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        tipo === 'comprado'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Compra
                    </button>
                    {servicio.puntos_requeridos ? (
                      <button
                        type="button"
                        data-testid="btn-canjeado"
                        onClick={() => setItemTipo(servicio.id, 'canjeado')}
                        disabled={!clientaId || puntosDisponibles < (servicio.puntos_requeridos ?? 0)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          tipo === 'canjeado'
                            ? 'bg-accent text-white border-accent'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                        title={!clientaId ? 'Selecciona una clienta primero' : puntosDisponibles < (servicio.puntos_requeridos ?? 0) ? 'Puntos insuficientes' : ''}
                      >
                        Canje
                      </button>
                    ) : (
                      <span data-testid="no-canjeable" className="text-[10px] text-gray-400 self-center">No canjeable</span>
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
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ej: traer diseño de referencia..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {isEditMode ? 'Guardar Cambios' : 'Crear Cita'}
        </Button>
      </div>
    </form>
  );
}
