# Plan: Rediseño de Canje Total por Servicio

Este documento describe la arquitectura para migrar de un campo de puntos libre en la cita (`puntos_utilizados`) a un sistema robusto basado en ítems de servicios ("comprado" o "canjeado").

## 1. Cambios en Base de Datos

### Tabla `servicios`
- Agregar `puntos_precio` (integer, nullable). 
  - Si es `null`, el servicio no es canjeable por puntos.
  - Si tiene un valor, ese es el costo fijo para un "canje total".

### Nueva Tabla Intermedia `cita_servicios` (o `servicio_cita`)
- `id`: uuid primary key.
- `cita_id`: uuid (FK a `citas`).
- `servicio_id`: uuid (FK a `servicios`).
- `tipo`: enum `'comprado' | 'canjeado'`.
- `puntos_precio_snapshot`: integer (el valor de `servicios.puntos_precio` al momento de crear la cita).
- `created_at`: timestamp.
- **Constraint**: Unique `(cita_id, servicio_id)` para evitar duplicados.

### Tabla `citas` (Cache/Derivados)
- Mantener `puntos_ganados` y `puntos_utilizados` solo como **campos calculados de solo lectura (cache)**.
- **Deprecar** `servicio_ids` (array de UUIDs). La fuente de verdad pasará a ser la tabla intermedia.

---

## 2. Lógica de Dominio (`apps/api/src/domain/logic/`)

Crear `apps/api/src/domain/logic/citas.items.ts` con funciones puras y testeadas:

1.  **`validateCitaItems(items, serviciosMaster)`**:
    - Verificar que no haya servicios duplicados.
    - Si un ítem es `canjeado`, verificar que el servicio tenga `puntos_precio` definido.
2.  **`computeCitaTotals(items)`**:
    - Sumar `puntos_utilizados` (total de ítems canjeados).
    - Sumar `puntos_ganados` (solo de ítems comprados, asumiendo una regla global o por servicio).
3.  **Integración en `patchCitaAtomic`**:
    - Antes de completar, verificar que la clienta tenga saldo suficiente (`saldo >= puntos_utilizados`).
    - Si no tiene, lanzar error `409 insufficient_points`.

---

## 3. Cambios en API (Endpoints)

### `POST /api/citas`
- **Nuevo Payload**:
  ```json
  {
    "clienta_id": "...",
    "fecha_hora": "...",
    "items": [
      { "servicio_id": "...", "tipo": "comprado" },
      { "servicio_id": "...", "tipo": "canjeado" }
    ]
  }
  ```
- El BE debe ignorar cualquier campo de puntos manual. Debe calcularlos usando la lógica de dominio y los snapshots del maestro de servicios.

### `GET /api/citas`
- Seguir retornando `servicio_ids`, `puntos_ganados` y `puntos_utilizados` para compatibilidad, pero poblarlos desde la tabla intermedia.

---

## 4. Frontend (Admin)

### Modal de Citas
- En lugar de un input de "Puntos a utilizar", el admin selecciona servicios.
- Al lado de cada servicio seleccionado, un toggle o selector: **[ Comprado | Canjeado ]**.
- Si se marca como "Canjeado", el sistema debe validar visualmente que el servicio permita canje (tenga puntos_precio).
- Mostrar el total de puntos que se descontarán dinámicamente según la selección.

---

## 5. Estrategia de Migración

1.  **Schema**: Aplicar migración de `puntos_precio` y nueva tabla intermedia.
2.  **Backfill**: Script para leer `citas.servicio_ids` y `citas.puntos_utilizados` existentes y crear los registros en `cita_servicios`.
    - Si `puntos_utilizados > 0`, marcar el servicio (o uno de ellos) como `canjeado`.
3.  **Código**: Implementar lógica de dominio y tests.
4.  **API**: Actualizar handlers para soportar `items`.
5.  **UI**: Actualizar formulario admin.

---

## 6. Invariantes a Mantener
- Una cita puede tener mezcla de comprados y canjeados.
- Un servicio canjeado **no genera puntos** ganados.
- El canje es **siempre total** (por el servicio completo).
