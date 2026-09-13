import type { ReactNode } from 'react';
import type { Cita, CitaItem, Servicio } from '@fidelity-card/shared';
import { Calendar, Clock, Gift, Sparkles } from 'lucide-react';
import { formatearFecha, formatearHora, formatearPrecio, getEstadoCitaColor } from '../utils';

interface CitaDetalleViewProps {
  cita: Cita;
  servicios: Servicio[];
  actions?: ReactNode;
}

function getCitaItems(cita: Cita): CitaItem[] {
  if (cita.items && cita.items.length > 0) {
    return cita.items;
  }
  return cita.servicio_ids.map((servicioId) => ({
    servicio_id: servicioId,
    tipo: 'comprado' as const
  }));
}

function getHeaderTone(estado: Cita['estado']): string {
  switch (estado) {
    case 'cancelada':
      return 'bg-red-50 border-red-100';
    case 'completada':
      return 'bg-blue-50 border-blue-100';
    default:
      return 'bg-gray-50 border-gray-100';
  }
}

export default function CitaDetalleView({ cita, servicios, actions }: CitaDetalleViewProps) {
  const items = getCitaItems(cita);
  const total = items.reduce((acc, item) => {
    if (item.tipo !== 'comprado') return acc;
    const servicio = servicios.find((s) => s.id === item.servicio_id);
    return acc + (servicio?.precio ?? 0);
  }, 0);

  return (
    <div className="space-y-6" data-testid={`cita-detalle-${cita.id}`}>
      <div className={`rounded-lg border p-4 ${getHeaderTone(cita.estado)}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getEstadoCitaColor(cita.estado)}`}>
            {cita.estado}
          </span>
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span className="font-medium">{formatearFecha(cita.fecha_hora)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span className="font-medium">{formatearHora(cita.fecha_hora)}</span>
            </div>
          </div>
        </div>
        {cita.estado === 'cancelada' && (
          <p className="mt-3 text-sm text-red-600" data-testid="cita-cancelada-aviso">
            Esta cita fue cancelada.
          </p>
        )}
        {cita.estado === 'completada' && (
          <p className="mt-3 text-sm text-blue-600" data-testid="cita-completada-aviso">
            Cita completada. Los puntos ya fueron acreditados.
          </p>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Servicios</h3>
        <ul className="divide-y divide-gray-100">
          {items.map((item) => {
            const servicio = servicios.find((s) => s.id === item.servicio_id);
            return (
              <li key={item.servicio_id} className="flex items-center justify-between py-3 gap-4">
                <span className="text-gray-900">{servicio?.nombre ?? 'Servicio no encontrado'}</span>
                {item.tipo === 'canjeado' ? (
                  <span className="text-sm font-semibold text-accent shrink-0">
                    Canjeado · {servicio?.puntos_requeridos ?? 0} pts
                  </span>
                ) : (
                  <span className="font-semibold text-gray-900 shrink-0">
                    {formatearPrecio(servicio?.precio ?? 0)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between border-t-2 border-gray-200 pt-3 mt-1">
          <span className="font-medium text-gray-900">Total</span>
          <span className="font-bold text-gray-900" data-testid="precio-total">
            {formatearPrecio(total)}
          </span>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Puntos</h3>
        {(cita.puntos_utilizados > 0 || cita.puntos_ganados > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cita.puntos_utilizados > 0 && (
              <div className="bg-red-50 rounded-lg p-4" data-testid="puntos-canjeados">
                <div className="flex items-center gap-2 text-red-600 font-bold">
                  <Gift size={18} />
                  -{cita.puntos_utilizados} pts
                </div>
                <div className="text-xs text-gray-600 mt-1">Canjeados en esta cita (descuento)</div>
              </div>
            )}
            {cita.puntos_ganados > 0 && (
              <div className="bg-primary/10 rounded-lg p-4" data-testid="puntos-ganados">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Sparkles size={18} />
                  +{cita.puntos_ganados} pts
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {cita.estado === 'completada' ? 'Puntos otorgados' : 'Puntos a ganar'}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Sin movimientos de puntos.</p>
        )}
      </div>

      {cita.notas && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Notas</h3>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{cita.notas}</p>
        </div>
      )}

      {actions && (
        <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6">
          {actions}
        </div>
      )}
    </div>
  );
}
