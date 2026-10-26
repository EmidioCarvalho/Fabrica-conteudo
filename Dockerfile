# ==============================================================================
# Multi-Stage Dockerfile para a Fábrica de Conteúdo (Full-Stack Production Ready)
# ==============================================================================

# STAGE 1: Build do Front-end (React + Vite + Tailwind CSS)
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# STAGE 2: Build do Back-end (Node.js + Express + TypeScript + Prisma)
FROM node:18-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# STAGE 3: Runner de Produção (Imagem Mínima e Segura)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Dependências nativas mínimas para OpenSSL (necessário para Prisma Engine)
RUN apk add --no-cache openssl

# Copia dependências de produção do servidor
COPY --from=backend-builder /app/server/package*.json ./server/
COPY --from=backend-builder /app/server/node_modules ./server/node_modules
COPY --from=backend-builder /app/server/dist ./server/dist
COPY --from=backend-builder /app/server/prisma ./server/prisma

# Copia build estático do front-end
COPY --from=frontend-builder /app/dist ./dist

# Diretório para armazenamento local de uploads
RUN mkdir -p /app/server/uploads && chown -R node:node /app

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

WORKDIR /app/server
CMD ["node", "dist/server.js"]
