# VerifyCall - Docker Setup Guide

This guide will help you run the VerifyCall application using Docker on any machine.

## Prerequisites
- Docker and Docker Compose installed
- Git (optional, for cloning)
- 4GB+ RAM recommended

## Quick Start

### 1. Clone or Extract the Project
```bash
# If you have the zip file, extract it
unzip verifycall-app.zip
cd verifycall-app
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```bash
# Copy the example environment file
cp .env.example .env

# Or create manually
touch .env
```

### 3. Start the Application
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/docs

## Services Overview
- **Frontend**: React app on port 3000
- **Backend**: FastAPI on port 5000
- **Database**: PostgreSQL on port 5432
- **Nginx**: Reverse proxy on port 80

## Stopping the Application
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Troubleshooting

### Common Issues
1. **Port conflicts**: Change ports in `docker-compose.yml`
2. **Build failures**: Run `docker-compose build --no-cache`
3. **Database issues**: Check PostgreSQL logs

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs db
```

## Development Mode
For development with hot reload:
```bash
# Start in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Production Mode
For production deployment:
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

## Database Reset
```bash
# Reset database
docker-compose down -v
docker-compose up --build
