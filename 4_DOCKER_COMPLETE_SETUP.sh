#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# ROADY Complete Docker Setup
# One-command deployment of entire ROADY stack
# ═══════════════════════════════════════════════════════════════════════════

set -e

echo "🚀 ROADY Docker Setup"
echo "===================="
echo ""

# Create docker-compose.yml
cat > docker-compose.yml << 'DOCKER_COMPOSE'
version: '3.8'

services:
  # ═════════════════════════════════════════════════════════════════════════
  # PostgreSQL Database
  # ═════════════════════════════════════════════════════════════════════════
  postgres:
    image: postgres:15
    container_name: roady-postgres
    environment:
      POSTGRES_DB: roady
      POSTGRES_USER: roady_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-roady_secure_pass_2024}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U roady_user"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - roady-network

  # ═════════════════════════════════════════════════════════════════════════
  # Redis Cache
  # ═════════════════════════════════════════════════════════════════════════
  redis:
    image: redis:7-alpine
    container_name: roady-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - roady-network

  # ═════════════════════════════════════════════════════════════════════════
  # Backend API (FastAPI)
  # ═════════════════════════════════════════════════════════════════════════
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: roady-backend
    environment:
      - DATABASE_URL=postgresql://roady_user:${POSTGRES_PASSWORD:-roady_secure_pass_2024}@postgres:5432/roady
      - REDIS_URL=redis://redis:6379
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - /app/__pycache__
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    networks:
      - roady-network

  # ═════════════════════════════════════════════════════════════════════════
  # Worker (Celery)
  # ═════════════════════════════════════════════════════════════════════════
  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: roady-worker
    environment:
      - DATABASE_URL=postgresql://roady_user:${POSTGRES_PASSWORD:-roady_secure_pass_2024}@postgres:5432/roady
      - REDIS_URL=redis://redis:6379
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
    volumes:
      - ./backend:/app
    depends_on:
      - postgres
      - redis
    command: celery -A tasks worker --loglevel=info
    networks:
      - roady-network

  # ═════════════════════════════════════════════════════════════════════════
  # Frontend (React)
  # ═════════════════════════════════════════════════════════════════════════
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: roady-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    command: npm start
    networks:
      - roady-network

  # ═════════════════════════════════════════════════════════════════════════
  # Nginx (Reverse Proxy)
  # ═════════════════════════════════════════════════════════════════════════
  nginx:
    image: nginx:alpine
    container_name: roady-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    networks:
      - roady-network

volumes:
  postgres_data:
  redis_data:

networks:
  roady-network:
    driver: bridge

DOCKER_COMPOSE

# Create backend Dockerfile
mkdir -p backend
cat > backend/Dockerfile << 'BACKEND_DOCKERFILE'
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

BACKEND_DOCKERFILE

# Create backend requirements.txt
cat > backend/requirements.txt << 'REQUIREMENTS'
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.4
anthropic==0.7.0
openai==1.3.5
google-generativeai==0.3.1
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
alembic==1.12.1

REQUIREMENTS

# Create frontend Dockerfile
mkdir -p frontend
cat > frontend/Dockerfile << 'FRONTEND_DOCKERFILE'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application
COPY . .

# Expose port
EXPOSE 3000

CMD ["npm", "start"]

FRONTEND_DOCKERFILE

# Create nginx config
mkdir -p nginx
cat > nginx/nginx.conf << 'NGINX_CONF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}

NGINX_CONF

# Create .env file template
cat > .env.template << 'ENV_TEMPLATE'
# Database
POSTGRES_PASSWORD=roady_secure_pass_2024

# LLM API Keys
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_key_here

# Optional
COHERE_API_KEY=
DEEPSEEK_API_KEY=
MISTRAL_API_KEY=
PERPLEXITY_API_KEY=

ENV_TEMPLATE

# Create database init script
mkdir -p database
cat > database/init.sql << 'INIT_SQL'
-- ROADY Database Initialization
-- This file is automatically run when PostgreSQL container starts

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables (copy from ROADY_DATABASE_SQL_COMPLETE.sql)
-- For brevity, just creating users table here as example

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(200) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    monthly_budget_limit DECIMAL(10,2),
    current_month_spend DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default admin user
INSERT INTO users (user_id, email, full_name, password_hash, role)
VALUES (
    'admin_001',
    'admin@roady.ai',
    'Admin User',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7C8FyXP5gG',
    'admin'
);

INIT_SQL

# Create README
cat > DOCKER_README.md << 'README'
# ROADY Docker Setup

## Quick Start

1. Copy environment variables:
```bash
cp .env.template .env
# Edit .env and add your API keys
```

2. Start all services:
```bash
docker-compose up -d
```

3. Check status:
```bash
docker-compose ps
```

4. Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Services

- **PostgreSQL**: Database (port 5432)
- **Redis**: Cache (port 6379)
- **Backend**: FastAPI (port 8000)
- **Worker**: Celery workers
- **Frontend**: React (port 3000)
- **Nginx**: Reverse proxy (port 80)

## Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Run database migrations
docker-compose exec backend alembic upgrade head

# Access PostgreSQL
docker-compose exec postgres psql -U roady_user roady

# Access backend shell
docker-compose exec backend python
```

## Development

For development with hot-reload:
```bash
docker-compose up
```

This will show logs in real-time and auto-reload on code changes.

## Production

For production deployment:
1. Set strong passwords in .env
2. Configure SSL certificates in nginx/ssl/
3. Use production-ready database (managed PostgreSQL)
4. Set up monitoring and backups

README

echo ""
echo "✅ Docker setup complete!"
echo ""
echo "📁 Created files:"
echo "  - docker-compose.yml"
echo "  - backend/Dockerfile"
echo "  - backend/requirements.txt"
echo "  - frontend/Dockerfile"
echo "  - nginx/nginx.conf"
echo "  - database/init.sql"
echo "  - .env.template"
echo "  - DOCKER_README.md"
echo ""
echo "🚀 Next steps:"
echo "  1. cp .env.template .env"
echo "  2. Edit .env and add your API keys"
echo "  3. docker-compose up -d"
echo "  4. Visit http://localhost:3000"
echo ""

