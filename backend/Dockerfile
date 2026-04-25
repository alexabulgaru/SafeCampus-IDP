FROM node:22.12.0-slim

ARG BACKEND_PORT=3001
ENV PORT=${BACKEND_PORT}

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .

RUN npx prisma generate
RUN npm run build

COPY entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
