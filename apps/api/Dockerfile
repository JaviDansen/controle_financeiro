FROM node:24-alpine AS builder

WORKDIR /app

# Copia manifests do monorepo
COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Instala todas as dependências do workspace
RUN npm ci --workspace=packages/db --workspace=apps/api

# Copia o código-fonte
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Build do pacote compartilhado e depois da API
RUN npm run build --workspace=packages/db
RUN npm run build --workspace=apps/api

# ---- imagem final ----
FROM node:24-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=packages/db --workspace=apps/api --omit=dev

COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/apps/api/dist    ./apps/api/dist
COPY apps/api/src/services/mp-sample.csv  ./apps/api/dist/services/mp-sample.csv

ENV NODE_ENV=production
ENV PORT=3011

EXPOSE 3011

CMD ["node", "apps/api/dist/index.js"]
