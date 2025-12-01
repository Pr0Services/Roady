# ============================================================
# ROADY CONSTRUCTION - FICHIER .ENV TEMPLATE
# Copier ce fichier vers .env et remplir les valeurs
# ============================================================

# ============================================================
# 🔧 APPLICATION
# ============================================================
APP_NAME=ROADY
APP_ENV=development          # development | staging | production
APP_DEBUG=true               # true | false
APP_URL=http://localhost:3000
API_URL=http://localhost:8000
APP_SECRET_KEY=             # Générer avec: openssl rand -hex 32
APP_VERSION=1.0.0

# ============================================================
# 🗄️ BASE DE DONNÉES - PostgreSQL
# ============================================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=roady
DB_USER=roady_user
DB_PASSWORD=                 # Mot de passe fort requis
DB_SSL_MODE=prefer           # disable | prefer | require
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10

# Connection string complète (générée automatiquement si vide)
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# ============================================================
# 📦 REDIS - Cache & Sessions
# ============================================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=              # Mot de passe Redis
REDIS_DB=0
REDIS_SSL=false

REDIS_URL=redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}

# ============================================================
# 🔐 AUTHENTIFICATION - JWT
# ============================================================
JWT_SECRET=                  # Générer avec: openssl rand -hex 64
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# OAuth2 Providers (optionnel)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# ============================================================
# 🤖 LLM - Intelligence Artificielle
# ============================================================
# Anthropic (Claude)
ANTHROPIC_API_KEY=           # sk-ant-xxxxx

# OpenAI (GPT)
OPENAI_API_KEY=              # sk-xxxxx
OPENAI_ORG_ID=               # org-xxxxx (optionnel)

# Google (Gemini)
GOOGLE_AI_API_KEY=           # AIzaxxxxx

# Local (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3:70b

# LLM Router Settings
LLM_DEFAULT_PROVIDER=claude  # claude | gpt | gemini | ollama
LLM_DEFAULT_MODEL=claude-sonnet-4-5-20250514
LLM_MAX_RETRIES=3
LLM_TIMEOUT_SECONDS=120
LLM_MONTHLY_BUDGET_USD=500   # Limite de budget mensuel

# ============================================================
# 🔔 NOTIFICATIONS - Firebase
# ============================================================
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=        # Clé privée JSON encodée base64
FIREBASE_CLIENT_EMAIL=
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json

# ============================================================
# 📧 EMAIL - SMTP
# ============================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=               # App password pour Gmail
SMTP_FROM_NAME=ROADY Construction
SMTP_FROM_EMAIL=noreply@roady.construction
SMTP_TLS=true

# SendGrid (alternative)
SENDGRID_API_KEY=

# ============================================================
# 📱 SMS - Twilio
# ============================================================
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=         # +1xxxxxxxxxx

# ============================================================
# ☁️ STOCKAGE - AWS S3 / Google Cloud Storage
# ============================================================
# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=roady-files
AWS_S3_ENDPOINT=             # Pour MinIO local (optionnel)

# Google Cloud Storage (alternative)
GCS_BUCKET=roady-files
GCS_PROJECT_ID=
GCS_CREDENTIALS_PATH=./gcs-service-account.json

# Local Storage (développement)
LOCAL_STORAGE_PATH=./uploads
MAX_UPLOAD_SIZE_MB=50

# ============================================================
# 📍 GÉOLOCALISATION
# ============================================================
GOOGLE_MAPS_API_KEY=
MAPBOX_ACCESS_TOKEN=

# ============================================================
# 📊 MONITORING & LOGGING
# ============================================================
# Logging
LOG_LEVEL=INFO               # DEBUG | INFO | WARNING | ERROR
LOG_FORMAT=json              # json | text
LOG_FILE_PATH=./logs/roady.log

# Sentry (Error Tracking)
SENTRY_DSN=
SENTRY_ENVIRONMENT=${APP_ENV}
SENTRY_TRACES_SAMPLE_RATE=0.1

# Prometheus
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=

# ============================================================
# 🔒 SÉCURITÉ
# ============================================================
# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
CORS_ALLOW_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_PER_HOUR=1000

# Encryption
ENCRYPTION_KEY=              # Générer avec: openssl rand -hex 32

# ============================================================
# 🐳 DOCKER & KUBERNETES
# ============================================================
# Docker Registry
DOCKER_REGISTRY=gcr.io/roady-project
DOCKER_IMAGE_TAG=latest

# Kubernetes
K8S_NAMESPACE=roady
K8S_CLUSTER_NAME=roady-cluster
K8S_CONTEXT=gke_roady-project_us-east1_roady-cluster

# ============================================================
# 🔄 CELERY - Background Tasks
# ============================================================
CELERY_BROKER_URL=${REDIS_URL}
CELERY_RESULT_BACKEND=${REDIS_URL}
CELERY_TASK_ALWAYS_EAGER=false  # true pour tests
CELERY_WORKER_CONCURRENCY=4

# ============================================================
# 🧪 TESTS
# ============================================================
TEST_DATABASE_URL=postgresql://roady_test:test@localhost:5432/roady_test
TEST_REDIS_URL=redis://localhost:6379/1

# ============================================================
# 📈 FEATURE FLAGS
# ============================================================
FEATURE_LLM_ENABLED=true
FEATURE_NOTIFICATIONS_ENABLED=true
FEATURE_GEOLOCATION_ENABLED=true
FEATURE_MOBILE_APP_ENABLED=true
FEATURE_SSO_ENABLED=false
FEATURE_ANALYTICS_ENABLED=true

# ============================================================
# 🏢 BUSINESS CONFIG
# ============================================================
DEFAULT_TIMEZONE=America/Montreal
DEFAULT_LANGUAGE=fr
DEFAULT_CURRENCY=CAD
COMPANY_NAME=ROADY Construction
SUPPORT_EMAIL=support@roady.construction
