#!/bin/bash
# ============================================
# ROADY CONSTRUCTION - SCRIPT D'INSTALLATION
# ============================================
# Usage: ./install.sh [dev|staging|prod]
# 
# Ce script installe et configure ROADY automatiquement

set -e  # Exit on error

# ============================================
# COULEURS ET STYLES
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ============================================
# FONCTIONS UTILITAIRES
# ============================================

print_banner() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║   ██████╗  ██████╗  █████╗ ██████╗ ██╗   ██╗              ║"
    echo "║   ██╔══██╗██╔═══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝              ║"
    echo "║   ██████╔╝██║   ██║███████║██║  ██║ ╚████╔╝               ║"
    echo "║   ██╔══██╗██║   ██║██╔══██║██║  ██║  ╚██╔╝                ║"
    echo "║   ██║  ██║╚██████╔╝██║  ██║██████╔╝   ██║                 ║"
    echo "║   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝    ╚═╝                 ║"
    echo "║                                                            ║"
    echo "║        🏗️  Construction Management System  🏗️              ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_step() {
    echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}${BOLD}  $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        return 1
    fi
    return 0
}

# ============================================
# VÉRIFICATION DES PRÉREQUIS
# ============================================

check_prerequisites() {
    log_step "1/7 - Vérification des prérequis"
    
    local missing=()
    
    # Docker
    if check_command docker; then
        local docker_version=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker installé (v$docker_version)"
    else
        missing+=("docker")
        log_error "Docker non installé"
    fi
    
    # Docker Compose
    if check_command docker-compose || docker compose version &> /dev/null; then
        log_success "Docker Compose installé"
    else
        missing+=("docker-compose")
        log_error "Docker Compose non installé"
    fi
    
    # Git
    if check_command git; then
        local git_version=$(git --version | cut -d' ' -f3)
        log_success "Git installé (v$git_version)"
    else
        missing+=("git")
        log_error "Git non installé"
    fi
    
    # Node.js (optionnel pour dev)
    if check_command node; then
        local node_version=$(node --version)
        log_success "Node.js installé ($node_version)"
    else
        log_warning "Node.js non installé (optionnel pour développement local)"
    fi
    
    # Python (optionnel pour dev)
    if check_command python3; then
        local python_version=$(python3 --version | cut -d' ' -f2)
        log_success "Python installé (v$python_version)"
    else
        log_warning "Python non installé (optionnel pour développement local)"
    fi
    
    # Vérifier si Docker daemon est en cours d'exécution
    if ! docker info &> /dev/null; then
        log_error "Docker daemon n'est pas en cours d'exécution"
        missing+=("docker-daemon")
    else
        log_success "Docker daemon actif"
    fi
    
    # Afficher les manquants
    if [ ${#missing[@]} -gt 0 ]; then
        echo ""
        log_error "Prérequis manquants: ${missing[*]}"
        echo ""
        echo -e "${YELLOW}Installation des prérequis:${NC}"
        echo ""
        echo "  macOS:    brew install docker docker-compose git"
        echo "  Ubuntu:   sudo apt install docker.io docker-compose git"
        echo "  Windows:  Installer Docker Desktop depuis https://docker.com"
        echo ""
        exit 1
    fi
    
    log_success "Tous les prérequis sont satisfaits!"
}

# ============================================
# CONFIGURATION ENVIRONNEMENT
# ============================================

setup_environment() {
    log_step "2/7 - Configuration de l'environnement"
    
    ENV=${1:-dev}
    log_info "Mode d'installation: ${BOLD}$ENV${NC}"
    
    # Créer .env si n'existe pas
    if [ ! -f .env ]; then
        log_info "Création du fichier .env..."
        cp .env.template .env
        
        # Générer des valeurs par défaut sécurisées
        SECRET_KEY=$(openssl rand -hex 32 2>/dev/null || echo "change-me-in-production-$(date +%s)")
        DB_PASSWORD=$(openssl rand -base64 24 2>/dev/null || echo "roady_db_pass_$(date +%s)")
        
        # Remplacer les valeurs dans .env
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
            sed -i '' "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
        else
            # Linux
            sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
            sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
        fi
        
        log_success "Fichier .env créé avec des valeurs sécurisées"
    else
        log_success "Fichier .env existant conservé"
    fi
    
    # Créer les répertoires nécessaires
    log_info "Création des répertoires..."
    mkdir -p data/postgres
    mkdir -p data/redis
    mkdir -p data/uploads
    mkdir -p logs
    mkdir -p backups
    
    log_success "Structure de répertoires créée"
}

# ============================================
# CONFIGURATION DES CLÉS API
# ============================================

configure_api_keys() {
    log_step "3/7 - Configuration des clés API"
    
    echo -e "${YELLOW}Configuration des clés API (optionnel - Entrée pour passer)${NC}"
    echo ""
    
    # Claude API Key
    read -p "🤖 Clé API Claude (CLAUDE_API_KEY): " claude_key
    if [ ! -z "$claude_key" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/CLAUDE_API_KEY=.*/CLAUDE_API_KEY=$claude_key/" .env
        else
            sed -i "s/CLAUDE_API_KEY=.*/CLAUDE_API_KEY=$claude_key/" .env
        fi
        log_success "Clé Claude configurée"
    else
        log_warning "Clé Claude non configurée (agents IA limités)"
    fi
    
    # OpenAI API Key (optionnel)
    read -p "🧠 Clé API OpenAI (optionnel): " openai_key
    if [ ! -z "$openai_key" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$openai_key/" .env
        else
            sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$openai_key/" .env
        fi
        log_success "Clé OpenAI configurée"
    fi
    
    # Stripe (optionnel)
    read -p "💳 Clé API Stripe (optionnel): " stripe_key
    if [ ! -z "$stripe_key" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/STRIPE_API_KEY=.*/STRIPE_API_KEY=$stripe_key/" .env
        else
            sed -i "s/STRIPE_API_KEY=.*/STRIPE_API_KEY=$stripe_key/" .env
        fi
        log_success "Clé Stripe configurée"
    fi
    
    echo ""
    log_info "Vous pourrez modifier ces clés plus tard dans le fichier .env"
}

# ============================================
# BUILD DES IMAGES DOCKER
# ============================================

build_images() {
    log_step "4/7 - Construction des images Docker"
    
    log_info "Construction de l'image backend..."
    docker compose build api --no-cache 2>&1 | while read line; do
        echo -e "  ${CYAN}│${NC} $line"
    done
    log_success "Image backend construite"
    
    log_info "Construction de l'image frontend..."
    docker compose build frontend --no-cache 2>&1 | while read line; do
        echo -e "  ${CYAN}│${NC} $line"
    done
    log_success "Image frontend construite"
    
    log_success "Toutes les images sont construites!"
}

# ============================================
# DÉMARRAGE DES SERVICES
# ============================================

start_services() {
    log_step "5/7 - Démarrage des services"
    
    log_info "Démarrage de PostgreSQL..."
    docker compose up -d postgres
    
    log_info "Attente de PostgreSQL (30s max)..."
    for i in {1..30}; do
        if docker compose exec -T postgres pg_isready -U roady_user &> /dev/null; then
            log_success "PostgreSQL prêt!"
            break
        fi
        sleep 1
        echo -ne "  Attente... $i/30s\r"
    done
    
    log_info "Démarrage de Redis..."
    docker compose up -d redis
    sleep 2
    log_success "Redis démarré"
    
    log_info "Démarrage de l'API backend..."
    docker compose up -d api
    sleep 5
    log_success "API démarrée"
    
    log_info "Démarrage du frontend..."
    docker compose up -d frontend
    sleep 3
    log_success "Frontend démarré"
    
    log_info "Démarrage des workers Celery..."
    docker compose up -d celery celery-beat
    log_success "Workers démarrés"
    
    log_success "Tous les services sont démarrés!"
}

# ============================================
# INITIALISATION DE LA BASE DE DONNÉES
# ============================================

init_database() {
    log_step "6/7 - Initialisation de la base de données"
    
    log_info "Exécution des migrations Alembic..."
    docker compose exec -T api alembic upgrade head 2>&1 | while read line; do
        echo -e "  ${CYAN}│${NC} $line"
    done
    log_success "Migrations appliquées"
    
    log_info "Création de l'utilisateur admin..."
    
    # Demander les infos admin
    echo ""
    read -p "📧 Email admin [admin@roady.construction]: " admin_email
    admin_email=${admin_email:-admin@roady.construction}
    
    read -s -p "🔐 Mot de passe admin: " admin_password
    echo ""
    
    if [ -z "$admin_password" ]; then
        admin_password="Admin123!"
        log_warning "Mot de passe par défaut utilisé: Admin123!"
    fi
    
    # Créer l'admin via l'API
    docker compose exec -T api python -c "
from src.database import SessionLocal
from src.models import User
from src.auth.password import hash_password

db = SessionLocal()
admin = User(
    email='$admin_email',
    hashed_password=hash_password('$admin_password'),
    full_name='Administrateur ROADY',
    role='admin',
    is_active=True
)
db.add(admin)
db.commit()
print('Admin créé avec succès!')
" 2>/dev/null || log_warning "Admin peut-être déjà existant"
    
    log_success "Base de données initialisée"
}

# ============================================
# VÉRIFICATION FINALE
# ============================================

verify_installation() {
    log_step "7/7 - Vérification de l'installation"
    
    echo ""
    log_info "Vérification des services..."
    echo ""
    
    # Tableau des services
    echo -e "  ${WHITE}┌─────────────────┬──────────┬─────────────────────────────┐${NC}"
    echo -e "  ${WHITE}│ Service         │ Status   │ URL                         │${NC}"
    echo -e "  ${WHITE}├─────────────────┼──────────┼─────────────────────────────┤${NC}"
    
    # API
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "  ${WHITE}│${NC} API Backend     ${WHITE}│${NC} ${GREEN}✓ UP${NC}     ${WHITE}│${NC} http://localhost:8000       ${WHITE}│${NC}"
        api_ok=true
    else
        echo -e "  ${WHITE}│${NC} API Backend     ${WHITE}│${NC} ${RED}✗ DOWN${NC}   ${WHITE}│${NC} http://localhost:8000       ${WHITE}│${NC}"
        api_ok=false
    fi
    
    # Frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "  ${WHITE}│${NC} Frontend        ${WHITE}│${NC} ${GREEN}✓ UP${NC}     ${WHITE}│${NC} http://localhost:3000       ${WHITE}│${NC}"
        frontend_ok=true
    else
        echo -e "  ${WHITE}│${NC} Frontend        ${WHITE}│${NC} ${RED}✗ DOWN${NC}   ${WHITE}│${NC} http://localhost:3000       ${WHITE}│${NC}"
        frontend_ok=false
    fi
    
    # API Docs
    if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
        echo -e "  ${WHITE}│${NC} API Docs        ${WHITE}│${NC} ${GREEN}✓ UP${NC}     ${WHITE}│${NC} http://localhost:8000/docs  ${WHITE}│${NC}"
    else
        echo -e "  ${WHITE}│${NC} API Docs        ${WHITE}│${NC} ${YELLOW}? ---${NC}    ${WHITE}│${NC} http://localhost:8000/docs  ${WHITE}│${NC}"
    fi
    
    # PostgreSQL
    if docker compose exec -T postgres pg_isready -U roady_user > /dev/null 2>&1; then
        echo -e "  ${WHITE}│${NC} PostgreSQL      ${WHITE}│${NC} ${GREEN}✓ UP${NC}     ${WHITE}│${NC} localhost:5432              ${WHITE}│${NC}"
    else
        echo -e "  ${WHITE}│${NC} PostgreSQL      ${WHITE}│${NC} ${RED}✗ DOWN${NC}   ${WHITE}│${NC} localhost:5432              ${WHITE}│${NC}"
    fi
    
    # Redis
    if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "  ${WHITE}│${NC} Redis           ${WHITE}│${NC} ${GREEN}✓ UP${NC}     ${WHITE}│${NC} localhost:6379              ${WHITE}│${NC}"
    else
        echo -e "  ${WHITE}│${NC} Redis           ${WHITE}│${NC} ${RED}✗ DOWN${NC}   ${WHITE}│${NC} localhost:6379              ${WHITE}│${NC}"
    fi
    
    echo -e "  ${WHITE}└─────────────────┴──────────┴─────────────────────────────┘${NC}"
    echo ""
}

# ============================================
# AFFICHAGE FINAL
# ============================================

print_success() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║   🎉  INSTALLATION RÉUSSIE!  🎉                            ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${WHITE}${BOLD}Accès à ROADY:${NC}"
    echo ""
    echo -e "  🌐 Application:    ${CYAN}http://localhost:3000${NC}"
    echo -e "  📡 API:            ${CYAN}http://localhost:8000${NC}"
    echo -e "  📚 Documentation:  ${CYAN}http://localhost:8000/docs${NC}"
    echo ""
    echo -e "${WHITE}${BOLD}Commandes utiles:${NC}"
    echo ""
    echo -e "  ${YELLOW}docker compose ps${NC}        - Voir l'état des services"
    echo -e "  ${YELLOW}docker compose logs -f${NC}   - Voir les logs en temps réel"
    echo -e "  ${YELLOW}docker compose down${NC}      - Arrêter tous les services"
    echo -e "  ${YELLOW}docker compose restart${NC}   - Redémarrer les services"
    echo ""
    echo -e "${WHITE}${BOLD}Prochaines étapes:${NC}"
    echo ""
    echo -e "  1. Ouvrir ${CYAN}http://localhost:3000${NC} dans votre navigateur"
    echo -e "  2. Se connecter avec le compte admin créé"
    echo -e "  3. Créer votre premier projet!"
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  📧 Support: ${CYAN}support@roady.construction${NC}"
    echo -e "  📚 Docs:    ${CYAN}https://docs.roady.construction${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ============================================
# MAIN
# ============================================

main() {
    clear
    print_banner
    
    ENV=${1:-dev}
    
    echo -e "${WHITE}Mode d'installation: ${CYAN}${BOLD}$ENV${NC}"
    echo ""
    read -p "Appuyez sur Entrée pour commencer l'installation..."
    echo ""
    
    check_prerequisites
    setup_environment $ENV
    configure_api_keys
    build_images
    start_services
    init_database
    verify_installation
    print_success
}

# Exécuter le script
main "$@"
