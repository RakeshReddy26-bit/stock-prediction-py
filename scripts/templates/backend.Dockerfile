FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build (if project uses TypeScript)
RUN if [ -f package.json ] && grep -q "build" package.json; then npm run build || true; fi

# Default command - adjust to your built artifact
# If your backend compiles to dist/server.js change the CMD accordingly
CMD ["node", "dist/server.js"]
