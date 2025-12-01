"""
ROADY Construction - Tests de Base
pytest + pytest-asyncio + httpx
"""

import pytest
from datetime import datetime, timedelta
from typing import Generator, AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import AsyncMock, patch
import json

# ============================================================
# FIXTURES
# ============================================================

@pytest.fixture(scope="session")
def test_config():
    """Configuration de test"""
    return {
        "DATABASE_URL": "postgresql://roady_test:test@localhost:5432/roady_test",
        "REDIS_URL": "redis://localhost:6379/1",
        "JWT_SECRET": "test-secret-key-for-testing-only",
        "ANTHROPIC_API_KEY": "test-key",
    }

@pytest.fixture(scope="session")
def engine(test_config):
    """Crée le moteur de base de données de test"""
    from src.database import Base
    
    engine = create_engine(test_config["DATABASE_URL"])
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(engine):
    """Session de base de données pour chaque test"""
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.rollback()
    session.close()

@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Client HTTP async pour tester l'API"""
    from src.main import app
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client

@pytest.fixture
def sample_user():
    """Utilisateur de test"""
    return {
        "email": "test@roady.construction",
        "password": "SecurePassword123!",
        "first_name": "Test",
        "last_name": "User",
        "role": "chef_projet"
    }

@pytest.fixture
def sample_project():
    """Projet de test"""
    return {
        "name": "Projet Test",
        "description": "Description du projet test",
        "client_name": "Client Test",
        "budget_total": 500000.00,
        "start_date": datetime.now().date().isoformat(),
        "end_date": (datetime.now() + timedelta(days=180)).date().isoformat()
    }

@pytest.fixture
def auth_headers(sample_user):
    """Headers d'authentification"""
    from src.auth.service import AuthService
    auth = AuthService()
    token = auth.create_access_token_for_test(sample_user)
    return {"Authorization": f"Bearer {token}"}

# ============================================================
# TESTS - HEALTH CHECK
# ============================================================

class TestHealthCheck:
    """Tests de santé de l'API"""
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self, async_client: AsyncClient):
        """Test endpoint /health"""
        response = await async_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_ready_endpoint(self, async_client: AsyncClient):
        """Test endpoint /ready"""
        response = await async_client.get("/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["database"] == "connected"
        assert data["redis"] == "connected"

# ============================================================
# TESTS - AUTHENTICATION
# ============================================================

class TestAuthentication:
    """Tests d'authentification"""
    
    @pytest.mark.asyncio
    async def test_register_user(self, async_client: AsyncClient, sample_user):
        """Test inscription utilisateur"""
        response = await async_client.post("/auth/register", json=sample_user)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == sample_user["email"]
        assert "id" in data
        assert "password" not in data
    
    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, async_client: AsyncClient, sample_user):
        """Test inscription avec email existant"""
        await async_client.post("/auth/register", json=sample_user)
        response = await async_client.post("/auth/register", json=sample_user)
        assert response.status_code == 400
        assert "existe" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_login_success(self, async_client: AsyncClient, sample_user):
        """Test connexion réussie"""
        await async_client.post("/auth/register", json=sample_user)
        response = await async_client.post("/auth/login", data={
            "username": sample_user["email"],
            "password": sample_user["password"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_login_invalid_password(self, async_client: AsyncClient, sample_user):
        """Test connexion avec mauvais mot de passe"""
        await async_client.post("/auth/register", json=sample_user)
        response = await async_client.post("/auth/login", data={
            "username": sample_user["email"],
            "password": "wrong_password"
        })
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_current_user(self, async_client: AsyncClient, auth_headers):
        """Test récupération utilisateur courant"""
        response = await async_client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "role" in data
    
    @pytest.mark.asyncio
    async def test_invalid_token(self, async_client: AsyncClient):
        """Test avec token invalide"""
        response = await async_client.get("/auth/me", headers={
            "Authorization": "Bearer invalid_token"
        })
        assert response.status_code == 401

# ============================================================
# TESTS - PROJECTS
# ============================================================

class TestProjects:
    """Tests des projets"""
    
    @pytest.mark.asyncio
    async def test_create_project(self, async_client: AsyncClient, auth_headers, sample_project):
        """Test création de projet"""
        response = await async_client.post(
            "/projects", 
            json=sample_project,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_project["name"]
        assert "id" in data
        assert "code" in data  # Auto-généré PRJ-XXXX-XXX
    
    @pytest.mark.asyncio
    async def test_list_projects(self, async_client: AsyncClient, auth_headers):
        """Test liste des projets"""
        response = await async_client.get("/projects", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)
    
    @pytest.mark.asyncio
    async def test_get_project(self, async_client: AsyncClient, auth_headers, sample_project):
        """Test récupération d'un projet"""
        create_response = await async_client.post(
            "/projects",
            json=sample_project,
            headers=auth_headers
        )
        project_id = create_response.json()["id"]
        
        response = await async_client.get(f"/projects/{project_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == project_id
    
    @pytest.mark.asyncio
    async def test_update_project(self, async_client: AsyncClient, auth_headers, sample_project):
        """Test mise à jour de projet"""
        create_response = await async_client.post(
            "/projects",
            json=sample_project,
            headers=auth_headers
        )
        project_id = create_response.json()["id"]
        
        response = await async_client.patch(
            f"/projects/{project_id}",
            json={"name": "Projet Modifié", "status": "active"},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Projet Modifié"
        assert response.json()["status"] == "active"
    
    @pytest.mark.asyncio
    async def test_project_not_found(self, async_client: AsyncClient, auth_headers):
        """Test projet non trouvé"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = await async_client.get(f"/projects/{fake_id}", headers=auth_headers)
        assert response.status_code == 404

# ============================================================
# TESTS - TASKS
# ============================================================

class TestTasks:
    """Tests des tâches"""
    
    @pytest.fixture
    async def project_id(self, async_client: AsyncClient, auth_headers, sample_project):
        """Crée un projet et retourne son ID"""
        response = await async_client.post(
            "/projects",
            json=sample_project,
            headers=auth_headers
        )
        return response.json()["id"]
    
    @pytest.mark.asyncio
    async def test_create_task(self, async_client: AsyncClient, auth_headers, project_id):
        """Test création de tâche"""
        task_data = {
            "project_id": project_id,
            "title": "Tâche Test",
            "description": "Description de la tâche",
            "priority": "high"
        }
        response = await async_client.post("/tasks", json=task_data, headers=auth_headers)
        assert response.status_code == 201
        assert response.json()["title"] == "Tâche Test"
        assert response.json()["status"] == "backlog"
    
    @pytest.mark.asyncio
    async def test_update_task_status(self, async_client: AsyncClient, auth_headers, project_id):
        """Test changement de statut"""
        task_data = {"project_id": project_id, "title": "Tâche Status"}
        create_response = await async_client.post("/tasks", json=task_data, headers=auth_headers)
        task_id = create_response.json()["id"]
        
        response = await async_client.patch(
            f"/tasks/{task_id}",
            json={"status": "in_progress"},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "in_progress"
    
    @pytest.mark.asyncio
    async def test_complete_task(self, async_client: AsyncClient, auth_headers, project_id):
        """Test complétion de tâche"""
        task_data = {"project_id": project_id, "title": "Tâche à compléter"}
        create_response = await async_client.post("/tasks", json=task_data, headers=auth_headers)
        task_id = create_response.json()["id"]
        
        response = await async_client.patch(
            f"/tasks/{task_id}",
            json={"status": "completed"},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "completed"
        assert response.json()["completed_at"] is not None

# ============================================================
# TESTS - RFI
# ============================================================

class TestRFI:
    """Tests des RFI"""
    
    @pytest.mark.asyncio
    async def test_create_rfi(self, async_client: AsyncClient, auth_headers, project_id):
        """Test création de RFI"""
        rfi_data = {
            "project_id": project_id,
            "title": "Question sur les fondations",
            "question": "Quelle est l'épaisseur requise pour le béton?"
        }
        response = await async_client.post("/rfis", json=rfi_data, headers=auth_headers)
        assert response.status_code == 201
        assert response.json()["status"] == "draft"
        assert "code" in response.json()  # RFI-XXX

# ============================================================
# TESTS - CALCULATEURS
# ============================================================

class TestCalculators:
    """Tests des calculateurs construction"""
    
    @pytest.mark.asyncio
    async def test_concrete_calculator(self, async_client: AsyncClient, auth_headers):
        """Test calculateur béton"""
        data = {
            "length": 10.0,
            "width": 5.0,
            "thickness": 0.15,
            "waste_percent": 10
        }
        response = await async_client.post("/calculators/concrete", json=data, headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        assert "volume_m3" in result
        assert result["volume_m3"] == pytest.approx(8.25, rel=0.01)  # 10*5*0.15*1.1
    
    @pytest.mark.asyncio
    async def test_paint_calculator(self, async_client: AsyncClient, auth_headers):
        """Test calculateur peinture"""
        data = {
            "surface_m2": 100.0,
            "coats": 2,
            "coverage_m2_per_liter": 10.0
        }
        response = await async_client.post("/calculators/paint", json=data, headers=auth_headers)
        assert response.status_code == 200
        result = response.json()
        assert "liters_needed" in result
        assert result["liters_needed"] == 20.0

# ============================================================
# TESTS - LLM INTEGRATION
# ============================================================

class TestLLMIntegration:
    """Tests de l'intégration LLM"""
    
    @pytest.mark.asyncio
    async def test_llm_completion(self, async_client: AsyncClient, auth_headers):
        """Test completion LLM (mocked)"""
        with patch("src.llm.router.LLMRouter.complete") as mock_complete:
            mock_complete.return_value = AsyncMock(return_value={
                "content": "Réponse de test",
                "model": "claude-sonnet-4-5-20250514",
                "usage": {"input_tokens": 10, "output_tokens": 20}
            })()
            
            response = await async_client.post(
                "/llm/complete",
                json={"prompt": "Test prompt"},
                headers=auth_headers
            )
            assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_llm_agent_response(self, async_client: AsyncClient, auth_headers):
        """Test réponse agent"""
        with patch("src.agents.construction.SuperviseurAgent.think") as mock_think:
            mock_think.return_value = {
                "response": "Points de sécurité vérifiés",
                "actions": []
            }
            
            response = await async_client.post(
                "/agents/superviseur/ask",
                json={"question": "Vérifier la sécurité du chantier"},
                headers=auth_headers
            )
            assert response.status_code == 200

# ============================================================
# TESTS - NOTIFICATIONS
# ============================================================

class TestNotifications:
    """Tests des notifications"""
    
    @pytest.mark.asyncio
    async def test_get_notifications(self, async_client: AsyncClient, auth_headers):
        """Test récupération notifications"""
        response = await async_client.get("/notifications", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
    
    @pytest.mark.asyncio
    async def test_mark_notification_read(self, async_client: AsyncClient, auth_headers):
        """Test marquer comme lu"""
        # Créer une notification de test d'abord
        # ...
        pass

# ============================================================
# TESTS - GEOLOCATION
# ============================================================

class TestGeolocation:
    """Tests de géolocalisation"""
    
    @pytest.mark.asyncio
    async def test_update_location(self, async_client: AsyncClient, auth_headers):
        """Test mise à jour position"""
        location_data = {
            "latitude": 45.5017,
            "longitude": -73.5673,
            "accuracy": 10.0,
            "battery_level": 75
        }
        response = await async_client.post(
            "/geolocation/update",
            json=location_data,
            headers=auth_headers
        )
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_get_team_locations(self, async_client: AsyncClient, auth_headers, project_id):
        """Test positions équipe"""
        response = await async_client.get(
            f"/geolocation/team/{project_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

# ============================================================
# TESTS - PERFORMANCE
# ============================================================

class TestPerformance:
    """Tests de performance"""
    
    @pytest.mark.asyncio
    async def test_response_time_health(self, async_client: AsyncClient):
        """Test temps de réponse /health < 100ms"""
        import time
        start = time.time()
        await async_client.get("/health")
        duration = (time.time() - start) * 1000
        assert duration < 100, f"Response time {duration}ms > 100ms"
    
    @pytest.mark.asyncio
    async def test_response_time_projects_list(self, async_client: AsyncClient, auth_headers):
        """Test temps de réponse liste projets < 500ms"""
        import time
        start = time.time()
        await async_client.get("/projects", headers=auth_headers)
        duration = (time.time() - start) * 1000
        assert duration < 500, f"Response time {duration}ms > 500ms"

# ============================================================
# CONFTEST - Pytest Configuration
# ============================================================

# conftest.py content:
"""
import pytest
import asyncio

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

def pytest_configure(config):
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
"""
