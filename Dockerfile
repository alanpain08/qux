# Базовая стадия с манифестами
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./

# Зависимости для прод
FROM base AS deps-prod
RUN npm ci --omit=dev

# Зависимости для дев
FROM base AS deps-dev
RUN npm ci

# Финальный прод-раннер
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps-prod /app/node_modules ./node_modules
COPY ./src ./src
COPY package.json ./
CMD ["node", "src/bot.js"]

# Дев-раннер с nodemon (будет выбран как build target в dev-compose)
FROM node:20-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "dev"]
