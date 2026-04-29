FROM node:24-alpine AS build

RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma
COPY apps/api/scripts apps/api/scripts

RUN npm ci
RUN npm run prisma:generate

COPY apps/api/tsconfig.json apps/api/tsconfig.json
COPY apps/api/src apps/api/src

RUN npm run api:build
RUN npm prune --omit=dev

FROM node:24-alpine AS runtime

RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=4000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

EXPOSE 4000

CMD ["node", "apps/api/dist/server.js"]
