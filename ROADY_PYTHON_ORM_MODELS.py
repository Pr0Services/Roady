"""
ROADY Database Models - SQLAlchemy ORM
Complete Python models for all database tables with relationships
"""

from sqlalchemy import (
    Column, String, Integer, Boolean, DECIMAL, Text, 
    TIMESTAMP, ForeignKey, CheckConstraint, JSON
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import List, Optional

Base = declarative_base()

# ═══════════════════════════════════════════════════════════════════════════
# MODEL: User
# ═══════════════════════════════════════════════════════════════════════════

class User(Base):
    __tablename__ = 'users'
    
    user_id = Column(String(100), primary_key=True)
    email = Column(String(200), unique=True, nullable=False)
    full_name = Column(String(200), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default='user')
    is_active = Column(Boolean, nullable=False, default=True)
    monthly_budget_limit = Column(DECIMAL(10, 2))
    current_month_spend = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    active_agents_count = Column(Integer, nullable=False, default=0)
    total_tasks_submitted = Column(Integer, nullable=False, default=0)
    avg_task_quality_rating = Column(DECIMAL(3, 2))
    preferences = Column(JSON)
    last_login_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    agents = relationship("Agent", back_populates="activated_by_user", foreign_keys="Agent.activated_by_user_id")
    tasks = relationship("Task", back_populates="submitted_by_user")
    workflows = relationship("Workflow", back_populates="created_by_user")
    budget_alerts = relationship("BudgetAlert", back_populates="user")
    
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'user', 'viewer')", name='check_user_role'),
    )
    
    def __repr__(self):
        return f"<User(id='{self.user_id}', email='{self.email}', role='{self.role}')>"


# ═══════════════════════════════════════════════════════════════════════════
# MODEL: LLMProvider
# ═══════════════════════════════════════════════════════════════════════════

class LLMProvider(Base):
    __tablename__ = 'llm_providers'
    
    provider_id = Column(String(50), primary_key=True)
    provider_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, nullable=False, default=False)
    api_key = Column(Text)  # Should be encrypted
    api_endpoint = Column(String(500))
    organization_id = Column(String(100))
    monthly_budget_limit = Column(DECIMAL(10, 2))
    current_month_spend = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    last_tested_at = Column(TIMESTAMP)
    test_status = Column(String(20), nullable=False, default='not_tested')
    test_error_message = Column(Text)
    added_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    models = relationship("LLMModel", back_populates="provider")
    
    __table_args__ = (
        CheckConstraint("test_status IN ('success', 'failed', 'not_tested')", name='check_test_status'),
    )
    
    def __repr__(self):
        return f"<LLMProvider(id='{self.provider_id}', name='{self.provider_name}', active={self.is_active})>"


# ═══════════════════════════════════════════════════════════════════════════
# MODEL: LLMModel
# ═══════════════════════════════════════════════════════════════════════════

class LLMModel(Base):
    __tablename__ = 'llm_models'
    
    model_id = Column(String(100), primary_key=True)
    provider_id = Column(String(50), ForeignKey('llm_providers.provider_id', ondelete='CASCADE'), nullable=False)
    model_name = Column(String(100), nullable=False)
    tier = Column(String(20), nullable=False)
    context_window = Column(Integer, nullable=False)
    max_output_tokens = Column(Integer, nullable=False)
    pricing_input_per_1m = Column(DECIMAL(10, 4), nullable=False)
    pricing_output_per_1m = Column(DECIMAL(10, 4), nullable=False)
    capabilities = Column(JSON)
    is_available = Column(Boolean, nullable=False, default=True)
    added_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    
    # Relationships
    provider = relationship("LLMProvider", back_populates="models")
    
    __table_args__ = (
        CheckConstraint("tier IN ('premium', 'standard', 'fast', 'local', 'specialized')", name='check_tier'),
    )
    
    def __repr__(self):
        return f"<LLMModel(id='{self.model_id}', name='{self.model_name}', tier='{self.tier}')>"


# ═══════════════════════════════════════════════════════════════════════════
# MODEL: Agent
# ═══════════════════════════════════════════════════════════════════════════

class Agent(Base):
    __tablename__ = 'agents'
    
    agent_id = Column(String(100), primary_key=True)
    agent_name = Column(String(200), nullable=False)
    department = Column(String(100), nullable=False)
    level = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, default=False)
    activated_at = Column(TIMESTAMP)
    activated_by_user_id = Column(String(100), ForeignKey('users.user_id', ondelete='SET NULL'))
    reports_to = Column(String(100), ForeignKey('agents.agent_id', ondelete='SET NULL'))
    
    # LLM Configuration
    primary_llm_provider = Column(String(50), ForeignKey('llm_providers.provider_id', ondelete='RESTRICT'), nullable=False)
    primary_llm_model = Column(String(100), nullable=False)
    fallback_llm_provider = Column(String(50))
    fallback_llm_model = Column(String(100))
    secondary_fallback_provider = Column(String(50))
    secondary_fallback_model = Column(String(100))
    
    # Model Parameters
    custom_system_prompt = Column(Text)
    max_tokens_per_request = Column(Integer, nullable=False, default=4000)
    temperature = Column(DECIMAL(3, 2), nullable=False, default=0.7)
    top_p = Column(DECIMAL(3, 2), nullable=False, default=0.9)
    
    # Budget & Quality
    monthly_budget_limit = Column(DECIMAL(10, 2))
    quality_threshold = Column(DECIMAL(3, 2), nullable=False, default=3.5)
    auto_upgrade_on_low_quality = Column(Boolean, nullable=False, default=False)
    auto_downgrade_on_budget = Column(Boolean, nullable=False, default=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    activated_by_user = relationship("User", back_populates="agents", foreign_keys=[activated_by_user_id])
    subordinates = relationship("Agent", backref="manager", remote_side=[agent_id])
    integrations = relationship("AgentIntegration", back_populates="agent", cascade="all, delete-orphan")
    usage_logs = relationship("AgentUsageLog", back_populates="agent", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="agent", foreign_keys="Task.assigned_to_agent")
    
    __table_args__ = (
        CheckConstraint("level IN (0, 1, 2)", name='check_level'),
        CheckConstraint("temperature >= 0 AND temperature <= 2", name='check_temperature'),
        CheckConstraint("top_p >= 0 AND top_p <= 1", name='check_top_p'),
        CheckConstraint("quality_threshold >= 1 AND quality_threshold <= 5", name='check_quality_threshold'),
    )
    
    def __repr__(self):
        return f"<Agent(id='{self.agent_id}', name='{self.agent_name}', level={self.level}, active={self.is_active})>"


# ═══════════════════════════════════════════════════════════════════════════
# MODEL: AgentIntegration
# ═══════════════════════════════════════════════════════════════════════════

class AgentIntegration(Base):
    __tablename__ = 'agent_integrations'
    
    integration_id = Column(String(100), primary_key=True)
    agent_id = Column(String(100), ForeignKey('agents.agent_id', ondelete='CASCADE'), nullable=False)
    integration_name = Column(String(100), nullable=False)
    integration_type = Column(String(50), nullable=False)
    is_required = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=False)
    credentials = Column(Text)  # Should be encrypted
    configuration = Column(JSON)
    last_tested_at = Column(TIMESTAMP)
    test_status = Column(String(20), nullable=False, default='not_tested')
    test_error_message = Column(Text)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    agent = relationship("Agent", back_populates="integrations")
    
    __table_args__ = (
        CheckConstraint("integration_type IN ('api', 'oauth', 'webhook', 'database')", name='check_integration_type'),
        CheckConstraint("test_status IN ('success', 'failed', 'not_tested')", name='check_integration_test_status'),
    )
    
    def __repr__(self):
        return f"<AgentIntegration(id='{self.integration_id}', agent='{self.agent_id}', name='{self.integration_name}')>"


# ═══════════════════════════════════════════════════════════════════════════
# MODEL: Workflow
# ═══════════════════════════════════════════════════════════════════════════

class Workflow(Base):
    __tablename__ = 'workflows'
    
    workflow_id = Column(String(100), primary_key=True)
    workflow_name = Column(String(200), nullable=False)
    workflow_type = Column(String(50), nullable=False)
    description = Column(Text)
    created_by_user_id = Column(String(100), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    is_template = Column(Boolean, nullable=False, default=False)
    steps = Column(JSON, nullable=False)
    required_agents = Column(JSON, nullable=False)
    estimated_duration_minutes = Column(Integer)
    estimated_cost_usd = Column(DECIMAL(10, 4))
    total_executions = Column(Integer, nullable=False, default=0)
    avg_duration_minutes = Column(Integer)
    avg_cost_usd = Column(DECIMAL(10, 4))
    avg_quality_rating = Column(DECIMAL(3, 2))
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by_user = relationship("User", back_populates="workflows")
    tasks = relationship("Task", back_populates="workflow")
    
    def __repr__(self):
        return f"<Workflow(id='{self.workflow_id}', name='{self.workflow_name}', type='{self.workflow_type}')>"


# ═══════════════════════════════════════════════════════════════════════════
# MODEL: Task
# ═══════════════════════════════════════════════════════════════════════════

class Task(Base):
    __tablename__ = 'tasks'
    
    task_id = Column(String(100), primary_key=True)
    task_name = Column(String(200), nullable=False)
    task_description = Column(Text, nullable=False)
    submitted_by_user_id = Column(String(100), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    assigned_to_agent = Column(String(100), ForeignKey('agents.agent_id', ondelete='RESTRICT'), nullable=False)
    assigned_by_orchestrator = Column(String(100), ForeignKey('agents.agent_id', ondelete='RESTRICT'), nullable=False)
    status = Column(String(50), nullable=False, default='pending')
    priority = Column(String(20), nullable=False, default='medium')
    workflow_id = Column(String(100), ForeignKey('workflows.workflow_id', ondelete='SET NULL'))
    parent_task_id = Column(String(100), ForeignKey('tasks.task_id', ondelete='CASCADE'))
    agents_involved = Column(JSON)
    total_cost_usd = Column(DECIMAL(10, 4))
    total_tokens = Column(Integer)
    quality_rating = Column(DECIMAL(3, 2))
    user_feedback = Column(Text)
    output_data = Column(Text)
    output_files = Column(JSON)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    started_at = Column(TIMESTAMP)
    completed_at = Column(TIMESTAMP)
    estimated_completion = Column(TIMESTAMP)
    
    # Relationships
    submitted_by_user = relationship("User", back_populates="tasks")
    agent = relationship("Agent", back_populates="tasks", foreign_keys=[assigned_to_agent])
    workflow = relationship("Workflow", back_populates="tasks")
    subtasks = relationship("Task", backref="parent_task", remote_side=[task_id])
    usage_logs = relationship("AgentUsageLog", back_populates="task", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')", name='check_status'),
        CheckConstraint("priority IN ('low', 'medium', 'high', 'urgent')", name='check_priority'),
        CheckConstraint("quality_rating >= 1 AND quality_rating <= 5", name='check_task_quality_rating'),
    )
    
    def __repr__(self):
        return f"<Task(id='{self.task_id}', name='{self.task_name}', status='{self.status}')>"


# ═══════════════════════════════════════════════════════════════════════════
# MODEL: AgentUsageLog
# ═══════════════════════════════════════════════════════════════════════════

class AgentUsageLog(Base):
    __tablename__ = 'agent_usage_logs'
    
    log_id = Column(String(100), primary_key=True)
    agent_id = Column(String(100), ForeignKey('agents.agent_id', ondelete='CASCADE'), nullable=False)
    task_id = Column(String(100), ForeignKey('tasks.task_id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(100), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    llm_provider = Column(String(50), nullable=False)
    llm_model = Column(String(100), nullable=False)
    input_tokens = Column(Integer, nullable=False)
    output_tokens = Column(Integer, nullable=False)
    total_tokens = Column(Integer, nullable=False)
    cost_usd = Column(DECIMAL(10, 4), nullable=False)
    latency_ms = Column(Integer, nullable=False)
    quality_rating = Column(DECIMAL(3, 2))
    was_fallback = Column(Boolean, nullable=False, default=False)
    fallback_level = Column(Integer)
    fallback_reason = Column(Text)
    prompt_tokens = Column(Integer)
    completion_tokens = Column(Integer)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    
    # Relationships
    agent = relationship("Agent", back_populates="usage_logs")
    task = relationship("Task", back_populates="usage_logs")
    
    __table_args__ = (
        CheckConstraint("fallback_level IN (1, 2, 3)", name='check_fallback_level'),
        CheckConstraint("quality_rating >= 1 AND quality_rating <= 5", name='check_log_quality_rating'),
    )
    
    def __repr__(self):
        return f"<AgentUsageLog(id='{self.log_id}', agent='{self.agent_id}', tokens={self.total_tokens}, cost=${self.cost_usd})>"


# ═══════════════════════════════════════════════════════════════════════════
# MODEL: BudgetAlert
# ═══════════════════════════════════════════════════════════════════════════

class BudgetAlert(Base):
    __tablename__ = 'budget_alerts'
    
    alert_id = Column(String(100), primary_key=True)
    user_id = Column(String(100), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    alert_type = Column(String(50), nullable=False)
    threshold_percent = Column(Integer, nullable=False)
    target_id = Column(String(100))
    budget_limit = Column(DECIMAL(10, 2), nullable=False)
    current_spend = Column(DECIMAL(10, 2), nullable=False)
    triggered_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    acknowledged = Column(Boolean, nullable=False, default=False)
    acknowledged_at = Column(TIMESTAMP)
    action_taken = Column(String(50))
    
    # Relationships
    user = relationship("User", back_populates="budget_alerts")
    
    __table_args__ = (
        CheckConstraint("alert_type IN ('global', 'provider', 'agent', 'department')", name='check_alert_type'),
        CheckConstraint("threshold_percent IN (70, 85, 95, 100)", name='check_threshold_percent'),
        CheckConstraint("action_taken IN ('ignored', 'optimized', 'increased_budget', 'paused')", name='check_action_taken'),
    )
    
    def __repr__(self):
        return f"<BudgetAlert(id='{self.alert_id}', user='{self.user_id}', threshold={self.threshold_percent}%)>"


# ═══════════════════════════════════════════════════════════════════════════
# DATABASE CONNECTION AND SESSION MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager

class Database:
    """Database connection manager"""
    
    def __init__(self, connection_string: str):
        """
        Initialize database connection
        
        Example connection strings:
        - PostgreSQL: postgresql://user:password@localhost:5432/roady
        - SQLite: sqlite:///roady.db
        """
        self.engine = create_engine(connection_string, echo=False)
        self.SessionLocal = sessionmaker(bind=self.engine, autocommit=False, autoflush=False)
    
    def create_all_tables(self):
        """Create all tables in database"""
        Base.metadata.create_all(bind=self.engine)
    
    def drop_all_tables(self):
        """Drop all tables from database (DANGEROUS!)"""
        Base.metadata.drop_all(bind=self.engine)
    
    @contextmanager
    def get_session(self) -> Session:
        """
        Context manager for database sessions
        
        Usage:
            with db.get_session() as session:
                user = session.query(User).first()
        """
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()


# ═══════════════════════════════════════════════════════════════════════════
# EXAMPLE USAGE
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Initialize database
    db = Database("postgresql://user:password@localhost:5432/roady")
    
    # Create tables
    db.create_all_tables()
    
    # Example: Create a user
    with db.get_session() as session:
        new_user = User(
            user_id="user_003",
            email="demo@example.com",
            full_name="Demo User",
            password_hash="$2b$12$...",  # Use bcrypt in production
            role="user",
            monthly_budget_limit=500.00
        )
        session.add(new_user)
    
    # Example: Query users
    with db.get_session() as session:
        users = session.query(User).filter(User.is_active == True).all()
        for user in users:
            print(f"User: {user.full_name} ({user.email})")
    
    # Example: Get agent with usage stats
    with db.get_session() as session:
        from sqlalchemy import func
        
        agent_stats = session.query(
            Agent.agent_id,
            Agent.agent_name,
            func.count(AgentUsageLog.log_id).label('total_requests'),
            func.sum(AgentUsageLog.cost_usd).label('total_cost')
        ).join(AgentUsageLog).group_by(Agent.agent_id, Agent.agent_name).all()
        
        for stat in agent_stats:
            print(f"{stat.agent_name}: {stat.total_requests} requests, ${stat.total_cost}")

