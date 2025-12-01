#!/bin/bash

# ============================================================
# ROADY CONSTRUCTION - SCRIPT D'INSTALLATION
# Usage: ./install.sh [dev|staging|prod]
# ============================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🏗️  ROADY CONSTRUCTION - INSTALLATION SCRIPT  🏗️      ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Environment
ENV=${1:-dev}
echo -e "${BLUE}📦 Environment: ${YELLOW}$ENV${NC}"
echo ""

# ============================================================
# FUNCTIONS
# ============================================================

log_step() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 n'est pas installé. Veuillez l'installer d'abord."
    fi
}

generate_secret() {
    openssl rand -hex 32
}

# ============================================================
# PRE-REQUISITES CHECK
# ============================================================

echo -e "${PURPLE}🔍 Vérification des prérequis...${NC}"
echo ""

check_command "docker"
check_command "docker-compose"
check_command "git"

# Optional checks
if command -v kubectl &> /dev/null; then
    log_step "kubectl trouvé"
    HAS_KUBECTL=true
else
    log_warn "kubectl non trouvé (optionnel pour Kubernetes)"
    HAS_KUBECTL=false
fi

if command -v helm &> /dev/null; then
    log_step "helm trouvé"
    HAS_HELM=true
else
    log_warn "helm non trouvé (optionnel pour Kubernetes)"
    HAS_HELM=false
fi

log_step "Docker version: $(docker --version)"
log_step "Docker Compose version: $(docker-compose --version)"

echo ""

# ============================================================
# DIRECTORY STRUCTURE
# ============================================================

echo -e "${PURPLE}📁 Création de la structure de répertoires...${NC}"

DIRS=(
    "backend/src"
    "backend/tests"
    "backend/alembic/versions"
    "frontend/src/components"
    "frontend/src/pages"
    "frontend/src/hooks"
    "frontend/public"
    "nginx/certs"
    "logs"
    "uploads"
    "backups"
    "scripts"
    "k8s"
    "monitoring/prometheus"
    "monitoring/grafana/dashboards"
    "monitoring/grafana/provisioning"
)

for dir in "${DIRS[@]}"; do
    mkdir -p "$dir"
    log_step "Créé: $dir"
done

echo ""

# ============================================================
# ENVIRONMENT FILE
# ============================================================

echo -e "${PURPLE}🔧 Configuration de l'environnement...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.template" ]; then
        cp .env.template .env
        log_step "Fichier .env créé depuis template"
        
        # Generate secrets
        log_info "Génération des secrets..."
        
        APP_SECRET=$(generate_secret)
        JWT_SECRET=$(generate_secret)
        ENCRYPTION_KEY=$(generate_secret)
        DB_PASSWORD=$(generate_secret | cut -c1-24)
        REDIS_PASSWORD=$(generate_secret | cut -c1-24)
        GRAFANA_PASSWORD=$(generate_secret | cut -c1-16)
        
        # Update .env with generated secrets
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/^APP_SECRET_KEY=.*/APP_SECRET_KEY=$APP_SECRET/" .env
            sed -i '' "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
            sed -i '' "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
            sed -i '' "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
            sed -i '' "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
            sed -i '' "s/^GRAFANA_ADMIN_PASSWORD=.*/GRAFANA_ADMIN_PASSWORD=$GRAFANA_PASSWORD/" .env
        else
            # Linux
            sed -i "s/^APP_SECRET_KEY=.*/APP_SECRET_KEY=$APP_SECRET/" .env
            sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
            sed -i "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
            sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
            sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
            sed -i "s/^GRAFANA_ADMIN_PASSWORD=.*/GRAFANA_ADMIN_PASSWORD=$GRAFANA_PASSWORD/" .env
        fi
        
        log_step "Secrets générés automatiquement"
    else
        log_error "Fichier .env.template non trouvé!"
    fi
else
    log_info "Fichier .env existe déjà"
fi

# Load environment
source .env 2>/dev/null || true

echo ""

# ============================================================
# DOCKER NETWORK
# ============================================================

echo -e "${PURPLE}🌐 Configuration du réseau Docker...${NC}"

if ! docker network ls | grep -q "roady-network"; then
    docker network create roady-network
    log_step "Réseau roady-network créé"
else
    log_info "Réseau roady-network existe déjà"
fi

echo ""

# ============================================================
# DATABASE INITIALIZATION
# ============================================================

echo -e "${PURPLE}🗄️  Initialisation de la base de données...${NC}"

# Start PostgreSQL
docker-compose up -d postgres
log_step "PostgreSQL démarré"

# Wait for PostgreSQL to be ready
echo -n "Attente de PostgreSQL"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U ${DB_USER:-roady_user} > /dev/null 2>&1; then
        echo ""
        log_step "PostgreSQL prêt!"
        break
    fi
    echo -n "."
    sleep 1
done

# Run migrations
if [ -f "backend/alembic.ini" ]; then
    log_info "Exécution des migrations..."
    docker-compose run --rm api alembic upgrade head
    log_step "Migrations appliquées"
fi

echo ""

# ============================================================
# REDIS INITIALIZATION
# ============================================================

echo -e "${PURPLE}📦 Initialisation de Redis...${NC}"

docker-compose up -d redis
log_step "Redis démarré"

# Wait for Redis
echo -n "Attente de Redis"
for i in {1..15}; do
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo ""
        log_step "Redis prêt!"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""

# ============================================================
# BUILD CONTAINERS
# ============================================================

echo -e "${PURPLE}🐳 Construction des conteneurs...${NC}"

if [ "$ENV" == "prod" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --parallel
else
    docker-compose build --parallel
fi

log_step "Conteneurs construits"

echo ""

# ============================================================
# START SERVICES
# ============================================================

echo -e "${PURPLE}🚀 Démarrage des services...${NC}"

if [ "$ENV" == "prod" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
else
    docker-compose up -d
fi

log_step "Services démarrés"

# Wait for API
echo -n "Attente de l'API"
for i in {1..60}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo ""
        log_step "API prête!"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""

# ============================================================
# MONITORING (Optional)
# ============================================================

if [ "$ENV" != "dev" ] || [ "$MONITORING" == "true" ]; then
    echo -e "${PURPLE}📊 Configuration du monitoring...${NC}"
    
    docker-compose -f docker-compose.monitoring.yml up -d
    log_step "Prometheus + Grafana démarrés"
fi

echo ""

# ============================================================
# RUN TESTS
# ============================================================

if [ "$RUN_TESTS" != "false" ]; then
    echo -e "${PURPLE}🧪 Exécution des tests...${NC}"
    
    docker-compose run --rm api pytest tests/ -v --tb=short || {
        log_warn "Certains tests ont échoué"
    }
fi

echo ""

# ============================================================
# HEALTH CHECK
# ============================================================

echo -e "${PURPLE}🏥 Vérification de santé...${NC}"

services=("postgres:5432" "redis:6379" "api:8000")

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if docker-compose ps | grep -q "$name.*Up"; then
        log_step "$name: ✓ Running"
    else
        log_warn "$name: ✗ Not running"
    fi
done

echo ""

# ============================================================
# FINAL SUMMARY
# ============================================================

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║        🎉 INSTALLATION TERMINÉE AVEC SUCCÈS! 🎉          ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}📍 URLs disponibles:${NC}"
echo ""
echo -e "   🌐 Frontend:    ${CYAN}http://localhost:3000${NC}"
echo -e "   🔌 API:         ${CYAN}http://localhost:8000${NC}"
echo -e "   📚 API Docs:    ${CYAN}http://localhost:8000/docs${NC}"
echo -e "   📊 Prometheus:  ${CYAN}http://localhost:9090${NC}"
echo -e "   📈 Grafana:     ${CYAN}http://localhost:3001${NC}"
echo ""

echo -e "${GREEN}🔑 Credentials:${NC}"
echo ""
echo -e "   Database:  ${YELLOW}${DB_USER:-roady_user}${NC} / ${YELLOW}(voir .env)${NC}"
echo -e "   Grafana:   ${YELLOW}admin${NC} / ${YELLOW}(voir .env)${NC}"
echo ""

echo -e "${GREEN}📋 Commandes utiles:${NC}"
echo ""
echo -e "   ${BLUE}docker-compose logs -f${NC}        # Voir les logs"
echo -e "   ${BLUE}docker-compose ps${NC}             # État des services"
echo -e "   ${BLUE}docker-compose down${NC}           # Arrêter tout"
echo -e "   ${BLUE}docker-compose restart${NC}        # Redémarrer"
echo -e "   ${BLUE}./scripts/backup.sh${NC}           # Sauvegarder la DB"
echo ""

echo -e "${YELLOW}⚠️  N'oublie pas de configurer:${NC}"
echo -e "   - Les clés API (ANTHROPIC_API_KEY, etc.) dans .env"
echo -e "   - Firebase pour les notifications push"
echo -e "   - Les certificats SSL pour la production"
echo ""

echo -e "${GREEN}Bon développement Jo! 🚀${NC}"
