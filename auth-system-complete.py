"""
ROADY Construction - Système d'Authentification Complet
OAuth2 + JWT + RBAC (Role-Based Access Control)
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, EmailStr, Field
from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, SecurityScopes
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets

# ============================================================
# CONFIGURATION
# ============================================================

class AuthConfig:
    SECRET_KEY = secrets.token_urlsafe(32)
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    PASSWORD_MIN_LENGTH = 8
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 15

# ============================================================
# ENUMS - RÔLES ET PERMISSIONS
# ============================================================

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"      # Accès total
    ADMIN = "admin"                   # Gestion entreprise
    DIRECTEUR = "directeur"           # Direction projet
    CHEF_PROJET = "chef_projet"       # Gestion projet
    SUPERVISEUR = "superviseur"       # Supervision terrain
    TECHNICIEN = "technicien"         # Travail terrain
    SOUS_TRAITANT = "sous_traitant"   # Accès limité
    CLIENT = "client"                 # Lecture seule
    INVITE = "invite"                 # Accès minimal

class Permission(str, Enum):
    # Projets
    PROJECT_CREATE = "project:create"
    PROJECT_READ = "project:read"
    PROJECT_UPDATE = "project:update"
    PROJECT_DELETE = "project:delete"
    PROJECT_ARCHIVE = "project:archive"
    
    # Tâches
    TASK_CREATE = "task:create"
    TASK_READ = "task:read"
    TASK_UPDATE = "task:update"
    TASK_DELETE = "task:delete"
    TASK_ASSIGN = "task:assign"
    
    # Rapports
    REPORT_CREATE = "report:create"
    REPORT_READ = "report:read"
    REPORT_APPROVE = "report:approve"
    REPORT_EXPORT = "report:export"
    
    # RFI
    RFI_CREATE = "rfi:create"
    RFI_READ = "rfi:read"
    RFI_RESPOND = "rfi:respond"
    RFI_CLOSE = "rfi:close"
    
    # Finances
    FINANCE_VIEW = "finance:view"
    FINANCE_EDIT = "finance:edit"
    FINANCE_APPROVE = "finance:approve"
    
    # Équipes
    TEAM_VIEW = "team:view"
    TEAM_MANAGE = "team:manage"
    
    # Admin
    ADMIN_USERS = "admin:users"
    ADMIN_SETTINGS = "admin:settings"
    ADMIN_AUDIT = "admin:audit"

# Mapping Rôles → Permissions
ROLE_PERMISSIONS: Dict[UserRole, List[Permission]] = {
    UserRole.SUPER_ADMIN: list(Permission),  # Toutes les permissions
    
    UserRole.ADMIN: [
        Permission.PROJECT_CREATE, Permission.PROJECT_READ, Permission.PROJECT_UPDATE,
        Permission.PROJECT_DELETE, Permission.PROJECT_ARCHIVE,
        Permission.TASK_CREATE, Permission.TASK_READ, Permission.TASK_UPDATE,
        Permission.TASK_DELETE, Permission.TASK_ASSIGN,
        Permission.REPORT_CREATE, Permission.REPORT_READ, Permission.REPORT_APPROVE, Permission.REPORT_EXPORT,
        Permission.RFI_CREATE, Permission.RFI_READ, Permission.RFI_RESPOND, Permission.RFI_CLOSE,
        Permission.FINANCE_VIEW, Permission.FINANCE_EDIT, Permission.FINANCE_APPROVE,
        Permission.TEAM_VIEW, Permission.TEAM_MANAGE,
        Permission.ADMIN_USERS, Permission.ADMIN_SETTINGS,
    ],
    
    UserRole.DIRECTEUR: [
        Permission.PROJECT_CREATE, Permission.PROJECT_READ, Permission.PROJECT_UPDATE,
        Permission.TASK_CREATE, Permission.TASK_READ, Permission.TASK_UPDATE, Permission.TASK_ASSIGN,
        Permission.REPORT_CREATE, Permission.REPORT_READ, Permission.REPORT_APPROVE, Permission.REPORT_EXPORT,
        Permission.RFI_CREATE, Permission.RFI_READ, Permission.RFI_RESPOND, Permission.RFI_CLOSE,
        Permission.FINANCE_VIEW, Permission.FINANCE_EDIT,
        Permission.TEAM_VIEW, Permission.TEAM_MANAGE,
    ],
    
    UserRole.CHEF_PROJET: [
        Permission.PROJECT_READ, Permission.PROJECT_UPDATE,
        Permission.TASK_CREATE, Permission.TASK_READ, Permission.TASK_UPDATE, Permission.TASK_ASSIGN,
        Permission.REPORT_CREATE, Permission.REPORT_READ, Permission.REPORT_EXPORT,
        Permission.RFI_CREATE, Permission.RFI_READ, Permission.RFI_RESPOND,
        Permission.FINANCE_VIEW,
        Permission.TEAM_VIEW,
    ],
    
    UserRole.SUPERVISEUR: [
        Permission.PROJECT_READ,
        Permission.TASK_READ, Permission.TASK_UPDATE,
        Permission.REPORT_CREATE, Permission.REPORT_READ,
        Permission.RFI_CREATE, Permission.RFI_READ,
        Permission.TEAM_VIEW,
    ],
    
    UserRole.TECHNICIEN: [
        Permission.PROJECT_READ,
        Permission.TASK_READ, Permission.TASK_UPDATE,
        Permission.REPORT_CREATE, Permission.REPORT_READ,
        Permission.RFI_CREATE, Permission.RFI_READ,
    ],
    
    UserRole.SOUS_TRAITANT: [
        Permission.PROJECT_READ,
        Permission.TASK_READ,
        Permission.REPORT_READ,
        Permission.RFI_READ,
    ],
    
    UserRole.CLIENT: [
        Permission.PROJECT_READ,
        Permission.REPORT_READ,
        Permission.RFI_READ,
    ],
    
    UserRole.INVITE: [
        Permission.PROJECT_READ,
    ],
}

# ============================================================
# MODÈLES PYDANTIC
# ============================================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    role: UserRole = UserRole.TECHNICIEN
    company_id: Optional[str] = None
    phone: Optional[str] = None

class UserInDB(BaseModel):
    id: str
    email: EmailStr
    hashed_password: str
    full_name: str
    role: UserRole
    company_id: Optional[str]
    phone: Optional[str]
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    last_login: Optional[datetime] = None
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    permissions: List[str]
    company_id: Optional[str]
    is_active: bool

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class TokenData(BaseModel):
    user_id: str
    email: str
    role: UserRole
    scopes: List[str] = []
    exp: datetime

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

# ============================================================
# SERVICE D'AUTHENTIFICATION
# ============================================================

class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.oauth2_scheme = OAuth2PasswordBearer(
            tokenUrl="auth/login",
            scopes={p.value: p.value for p in Permission}
        )
    
    # Password Hashing
    def hash_password(self, password: str) -> str:
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain: str, hashed: str) -> bool:
        return self.pwd_context.verify(plain, hashed)
    
    # Token Generation
    def create_access_token(self, user: UserInDB, scopes: List[str] = None) -> str:
        permissions = [p.value for p in ROLE_PERMISSIONS.get(user.role, [])]
        expire = datetime.utcnow() + timedelta(minutes=AuthConfig.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        payload = {
            "sub": user.id,
            "email": user.email,
            "role": user.role.value,
            "scopes": scopes or permissions,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        return jwt.encode(payload, AuthConfig.SECRET_KEY, algorithm=AuthConfig.ALGORITHM)
    
    def create_refresh_token(self, user: UserInDB) -> str:
        expire = datetime.utcnow() + timedelta(days=AuthConfig.REFRESH_TOKEN_EXPIRE_DAYS)
        payload = {
            "sub": user.id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        return jwt.encode(payload, AuthConfig.SECRET_KEY, algorithm=AuthConfig.ALGORITHM)
    
    def decode_token(self, token: str) -> TokenData:
        try:
            payload = jwt.decode(token, AuthConfig.SECRET_KEY, algorithms=[AuthConfig.ALGORITHM])
            return TokenData(
                user_id=payload["sub"],
                email=payload["email"],
                role=UserRole(payload["role"]),
                scopes=payload.get("scopes", []),
                exp=datetime.fromtimestamp(payload["exp"])
            )
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token invalide: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"}
            )
    
    # Account Security
    def check_account_locked(self, user: UserInDB) -> bool:
        if user.locked_until and user.locked_until > datetime.utcnow():
            return True
        return False
    
    def record_failed_login(self, user: UserInDB) -> UserInDB:
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= AuthConfig.MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=AuthConfig.LOCKOUT_DURATION_MINUTES)
        return user
    
    def reset_failed_logins(self, user: UserInDB) -> UserInDB:
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login = datetime.utcnow()
        return user

auth_service = AuthService()

# ============================================================
# DÉPENDANCES FASTAPI
# ============================================================

async def get_current_user(
    security_scopes: SecurityScopes,
    token: str = Depends(auth_service.oauth2_scheme)
) -> UserInDB:
    """Valide le token et retourne l'utilisateur courant"""
    
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"
    
    token_data = auth_service.decode_token(token)
    
    # Vérifier les scopes requis
    for scope in security_scopes.scopes:
        if scope not in token_data.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission manquante: {scope}",
                headers={"WWW-Authenticate": authenticate_value}
            )
    
    # Charger l'utilisateur depuis la DB (simulé ici)
    user = await get_user_from_db(token_data.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur inactif ou non trouvé"
        )
    
    return user

def require_permissions(*permissions: Permission):
    """Décorateur pour exiger des permissions spécifiques"""
    def decorator(func):
        async def wrapper(*args, current_user: UserInDB = Security(get_current_user, scopes=[p.value for p in permissions]), **kwargs):
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# ============================================================
# ROUTES API AUTH
# ============================================================

app = FastAPI(title="ROADY Auth API")

@app.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Inscription d'un nouvel utilisateur"""
    # Vérifier si email existe déjà
    existing = await get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Créer l'utilisateur
    user = UserInDB(
        id=secrets.token_urlsafe(16),
        email=user_data.email,
        hashed_password=auth_service.hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        company_id=user_data.company_id,
        phone=user_data.phone,
        created_at=datetime.utcnow()
    )
    
    await save_user(user)
    
    # Envoyer email de vérification
    await send_verification_email(user)
    
    permissions = [p.value for p in ROLE_PERMISSIONS.get(user.role, [])]
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        permissions=permissions,
        company_id=user.company_id,
        is_active=user.is_active
    )

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Connexion utilisateur"""
    user = await get_user_by_email(form_data.username)
    
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if auth_service.check_account_locked(user):
        raise HTTPException(status_code=423, detail="Compte verrouillé. Réessayez plus tard.")
    
    if not auth_service.verify_password(form_data.password, user.hashed_password):
        user = auth_service.record_failed_login(user)
        await save_user(user)
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    # Reset failed attempts on success
    user = auth_service.reset_failed_logins(user)
    await save_user(user)
    
    # Générer les tokens
    access_token = auth_service.create_access_token(user, form_data.scopes)
    refresh_token = auth_service.create_refresh_token(user)
    
    permissions = [p.value for p in ROLE_PERMISSIONS.get(user.role, [])]
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=AuthConfig.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            permissions=permissions,
            company_id=user.company_id,
            is_active=user.is_active
        )
    )

@app.post("/auth/refresh", response_model=Token)
async def refresh_token(refresh_token: str):
    """Rafraîchir le token d'accès"""
    try:
        payload = jwt.decode(refresh_token, AuthConfig.SECRET_KEY, algorithms=[AuthConfig.ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token invalide")
        
        user = await get_user_from_db(payload["sub"])
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Utilisateur invalide")
        
        new_access = auth_service.create_access_token(user)
        new_refresh = auth_service.create_refresh_token(user)
        
        permissions = [p.value for p in ROLE_PERMISSIONS.get(user.role, [])]
        
        return Token(
            access_token=new_access,
            refresh_token=new_refresh,
            expires_in=AuthConfig.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse(
                id=user.id, email=user.email, full_name=user.full_name,
                role=user.role, permissions=permissions,
                company_id=user.company_id, is_active=user.is_active
            )
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Token refresh invalide")

@app.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: UserInDB = Security(get_current_user)):
    """Obtenir le profil de l'utilisateur connecté"""
    permissions = [p.value for p in ROLE_PERMISSIONS.get(current_user.role, [])]
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        permissions=permissions,
        company_id=current_user.company_id,
        is_active=current_user.is_active
    )

@app.post("/auth/password/change")
async def change_password(
    data: PasswordChange,
    current_user: UserInDB = Security(get_current_user)
):
    """Changer le mot de passe"""
    if not auth_service.verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    
    current_user.hashed_password = auth_service.hash_password(data.new_password)
    await save_user(current_user)
    
    return {"message": "Mot de passe modifié avec succès"}

@app.post("/auth/logout")
async def logout(current_user: UserInDB = Security(get_current_user)):
    """Déconnexion (invalidation du token côté client)"""
    # En production: ajouter le token à une blacklist Redis
    return {"message": "Déconnexion réussie"}

# Exemple d'endpoint protégé par permission
@app.get("/projects")
async def list_projects(
    current_user: UserInDB = Security(get_current_user, scopes=[Permission.PROJECT_READ.value])
):
    """Liste les projets (nécessite permission project:read)"""
    return {"projects": [], "user": current_user.full_name}

@app.post("/projects")
async def create_project(
    current_user: UserInDB = Security(get_current_user, scopes=[Permission.PROJECT_CREATE.value])
):
    """Créer un projet (nécessite permission project:create)"""
    return {"message": "Projet créé", "created_by": current_user.full_name}

# ============================================================
# FONCTIONS DB (À IMPLÉMENTER)
# ============================================================

async def get_user_from_db(user_id: str) -> Optional[UserInDB]:
    """Récupère un utilisateur par ID"""
    pass

async def get_user_by_email(email: str) -> Optional[UserInDB]:
    """Récupère un utilisateur par email"""
    pass

async def save_user(user: UserInDB) -> None:
    """Sauvegarde un utilisateur"""
    pass

async def send_verification_email(user: UserInDB) -> None:
    """Envoie l'email de vérification"""
    pass
