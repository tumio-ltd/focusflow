# apps/studio/Dockerfile
# Multi-stage build for FocusFlow Studio (Vite 8 SPA)

# --- Stage 1: Build Phase ---
FROM node:24-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# 拷贝 monorepo 配置文件与依赖声明
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/studio/package.json ./apps/studio/
COPY packages/ ./packages/

# 仅安装生产构建依赖
RUN pnpm install --frozen-lockfile

# 拷贝 Studio 前端源码并执行 Vite 8 生产编译
COPY apps/studio ./apps/studio
ENV NODE_ENV=production
RUN pnpm --filter @focusflow/studio build

# --- Stage 2: Nginx Alpine Static Serving ---
FROM nginx:1.27-alpine AS runner

# 拷贝自定义 Nginx 路由与安全头配置
COPY apps/studio/nginx.conf /etc/nginx/conf.d/default.conf

# 拷贝 Vite 8 构建产物至 Nginx 静态根目录
COPY --from=builder /app/apps/studio/dist /usr/share/nginx/html

# 创建非 root 运行账号并授权安全权限
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html

USER nginx
EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
