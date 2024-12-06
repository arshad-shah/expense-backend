FROM node:18-alpine

# Add build arguments
ARG MONGO_USER
ARG MONGO_PASSWORD
ARG JWT_SECRET
ARG FRONTEND_URL

# Set environment variables
ENV MONGO_USER=$MONGO_USER
ENV MONGO_PASSWORD=$MONGO_PASSWORD
ENV JWT_SECRET=$JWT_SECRET
ENV FRONTEND_URL=$FRONTEND_URL

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Bundle app source
COPY . .

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:4000/health || exit 1

# Expose port
EXPOSE 4000

# Start command
CMD ["pnpm", "start"]