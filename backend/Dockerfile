FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

COPY packages/shared packages/shared
COPY backend backend

ENV NODE_ENV=production
EXPOSE 3001

# exec deja a bun como PID 1 para que reciba SIGTERM del orquestador
CMD ["sh", "-c", "cd backend && bun run db:migrate && exec bun src/index.ts"]
