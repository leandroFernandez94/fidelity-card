FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

COPY packages/shared packages/shared
COPY frontend frontend

RUN cd frontend && bun run build

FROM nginx:1.27-alpine

ENV PORT=80
ENV API_UPSTREAM=http://backend:3001

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
