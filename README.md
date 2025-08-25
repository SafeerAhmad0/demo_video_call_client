# VerifyCall Application

A full-stack application for call verification with password reset functionality.

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Installation & Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd verifycall-app
   ```

2. **Environment Setup**

   ```bash
   # Copy environment variables
   cp .env.example .env

   # Edit .env file with your configurations
   # Important: Update EMAIL_USER, EMAIL_PASS, and JWT_SECRET
   ```

3. **Start the Application**

   ```bash
   # Development mode
   docker-compose up -d

   # Production mode
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

## 🏗️ Architecture

### Services

- **PostgreSQL**: Database service
- **Backend**: Python/Flask API
- **Frontend**: React/TypeScript application
- **Jitsi**: Video conferencing service
- **Nginx**: Reverse proxy (optional)

### Ports

- 3000: Frontend (React)
- 5000: Backend (API)
- 5432: PostgreSQL
- 80: Nginx (production)

## 📁 Project Structure

```
verifycall-app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── config/
│   │   └── migrations/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

## 🔧 Configuration

### Environment Variables

Copy the `.env.example` file to `.env` and update the values with your actual credentials:

```bash
cp .env.example .env
```

#### Database Configuration

- `DATABASE_URL`: PostgreSQL connection string
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password

#### JWT Settings

- `JWT_SECRET`: JWT secret key for authentication

#### Twilio Settings (for SMS functionality)

- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number

#### SMTP Settings (for email notifications)

- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `SMTP_USER`: SMTP user email
- `SMTP_PASSWORD`: SMTP user password
- `EMAIL_FROM`: Email sender address
- `EMAIL_TO`: Email recipient address

#### AWS Settings (for S3 storage)

- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_REGION`: AWS region
- `S3_BUCKET`: S3 bucket name

#### Jitsi Settings (for video conferencing)

- `JITSI_APP_ID`: Jitsi application ID
- `JITSI_APP_SECRET`: Jitsi application secret
- `JITSI_DOMAIN`: Jitsi domain

#### Server Settings

- `PORT`: Backend port (default: 5000)

## 🐳 Docker Commands

### Basic Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose up -d --build

# Scale services
docker-compose up -d --scale backend=2
```

### Database Commands

```bash
# Access database
docker exec -it verifycall-postgres psql -U verifycall_user -d verifycall_db

# Backup database
docker exec verifycall-postgres pg_dump -U verifycall_user verifycall_db > backup.sql

# Restore database
docker exec -i verifycall-postgres psql -U verifycall_user -d verifycall_db < backup.sql
```

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3000

   # Stop conflicting service or change ports in .env
   ```

2. **Database connection issues**

   ```bash
   # Check if database is ready
   docker-compose logs postgres

   # Wait for database to be ready
   docker-compose up -d --wait
   ```

3. **Permission issues**
   ```bash
   # Fix file permissions
   chmod +x backend/apply-migration.js
   ```

### Health Checks

- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:3000
- Database: Check logs for "ready to accept connections"

## 📦 Distribution

### Create Distribution Package

```bash
# Create zip package
zip -r verifycall-app.zip verifycall-app/ -x "*.git*" "node_modules/*" "*.env"

# Or create tar.gz
tar -czf verifycall-app.tar.gz verifycall-app/ --exclude=.git --exclude=node_modules --exclude=.env
```

### Send to Friend

1. Zip the entire project folder
2. Include this README
3. Share the .env.example file
4. Provide the zip file via:
   - Email
   - Cloud storage (Google Drive, Dropbox)
   - USB drive

## 🔄 Updates & Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose up -d --build

# Update database if needed
docker exec verifycall-backend npm run migrate
```

### Monitoring

```bash
# Check service status
docker-compose ps

# View resource usage
docker stats

# Check logs
docker-compose logs -f [service-name]
```

## 🆘 Support

If your friend encounters issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Ensure Docker and Docker Compose are installed
4. Check that ports are available
5. Review logs for specific error messages

## 📞 Contact

For questions or issues, please check the logs first:

```bash
docker-compose logs
```
