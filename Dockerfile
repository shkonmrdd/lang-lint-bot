FROM oven/bun:1.3 AS deps
WORKDIR /app

COPY bun.lock package.json ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3 AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY bun.lock package.json ./
COPY src ./src

CMD ["bun", "run", "start"]
