# Multi-stage build for React frontend
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files from frontend directory
COPY frontend/package*.json ./
RUN npm install --include=dev

# Copy source code from frontend directory
COPY frontend/ .

# Build the app with environment variables
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
