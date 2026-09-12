## Issue vinculada

Closes #N

<!-- Usa una palabra clave válida para vincular la issue y cerrarla automáticamente al mergear:
`Closes #123`, `Fixes #123` o `Resolves #123`. Reemplaza el #N de arriba. -->

## Tipo de cambio

Marca exactamente una opción y agrega el label correspondiente:

- [ ] Bug fix (`type:bug`)
- [ ] Nueva funcionalidad (`type:feature`)
- [ ] Documentación (`type:docs`)
- [ ] Refactor (`type:refactor`)
- [ ] Chore / mantenimiento (`type:chore`)
- [ ] Breaking change (`type:breaking-change`)

## Resumen

- Cambio principal en una línea
- Cambio secundario (opcional)
- Cambio secundario (opcional)

## Tabla de cambios

| Archivo | Cambio |
| ------- | ------ |
| `ruta/al/archivo.ts` | Descripción breve del cambio |

## Plan de pruebas

- [ ] Typecheck: `bunx tsc -b` (raíz) y `bun run typecheck` (backend)
- [ ] Tests de backend: `bun run test` (workdir `backend/`)
- [ ] Lint: `bun run lint`
- [ ] Verificación manual de la UI o endpoint afectado

## Checklist del contribuidor

- [ ] Hay una issue vinculada en la sección superior
- [ ] El PR tiene exactamente un label `type:*`
- [ ] El título del PR sigue conventional commits
- [ ] Los commits siguen conventional commits
- [ ] Sin Co-Authored-By ni atribución de IA en los commits
