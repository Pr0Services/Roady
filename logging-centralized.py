"""
ROADY Construction - Système de Logging Centralisé
Structured Logging + Correlation IDs + Log Aggregation
"""

import logging
import sys
import json
import uuid
from datetime import datetime
from typing import Optional, Any, Dict
from contextvars import ContextVar
from functools import wraps
import traceback

from pydantic import BaseModel
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# ============================================================
# CONTEXT VARIABLES (Thread-safe)
# ============================================================

# Correlation ID pour tracer les requêtes
correlation_id_var: ContextVar[str] = ContextVar('correlation_id', default='')
user_id_var: ContextVar[str] = ContextVar('user_id', default='')
request_id_var: ContextVar[str] = ContextVar('request_id', default='')

# ============================================================
# LOG MODELS
# ============================================================

class LogContext(BaseModel):
    """Contexte attaché à chaque log"""
    correlation_id: Optional[str] = None
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    service: str = "roady-api"
    environment: str = "development"
    version: str = "1.0.0"

class LogEntry(BaseModel):
    """Structure d'un log"""
    timestamp: str
    level: str
    message: str
    logger: str
    context: LogContext
    extra: Dict[str, Any] = {}
    exception: Optional[Dict[str, Any]] = None

# ============================================================
# JSON FORMATTER
# ============================================================

class JSONFormatter(logging.Formatter):
    """Formatter qui produit des logs JSON structurés"""
    
    def __init__(self, service: str = "roady-api", environment: str = "development"):
        super().__init__()
        self.service = service
        self.environment = environment
    
    def format(self, record: logging.LogRecord) -> str:
        # Contexte de base
        context = LogContext(
            correlation_id=correlation_id_var.get() or None,
            request_id=request_id_var.get() or None,
            user_id=user_id_var.get() or None,
            service=self.service,
            environment=self.environment,
        )
        
        # Données supplémentaires
        extra = {}
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname',
                          'filename', 'module', 'exc_info', 'exc_text', 'stack_info',
                          'lineno', 'funcName', 'created', 'msecs', 'relativeCreated',
                          'thread', 'threadName', 'processName', 'process', 'message']:
                if not key.startswith('_'):
                    extra[key] = value
        
        # Exception info
        exception_info = None
        if record.exc_info:
            exception_info = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": traceback.format_exception(*record.exc_info) if record.exc_info[2] else None
            }
        
        # Construire le log entry
        log_entry = LogEntry(
            timestamp=datetime.utcnow().isoformat() + "Z",
            level=record.levelname,
            message=record.getMessage(),
            logger=record.name,
            context=context,
            extra=extra,
            exception=exception_info
        )
        
        return log_entry.model_dump_json()

# ============================================================
# CONSOLE FORMATTER (pour développement)
# ============================================================

class ColoredConsoleFormatter(logging.Formatter):
    """Formatter coloré pour la console en développement"""
    
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        
        # Timestamp
        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        
        # Correlation ID
        corr_id = correlation_id_var.get()
        corr_str = f"[{corr_id[:8]}]" if corr_id else ""
        
        # Format message
        message = f"{color}{timestamp}{self.RESET} {corr_str} {color}{record.levelname:8}{self.RESET} {record.name}: {record.getMessage()}"
        
        # Add exception if present
        if record.exc_info:
            message += f"\n{self._formatException(record.exc_info)}"
        
        return message

# ============================================================
# LOGGER SETUP
# ============================================================

def setup_logging(
    service: str = "roady-api",
    environment: str = "development",
    log_level: str = "INFO",
    json_output: bool = None
) -> logging.Logger:
    """Configure le système de logging"""
    
    # Auto-detect JSON output
    if json_output is None:
        json_output = environment in ["production", "staging"]
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level.upper()))
    
    if json_output:
        console_handler.setFormatter(JSONFormatter(service, environment))
    else:
        console_handler.setFormatter(ColoredConsoleFormatter())
    
    root_logger.addHandler(console_handler)
    
    # File handler (always JSON)
    try:
        file_handler = logging.FileHandler(f"logs/{service}.log")
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(JSONFormatter(service, environment))
        root_logger.addHandler(file_handler)
    except Exception:
        pass  # Ignore if logs directory doesn't exist
    
    # Silence noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    
    return root_logger

# ============================================================
# CUSTOM LOGGER
# ============================================================

class ROADYLogger:
    """Logger personnalisé avec méthodes utilitaires"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def _log(self, level: int, message: str, **kwargs):
        """Log avec contexte enrichi"""
        extra = {
            'correlation_id': correlation_id_var.get(),
            'user_id': user_id_var.get(),
            **kwargs
        }
        self.logger.log(level, message, extra=extra)
    
    def debug(self, message: str, **kwargs):
        self._log(logging.DEBUG, message, **kwargs)
    
    def info(self, message: str, **kwargs):
        self._log(logging.INFO, message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self._log(logging.WARNING, message, **kwargs)
    
    def error(self, message: str, exc_info: bool = False, **kwargs):
        self._log(logging.ERROR, message, **kwargs)
        if exc_info:
            self.logger.exception(message)
    
    def critical(self, message: str, **kwargs):
        self._log(logging.CRITICAL, message, **kwargs)
    
    # Méthodes spécialisées ROADY
    
    def api_request(self, method: str, path: str, status: int, duration_ms: float, **kwargs):
        """Log une requête API"""
        self.info(
            f"{method} {path} -> {status} ({duration_ms:.2f}ms)",
            event_type="api_request",
            http_method=method,
            http_path=path,
            http_status=status,
            duration_ms=duration_ms,
            **kwargs
        )
    
    def db_query(self, query_type: str, table: str, duration_ms: float, rows: int = 0, **kwargs):
        """Log une requête DB"""
        self.debug(
            f"DB {query_type} on {table}: {rows} rows ({duration_ms:.2f}ms)",
            event_type="db_query",
            query_type=query_type,
            table=table,
            duration_ms=duration_ms,
            rows_affected=rows,
            **kwargs
        )
    
    def llm_request(self, provider: str, model: str, tokens: int, cost: float, duration_ms: float, **kwargs):
        """Log une requête LLM"""
        self.info(
            f"LLM {provider}/{model}: {tokens} tokens, ${cost:.4f} ({duration_ms:.0f}ms)",
            event_type="llm_request",
            llm_provider=provider,
            llm_model=model,
            llm_tokens=tokens,
            llm_cost_usd=cost,
            duration_ms=duration_ms,
            **kwargs
        )
    
    def auth_event(self, event: str, user_email: str = None, success: bool = True, **kwargs):
        """Log un événement d'authentification"""
        level = logging.INFO if success else logging.WARNING
        self._log(
            level,
            f"Auth {event}: {user_email or 'unknown'} - {'success' if success else 'failed'}",
            event_type="auth",
            auth_event=event,
            auth_success=success,
            user_email=user_email,
            **kwargs
        )
    
    def business_event(self, event: str, entity_type: str, entity_id: str, **kwargs):
        """Log un événement métier"""
        self.info(
            f"Business event: {event} on {entity_type}/{entity_id}",
            event_type="business",
            business_event=event,
            entity_type=entity_type,
            entity_id=entity_id,
            **kwargs
        )

def get_logger(name: str) -> ROADYLogger:
    """Factory pour obtenir un logger"""
    return ROADYLogger(name)

# ============================================================
# FASTAPI MIDDLEWARE
# ============================================================

class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware pour logger toutes les requêtes HTTP"""
    
    def __init__(self, app, logger: ROADYLogger = None):
        super().__init__(app)
        self.logger = logger or get_logger("roady.http")
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Generate IDs
        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        request_id = str(uuid.uuid4())
        
        # Set context variables
        correlation_id_var.set(correlation_id)
        request_id_var.set(request_id)
        
        # Extract user from token if available
        # (À adapter selon votre système d'auth)
        
        # Start timer
        start_time = datetime.now()
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = (datetime.now() - start_time).total_seconds() * 1000
            
            # Log request
            self.logger.api_request(
                method=request.method,
                path=request.url.path,
                status=response.status_code,
                duration_ms=duration,
                client_ip=request.client.host if request.client else None,
                user_agent=request.headers.get("User-Agent"),
            )
            
            # Add correlation ID to response
            response.headers["X-Correlation-ID"] = correlation_id
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds() * 1000
            self.logger.error(
                f"Request failed: {str(e)}",
                exc_info=True,
                http_method=request.method,
                http_path=request.url.path,
                duration_ms=duration,
            )
            raise

# ============================================================
# DECORATORS
# ============================================================

def log_function_call(logger: ROADYLogger = None):
    """Décorateur pour logger les appels de fonction"""
    def decorator(func):
        nonlocal logger
        if logger is None:
            logger = get_logger(func.__module__)
        
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start = datetime.now()
            try:
                result = await func(*args, **kwargs)
                duration = (datetime.now() - start).total_seconds() * 1000
                logger.debug(f"{func.__name__} completed in {duration:.2f}ms")
                return result
            except Exception as e:
                duration = (datetime.now() - start).total_seconds() * 1000
                logger.error(f"{func.__name__} failed after {duration:.2f}ms: {str(e)}", exc_info=True)
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start = datetime.now()
            try:
                result = func(*args, **kwargs)
                duration = (datetime.now() - start).total_seconds() * 1000
                logger.debug(f"{func.__name__} completed in {duration:.2f}ms")
                return result
            except Exception as e:
                duration = (datetime.now() - start).total_seconds() * 1000
                logger.error(f"{func.__name__} failed after {duration:.2f}ms: {str(e)}", exc_info=True)
                raise
        
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator

# ============================================================
# INTEGRATION FASTAPI
# ============================================================

def configure_app_logging(app, environment: str = "development"):
    """Configure le logging pour une app FastAPI"""
    from fastapi import FastAPI
    
    # Setup logging
    setup_logging(
        service="roady-api",
        environment=environment,
        log_level="DEBUG" if environment == "development" else "INFO"
    )
    
    # Add middleware
    logger = get_logger("roady.http")
    app.add_middleware(LoggingMiddleware, logger=logger)
    
    # Startup log
    @app.on_event("startup")
    async def log_startup():
        logger.info(
            f"🚀 ROADY API starting",
            event_type="lifecycle",
            lifecycle_event="startup",
            environment=environment
        )
    
    @app.on_event("shutdown")
    async def log_shutdown():
        logger.info(
            f"👋 ROADY API shutting down",
            event_type="lifecycle",
            lifecycle_event="shutdown"
        )

# ============================================================
# EXAMPLE USAGE
# ============================================================

if __name__ == "__main__":
    # Setup
    setup_logging(environment="development", log_level="DEBUG")
    logger = get_logger("roady.example")
    
    # Basic logging
    logger.info("Application started")
    logger.debug("Debug message", extra_field="value")
    
    # Set correlation ID
    correlation_id_var.set("test-correlation-123")
    
    # Specialized logging
    logger.api_request("GET", "/api/projects", 200, 45.5)
    logger.db_query("SELECT", "projects", 12.3, rows=25)
    logger.llm_request("claude", "sonnet-4", 1500, 0.0045, 850)
    logger.auth_event("login", "user@example.com", success=True)
    logger.business_event("project_created", "project", "proj-123")
    
    # Error logging
    try:
        raise ValueError("Test error")
    except Exception:
        logger.error("Something went wrong", exc_info=True)
