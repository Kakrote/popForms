FROM node:20-alpine

WORKDIR /app
ENV DATABASE_URL="postgresql://postgres:root@localhost:5432/mydb?schema=public"
# ENV ADMIN_EMAIL=admin@example.com
# ENV ADMIN_PASSWORD=yourStrongPassword
# ENV ADMIN_USERNAME=admin
# ENV JWT_SECRET=yourSuperSecretKey
# ENV JWT_EXPIRES_IN=1h=value
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY tsconfig.json ./
COPY server.ts ./
COPY src ./src

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]