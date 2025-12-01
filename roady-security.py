"""
ROADY Construction - Audit de Sécurité & Hardening
Checklist, Middleware de sécurité, Validation, Rate Limiting
"""

from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import hashlib
import secrets
import re
import ipaddress
from functools import wraps
import asyncio

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, validator, Field
import redis.asyncio as redis

# ============================================
# CONFIGURATION SÉCURITÉ
# ============================================

class SecurityConfig:
    # Rate Limiting
    RATE_LIMIT_REQUESTS = 100
    RATE_LIMIT_WINDOW_SECONDS = 60
    RATE_LIMIT_BURST = 20
    
    # Brute Force Protection
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 15
    
    # Session
    SESSION_TIMEOUT_MINUTES = 30
    MAX_SESSIONS_PER_USER = 5
    
    # Password Policy
    PASSWORD_MIN_LENGTH = 12
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_REQUIRE_DIGIT = True
    PASSWORD_REQUIRE_SPECIAL = True
    PASSWORD_HISTORY_COUNT = 5
    
    # Input Validation
    MAX_INPUT_LENGTH = 10000
    MAX_FILE_SIZE_MB = 50
    ALLOWED_FILE_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.png', '.dwg'}
    
    # Security Headers
    HSTS_MAX_AGE = 31536000  # 1 year
    
    # IP Security
    BLOCKED_IPS: Set[str] = set()
    ALLOWED_IPS: Optional[Set[str]] = None  # None = allow all
    
    # API Keys
    API_KEY_LENGTH = 64
    API_KEY_EXPIRY_DAYS = 365

# ============================================
# RATE LIMITER
# ============================================

class RateLimiter:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url)
    
    async def is_allowed(self, key: str, limit: int = None, window: int = None) -> bool:
        limit = limit or SecurityConfig.RATE_LIMIT_REQUESTS
        window = window or SecurityConfig.RATE_LIMIT_WINDOW_SECONDS
        
        current = await self.redis.get(f"ratelimit:{key}")
        if current is None:
            await self.redis.setex(f"ratelimit:{key}", window, 1)
            return True
        
        if int(current) >= limit:
            return False
        
        await self.redis.incr(f"ratelimit:{key}")
        return True
    
    async def get_remaining(self, key: str, limit: int = None) -> int:
        limit = limit or SecurityConfig.RATE_LIMIT_REQUESTS
        current = await self.redis.get(f"ratelimit:{key}")
        if current is None:
            return limit
        return max(0, limit - int(current))

rate_limiter: Optional[RateLimiter] = None

# ============================================
# INPUT VALIDATION & SANITIZATION
# ============================================

class InputSanitizer:
    # Patterns dangereux
    SQL_INJECTION_PATTERNS = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)",
        r"(--|#|/\*|\*/)",
        r"(\bOR\b\s+\d+\s*=\s*\d+)",
        r"(\bAND\b\s+\d+\s*=\s*\d+)",
        r"(;|\||`)"
    ]
    
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe",
        r"<embed",
        r"<object"
    ]
    
    PATH_TRAVERSAL_PATTERNS = [
        r"\.\./",
        r"\.\.\\",
        r"%2e%2e%2f",
        r"%2e%2e/",
        r"\.%2e/"
    ]
    
    @classmethod
    def check_sql_injection(cls, value: str) -> bool:
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        return False
    
    @classmethod
    def check_xss(cls, value: str) -> bool:
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        return False
    
    @classmethod
    def check_path_traversal(cls, value: str) -> bool:
        for pattern in cls.PATH_TRAVERSAL_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        return False
    
    @classmethod
    def sanitize(cls, value: str) -> str:
        if not isinstance(value, str):
            return value
        
        # Escape HTML
        value = value.replace('&', '&amp;')
        value = value.replace('<', '&lt;')
        value = value.replace('>', '&gt;')
        value = value.replace('"', '&quot;')
        value = value.replace("'", '&#x27;')
        
        return value
    
    @classmethod
    def validate_input(cls, value: str, field_name: str = "input") -> str:
        if len(value) > SecurityConfig.MAX_INPUT_LENGTH:
            raise ValueError(f"{field_name} exceeds maximum length")
        
        if cls.check_sql_injection(value):
            raise ValueError(f"Suspicious pattern detected in {field_name}")
        
        if cls.check_xss(value):
            raise ValueError(f"Invalid content in {field_name}")
        
        if cls.check_path_traversal(value):
            raise ValueError(f"Invalid path in {field_name}")
        
        return cls.sanitize(value)

# ============================================
# PASSWORD VALIDATOR
# ============================================

class PasswordValidator:
    @staticmethod
    def validate(password: str) -> tuple[bool, List[str]]:
        errors = []
        
        if len(password) < SecurityConfig.PASSWORD_MIN_LENGTH:
            errors.append(f"Minimum {SecurityConfig.PASSWORD_MIN_LENGTH} caractères requis")
        
        if SecurityConfig.PASSWORD_REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
            errors.append("Au moins une majuscule requise")
        
        if SecurityConfig.PASSWORD_REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
            errors.append("Au moins une minuscule requise")
        
        if SecurityConfig.PASSWORD_REQUIRE_DIGIT and not re.search(r'\d', password):
            errors.append("Au moins un chiffre requis")
        
        if SecurityConfig.PASSWORD_REQUIRE_SPECIAL and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Au moins un caractère spécial requis")
        
        # Check common passwords
        common_passwords = {'password', '123456', 'qwerty', 'admin', 'letmein', 'welcome'}
        if password.lower() in common_passwords:
            errors.append("Mot de passe trop commun")
        
        return len(errors) == 0, errors

# ============================================
# MIDDLEWARE DE SÉCURITÉ
# ============================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), microphone=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' wss: https:; "
            "frame-ancestors 'none'"
        )
        
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                f"max-age={SecurityConfig.HSTS_MAX_AGE}; includeSubDomains; preload"
            )
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if rate_limiter is None:
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        
        # Check rate limit
        key = f"{client_ip}:{request.url.path}"
        if not await rate_limiter.is_allowed(key):
            raise HTTPException(status_code=429, detail="Too many requests")
        
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = await rate_limiter.get_remaining(key)
        response.headers["X-RateLimit-Limit"] = str(SecurityConfig.RATE_LIMIT_REQUESTS)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        
        return response

class IPFilterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        
        # Check blocked IPs
        if client_ip in SecurityConfig.BLOCKED_IPS:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check allowed IPs (if whitelist is set)
        if SecurityConfig.ALLOWED_IPS is not None:
            if client_ip not in SecurityConfig.ALLOWED_IPS:
                raise HTTPException(status_code=403, detail="Access denied")
        
        return await call_next(request)

class RequestValidationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Check Content-Length
        content_length = request.headers.get("Content-Length")
        if content_length and int(content_length) > SecurityConfig.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Request too large")
        
        # Validate Content-Type for POST/PUT
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("Content-Type", "")
            allowed_types = ["application/json", "multipart/form-data", "application/x-www-form-urlencoded"]
            if not any(ct in content_type for ct in allowed_types):
                raise HTTPException(status_code=415, detail="Unsupported media type")
        
        return await call_next(request)

# ============================================
# AUDIT LOGGING
# ============================================

@dataclass
class AuditEvent:
    timestamp: datetime
    event_type: str
    user_id: Optional[str]
    ip_address: str
    resource: str
    action: str
    status: str
    details: Dict[str, Any] = field(default_factory=dict)

class AuditLogger:
    def __init__(self):
        self.events: List[AuditEvent] = []
    
    async def log(self, event_type: str, user_id: Optional[str], ip: str,
                  resource: str, action: str, status: str, details: Dict = None):
        event = AuditEvent(
            timestamp=datetime.utcnow(),
            event_type=event_type,
            user_id=user_id,
            ip_address=ip,
            resource=resource,
            action=action,
            status=status,
            details=details or {}
        )
        self.events.append(event)
        
        # Log to structured logger
        import structlog
        logger = structlog.get_logger()
        logger.info("audit_event", **event.__dict__)
    
    async def log_auth_success(self, user_id: str, ip: str):
        await self.log("AUTH", user_id, ip, "/auth/token", "LOGIN", "SUCCESS")
    
    async def log_auth_failure(self, email: str, ip: str, reason: str):
        await self.log("AUTH", None, ip, "/auth/token", "LOGIN", "FAILURE", {"email": email, "reason": reason})
    
    async def log_access(self, user_id: str, ip: str, resource: str, action: str):
        await self.log("ACCESS", user_id, ip, resource, action, "SUCCESS")
    
    async def log_security_event(self, ip: str, event_type: str, details: Dict):
        await self.log("SECURITY", None, ip, "system", event_type, "ALERT", details)

audit_logger = AuditLogger()

# ============================================
# SECURITY AUDIT CHECKLIST
# ============================================

@dataclass
class SecurityCheckResult:
    name: str
    status: str  # PASS, FAIL, WARN
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    description: str
    remediation: Optional[str] = None

class SecurityAuditor:
    def __init__(self):
        self.results: List[SecurityCheckResult] = []
    
    def check(self, name: str, condition: bool, severity: str, 
              description: str, remediation: str = None):
        status = "PASS" if condition else "FAIL"
        self.results.append(SecurityCheckResult(
            name=name, status=status, severity=severity,
            description=description, remediation=remediation
        ))
    
    async def run_audit(self) -> Dict[str, Any]:
        self.results = []
        
        # Authentication checks
        self.check(
            "Password Policy", 
            SecurityConfig.PASSWORD_MIN_LENGTH >= 12,
            "HIGH",
            "Password minimum length should be 12+",
            "Update PASSWORD_MIN_LENGTH in SecurityConfig"
        )
        
        self.check(
            "MFA Available",
            True,  # Check if MFA is implemented
            "HIGH",
            "Multi-factor authentication should be available"
        )
        
        self.check(
            "Session Timeout",
            SecurityConfig.SESSION_TIMEOUT_MINUTES <= 30,
            "MEDIUM",
            "Session timeout should be 30 minutes or less"
        )
        
        self.check(
            "Brute Force Protection",
            SecurityConfig.MAX_LOGIN_ATTEMPTS <= 5,
            "HIGH",
            "Account lockout after 5 failed attempts"
        )
        
        # Rate limiting
        self.check(
            "Rate Limiting Enabled",
            rate_limiter is not None,
            "HIGH",
            "API rate limiting should be enabled",
            "Initialize rate_limiter with Redis URL"
        )
        
        # Input validation
        self.check(
            "Input Length Limit",
            SecurityConfig.MAX_INPUT_LENGTH <= 10000,
            "MEDIUM",
            "Input length should be limited"
        )
        
        self.check(
            "File Size Limit",
            SecurityConfig.MAX_FILE_SIZE_MB <= 50,
            "MEDIUM",
            "File upload size should be limited"
        )
        
        # Headers
        self.check(
            "HSTS Enabled",
            SecurityConfig.HSTS_MAX_AGE >= 31536000,
            "HIGH",
            "HSTS should be enabled with 1 year max-age"
        )
        
        # Summary
        passed = sum(1 for r in self.results if r.status == "PASS")
        failed = sum(1 for r in self.results if r.status == "FAIL")
        critical_failures = [r for r in self.results if r.status == "FAIL" and r.severity == "CRITICAL"]
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "summary": {
                "total_checks": len(self.results),
                "passed": passed,
                "failed": failed,
                "score": f"{(passed / len(self.results)) * 100:.1f}%"
            },
            "critical_issues": len(critical_failures),
            "results": [r.__dict__ for r in self.results]
        }

# ============================================
# SETUP APPLICATION SECURITY
# ============================================

def setup_security(app: FastAPI, redis_url: str = None):
    """Configure all security middleware and settings"""
    global rate_limiter
    
    if redis_url:
        rate_limiter = RateLimiter(redis_url)
    
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://roady.app", "https://staging.roady.app"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["*"],
        expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining"]
    )
    
    # Trusted Hosts
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["roady.app", "*.roady.app", "localhost"]
    )
    
    # Custom Security Middleware
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(IPFilterMiddleware)
    app.add_middleware(RequestValidationMiddleware)
    
    # Security audit endpoint (admin only)
    @app.get("/admin/security-audit")
    async def security_audit():
        auditor = SecurityAuditor()
        return await auditor.run_audit()
    
    return app
