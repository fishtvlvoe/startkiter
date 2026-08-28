FROM node:22-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
ARG NODE_OPTIONS=--max-old-space-size=4096
ENV NODE_OPTIONS="$NODE_OPTIONS"

RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends ca-certificates openssl \
	&& rm -rf /var/lib/apt/lists/* \
	&& npm install --global pnpm@11.20.0 turbo@2.10.10

FROM base AS builder

WORKDIR /app
COPY . .
RUN turbo prune @startkiter/marketing --docker

FROM base AS installer

WORKDIR /app
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ ./
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ ./
COPY turbo.json turbo.json
RUN DATABASE_URL=postgresql://localhost:5432/startkiter pnpm --filter @startkiter/database exec prisma generate --no-hints
RUN DATABASE_URL=postgresql://localhost:5432/startkiter pnpm turbo run build --filter=@startkiter/marketing...
RUN mkdir -p /app/apps/marketing/public
RUN set -eux; \
	helper_store_dir="$(find /app/node_modules/.pnpm -maxdepth 1 -type d -name '@swc+helpers@*' | head -n 1)"; \
	test -n "$helper_store_dir"; \
	helper_package_dir="/app/runtime-node-modules/.pnpm/$(basename "$helper_store_dir")/node_modules/@swc"; \
	mkdir -p "$helper_package_dir"; \
	cp -a "$helper_store_dir/node_modules/@swc/helpers" "$helper_package_dir/"

FROM base AS runner

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs \
	&& adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=installer --chown=nextjs:nodejs /app/apps/marketing/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/marketing/.next/static ./apps/marketing/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/marketing/public ./apps/marketing/public
COPY --from=installer --chown=nextjs:nodejs /app/runtime-node-modules/.pnpm ./node_modules/.pnpm

USER nextjs
EXPOSE 3000

CMD ["node", "apps/marketing/server.js"]
