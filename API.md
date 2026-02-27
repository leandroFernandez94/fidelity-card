# Fidelity Card - Documentación de Servicios

Este documento describe los servicios de API disponibles en la aplicación.

## 📋 Servicios Disponibles

### Profiles Service
`src/services/profiles.ts`

- `getAll()` - Obtiene todos los perfiles
- `getById(id)` - Obtiene un perfil por ID
- `update(id, updates)` - Actualiza un perfil
- `delete(id)` - Elimina un perfil
- `getByRol(rol)` - Obtiene perfiles por rol (admin/clienta)

### Servicios Service
`src/services/servicios.ts`

- `getAll()` - Obtiene todos los servicios
- `getById(id)` - Obtiene un servicio por ID
- `create(servicio)` - Crea un nuevo servicio
- `update(id, updates)` - Actualiza un servicio
- `delete(id)` - Elimina un servicio

### Citas Service
`src/services/citas.ts`

- `getAll()` - Obtiene todas las citas
- `getById(id)` - Obtiene una cita por ID
- `getByClienta(clientaId)` - Obtiene citas de una clienta
- `create(cita)` - Crea una nueva cita
- `update(id, updates)` - Actualiza una cita
- `delete(id)` - Elimina una cita
- `getProximas(fecha)` - Obtiene citas próximas a partir de una fecha
- `getPendientes()` - Obtiene citas pendientes y confirmadas

### Referidos Service
`src/services/referidos.ts`

- `getAll()` - Obtiene todos los referidos
- `getById(id)` - Obtiene un referido por ID
- `getByReferente(referenteId)` - Obtiene referidos de un referente
- `create(referido)` - Crea un nuevo referido

### Puntos Service
`src/services/puntos.ts`

- `sumarPuntos(profileId, cantidad)` - Suma puntos a un perfil
- `restarPuntos(profileId, cantidad)` - Resta puntos a un perfil
- `calcularPuntosCita(servicioIds)` - Calcula puntos según servicios
- `otorgarPuntosCita(cita)` - Otorga puntos al completar una cita
- `otorgarPuntosReferido(referenteId, referidaId, puntos)` - Otorga puntos por referido
- `getTopClientas(limite)` - Obtiene top clientas por puntos

## 🔐 Políticas de Seguridad (RLS)

### Perfiles
- **Read propia**: Cualquier usuario puede leer su propio perfil
- **Update propia**: Cualquier usuario puede actualizar su propio perfil
- **Read todas**: Solo admins pueden leer todos los perfiles
- **Update todas**: Solo admins pueden actualizar cualquier perfil

### Servicios
- **Read todas**: Público (cualquiera puede leer servicios)

### Citas
- **Read propias**: Clientas pueden leer sus propias citas
- **Read todas**: Solo admins pueden leer todas las citas
- **Insert**: Solo admins pueden crear citas
- **Update**: Solo admins pueden actualizar citas

### Referidos
- **Read propias**: Clientas pueden leer sus propios referidos
- **Read todas**: Solo admins pueden leer todos los referidos

### Premios
- **Read todas**: Público (cualquiera puede leer premios)

## 🎯 Estados de Cita

- `pendiente` - Cita creada pero no confirmada
- `confirmada` - Cita confirmada
- `completada` - Cita completada (puntos otorgados)
- `cancelada` - Cita cancelada

## 👥 Roles de Usuario

- `admin` - Acceso completo a todas las funcionalidades de administración
- `clienta` - Acceso limitado a sus propios datos

## 📊 Métricas del Dashboard

### Admin
- Total de clientas registradas
- Citas del día actual
- Citas pendientes
- Puntos totales otorgados
- Total de citas
- Próximas 5 citas
- Top 5 clientas por puntos

### Clienta
- Próximas citas
- Citas pasadas
- Puntos acumulados
- Total de referidos
- Puntos ganados por referidos
