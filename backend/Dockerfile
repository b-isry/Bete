# ---- Dependencies ----
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ---- Development (hot-reload; docker-compose target) ----
FROM deps AS dev

WORKDIR /app

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]

# ---- Build (TypeScript compile) ----
FROM deps AS build

WORKDIR /app

COPY . .
RUN npm run build
RUN npm ci --omit=dev

# ---- Production (deploy this stage only — never `dev`) ----
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

USER appuser

EXPOSE 4000

CMD ["node", "dist/server.js"]
