"""
ROADY Construction - Monitoring & Observabilité
Métriques, Logs structurés, Tracing distribué
"""

import time
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime
from functools import wraps
from contextlib import contextmanager
from dataclasses import dataclass, field
import json
import asyncio

from prometheus_client import Counter, Histogram, Gauge, Info, generate_latest
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
import structlog

# ============================================
# CONFIGURATION STRUCTLOG
# ============================================

def configure_logging(environment: str = "production"):
    """Configure structured logging"""
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]
    
    if environment == "development":
        processors.append(structlog.dev.ConsoleRenderer(colors=True))
    else:
        processors.append(structlog.processors.JSONRenderer())
    
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

logger = structlog.get_logger()

# ============================================
# MÉTRIQUES PROMETHEUS
# ============================================

class ROADYMetrics:
    """Métriques Prometheus pour ROADY"""
    
    def __init__(self):
        # Compteurs
        self.requests_total = Counter(
            'roady_requests_total',
            'Total des requêtes HTTP',
            ['method', 'endpoint', 'status']
        )
        
        self.agent_calls_total = Counter(
            'roady_agent_calls_total',
            'Total des appels aux agents IA',
            ['agent_id', 'agent_level', 'provider', 'status']
        )
        
        self.calculator_uses_total = Counter(
            'roady_calculator_uses_total',
            'Utilisations des calculateurs',
            ['calculator_type']
        )
        
        self.workflow_executions_total = Counter(
            'roady_workflow_executions_total',
            'Exécutions de workflows',
            ['workflow_type', 'status']
        )
        
        # Histogrammes
        self.request_duration = Histogram(
            'roady_request_duration_seconds',
            'Durée des requêtes HTTP',
            ['method', 'endpoint'],
            buckets=[.01, .025, .05, .075, .1, .25, .5, .75, 1.0, 2.5, 5.0, 7.5, 10.0]
        )
        
        self.agent_response_time = Histogram(
            'roady_agent_response_seconds',
            'Temps de réponse des agents IA',
            ['agent_id', 'provider'],
            buckets=[.5, 1, 2, 5, 10, 20, 30, 60, 120]
        )
        
        self.llm_tokens_used = Histogram(
            'roady_llm_tokens',
            'Tokens LLM utilisés',
            ['provider', 'model', 'type'],
            buckets=[100, 500, 1000, 2000, 4000, 8000, 16000]
        )
        
        # Gauges
        self.active_users = Gauge(
            'roady_active_users',
            'Utilisateurs actifs actuellement'
        )
        
        self.active_agents = Gauge(
            'roady_active_agents',
            'Agents IA en cours d\'exécution'
        )
        
        self.projects_count = Gauge(
            'roady_projects_total',
            'Nombre total de projets',
            ['status']
        )
        
        self.queue_size = Gauge(
            'roady_task_queue_size',
            'Taille de la file d\'attente',
            ['queue_name']
        )
        
        # Info
        self.app_info = Info(
            'roady_app',
            'Informations sur l\'application'
        )
        self.app_info.info({
            'version': '1.0.0',
            'environment': 'production',
            'python_version': '3.11'
        })
    
    def track_request(self, method: str, endpoint: str, status: int, duration: float):
        """Enregistre une requête HTTP"""
        self.requests_total.labels(method=method, endpoint=endpoint, status=status).inc()
        self.request_duration.labels(method=method, endpoint=endpoint).observe(duration)
    
    def track_agent_call(self, agent_id: str, level: str, provider: str, 
                         status: str, duration: float, tokens: Dict[str, int]):
        """Enregistre un appel agent"""
        self.agent_calls_total.labels(
            agent_id=agent_id, agent_level=level, 
            provider=provider, status=status
        ).inc()
        self.agent_response_time.labels(agent_id=agent_id, provider=provider).observe(duration)
        
        if tokens:
            model = f"{provider}_default"
            self.llm_tokens_used.labels(provider=provider, model=model, type='input').observe(tokens.get('input', 0))
            self.llm_tokens_used.labels(provider=provider, model=model, type='output').observe(tokens.get('output', 0))

metrics = ROADYMetrics()

# ============================================
# TRACING DISTRIBUÉ
# ============================================

def configure_tracing(service_name: str = "roady-api", endpoint: str = "localhost:4317"):
    """Configure OpenTelemetry tracing"""
    provider = TracerProvider()
    processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint, insecure=True))
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)
    return trace.get_tracer(service_name)

tracer = trace.get_tracer("roady")

# ============================================
# DÉCORATEURS DE MONITORING
# ============================================

def monitored_endpoint(endpoint_name: str):
    """Décorateur pour monitorer les endpoints FastAPI"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            method = kwargs.get('request', {}).method if hasattr(kwargs.get('request', {}), 'method') else 'UNKNOWN'
            
            with tracer.start_as_current_span(f"endpoint.{endpoint_name}") as span:
                span.set_attribute("endpoint", endpoint_name)
                span.set_attribute("method", method)
                
                try:
                    result = await func(*args, **kwargs)
                    status = 200
                    span.set_attribute("status", "success")
                except Exception as e:
                    status = 500
                    span.set_attribute("status", "error")
                    span.set_attribute("error.message", str(e))
                    logger.error("endpoint_error", endpoint=endpoint_name, error=str(e))
                    raise
                finally:
                    duration = time.time() - start_time
                    metrics.track_request(method, endpoint_name, status, duration)
                
                return result
        return wrapper
    return decorator

def monitored_agent(agent_id: str, agent_level: str = "L3"):
    """Décorateur pour monitorer les agents IA"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            metrics.active_agents.inc()
            
            with tracer.start_as_current_span(f"agent.{agent_id}") as span:
                span.set_attribute("agent.id", agent_id)
                span.set_attribute("agent.level", agent_level)
                
                try:
                    result = await func(*args, **kwargs)
                    status = "success"
                    provider = getattr(result, 'provider', 'unknown')
                    tokens = getattr(result, 'usage', {})
                except Exception as e:
                    status = "error"
                    provider = "unknown"
                    tokens = {}
                    span.set_attribute("error", str(e))
                    logger.error("agent_error", agent_id=agent_id, error=str(e))
                    raise
                finally:
                    duration = time.time() - start_time
                    metrics.track_agent_call(agent_id, agent_level, provider, status, duration, tokens)
                    metrics.active_agents.dec()
                
                logger.info("agent_call", agent_id=agent_id, duration=duration, status=status)
                return result
        return wrapper
    return decorator

# ============================================
# HEALTH CHECKS
# ============================================

@dataclass
class HealthCheck:
    name: str
    status: str
    latency_ms: float
    details: Dict[str, Any] = field(default_factory=dict)

class HealthChecker:
    """Vérification de santé des services"""
    
    def __init__(self):
        self.checks: Dict[str, Callable] = {}
    
    def register(self, name: str, check_func: Callable):
        """Enregistre un health check"""
        self.checks[name] = check_func
    
    async def check_all(self) -> Dict[str, Any]:
        """Exécute tous les health checks"""
        results = []
        overall_status = "healthy"
        
        for name, check_func in self.checks.items():
            start = time.time()
            try:
                if asyncio.iscoroutinefunction(check_func):
                    details = await check_func()
                else:
                    details = check_func()
                status = "healthy"
            except Exception as e:
                status = "unhealthy"
                details = {"error": str(e)}
                overall_status = "unhealthy"
            
            latency = (time.time() - start) * 1000
            results.append(HealthCheck(name=name, status=status, latency_ms=latency, details=details))
        
        return {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "checks": [
                {"name": r.name, "status": r.status, "latency_ms": round(r.latency_ms, 2), "details": r.details}
                for r in results
            ]
        }

health_checker = HealthChecker()

# Enregistrer les checks de base
async def check_database():
    from src.database import Database
    await Database.execute("SELECT 1")
    return {"connection": "ok"}

async def check_redis():
    from src.cache import redis_client
    await redis_client.ping()
    return {"connection": "ok"}

async def check_llm():
    # Vérifier la connectivité LLM (sans faire d'appel réel)
    return {"providers": ["claude", "openai"], "status": "configured"}

health_checker.register("database", check_database)
health_checker.register("redis", check_redis)
health_checker.register("llm", check_llm)

# ============================================
# ALERTES
# ============================================

@dataclass
class Alert:
    name: str
    severity: str  # info, warning, critical
    message: str
    timestamp: datetime
    context: Dict[str, Any]

class AlertManager:
    """Gestion des alertes"""
    
    def __init__(self):
        self.handlers: List[Callable] = []
    
    def add_handler(self, handler: Callable):
        self.handlers.append(handler)
    
    async def send_alert(self, name: str, severity: str, message: str, context: Dict = None):
        alert = Alert(
            name=name, severity=severity, message=message,
            timestamp=datetime.utcnow(), context=context or {}
        )
        
        logger.warning("alert_triggered", alert_name=name, severity=severity, message=message)
        
        for handler in self.handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(alert)
                else:
                    handler(alert)
            except Exception as e:
                logger.error("alert_handler_error", error=str(e))

alert_manager = AlertManager()

# ============================================
# FASTAPI MIDDLEWARE
# ============================================

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

class MonitoringMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Ajouter contexte de logging
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request.headers.get("X-Request-ID", "unknown"),
            path=request.url.path,
            method=request.method
        )
        
        with tracer.start_as_current_span("http_request") as span:
            span.set_attribute("http.method", request.method)
            span.set_attribute("http.url", str(request.url))
            
            response = await call_next(request)
            
            duration = time.time() - start_time
            status = response.status_code
            
            span.set_attribute("http.status_code", status)
            metrics.track_request(request.method, request.url.path, status, duration)
            
            logger.info("request_completed", status=status, duration_ms=round(duration * 1000, 2))
        
        return response

# ============================================
# ENDPOINTS MONITORING
# ============================================

def setup_monitoring_routes(app: FastAPI):
    """Configure les routes de monitoring"""
    
    @app.get("/health")
    async def health():
        return await health_checker.check_all()
    
    @app.get("/health/live")
    async def liveness():
        return {"status": "alive"}
    
    @app.get("/health/ready")
    async def readiness():
        result = await health_checker.check_all()
        if result["status"] != "healthy":
            from fastapi import HTTPException
            raise HTTPException(status_code=503, detail=result)
        return result
    
    @app.get("/metrics")
    async def prometheus_metrics():
        from fastapi.responses import Response
        return Response(content=generate_latest(), media_type="text/plain")
