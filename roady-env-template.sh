# ============================================
# ROADY CONSTRUCTION - CONFIGURATION
# ============================================
# Copier ce fichier vers .env et configurer les valeurs
# cp .env.template .env

# ============================================
# ENVIRONNEMENT
# ============================================
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# ============================================
# APPLICATION
# ============================================
APP_NAME=ROADY Construction
APP_VERSION=1.0.0
APP_URL=http://localhost:3000
API_URL=http://localhost:8000

# ============================================
# BASE DE DONNÉES POSTGRESQL
# ============================================
DB_HOST=postgres
DB_PORT=5432
DB_NAME=roady
DB_USER=roady_user
DB_PASSWORD=CHANGE_ME_SECURE_PASSWORD

# URL complète (générée automatiquement)
DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# ============================================
# REDIS
# ============================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://${REDIS_HOST}:${REDIS_PORT}/0

# ============================================
# SÉCURITÉ / JWT
# ============================================
# Générer avec: openssl rand -hex 32
SECRET_KEY=CHANGE_ME_GENERATE_SECURE_KEY

JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# ============================================
# CORS
# ============================================
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000

# ============================================
# API LLM - INTELLIGENCE ARTIFICIELLE
# ============================================
# Claude API (Anthropic) - Principal
CLAUDE_API_KEY=sk-ant-api03-VOTRE_CLE_ICI

# OpenAI (Optionnel - Fallback)
OPENAI_API_KEY=sk-VOTRE_CLE_ICI

# Configuration LLM
DEFAULT_LLM_PROVIDER=claude
LLM_MAX_TOKENS=4096
LLM_TEMPERATURE=0.7

# ============================================
# FIREBASE - NOTIFICATIONS PUSH
# ============================================
FIREBASE_PROJECT_ID=roady-construction
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_CLIENT_ID=

# VAPID pour Web Push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# ============================================
# SERVICES EXTERNES (OPTIONNELS)
# ============================================

# Stripe - Paiements
STRIPE_API_KEY=sk_test_
STRIPE_WEBHOOK_SECRET=whsec_

# Twilio - SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# SendGrid - Emails
SENDGRID_API_KEY=SG.
SENDGRID_FROM_EMAIL=noreply@roady.construction

# AWS S3 - Stockage fichiers
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ca-central-1
AWS_S3_BUCKET=roady-uploads

# Google Maps - Géolocalisation
GOOGLE_MAPS_API_KEY=

# ============================================
# MONITORING
# ============================================
SENTRY_DSN=
GRAFANA_PASSWORD=admin

# ============================================
# CELERY - TÂCHES ASYNCHRONES
# ============================================
CELERY_BROKER_URL=redis://${REDIS_HOST}:${REDIS_PORT}/1
CELERY_RESULT_BACKEND=redis://${REDIS_HOST}:${REDIS_PORT}/2

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_LLM_PER_MINUTE=20

# ============================================
# UPLOADS
# ============================================
MAX_UPLOAD_SIZE_MB=50
ALLOWED_EXTENSIONS=pdf,doc,docx,xls,xlsx,png,jpg,jpeg,gif,dwg,rvt

# ============================================
# BACKUP
# ============================================
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
