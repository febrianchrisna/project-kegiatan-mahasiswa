FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port (Cloud Run will set PORT environment variable)
EXPOSE 5000

# Use node directly instead of npm start for better signal handling
CMD ["node", "index.js"]