export type CitaItemInput = {
  servicio_id: string;
  tipo: 'comprado' | 'canjeado';
};

export type ServicioMaster = {
  id: string;
  puntos_requeridos: number | null;
  puntos_otorgados: number;
};

export type CitaTotals = {
  puntos_ganados: number;
  puntos_utilizados: number;
};

/**
 * Valida que los items de la cita sean correctos según el maestro de servicios.
 * - No duplicados.
 * - Si es canjeado, el servicio debe tener puntos_requeridos definido.
 */
export function validateCitaItems(items: CitaItemInput[], serviciosMaster: ServicioMaster[]) {
  const seenIds = new Set<string>();
  
  for (const item of items) {
    if (seenIds.has(item.servicio_id)) {
      throw new Error(`Servicio duplicado: ${item.servicio_id}`);
    }
    seenIds.add(item.servicio_id);

    const servicio = serviciosMaster.find(s => s.id === item.servicio_id);
    if (!servicio) {
      throw new Error(`Servicio no encontrado: ${item.servicio_id}`);
    }

    if (item.tipo === 'canjeado' && (servicio.puntos_requeridos === null || servicio.puntos_requeridos === undefined)) {
      throw new Error(`El servicio ${item.servicio_id} no es canjeable por puntos`);
    }
  }
}

/**
 * Calcula los totales de puntos ganados y utilizados.
 * - Puntos ganados: suma de puntos_otorgados de servicios 'comprado'.
 * - Puntos utilizados: suma de puntos_requeridos de servicios 'canjeado'.
 */
export function computeCitaTotals(items: CitaItemInput[], serviciosMaster: ServicioMaster[]): CitaTotals {
  let puntos_ganados = 0;
  let puntos_utilizados = 0;

  for (const item of items) {
    const servicio = serviciosMaster.find(s => s.id === item.servicio_id);
    if (!servicio) continue;

    if (item.tipo === 'comprado') {
      puntos_ganados += servicio.puntos_otorgados;
    } else {
      puntos_utilizados += servicio.puntos_requeridos ?? 0;
    }
  }

  return { puntos_ganados, puntos_utilizados };
}
