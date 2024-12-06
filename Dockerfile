FROM node:18-alpine

# Define build arguments
ARG MONGO_USER
ARG MONGO_PASSWORD
ARG JWT_SECRET
ARG FRONTEND_URL

# Set as environment variables
ENV NODE_ENV=production
ENV MONGO_USER=$MONGO_USER
ENV MONGO_PASSWORD=$MONGO_PASSWORD
ENV JWT_SECRET=$JWT_SECRET
ENV FRONTEND_URL=$FRONTEND_URL

# Install pnpm
RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install

COPY . .

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:4000/health || exit 1

EXPOSE 4000

CMD ["pnpm", "start"]