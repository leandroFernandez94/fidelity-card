# Bun en este repo

Este repo usa Bun para correr la API (Elysia) y puede usar Bun para ejecutar scripts del root.

## Instalar Bun (sin sudo)

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version
```

Si tu shell no carga `~/.bashrc` (zsh, fish), agrega `~/.bun/bin` a tu `PATH` o ejecuta el `source` equivalente.

## Usar Bun en el proyecto

Instalar dependencias del root:

```bash
bun install
```

Scripts DB (Drizzle):

```bash
bun run db:generate
bun run db:migrate
bun run db:smoke
```

API:

```bash
bun run api:dev
```
