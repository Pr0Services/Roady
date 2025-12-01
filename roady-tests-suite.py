# ============================================
# ROADY CONSTRUCTION - SUITE DE TESTS COMPLÈTE
# ============================================
# Structure: tests/
# ├── conftest.py
# ├── unit/
# ├── integration/
# └── e2e/

# ============================================
# tests/conftest.py - Configuration Pytest
# ============================================

import asyncio
import pytest
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from unittest.mock import MagicMock, AsyncMock

from src.main import app
from src.database import Base, get_db
from src.auth.jwt import create_access_token
from src.models import User, Project, Task, Agent

# Test Database URL
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5433/roady_test"

# Create test engine
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def setup_database():
    """Create all tables before tests, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session(setup_database) -> AsyncGenerator[AsyncSession, None]:
    """Get database session for each test."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Get test client with overridden dependencies."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@roady.construction",
        hashed_password="$2b$12$test_hash",
        full_name="Test User",
        role="admin",
        company_id=1,
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Get authentication headers."""
    token = create_access_token(data={"sub": str(test_user.id), "role": test_user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def test_project(db_session: AsyncSession, test_user: User) -> Project:
    """Create a test project."""
    project = Project(
        name="Test Construction Project",
        description="A test project for unit tests",
        owner_id=test_user.id,
        company_id=1,
        status="active",
        budget=1000000.00,
        start_date="2024-01-01",
        end_date="2024-12-31"
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)
    return project


@pytest.fixture
def mock_llm_service():
    """Mock LLM service for testing."""
    mock = AsyncMock()
    mock.generate.return_value = {
        "response": "Mocked LLM response",
        "tokens_used": 100,
        "model": "claude-3-opus"
    }
    return mock


@pytest.fixture
def mock_firebase():
    """Mock Firebase for notification tests."""
    mock = MagicMock()
    mock.send.return_value = "mock_message_id"
    return mock


# ============================================
# tests/unit/test_auth.py - Tests Authentification
# ============================================

import pytest
from datetime import datetime, timedelta
from jose import jwt
from src.auth.jwt import create_access_token, verify_token, create_refresh_token
from src.auth.password import hash_password, verify_password
from src.auth.rbac import check_permission, ROLE_PERMISSIONS
from src.config import settings


class TestPasswordHashing:
    """Tests for password hashing utilities."""
    
    def test_hash_password_creates_valid_hash(self):
        password = "SecurePassword123!"
        hashed = hash_password(password)
        
        assert hashed != password
        assert hashed.startswith("$2b$")
        assert len(hashed) == 60
    
    def test_verify_password_correct(self):
        password = "SecurePassword123!"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_password_incorrect(self):
        password = "SecurePassword123!"
        hashed = hash_password(password)
        
        assert verify_password("WrongPassword", hashed) is False
    
    def test_different_passwords_different_hashes(self):
        hash1 = hash_password("Password1")
        hash2 = hash_password("Password2")
        
        assert hash1 != hash2


class TestJWT:
    """Tests for JWT token utilities."""
    
    def test_create_access_token(self):
        data = {"sub": "123", "role": "admin"}
        token = create_access_token(data)
        
        assert token is not None
        assert len(token.split(".")) == 3  # JWT format
    
    def test_verify_valid_token(self):
        data = {"sub": "123", "role": "admin"}
        token = create_access_token(data)
        
        payload = verify_token(token)
        
        assert payload["sub"] == "123"
        assert payload["role"] == "admin"
        assert "exp" in payload
    
    def test_verify_expired_token(self):
        data = {"sub": "123", "role": "admin"}
        token = create_access_token(data, expires_delta=timedelta(seconds=-1))
        
        with pytest.raises(Exception):
            verify_token(token)
    
    def test_verify_invalid_token(self):
        with pytest.raises(Exception):
            verify_token("invalid.token.here")
    
    def test_create_refresh_token(self):
        data = {"sub": "123"}
        token = create_refresh_token(data)
        payload = verify_token(token)
        
        # Refresh tokens should have longer expiry
        exp = datetime.fromtimestamp(payload["exp"])
        assert exp > datetime.utcnow() + timedelta(days=6)


class TestRBAC:
    """Tests for Role-Based Access Control."""
    
    def test_admin_has_all_permissions(self):
        assert check_permission("admin", "users:read") is True
        assert check_permission("admin", "users:write") is True
        assert check_permission("admin", "projects:delete") is True
        assert check_permission("admin", "settings:admin") is True
    
    def test_manager_permissions(self):
        assert check_permission("manager", "projects:read") is True
        assert check_permission("manager", "projects:write") is True
        assert check_permission("manager", "settings:admin") is False
    
    def test_worker_limited_permissions(self):
        assert check_permission("worker", "tasks:read") is True
        assert check_permission("worker", "tasks:write") is True
        assert check_permission("worker", "projects:delete") is False
        assert check_permission("worker", "users:write") is False
    
    def test_invalid_role(self):
        assert check_permission("invalid_role", "users:read") is False
    
    def test_invalid_permission(self):
        assert check_permission("admin", "invalid:permission") is False


# ============================================
# tests/unit/test_models.py - Tests Modèles
# ============================================

import pytest
from datetime import date, datetime
from decimal import Decimal
from src.models import User, Project, Task, Agent, Estimate


class TestUserModel:
    """Tests for User model."""
    
    def test_user_creation(self):
        user = User(
            email="test@example.com",
            hashed_password="hashed",
            full_name="Test User",
            role="worker"
        )
        
        assert user.email == "test@example.com"
        assert user.role == "worker"
        assert user.is_active is True
    
    def test_user_email_validation(self):
        with pytest.raises(ValueError):
            User(email="invalid-email", hashed_password="hash", full_name="Test")
    
    def test_user_role_validation(self):
        with pytest.raises(ValueError):
            User(email="test@test.com", hashed_password="hash", role="invalid_role")


class TestProjectModel:
    """Tests for Project model."""
    
    def test_project_creation(self):
        project = Project(
            name="Construction Project",
            description="A new building",
            status="planning",
            budget=Decimal("500000.00")
        )
        
        assert project.name == "Construction Project"
        assert project.status == "planning"
        assert project.budget == Decimal("500000.00")
    
    def test_project_budget_calculation(self):
        project = Project(name="Test", budget=Decimal("100000.00"))
        project.spent = Decimal("25000.00")
        
        assert project.remaining_budget == Decimal("75000.00")
        assert project.budget_percentage == 25.0
    
    def test_project_status_transitions(self):
        project = Project(name="Test", status="planning")
        
        assert project.can_transition_to("active") is True
        assert project.can_transition_to("completed") is False
        
        project.status = "active"
        assert project.can_transition_to("completed") is True


class TestTaskModel:
    """Tests for Task model."""
    
    def test_task_creation(self):
        task = Task(
            title="Install Foundation",
            description="Pour concrete foundation",
            priority="high",
            status="pending"
        )
        
        assert task.title == "Install Foundation"
        assert task.priority == "high"
    
    def test_task_duration_calculation(self):
        task = Task(
            title="Test",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 15)
        )
        
        assert task.duration_days == 14
    
    def test_task_overdue_check(self):
        task = Task(
            title="Test",
            due_date=date(2024, 1, 1),
            status="pending"
        )
        
        assert task.is_overdue is True


# ============================================
# tests/unit/test_calculators.py - Tests Calculateurs
# ============================================

import pytest
from decimal import Decimal
from src.calculators.concrete import ConcreteCalculator
from src.calculators.structural import StructuralCalculator
from src.calculators.estimate import EstimateCalculator


class TestConcreteCalculator:
    """Tests for concrete calculations."""
    
    def test_volume_rectangular_slab(self):
        calc = ConcreteCalculator()
        volume = calc.calculate_volume(
            length=10.0,  # meters
            width=8.0,
            thickness=0.15
        )
        
        assert volume == pytest.approx(12.0, rel=0.01)
    
    def test_volume_with_waste_factor(self):
        calc = ConcreteCalculator()
        volume = calc.calculate_volume(10.0, 8.0, 0.15, waste_factor=0.05)
        
        assert volume == pytest.approx(12.6, rel=0.01)  # 12 * 1.05
    
    def test_concrete_cost_estimation(self):
        calc = ConcreteCalculator()
        cost = calc.estimate_cost(
            volume=12.0,
            concrete_type="30MPa",
            includes_rebar=True,
            includes_labor=True
        )
        
        assert cost["concrete_cost"] > 0
        assert cost["rebar_cost"] > 0
        assert cost["labor_cost"] > 0
        assert cost["total"] == sum([
            cost["concrete_cost"],
            cost["rebar_cost"],
            cost["labor_cost"]
        ])
    
    def test_reinforcement_calculation(self):
        calc = ConcreteCalculator()
        rebar = calc.calculate_reinforcement(
            area=80.0,  # m²
            spacing=0.30,  # 300mm
            bar_size=15  # 15M
        )
        
        assert rebar["total_length"] > 0
        assert rebar["number_of_bars"] > 0
        assert rebar["weight_kg"] > 0


class TestStructuralCalculator:
    """Tests for structural calculations."""
    
    def test_beam_load_capacity(self):
        calc = StructuralCalculator()
        capacity = calc.calculate_beam_capacity(
            span=6.0,  # meters
            section="W310x39",
            steel_grade="350W"
        )
        
        assert capacity["moment_resistance"] > 0
        assert capacity["shear_resistance"] > 0
    
    def test_column_buckling(self):
        calc = StructuralCalculator()
        result = calc.check_column_buckling(
            height=4.0,
            section="W200x46",
            axial_load=500,  # kN
            effective_length_factor=1.0
        )
        
        assert "slenderness_ratio" in result
        assert "critical_load" in result
        assert "safety_factor" in result
    
    def test_foundation_bearing(self):
        calc = StructuralCalculator()
        result = calc.check_bearing_capacity(
            footing_size=(2.0, 2.0),  # meters
            depth=1.2,
            soil_bearing=150,  # kPa
            column_load=400  # kN
        )
        
        assert result["is_adequate"] is True
        assert result["actual_pressure"] < result["allowable_pressure"]


class TestEstimateCalculator:
    """Tests for cost estimation."""
    
    def test_material_takeoff(self):
        calc = EstimateCalculator()
        takeoff = calc.calculate_takeoff(
            building_area=500,  # m²
            stories=2,
            construction_type="wood_frame"
        )
        
        assert "concrete" in takeoff
        assert "lumber" in takeoff
        assert "insulation" in takeoff
        assert all(v > 0 for v in takeoff.values())
    
    def test_labor_estimation(self):
        calc = EstimateCalculator()
        labor = calc.estimate_labor(
            task_type="framing",
            quantity=100,  # m²
            complexity="medium"
        )
        
        assert labor["hours"] > 0
        assert labor["cost"] > 0
        assert labor["crew_size"] > 0
    
    def test_total_project_estimate(self):
        calc = EstimateCalculator()
        estimate = calc.full_estimate(
            building_area=1000,
            stories=3,
            construction_type="concrete",
            location="quebec",
            includes_contingency=True
        )
        
        assert estimate["materials"] > 0
        assert estimate["labor"] > 0
        assert estimate["equipment"] > 0
        assert estimate["contingency"] == pytest.approx(
            estimate["subtotal"] * 0.10, rel=0.01
        )
        assert estimate["total"] > estimate["subtotal"]


# ============================================
# tests/integration/test_api_projects.py
# ============================================

import pytest
from httpx import AsyncClient


class TestProjectsAPI:
    """Integration tests for Projects API."""
    
    @pytest.mark.asyncio
    async def test_create_project(self, client: AsyncClient, auth_headers: dict):
        response = await client.post(
            "/api/v1/projects",
            json={
                "name": "New Building Project",
                "description": "A 10-story commercial building",
                "budget": 5000000.00,
                "start_date": "2024-03-01",
                "end_date": "2025-06-30"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Building Project"
        assert data["status"] == "planning"
        assert "id" in data
    
    @pytest.mark.asyncio
    async def test_get_project(self, client: AsyncClient, auth_headers: dict, test_project):
        response = await client.get(
            f"/api/v1/projects/{test_project.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_project.id
        assert data["name"] == test_project.name
    
    @pytest.mark.asyncio
    async def test_list_projects(self, client: AsyncClient, auth_headers: dict):
        response = await client.get(
            "/api/v1/projects",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
    
    @pytest.mark.asyncio
    async def test_update_project(self, client: AsyncClient, auth_headers: dict, test_project):
        response = await client.patch(
            f"/api/v1/projects/{test_project.id}",
            json={"status": "active", "budget": 1200000.00},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "active"
        assert data["budget"] == 1200000.00
    
    @pytest.mark.asyncio
    async def test_delete_project(self, client: AsyncClient, auth_headers: dict, test_project):
        response = await client.delete(
            f"/api/v1/projects/{test_project.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify deletion
        get_response = await client.get(
            f"/api/v1/projects/{test_project.id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_project_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/projects")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_project_validation_error(self, client: AsyncClient, auth_headers: dict):
        response = await client.post(
            "/api/v1/projects",
            json={"name": ""},  # Invalid: empty name
            headers=auth_headers
        )
        
        assert response.status_code == 422


# ============================================
# tests/integration/test_api_agents.py
# ============================================

class TestAgentsAPI:
    """Integration tests for AI Agents API."""
    
    @pytest.mark.asyncio
    async def test_list_agents(self, client: AsyncClient, auth_headers: dict):
        response = await client.get(
            "/api/v1/agents",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_invoke_agent(self, client: AsyncClient, auth_headers: dict, mock_llm_service):
        response = await client.post(
            "/api/v1/agents/estimator/invoke",
            json={
                "prompt": "Estimate cost for a 500m² concrete slab",
                "context": {"project_id": 1}
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "agent_id" in data
    
    @pytest.mark.asyncio
    async def test_agent_conversation(self, client: AsyncClient, auth_headers: dict):
        # Start conversation
        response1 = await client.post(
            "/api/v1/agents/assistant/chat",
            json={"message": "Hello, I need help with my project"},
            headers=auth_headers
        )
        
        assert response1.status_code == 200
        conversation_id = response1.json()["conversation_id"]
        
        # Continue conversation
        response2 = await client.post(
            "/api/v1/agents/assistant/chat",
            json={
                "message": "What's the best foundation type for clay soil?",
                "conversation_id": conversation_id
            },
            headers=auth_headers
        )
        
        assert response2.status_code == 200
        assert response2.json()["conversation_id"] == conversation_id


# ============================================
# tests/e2e/test_full_workflow.py - Tests E2E
# ============================================

import pytest
from playwright.async_api import async_playwright, Page


class TestFullWorkflow:
    """End-to-end tests for complete user workflows."""
    
    @pytest.fixture
    async def page(self) -> Page:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            yield page
            await browser.close()
    
    @pytest.mark.asyncio
    async def test_user_registration_and_login(self, page: Page):
        # Go to registration page
        await page.goto("http://localhost:3000/register")
        
        # Fill registration form
        await page.fill('[data-testid="email"]', "newuser@test.com")
        await page.fill('[data-testid="password"]', "SecurePass123!")
        await page.fill('[data-testid="confirm-password"]', "SecurePass123!")
        await page.fill('[data-testid="full-name"]', "New User")
        await page.click('[data-testid="register-btn"]')
        
        # Should redirect to login
        await page.wait_for_url("**/login")
        
        # Login
        await page.fill('[data-testid="email"]', "newuser@test.com")
        await page.fill('[data-testid="password"]', "SecurePass123!")
        await page.click('[data-testid="login-btn"]')
        
        # Should redirect to dashboard
        await page.wait_for_url("**/dashboard")
        assert await page.is_visible('[data-testid="welcome-message"]')
    
    @pytest.mark.asyncio
    async def test_create_project_workflow(self, page: Page):
        # Login first
        await page.goto("http://localhost:3000/login")
        await page.fill('[data-testid="email"]', "admin@roady.construction")
        await page.fill('[data-testid="password"]', "AdminPass123!")
        await page.click('[data-testid="login-btn"]')
        await page.wait_for_url("**/dashboard")
        
        # Navigate to projects
        await page.click('[data-testid="nav-projects"]')
        await page.wait_for_url("**/projects")
        
        # Create new project
        await page.click('[data-testid="new-project-btn"]')
        await page.fill('[data-testid="project-name"]', "E2E Test Project")
        await page.fill('[data-testid="project-budget"]', "1000000")
        await page.fill('[data-testid="project-description"]', "Test project for E2E")
        await page.click('[data-testid="save-project-btn"]')
        
        # Verify project created
        await page.wait_for_selector('[data-testid="project-card"]')
        assert await page.is_visible('text=E2E Test Project')
    
    @pytest.mark.asyncio
    async def test_ai_agent_interaction(self, page: Page):
        # Login and go to AI assistant
        await page.goto("http://localhost:3000/login")
        await page.fill('[data-testid="email"]', "admin@roady.construction")
        await page.fill('[data-testid="password"]', "AdminPass123!")
        await page.click('[data-testid="login-btn"]')
        
        await page.click('[data-testid="nav-ai-assistant"]')
        await page.wait_for_url("**/assistant")
        
        # Send message to AI
        await page.fill('[data-testid="chat-input"]', "Calculate concrete for a 100m² slab")
        await page.click('[data-testid="send-btn"]')
        
        # Wait for response
        await page.wait_for_selector('[data-testid="ai-response"]', timeout=30000)
        response = await page.text_content('[data-testid="ai-response"]')
        
        assert "concrete" in response.lower() or "m³" in response


# ============================================
# pytest.ini - Configuration Pytest
# ============================================
"""
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --strict-markers
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    e2e: marks tests as end-to-end tests
filterwarnings =
    ignore::DeprecationWarning
"""

# ============================================
# Commandes pour exécuter les tests
# ============================================
"""
# Tous les tests
pytest

# Tests unitaires seulement
pytest tests/unit/

# Tests d'intégration
pytest tests/integration/

# Tests E2E
pytest tests/e2e/

# Avec couverture
pytest --cov=src --cov-report=html --cov-report=term

# Tests parallèles
pytest -n auto

# Tests marqués
pytest -m "not slow"
pytest -m integration
"""
