FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
RUN npm run build
# Also compile the seed script so it's available in production
RUN npx tsc prisma/seed.ts --outDir dist --esModuleInterop --resolveJsonModule --module commonjs --target es2020 --skipLibCheck || true

# ---- Production image ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/index.js"]
