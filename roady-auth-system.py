"""
ROADY Construction - Système d'Authentification Complet
OAuth2 + JWT + RBAC (Role-Based Access Control)
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Set
from enum import Enum
from pydantic import BaseModel, EmailStr, Field
from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, SecurityScopes
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
import hashlib

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
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    DIRECTEUR = "directeur"
    CHEF_PROJET = "chef_projet"
    SUPERVISEUR = "superviseur"
    TECHNICIEN = "technicien"
    SOUS_TRAITANT = "sous_traitant"
    CLIENT = "client"
    INVITE = "invite"

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
    # Finance
    FINANCE_VIEW = "finance:view"
    FINANCE_EDIT = "finance:edit"
    FINANCE_APPROVE = "finance:approve"
    # Admin
    ADMIN_USERS = "admin:users"
    ADMIN_SETTINGS = "admin:settings"
    ADMIN_AUDIT = "admin:audit"
    # Agents IA
    AGENT_USE = "agent:use"
    AGENT_CONFIG = "agent:config"
    AGENT_ADMIN = "agent:admin"

# Matrice des permissions par rôle
ROLE_PERMISSIONS: Dict[UserRole, Set[Permission]] = {
    UserRole.SUPER_ADMIN: set(Permission),  # Toutes les permissions
    UserRole.ADMIN: {
        Permission.PROJECT_CREATE, Permission.PROJECT_READ, Permission.PROJECT_UPDATE,
        Permission.PROJECT_DELETE, Permission.PROJECT_ARCHIVE,
        Permission.TASK_CREATE, Permission.TASK_READ, Permission.TASK_UPDATE,
        Permission.TASK_DELETE, Permission.TASK_ASSIGN,
        Permission.REPORT_CREATE, Permission.REPORT_READ, Permission.REPORT_APPROVE,
        Permission.REPORT_EXPORT, Permission.FINANCE_VIEW, Permission.FINANCE_EDIT,
        Permission.ADMIN_USERS, Permission.ADMIN_SETTINGS,
        Permission.AGENT_USE, Permission.AGENT_CONFIG,
    },
    UserRole.DIRECTEUR: {
        Permission.PROJECT_CREATE, Permission.PROJECT_READ, Permission.PROJECT_UPDATE,
        Permission.PROJECT_ARCHIVE, Permission.TASK_CREATE, Permission.TASK_READ,
        Permission.TASK_UPDATE, Permission.TASK_ASSIGN, Permission.REPORT_CREATE,
        Permission.REPORT_READ, Permission.REPORT_APPROVE, Permission.REPORT_EXPORT,
        Permission.FINANCE_VIEW, Permission.AGENT_USE, Permission.AGENT_CONFIG,
    },
    UserRole.CHEF_PROJET: {
        Permission.PROJECT_READ, Permission.PROJECT_UPDATE,
        Permission.TASK_CREATE, Permission.TASK_READ, Permission.TASK_UPDATE,
        Permission.TASK_ASSIGN, Permission.REPORT_CREATE, Permission.REPORT_READ,
        Permission.REPORT_EXPORT, Permission.FINANCE_VIEW, Permission.AGENT_USE,
    },
    UserRole.SUPERVISEUR: {
        Permission.PROJECT_READ, Permission.TASK_READ, Permission.TASK_UPDATE,
        Permission.REPORT_CREATE, Permission.REPORT_READ, Permission.AGENT_USE,
    },
    UserRole.TECHNICIEN: {
        Permission.PROJECT_READ, Permission.TASK_READ, Permission.TASK_UPDATE,
        Permission.REPORT_CREATE, Permission.REPORT_READ,
    },
    UserRole.SOUS_TRAITANT: {
        Permission.PROJECT_READ, Permission.TASK_READ, Permission.REPORT_READ,
    },
    UserRole.CLIENT: {
        Permission.PROJECT_READ, Permission.REPORT_READ,
    },
    UserRole.INVITE: {
        Permission.PROJECT_READ,
    },
}

# ============================================================
# MODÈLES PYDANTIC
# ============================================================

class UserBase(BaseModel):
    email: EmailStr
    nom: str
    prenom: str
    role: UserRole = UserRole.TECHNICIEN
    entreprise_id: Optional[str] = None
    equipe_ids: List[str] = []
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserInDB(UserBase):
    id: str
    hashed_password: str
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    login_attempts: int = 0
    locked_until: Optional[datetime] = None
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    user_id: str
    email: str
    role: UserRole
    permissions: List[str]
    scopes: List[str] = []

# ============================================================
# SERVICE D'AUTHENTIFICATION
# ============================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token",
    scopes={p.value: p.value for p in Permission}
)

class AuthService:
    def __init__(self):
        self.users_db: Dict[str, UserInDB] = {}
        self.refresh_tokens: Dict[str, str] = {}
    
    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)
    
    def verify_password(self, plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)
    
    def create_access_token(self, user: UserInDB, scopes: List[str] = []) -> str:
        permissions = [p.value for p in ROLE_PERMISSIONS.get(user.role, set())]
        expire = datetime.utcnow() + timedelta(minutes=AuthConfig.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": user.id,
            "email": user.email,
            "role": user.role.value,
            "permissions": permissions,
            "scopes": scopes,
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
            "type": "refresh",
            "jti": secrets.token_urlsafe(32)
        }
        token = jwt.encode(payload, AuthConfig.SECRET_KEY, algorithm=AuthConfig.ALGORITHM)
        self.refresh_tokens[payload["jti"]] = user.id
        return token
    
    def verify_token(self, token: str, token_type: str = "access") -> TokenData:
        try:
            payload = jwt.decode(token, AuthConfig.SECRET_KEY, algorithms=[AuthConfig.ALGORITHM])
            if payload.get("type") != token_type:
                raise HTTPException(status_code=401, detail="Invalid token type")
            return TokenData(
                user_id=payload["sub"],
                email=payload.get("email", ""),
                role=UserRole(payload.get("role", "invite")),
                permissions=payload.get("permissions", []),
                scopes=payload.get("scopes", [])
            )
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    async def authenticate(self, email: str, password: str) -> Optional[UserInDB]:
        user = self.get_user_by_email(email)
        if not user:
            return None
        if user.locked_until and user.locked_until > datetime.utcnow():
            raise HTTPException(status_code=423, detail="Account locked")
        if not self.verify_password(password, user.hashed_password):
            user.login_attempts += 1
            if user.login_attempts >= AuthConfig.MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(minutes=AuthConfig.LOCKOUT_DURATION_MINUTES)
            return None
        user.login_attempts = 0
        user.last_login = datetime.utcnow()
        return user
    
    def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        for user in self.users_db.values():
            if user.email == email:
                return user
        return None
    
    def has_permission(self, user: UserInDB, permission: Permission) -> bool:
        return permission in ROLE_PERMISSIONS.get(user.role, set())

auth_service = AuthService()

# ============================================================
# DÉPENDANCES FASTAPI
# ============================================================

async def get_current_user(
    security_scopes: SecurityScopes,
    token: str = Depends(oauth2_scheme)
) -> TokenData:
    token_data = auth_service.verify_token(token)
    for scope in security_scopes.scopes:
        if scope not in token_data.permissions:
            raise HTTPException(
                status_code=403,
                detail=f"Permission required: {scope}"
            )
    return token_data

def require_permissions(*permissions: Permission):
    async def checker(current_user: TokenData = Depends(get_current_user)):
        for perm in permissions:
            if perm.value not in current_user.permissions:
                raise HTTPException(status_code=403, detail=f"Missing: {perm.value}")
        return current_user
    return checker

# ============================================================
# ROUTES API
# ============================================================

app = FastAPI(title="ROADY Auth API")

@app.post("/auth/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await auth_service.authenticate(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return Token(
        access_token=auth_service.create_access_token(user, form_data.scopes),
        refresh_token=auth_service.create_refresh_token(user),
        expires_in=AuthConfig.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@app.post("/auth/refresh", response_model=Token)
async def refresh(refresh_token: str):
    token_data = auth_service.verify_token(refresh_token, "refresh")
    user = auth_service.users_db.get(token_data.user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return Token(
        access_token=auth_service.create_access_token(user),
        refresh_token=auth_service.create_refresh_token(user),
        expires_in=AuthConfig.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@app.get("/auth/me")
async def get_me(current_user: TokenData = Depends(get_current_user)):
    return current_user

@app.get("/projects", dependencies=[Depends(require_permissions(Permission.PROJECT_READ))])
async def list_projects():
    return {"message": "Projects list"}

@app.post("/projects", dependencies=[Depends(require_permissions(Permission.PROJECT_CREATE))])
async def create_project():
    return {"message": "Project created"}
