#!/bin/bash
# ============================================================
# ROADY CONSTRUCTION - SCRIPTS UTILITAIRES
# ============================================================


# ============================================================
# scripts/reset-db.sh - Reset complet de la base de données
# ============================================================

#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  ATTENTION: Cette action va SUPPRIMER toutes les données!${NC}"
echo ""
read -p "Êtes-vous sûr? (tapez 'oui' pour confirmer): " confirm

if [ "$confirm" != "oui" ]; then
    echo "Annulé."
    exit 0
fi

echo -e "${YELLOW}🔄 Reset de la base de données...${NC}"

# Charger les variables d'environnement
source .env 2>/dev/null || true

# Arrêter l'API pour éviter les connexions
docker-compose stop api worker scheduler

# Drop et recréer la DB
docker-compose exec -T postgres psql -U ${DB_USER:-roady_user} -c "DROP DATABASE IF EXISTS ${DB_NAME:-roady};"
docker-compose exec -T postgres psql -U ${DB_USER:-roady_user} -c "CREATE DATABASE ${DB_NAME:-roady};"

echo -e "${GREEN}✅ Base de données recréée${NC}"

# Appliquer les migrations
docker-compose run --rm api alembic upgrade head

echo -e "${GREEN}✅ Migrations appliquées${NC}"

# Redémarrer les services
docker-compose start api worker scheduler

echo -e "${GREEN}🎉 Reset terminé!${NC}"


# ============================================================
# scripts/seed-data.sh - Charger les données de démo
# ============================================================

#!/bin/bash
set -e

echo "🌱 Chargement des données de démonstration..."

source .env 2>/dev/null || true

# Exécuter le script de seed
docker-compose exec -T api python -c "
from src.database import SessionLocal
from src.seeds.demo_data import seed_demo_data

db = SessionLocal()
try:
    seed_demo_data(db)
    print('✅ Données de démo chargées!')
finally:
    db.close()
"

echo "🎉 Seed terminé!"


# ============================================================
# scripts/migrate.sh - Gestion des migrations
# ============================================================

#!/bin/bash
set -e

case "$1" in
    create)
        echo "📝 Création d'une nouvelle migration..."
        docker-compose run --rm api alembic revision --autogenerate -m "$2"
        ;;
    up)
        echo "⬆️  Application des migrations..."
        docker-compose run --rm api alembic upgrade head
        ;;
    down)
        echo "⬇️  Rollback de la dernière migration..."
        docker-compose run --rm api alembic downgrade -1
        ;;
    history)
        echo "📜 Historique des migrations..."
        docker-compose run --rm api alembic history
        ;;
    current)
        echo "📍 Version actuelle..."
        docker-compose run --rm api alembic current
        ;;
    *)
        echo "Usage: $0 {create|up|down|history|current} [message]"
        echo ""
        echo "  create <message>  - Créer une nouvelle migration"
        echo "  up                - Appliquer toutes les migrations"
        echo "  down              - Rollback la dernière migration"
        echo "  history           - Voir l'historique"
        echo "  current           - Voir la version actuelle"
        exit 1
        ;;
esac


# ============================================================
# scripts/logs.sh - Voir les logs facilement
# ============================================================

#!/bin/bash

SERVICE=${1:-all}
LINES=${2:-100}

case "$SERVICE" in
    api)
        docker-compose logs -f --tail=$LINES api
        ;;
    worker)
        docker-compose logs -f --tail=$LINES worker
        ;;
    postgres)
        docker-compose logs -f --tail=$LINES postgres
        ;;
    redis)
        docker-compose logs -f --tail=$LINES redis
        ;;
    nginx)
        docker-compose logs -f --tail=$LINES nginx
        ;;
    all)
        docker-compose logs -f --tail=$LINES
        ;;
    *)
        echo "Usage: $0 {api|worker|postgres|redis|nginx|all} [lines]"
        exit 1
        ;;
esac


# ============================================================
# scripts/shell.sh - Accès shell aux conteneurs
# ============================================================

#!/bin/bash

SERVICE=${1:-api}

case "$SERVICE" in
    api)
        docker-compose exec api /bin/bash
        ;;
    postgres)
        docker-compose exec postgres psql -U ${DB_USER:-roady_user} -d ${DB_NAME:-roady}
        ;;
    redis)
        docker-compose exec redis redis-cli
        ;;
    *)
        echo "Usage: $0 {api|postgres|redis}"
        exit 1
        ;;
esac


# ============================================================
# scripts/test.sh - Exécuter les tests
# ============================================================

#!/bin/bash
set -e

echo "🧪 Exécution des tests..."

case "$1" in
    unit)
        docker-compose run --rm api pytest tests/unit -v
        ;;
    integration)
        docker-compose run --rm api pytest tests/integration -v
        ;;
    coverage)
        docker-compose run --rm api pytest --cov=src --cov-report=html --cov-report=term
        echo "📊 Rapport de couverture généré dans htmlcov/"
        ;;
    watch)
        docker-compose run --rm api pytest-watch
        ;;
    *)
        docker-compose run --rm api pytest tests/ -v
        ;;
esac

echo "✅ Tests terminés!"


# ============================================================
# scripts/build.sh - Build des images Docker
# ============================================================

#!/bin/bash
set -e

ENV=${1:-dev}
TAG=${2:-latest}

echo "🏗️  Build des images Docker (env: $ENV, tag: $TAG)..."

# Build API
docker build -t roady-api:$TAG -f backend/Dockerfile ./backend

# Build Frontend
docker build -t roady-web:$TAG \
    --build-arg VITE_API_URL=${API_URL:-http://localhost:8000} \
    -f frontend/Dockerfile ./frontend

# Build Worker
docker build -t roady-worker:$TAG -f backend/Dockerfile.worker ./backend

echo "✅ Build terminé!"

# Tag pour registry si production
if [ "$ENV" == "prod" ]; then
    echo "🏷️  Tagging pour registry..."
    docker tag roady-api:$TAG gcr.io/roady-project/roady-api:$TAG
    docker tag roady-web:$TAG gcr.io/roady-project/roady-web:$TAG
    docker tag roady-worker:$TAG gcr.io/roady-project/roady-worker:$TAG
    echo "✅ Images taguées!"
fi


# ============================================================
# scripts/clean.sh - Nettoyer les ressources Docker
# ============================================================

#!/bin/bash

echo "🧹 Nettoyage des ressources Docker..."

case "$1" in
    containers)
        docker-compose down --remove-orphans
        ;;
    volumes)
        docker-compose down -v --remove-orphans
        echo "⚠️  Volumes supprimés (données perdues)"
        ;;
    images)
        docker-compose down --rmi local
        ;;
    all)
        docker-compose down -v --rmi local --remove-orphans
        docker system prune -f
        echo "✅ Nettoyage complet effectué"
        ;;
    *)
        echo "Usage: $0 {containers|volumes|images|all}"
        echo ""
        echo "  containers  - Arrêter et supprimer les conteneurs"
        echo "  volumes     - Supprimer aussi les volumes (DONNÉES PERDUES!)"
        echo "  images      - Supprimer les images locales"
        echo "  all         - Tout nettoyer + prune"
        exit 1
        ;;
esac


# ============================================================
# scripts/status.sh - État du système
# ============================================================

#!/bin/bash

echo "📊 ROADY Construction - État du système"
echo "========================================"
echo ""

echo "🐳 Conteneurs:"
docker-compose ps
echo ""

echo "💾 Espace disque Docker:"
docker system df
echo ""

echo "🌐 Ports utilisés:"
docker-compose ps --format "table {{.Name}}\t{{.Ports}}"
echo ""

echo "📈 Utilisation ressources:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
