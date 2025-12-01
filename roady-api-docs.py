# ============================================
# ROADY CONSTRUCTION - API DOCUMENTATION COMPLÈTE
# ============================================
# OpenAPI 3.1 / Swagger avec FastAPI
# Structure: backend/src/api/

"""
Documentation API Features:
- OpenAPI 3.1 auto-générée
- Swagger UI interactif
- ReDoc pour documentation lisible
- Exemples de requêtes/réponses
- Schémas de validation
- Authentification documentée
"""

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query, Path, Body
from fastapi.openapi.utils import get_openapi
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
import json

# ============================================
# backend/src/main.py - Configuration OpenAPI
# ============================================

app = FastAPI(
    title="ROADY Construction API",
    description="""
## 🏗️ API de Gestion de Construction Intelligente

ROADY est une plateforme complète pour la gestion de projets de construction, 
intégrant des agents IA spécialisés pour l'estimation, la planification et le suivi.

### Fonctionnalités principales

* **Projets** - Gestion complète du cycle de vie des projets
* **Tâches** - Suivi et assignation des tâches
* **Estimations** - Calculs de coûts automatisés
* **Agents IA** - Assistants intelligents spécialisés
* **Documents** - Gestion documentaire intégrée
* **Équipes** - Gestion des utilisateurs et permissions

### Authentification

L'API utilise **JWT Bearer tokens**. Obtenez un token via `/auth/login` 
et incluez-le dans le header `Authorization: Bearer <token>`.

### Rate Limiting

- 100 requêtes/minute pour les endpoints standards
- 20 requêtes/minute pour les endpoints IA
- 1000 requêtes/heure par utilisateur

### Support

📧 api-support@roady.construction  
📚 [Documentation complète](https://docs.roady.construction)
    """,
    version="1.0.0",
    terms_of_service="https://roady.construction/terms",
    contact={
        "name": "ROADY API Support",
        "url": "https://roady.construction/support",
        "email": "api-support@roady.construction"
    },
    license_info={
        "name": "Proprietary",
        "url": "https://roady.construction/license"
    },
    openapi_tags=[
        {"name": "auth", "description": "Authentification et gestion des tokens"},
        {"name": "users", "description": "Gestion des utilisateurs"},
        {"name": "projects", "description": "Gestion des projets de construction"},
        {"name": "tasks", "description": "Gestion des tâches"},
        {"name": "estimates", "description": "Estimations et calculs de coûts"},
        {"name": "agents", "description": "Agents IA et assistants"},
        {"name": "documents", "description": "Gestion documentaire"},
        {"name": "reports", "description": "Rapports et analytics"},
    ],
    servers=[
        {"url": "https://api.roady.construction", "description": "Production"},
        {"url": "https://staging-api.roady.construction", "description": "Staging"},
        {"url": "http://localhost:8000", "description": "Development"}
    ]
)


# ============================================
# Schemas Pydantic avec documentation
# ============================================

# === Enums ===
class ProjectStatus(str, Enum):
    planning = "planning"
    active = "active"
    on_hold = "on_hold"
    completed = "completed"
    cancelled = "cancelled"

class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"
    supervisor = "supervisor"
    worker = "worker"
    client = "client"


# === Auth Schemas ===
class LoginRequest(BaseModel):
    """Requête de connexion."""
    email: EmailStr = Field(..., example="user@company.com")
    password: str = Field(..., min_length=8, example="SecurePass123!")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {"email": "admin@roady.construction", "password": "AdminPass123!"}
            ]
        }
    }

class TokenResponse(BaseModel):
    """Réponse avec tokens JWT."""
    access_token: str = Field(..., description="Token d'accès JWT")
    refresh_token: str = Field(..., description="Token de rafraîchissement")
    token_type: str = Field(default="bearer")
    expires_in: int = Field(..., description="Durée de validité en secondes", example=3600)
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "access_token": "eyJhbGciOiJIUzI1NiIs...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
                "token_type": "bearer",
                "expires_in": 3600
            }]
        }
    }


# === User Schemas ===
class UserBase(BaseModel):
    """Schéma de base utilisateur."""
    email: EmailStr = Field(..., description="Adresse email unique")
    full_name: str = Field(..., min_length=2, max_length=100, example="Jean Tremblay")
    phone: Optional[str] = Field(None, pattern=r"^\+?[0-9]{10,15}$", example="+15145551234")
    role: UserRole = Field(default=UserRole.worker)
    company_id: Optional[int] = Field(None, description="ID de l'entreprise")

class UserCreate(UserBase):
    """Création d'utilisateur."""
    password: str = Field(..., min_length=8, description="Mot de passe sécurisé")

class UserResponse(UserBase):
    """Réponse utilisateur."""
    id: int = Field(..., description="ID unique")
    is_active: bool = Field(default=True)
    created_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


# === Project Schemas ===
class ProjectBase(BaseModel):
    """Schéma de base projet."""
    name: str = Field(
        ..., 
        min_length=3, 
        max_length=200,
        description="Nom du projet",
        example="Construction Centre Commercial Laval"
    )
    description: Optional[str] = Field(
        None, 
        max_length=2000,
        example="Projet de construction d'un centre commercial de 50,000 m²"
    )
    address: Optional[str] = Field(None, example="1234 Boulevard des Laurentides, Laval, QC")
    budget: Optional[Decimal] = Field(
        None, 
        ge=0, 
        description="Budget total en CAD",
        example=15000000.00
    )
    start_date: Optional[date] = Field(None, example="2024-03-01")
    end_date: Optional[date] = Field(None, example="2025-06-30")

class ProjectCreate(ProjectBase):
    """Création de projet."""
    client_id: Optional[int] = Field(None, description="ID du client")
    manager_id: Optional[int] = Field(None, description="ID du gestionnaire")

class ProjectUpdate(BaseModel):
    """Mise à jour de projet."""
    name: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    budget: Optional[Decimal] = Field(None, ge=0)
    end_date: Optional[date] = None

class ProjectResponse(ProjectBase):
    """Réponse projet complète."""
    id: int
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime
    owner_id: int
    company_id: int
    progress_percent: float = Field(..., ge=0, le=100, example=45.5)
    spent_amount: Decimal = Field(default=0, example=5250000.00)
    tasks_count: int = Field(default=0)
    team_size: int = Field(default=0)
    
    model_config = {"from_attributes": True}

class ProjectListResponse(BaseModel):
    """Liste paginée de projets."""
    items: List[ProjectResponse]
    total: int = Field(..., description="Nombre total de projets")
    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1, le=100)
    pages: int = Field(..., description="Nombre total de pages")


# === Task Schemas ===
class TaskBase(BaseModel):
    """Schéma de base tâche."""
    title: str = Field(..., min_length=3, max_length=200, example="Installation des fondations")
    description: Optional[str] = Field(None, example="Coulée du béton pour les fondations principales")
    priority: TaskPriority = Field(default=TaskPriority.medium)
    due_date: Optional[date] = None
    estimated_hours: Optional[float] = Field(None, ge=0, example=40.0)

class TaskCreate(TaskBase):
    """Création de tâche."""
    project_id: int = Field(..., description="ID du projet parent")
    assignee_id: Optional[int] = Field(None, description="ID de l'assigné")
    parent_task_id: Optional[int] = Field(None, description="ID de la tâche parente")

class TaskResponse(TaskBase):
    """Réponse tâche."""
    id: int
    project_id: int
    status: str
    assignee: Optional[UserResponse] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    actual_hours: Optional[float] = None
    
    model_config = {"from_attributes": True}


# === Estimate Schemas ===
class EstimateItem(BaseModel):
    """Item d'estimation."""
    description: str = Field(..., example="Béton 30 MPa")
    quantity: float = Field(..., gt=0, example=150.0)
    unit: str = Field(..., example="m³")
    unit_cost: Decimal = Field(..., ge=0, example=185.00)
    total: Decimal = Field(..., ge=0, example=27750.00)
    category: str = Field(..., example="materials")

class EstimateRequest(BaseModel):
    """Requête d'estimation."""
    project_id: int
    estimate_type: Literal["preliminary", "detailed", "final"] = "preliminary"
    parameters: Dict[str, Any] = Field(
        ...,
        example={
            "building_area": 1000,
            "stories": 2,
            "construction_type": "concrete",
            "location": "montreal"
        }
    )

class EstimateResponse(BaseModel):
    """Réponse d'estimation."""
    id: int
    project_id: int
    estimate_type: str
    items: List[EstimateItem]
    subtotal_materials: Decimal
    subtotal_labor: Decimal
    subtotal_equipment: Decimal
    overhead: Decimal = Field(..., description="Frais généraux (10-15%)")
    profit: Decimal = Field(..., description="Profit (5-10%)")
    contingency: Decimal = Field(..., description="Contingence (5-15%)")
    total: Decimal
    cost_per_sqm: Decimal = Field(..., description="Coût au m²")
    created_at: datetime
    valid_until: date


# === Agent Schemas ===
class AgentInfo(BaseModel):
    """Information sur un agent IA."""
    id: str = Field(..., example="estimator")
    name: str = Field(..., example="Agent Estimateur")
    description: str = Field(..., example="Spécialiste en estimation de coûts de construction")
    capabilities: List[str] = Field(..., example=["cost_estimation", "material_takeoff", "labor_calculation"])
    category: str = Field(..., example="estimation")
    is_available: bool = True

class AgentChatRequest(BaseModel):
    """Requête de chat avec un agent."""
    message: str = Field(
        ..., 
        min_length=1, 
        max_length=4000,
        example="Estime le coût d'une dalle de béton de 100m² avec 150mm d'épaisseur"
    )
    conversation_id: Optional[str] = Field(None, description="ID de conversation existante")
    context: Optional[Dict[str, Any]] = Field(
        None,
        description="Contexte additionnel",
        example={"project_id": 123, "location": "montreal"}
    )

class AgentChatResponse(BaseModel):
    """Réponse de chat d'un agent."""
    conversation_id: str
    message: str
    agent_id: str
    tokens_used: int
    processing_time_ms: int
    sources: Optional[List[str]] = None
    suggested_actions: Optional[List[Dict[str, str]]] = None


# ============================================
# API Routes avec documentation
# ============================================

# === Auth Router ===
auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post(
    "/login",
    response_model=TokenResponse,
    summary="Connexion utilisateur",
    description="Authentifie un utilisateur et retourne des tokens JWT.",
    responses={
        200: {"description": "Connexion réussie"},
        401: {"description": "Identifiants invalides"},
        429: {"description": "Trop de tentatives"}
    }
)
async def login(credentials: LoginRequest):
    """
    Authentifie un utilisateur avec email et mot de passe.
    
    - **email**: Adresse email de l'utilisateur
    - **password**: Mot de passe
    
    Retourne un access_token (1h) et un refresh_token (7j).
    """
    pass

@auth_router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rafraîchir le token",
    description="Génère un nouveau access_token à partir du refresh_token."
)
async def refresh_token(refresh_token: str = Body(..., embed=True)):
    """Rafraîchit le token d'accès."""
    pass


# === Projects Router ===
projects_router = APIRouter(prefix="/projects", tags=["projects"])

@projects_router.get(
    "",
    response_model=ProjectListResponse,
    summary="Lister les projets",
    description="Récupère la liste paginée des projets avec filtres optionnels."
)
async def list_projects(
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(20, ge=1, le=100, description="Éléments par page"),
    status: Optional[ProjectStatus] = Query(None, description="Filtrer par statut"),
    search: Optional[str] = Query(None, max_length=100, description="Recherche textuelle"),
    sort_by: str = Query("created_at", description="Champ de tri"),
    sort_order: Literal["asc", "desc"] = Query("desc", description="Ordre de tri")
):
    """
    Liste tous les projets accessibles à l'utilisateur.
    
    Supporte la pagination, le filtrage et le tri.
    """
    pass

@projects_router.post(
    "",
    response_model=ProjectResponse,
    status_code=201,
    summary="Créer un projet",
    description="Crée un nouveau projet de construction.",
    responses={
        201: {"description": "Projet créé avec succès"},
        400: {"description": "Données invalides"},
        403: {"description": "Permission refusée"}
    }
)
async def create_project(project: ProjectCreate):
    """
    Crée un nouveau projet.
    
    Requiert le rôle `manager` ou supérieur.
    """
    pass

@projects_router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Détails d'un projet",
    responses={
        200: {"description": "Projet trouvé"},
        404: {"description": "Projet non trouvé"}
    }
)
async def get_project(
    project_id: int = Path(..., ge=1, description="ID du projet")
):
    """Récupère les détails d'un projet spécifique."""
    pass

@projects_router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Modifier un projet"
)
async def update_project(
    project_id: int = Path(..., ge=1),
    updates: ProjectUpdate = Body(...)
):
    """Met à jour un projet existant."""
    pass

@projects_router.delete(
    "/{project_id}",
    status_code=204,
    summary="Supprimer un projet",
    responses={
        204: {"description": "Projet supprimé"},
        404: {"description": "Projet non trouvé"},
        409: {"description": "Projet ne peut être supprimé (tâches actives)"}
    }
)
async def delete_project(project_id: int = Path(..., ge=1)):
    """
    Supprime un projet.
    
    ⚠️ Cette action est irréversible. Le projet doit être vide ou annulé.
    """
    pass


# === Estimates Router ===
estimates_router = APIRouter(prefix="/estimates", tags=["estimates"])

@estimates_router.post(
    "/calculate",
    response_model=EstimateResponse,
    summary="Calculer une estimation",
    description="Génère une estimation de coûts basée sur les paramètres fournis."
)
async def calculate_estimate(request: EstimateRequest):
    """
    Calcule une estimation de coûts.
    
    ## Paramètres supportés
    
    | Paramètre | Type | Description |
    |-----------|------|-------------|
    | building_area | float | Surface en m² |
    | stories | int | Nombre d'étages |
    | construction_type | string | concrete, steel, wood |
    | location | string | Ville/région |
    | quality_level | string | standard, premium, luxury |
    
    ## Types d'estimation
    
    - **preliminary**: Estimation rapide ±25%
    - **detailed**: Estimation détaillée ±10%
    - **final**: Estimation finale ±5%
    """
    pass


# === Agents Router ===
agents_router = APIRouter(prefix="/agents", tags=["agents"])

@agents_router.get(
    "",
    response_model=List[AgentInfo],
    summary="Lister les agents IA",
    description="Récupère la liste des agents IA disponibles."
)
async def list_agents():
    """Liste tous les agents IA disponibles."""
    pass

@agents_router.post(
    "/{agent_id}/chat",
    response_model=AgentChatResponse,
    summary="Discuter avec un agent",
    description="Envoie un message à un agent IA spécialisé.",
    responses={
        200: {"description": "Réponse de l'agent"},
        404: {"description": "Agent non trouvé"},
        429: {"description": "Limite de requêtes atteinte"},
        503: {"description": "Agent temporairement indisponible"}
    }
)
async def chat_with_agent(
    agent_id: str = Path(..., description="ID de l'agent", example="estimator"),
    request: AgentChatRequest = Body(...)
):
    """
    Envoie un message à un agent IA.
    
    ## Agents disponibles
    
    | ID | Spécialité |
    |----|------------|
    | estimator | Estimation de coûts |
    | structural | Calculs structuraux |
    | scheduler | Planification |
    | safety | Santé et sécurité |
    | codes | Codes et normes |
    
    ## Limites
    
    - 20 requêtes/minute par utilisateur
    - Message max: 4000 caractères
    - Contexte conservé 24h
    """
    pass


# ============================================
# Custom OpenAPI Schema
# ============================================

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Token JWT obtenu via /auth/login"
        },
        "apiKey": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
            "description": "Clé API pour intégrations externes"
        }
    }
    
    # Apply security globally
    openapi_schema["security"] = [{"bearerAuth": []}]
    
    # Add webhooks documentation
    openapi_schema["webhooks"] = {
        "projectUpdated": {
            "post": {
                "summary": "Projet mis à jour",
                "description": "Webhook déclenché quand un projet est modifié",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/ProjectResponse"
                            }
                        }
                    }
                },
                "responses": {"200": {"description": "Webhook reçu"}}
            }
        },
        "taskCompleted": {
            "post": {
                "summary": "Tâche complétée",
                "description": "Webhook déclenché quand une tâche est terminée"
            }
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(estimates_router, prefix="/api/v1")
app.include_router(agents_router, prefix="/api/v1")


# ============================================
# Error Responses Documentation
# ============================================

ERROR_RESPONSES = {
    400: {
        "description": "Bad Request - Données invalides",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Validation error",
                    "errors": [{"field": "email", "message": "Invalid email format"}]
                }
            }
        }
    },
    401: {
        "description": "Unauthorized - Token invalide ou expiré",
        "content": {
            "application/json": {
                "example": {"detail": "Could not validate credentials"}
            }
        }
    },
    403: {
        "description": "Forbidden - Permission insuffisante",
        "content": {
            "application/json": {
                "example": {"detail": "You don't have permission to access this resource"}
            }
        }
    },
    404: {
        "description": "Not Found - Ressource introuvable",
        "content": {
            "application/json": {
                "example": {"detail": "Project not found"}
            }
        }
    },
    429: {
        "description": "Too Many Requests - Rate limit atteint",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Rate limit exceeded",
                    "retry_after": 60
                }
            }
        }
    },
    500: {
        "description": "Internal Server Error",
        "content": {
            "application/json": {
                "example": {
                    "detail": "An unexpected error occurred",
                    "request_id": "req_abc123"
                }
            }
        }
    }
}

# ============================================
# API Documentation Endpoints
# ============================================

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"{app.title} - Swagger UI",
        swagger_favicon_url="/favicon.ico"
    )

@app.get("/redoc", include_in_schema=False)
async def redoc_html():
    return get_redoc_html(
        openapi_url="/openapi.json",
        title=f"{app.title} - ReDoc"
    )

@app.get("/openapi.json", include_in_schema=False)
async def get_openapi_json():
    return app.openapi()
