# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
COPY frontend/prisma ./prisma
RUN npm install
COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Stage 2: Final image ----
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL=sqlite:////data/flowbot.db \
    CORS_ALLOW_ORIGINS=http://localhost:3000 \
    INTEGRATIONS_SECRET=change-me-integrations-hmac

RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs npm supervisor && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /data

WORKDIR /app

# Backend
COPY backend/pyproject.toml ./
RUN pip install --upgrade pip && pip install .

COPY backend/app ./app

# Frontend
COPY --from=frontend-build /app/node_modules ./frontend/node_modules
COPY --from=frontend-build /app/.next ./frontend/.next
COPY --from=frontend-build /app/public ./frontend/public
COPY --from=frontend-build /app/package.json ./frontend/package.json
COPY --from=frontend-build /app/prisma ./frontend/prisma
COPY --from=frontend-build /app/next.config.mjs ./frontend/next.config.mjs
COPY --from=frontend-build /app/tsconfig.json ./frontend/tsconfig.json
COPY --from=frontend-build /app/postcss.config.js ./frontend/postcss.config.js
COPY --from=frontend-build /app/tailwind.config.ts ./frontend/tailwind.config.ts

# Prisma
RUN cd frontend && npx prisma generate

# Supervisord config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3000 8000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
