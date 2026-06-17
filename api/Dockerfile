FROM node:20-alpine
WORKDIR /app/api
COPY api/package.json api/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY shared /app/shared
COPY api/tsconfig.json api/src ./
RUN npm run build
RUN npx playwright install chromium --with-deps || npx playwright install chromium
ENV NODE_ENV=production
ENV ENABLE_BATCH_WORKER=true
ENV DATABASE_PATH=/data/app.db
RUN mkdir -p /data
EXPOSE 8080
CMD ["node", "dist/index.js"]
