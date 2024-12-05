FROM node:18-alpine

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

# Expose port
EXPOSE 4000

# Start command
CMD ["pnpm", "start"]