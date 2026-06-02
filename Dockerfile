# Use Node.js as the base image
FROM node:20-slim AS builder

# Set the working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies (backend)
RUN npm install

# Copy the rest of the application
COPY . .

# Add build arguments for Frontend (Vite needs these at build time)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_VAPID_KEY

# Set them as environment variables for the build
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_VAPID_KEY=$VITE_FIREBASE_VAPID_KEY

# Build the frontend
RUN npm run build

# Final Stage
FROM node:20-slim

WORKDIR /app

# Copy built assets and backend code from builder stage
COPY --from=builder /app /app

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables (can be overridden by docker-compose)
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "start"]
