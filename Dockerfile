# Imagem de produção do Xboxmania (Next.js + Payload). Compatível com Coolify.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=3072
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app ./
# Uploads de mídia: monte um volume persistente em /app/media
RUN mkdir -p /app/media && chown -R node:node /app
USER node
EXPOSE 3000
# Aplica migrações do banco e inicia o site
CMD ["sh", "-c", "npx payload migrate && npm start"]
