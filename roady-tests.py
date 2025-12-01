"""
ROADY Construction - Suite de Tests Complète
Tests unitaires, intégration, et E2E
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta
from typing import Generator, AsyncGenerator
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient

# ============================================
# FIXTURES
# ============================================

@pytest.fixture
def app():
    """Application FastAPI pour tests"""
    from src.main import app
    return app

@pytest.fixture
def client(app) -> Generator:
    """Client de test synchrone"""
    with TestClient(app) as c:
        yield c

@pytest.fixture
async def async_client(app) -> AsyncGenerator:
    """Client de test asynchrone"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def mock_db():
    """Mock de la base de données"""
    with patch("src.database.Database") as mock:
        mock.execute = AsyncMock()
        mock.fetch_one = AsyncMock()
        mock.fetch_all = AsyncMock(return_value=[])
        yield mock

@pytest.fixture
def mock_redis():
    """Mock de Redis"""
    with patch("src.cache.redis_client") as mock:
        mock.get = AsyncMock(return_value=None)
        mock.set = AsyncMock(return_value=True)
        mock.delete = AsyncMock(return_value=True)
        yield mock

@pytest.fixture
def mock_llm():
    """Mock du service LLM"""
    with patch("src.llm.LLMRouter") as mock:
        mock.route = AsyncMock(return_value=MagicMock(
            content="Réponse simulée de l'agent",
            model="claude-sonnet-4-20250514",
            usage={"input": 100, "output": 50},
            latency_ms=250.0
        ))
        yield mock

@pytest.fixture
def sample_user():
    """Utilisateur de test"""
    return {
        "id": "user-123",
        "email": "test@roady.com",
        "nom": "Test",
        "prenom": "User",
        "role": "chef_projet",
        "entreprise_id": "ent-456"
    }

@pytest.fixture
def sample_project():
    """Projet de test"""
    return {
        "id": "proj-789",
        "nom": "Construction Test",
        "client": "Client ABC",
        "budget": 500000,
        "statut": "en_cours",
        "date_debut": "2025-01-15",
        "date_fin_prevue": "2025-06-30"
    }

@pytest.fixture
def auth_headers(sample_user):
    """Headers d'authentification"""
    from src.auth.service import auth_service
    token = auth_service.create_access_token(MagicMock(**sample_user))
    return {"Authorization": f"Bearer {token}"}

# ============================================
# TESTS UNITAIRES - AUTH
# ============================================

class TestAuthService:
    """Tests du service d'authentification"""
    
    def test_hash_password(self):
        from src.auth.service import auth_service
        password = "SecurePass123!"
        hashed = auth_service.hash_password(password)
        assert hashed != password
        assert auth_service.verify_password(password, hashed)
    
    def test_verify_password_invalid(self):
        from src.auth.service import auth_service
        hashed = auth_service.hash_password("correct")
        assert not auth_service.verify_password("wrong", hashed)
    
    def test_create_access_token(self, sample_user):
        from src.auth.service import auth_service
        user = MagicMock(**sample_user)
        token = auth_service.create_access_token(user)
        assert token is not None
        assert len(token) > 50
    
    def test_verify_token_valid(self, sample_user):
        from src.auth.service import auth_service
        user = MagicMock(**sample_user)
        token = auth_service.create_access_token(user)
        data = auth_service.verify_token(token)
        assert data.user_id == sample_user["id"]
        assert data.email == sample_user["email"]
    
    def test_verify_token_expired(self, sample_user):
        from src.auth.service import auth_service
        from src.auth.config import AuthConfig
        
        with patch.object(AuthConfig, 'ACCESS_TOKEN_EXPIRE_MINUTES', -1):
            user = MagicMock(**sample_user)
            token = auth_service.create_access_token(user)
            with pytest.raises(Exception):
                auth_service.verify_token(token)
    
    def test_role_permissions(self):
        from src.auth.permissions import ROLE_PERMISSIONS, Permission, UserRole
        
        # Super admin a toutes les permissions
        assert len(ROLE_PERMISSIONS[UserRole.SUPER_ADMIN]) == len(Permission)
        
        # Client a seulement lecture
        client_perms = ROLE_PERMISSIONS[UserRole.CLIENT]
        assert Permission.PROJECT_READ in client_perms
        assert Permission.PROJECT_CREATE not in client_perms

# ============================================
# TESTS UNITAIRES - CALCULATEURS
# ============================================

class TestCalculators:
    """Tests des calculateurs construction"""
    
    def test_concrete_calculator(self):
        from src.calculators.concrete import calculate_concrete
        result = calculate_concrete(
            length=10, width=5, thickness=0.15,
            concrete_type="25 MPa", waste_percent=10
        )
        assert result["volume_m3"] == pytest.approx(8.25, rel=0.01)
        assert "cost_cad" in result
        assert result["cost_cad"] > 0
    
    def test_load_calculator(self):
        from src.calculators.loads import calculate_loads
        result = calculate_loads(
            area_m2=100, floors=2,
            usage="residential", roof_type="pitched"
        )
        assert "dead_load_kn" in result
        assert "live_load_kn" in result
        assert "total_load_kn" in result
        assert result["total_load_kn"] > 0
    
    def test_rebar_calculator(self):
        from src.calculators.rebar import calculate_rebar
        result = calculate_rebar(
            concrete_volume=10, rebar_ratio=0.02,
            bar_size="15M", coverage_cm=5
        )
        assert "weight_kg" in result
        assert "bar_count" in result
        assert result["weight_kg"] > 0
    
    def test_paint_calculator(self):
        from src.calculators.paint import calculate_paint
        result = calculate_paint(
            wall_length=20, wall_height=2.7,
            coats=2, doors=2, windows=4
        )
        assert "area_m2" in result
        assert "liters_needed" in result
        assert result["liters_needed"] > 0

# ============================================
# TESTS UNITAIRES - AGENTS
# ============================================

class TestAgents:
    """Tests des agents IA"""
    
    @pytest.mark.asyncio
    async def test_agent_classification(self, mock_llm):
        from src.agents.router import LLMRouter, TaskClassification
        
        router = LLMRouter({})
        messages = [MagicMock(content="Calcule le volume de béton pour une fondation de 50m²")]
        
        classification = router.classify_task(messages, "L2")
        assert isinstance(classification, TaskClassification)
        assert classification.domain == "construction"
    
    @pytest.mark.asyncio
    async def test_agent_response(self, mock_llm):
        from src.agents.wrapper import AgentLLM
        
        agent = AgentLLM(mock_llm)
        agent.set_system_prompt("Tu es un agent de test")
        
        response = await agent.chat("Bonjour", agent_level="L3")
        assert response == "Réponse simulée de l'agent"
    
    @pytest.mark.asyncio
    async def test_agent_history_management(self, mock_llm):
        from src.agents.wrapper import AgentLLM
        
        agent = AgentLLM(mock_llm)
        agent.set_system_prompt("System prompt")
        await agent.chat("Message 1")
        await agent.chat("Message 2")
        
        assert len(agent.conversation_history) == 5  # system + 2*(user + assistant)
        
        agent.clear_history()
        assert len(agent.conversation_history) == 1  # Only system prompt

# ============================================
# TESTS D'INTÉGRATION - API
# ============================================

class TestAPIIntegration:
    """Tests d'intégration API"""
    
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_login_success(self, client, mock_db):
        mock_db.fetch_one.return_value = {
            "id": "user-123",
            "email": "test@roady.com",
            "hashed_password": "$2b$12$...",  # bcrypt hash
            "role": "chef_projet",
            "is_active": True
        }
        
        response = client.post("/auth/token", data={
            "username": "test@roady.com",
            "password": "password123"
        })
        # Note: Ce test nécessite le mock approprié du hash
    
    def test_protected_route_unauthorized(self, client):
        response = client.get("/projects")
        assert response.status_code == 401
    
    def test_protected_route_authorized(self, client, auth_headers):
        response = client.get("/projects", headers=auth_headers)
        assert response.status_code in [200, 403]  # Dépend des permissions
    
    @pytest.mark.asyncio
    async def test_create_project(self, async_client, auth_headers, mock_db):
        mock_db.execute.return_value = "proj-new"
        
        response = await async_client.post(
            "/projects",
            headers=auth_headers,
            json={
                "nom": "Nouveau Projet",
                "client": "Client XYZ",
                "budget": 100000
            }
        )
        # Vérifier la création

# ============================================
# TESTS E2E - WORKFLOWS
# ============================================

class TestWorkflowsE2E:
    """Tests End-to-End des workflows"""
    
    @pytest.mark.asyncio
    async def test_estimation_workflow(self, async_client, auth_headers, mock_llm, mock_db):
        """Test du workflow complet d'estimation"""
        # 1. Créer un projet
        project_response = await async_client.post(
            "/projects",
            headers=auth_headers,
            json={"nom": "Test Estimation", "client": "Client Test", "budget": 500000}
        )
        
        # 2. Demander une estimation
        estimation_response = await async_client.post(
            "/estimations",
            headers=auth_headers,
            json={
                "project_id": "proj-123",
                "description": "Fondation 100m² avec murs de soutènement",
                "type": "preliminary"
            }
        )
        
        # 3. Vérifier que l'agent a été appelé
        mock_llm.route.assert_called()
    
    @pytest.mark.asyncio
    async def test_report_generation_workflow(self, async_client, auth_headers, mock_db):
        """Test du workflow de génération de rapport"""
        response = await async_client.post(
            "/reports/generate",
            headers=auth_headers,
            json={
                "project_id": "proj-123",
                "type": "daily",
                "date": "2025-01-15"
            }
        )
        # Vérifier la génération

# ============================================
# CONFIGURATION PYTEST
# ============================================

def pytest_configure(config):
    """Configuration pytest"""
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks integration tests")
    config.addinivalue_line("markers", "e2e: marks end-to-end tests")

# pytest.ini ou pyproject.toml:
# [pytest]
# asyncio_mode = auto
# testpaths = tests
# python_files = test_*.py
# python_classes = Test*
# python_functions = test_*
# addopts = -v --cov=src --cov-report=html --cov-report=term-missing
