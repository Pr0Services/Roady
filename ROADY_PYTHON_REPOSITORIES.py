"""
ROADY Database Repositories - Data Access Layer
Clean architecture pattern with repository classes for each model
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from datetime import datetime, timedelta
from roady_models import (
    User, Agent, Task, AgentUsageLog, LLMProvider, LLMModel,
    AgentIntegration, Workflow, BudgetAlert
)


# ═══════════════════════════════════════════════════════════════════════════
# USER REPOSITORY
# ═══════════════════════════════════════════════════════════════════════════

class UserRepository:
    """Repository for User operations"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, user_data: Dict[str, Any]) -> User:
        """Create a new user"""
        user = User(**user_data)
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user
    
    def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return self.session.query(User).filter(User.user_id == user_id).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.session.query(User).filter(User.email == email).first()
    
    def get_all_active(self) -> List[User]:
        """Get all active users"""
        return self.session.query(User).filter(User.is_active == True).all()
    
    def update(self, user_id: str, updates: Dict[str, Any]) -> Optional[User]:
        """Update user"""
        user = self.get_by_id(user_id)
        if user:
            for key, value in updates.items():
                setattr(user, key, value)
            self.session.commit()
            self.session.refresh(user)
        return user
    
    def update_budget_spend(self, user_id: str, amount: float) -> None:
        """Add to current month spend"""
        user = self.get_by_id(user_id)
        if user:
            user.current_month_spend += amount
            self.session.commit()
    
    def reset_monthly_spend(self) -> None:
        """Reset all users' monthly spend (run on 1st of month)"""
        self.session.query(User).update({User.current_month_spend: 0.00})
        self.session.commit()
    
    def get_budget_status(self, user_id: str) -> Dict[str, Any]:
        """Get user's budget status"""
        user = self.get_by_id(user_id)
        if not user:
            return None
        
        percent_used = 0
        if user.monthly_budget_limit and user.monthly_budget_limit > 0:
            percent_used = (user.current_month_spend / user.monthly_budget_limit) * 100
        
        return {
            'user_id': user.user_id,
            'budget_limit': float(user.monthly_budget_limit) if user.monthly_budget_limit else None,
            'current_spend': float(user.current_month_spend),
            'remaining': float(user.monthly_budget_limit - user.current_month_spend) if user.monthly_budget_limit else None,
            'percent_used': round(percent_used, 2),
            'status': 'ok' if percent_used < 85 else 'warning' if percent_used < 95 else 'critical'
        }


# ═══════════════════════════════════════════════════════════════════════════
# AGENT REPOSITORY
# ═══════════════════════════════════════════════════════════════════════════

class AgentRepository:
    """Repository for Agent operations"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, agent_data: Dict[str, Any]) -> Agent:
        """Create a new agent"""
        agent = Agent(**agent_data)
        self.session.add(agent)
        self.session.commit()
        self.session.refresh(agent)
        return agent
    
    def get_by_id(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ID"""
        return self.session.query(Agent).filter(Agent.agent_id == agent_id).first()
    
    def get_all_active(self) -> List[Agent]:
        """Get all active agents"""
        return self.session.query(Agent).filter(Agent.is_active == True).all()
    
    def get_by_department(self, department: str) -> List[Agent]:
        """Get agents by department"""
        return self.session.query(Agent).filter(Agent.department == department).all()
    
    def get_by_level(self, level: int) -> List[Agent]:
        """Get agents by level (0, 1, 2)"""
        return self.session.query(Agent).filter(Agent.level == level).all()
    
    def get_subordinates(self, manager_agent_id: str) -> List[Agent]:
        """Get all agents reporting to this agent"""
        return self.session.query(Agent).filter(Agent.reports_to == manager_agent_id).all()
    
    def activate_agent(self, agent_id: str, user_id: str) -> Optional[Agent]:
        """Activate an agent"""
        agent = self.get_by_id(agent_id)
        if agent:
            agent.is_active = True
            agent.activated_at = datetime.utcnow()
            agent.activated_by_user_id = user_id
            self.session.commit()
            self.session.refresh(agent)
        return agent
    
    def deactivate_agent(self, agent_id: str) -> Optional[Agent]:
        """Deactivate an agent"""
        agent = self.get_by_id(agent_id)
        if agent:
            agent.is_active = False
            self.session.commit()
            self.session.refresh(agent)
        return agent
    
    def update_llm_config(self, agent_id: str, llm_config: Dict[str, Any]) -> Optional[Agent]:
        """Update agent's LLM configuration"""
        agent = self.get_by_id(agent_id)
        if agent:
            for key, value in llm_config.items():
                if hasattr(agent, key):
                    setattr(agent, key, value)
            self.session.commit()
            self.session.refresh(agent)
        return agent
    
    def get_performance_stats(self, agent_id: str, days: int = 30) -> Dict[str, Any]:
        """Get agent performance statistics"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        stats = self.session.query(
            func.count(AgentUsageLog.log_id).label('total_requests'),
            func.sum(AgentUsageLog.total_tokens).label('total_tokens'),
            func.sum(AgentUsageLog.cost_usd).label('total_cost'),
            func.avg(AgentUsageLog.latency_ms).label('avg_latency'),
            func.avg(AgentUsageLog.quality_rating).label('avg_quality'),
            func.count(func.nullif(AgentUsageLog.was_fallback, False)).label('fallback_count')
        ).filter(
            and_(
                AgentUsageLog.agent_id == agent_id,
                AgentUsageLog.created_at >= cutoff_date
            )
        ).first()
        
        return {
            'agent_id': agent_id,
            'period_days': days,
            'total_requests': stats.total_requests or 0,
            'total_tokens': stats.total_tokens or 0,
            'total_cost_usd': float(stats.total_cost or 0),
            'avg_latency_ms': float(stats.avg_latency or 0),
            'avg_quality_rating': float(stats.avg_quality or 0),
            'fallback_count': stats.fallback_count or 0,
            'fallback_rate': (stats.fallback_count / stats.total_requests * 100) if stats.total_requests else 0
        }


# ═══════════════════════════════════════════════════════════════════════════
# TASK REPOSITORY
# ═══════════════════════════════════════════════════════════════════════════

class TaskRepository:
    """Repository for Task operations"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, task_data: Dict[str, Any]) -> Task:
        """Create a new task"""
        task = Task(**task_data)
        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)
        return task
    
    def get_by_id(self, task_id: str) -> Optional[Task]:
        """Get task by ID"""
        return self.session.query(Task).filter(Task.task_id == task_id).first()
    
    def get_by_user(self, user_id: str, status: Optional[str] = None) -> List[Task]:
        """Get tasks by user, optionally filtered by status"""
        query = self.session.query(Task).filter(Task.submitted_by_user_id == user_id)
        if status:
            query = query.filter(Task.status == status)
        return query.order_by(desc(Task.created_at)).all()
    
    def get_by_agent(self, agent_id: str, status: Optional[str] = None) -> List[Task]:
        """Get tasks assigned to agent"""
        query = self.session.query(Task).filter(Task.assigned_to_agent == agent_id)
        if status:
            query = query.filter(Task.status == status)
        return query.order_by(desc(Task.created_at)).all()
    
    def get_pending(self) -> List[Task]:
        """Get all pending tasks"""
        return self.session.query(Task).filter(Task.status == 'pending').order_by(Task.priority.desc(), Task.created_at).all()
    
    def update_status(self, task_id: str, status: str) -> Optional[Task]:
        """Update task status"""
        task = self.get_by_id(task_id)
        if task:
            task.status = status
            
            if status == 'in_progress' and not task.started_at:
                task.started_at = datetime.utcnow()
            elif status == 'completed' and not task.completed_at:
                task.completed_at = datetime.utcnow()
            
            self.session.commit()
            self.session.refresh(task)
        return task
    
    def add_quality_rating(self, task_id: str, rating: float, feedback: Optional[str] = None) -> Optional[Task]:
        """Add quality rating to task"""
        task = self.get_by_id(task_id)
        if task:
            task.quality_rating = rating
            if feedback:
                task.user_feedback = feedback
            self.session.commit()
            self.session.refresh(task)
        return task
    
    def calculate_total_cost(self, task_id: str) -> float:
        """Calculate total cost from usage logs"""
        total = self.session.query(
            func.sum(AgentUsageLog.cost_usd)
        ).filter(
            AgentUsageLog.task_id == task_id
        ).scalar()
        
        return float(total or 0)
    
    def get_statistics(self, user_id: Optional[str] = None, days: int = 30) -> Dict[str, Any]:
        """Get task statistics"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = self.session.query(Task).filter(Task.created_at >= cutoff_date)
        
        if user_id:
            query = query.filter(Task.submitted_by_user_id == user_id)
        
        all_tasks = query.all()
        
        stats = {
            'total_tasks': len(all_tasks),
            'by_status': {},
            'by_priority': {},
            'avg_duration_minutes': 0,
            'avg_cost_usd': 0,
            'avg_quality_rating': 0
        }
        
        # Count by status
        for task in all_tasks:
            stats['by_status'][task.status] = stats['by_status'].get(task.status, 0) + 1
            stats['by_priority'][task.priority] = stats['by_priority'].get(task.priority, 0) + 1
        
        # Calculate averages
        completed_tasks = [t for t in all_tasks if t.status == 'completed']
        if completed_tasks:
            durations = [
                (t.completed_at - t.started_at).total_seconds() / 60
                for t in completed_tasks
                if t.started_at and t.completed_at
            ]
            costs = [float(t.total_cost_usd) for t in completed_tasks if t.total_cost_usd]
            ratings = [float(t.quality_rating) for t in completed_tasks if t.quality_rating]
            
            stats['avg_duration_minutes'] = sum(durations) / len(durations) if durations else 0
            stats['avg_cost_usd'] = sum(costs) / len(costs) if costs else 0
            stats['avg_quality_rating'] = sum(ratings) / len(ratings) if ratings else 0
        
        return stats


# ═══════════════════════════════════════════════════════════════════════════
# AGENT USAGE LOG REPOSITORY
# ═══════════════════════════════════════════════════════════════════════════

class AgentUsageLogRepository:
    """Repository for AgentUsageLog operations"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, log_data: Dict[str, Any]) -> AgentUsageLog:
        """Create a new usage log entry"""
        log = AgentUsageLog(**log_data)
        self.session.add(log)
        self.session.commit()
        self.session.refresh(log)
        return log
    
    def get_by_task(self, task_id: str) -> List[AgentUsageLog]:
        """Get all usage logs for a task"""
        return self.session.query(AgentUsageLog).filter(AgentUsageLog.task_id == task_id).all()
    
    def get_by_agent(self, agent_id: str, days: int = 30) -> List[AgentUsageLog]:
        """Get usage logs for an agent"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return self.session.query(AgentUsageLog).filter(
            and_(
                AgentUsageLog.agent_id == agent_id,
                AgentUsageLog.created_at >= cutoff_date
            )
        ).all()
    
    def get_cost_breakdown_by_provider(self, user_id: str, days: int = 30) -> Dict[str, float]:
        """Get cost breakdown by LLM provider"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        results = self.session.query(
            AgentUsageLog.llm_provider,
            func.sum(AgentUsageLog.cost_usd).label('total_cost')
        ).filter(
            and_(
                AgentUsageLog.user_id == user_id,
                AgentUsageLog.created_at >= cutoff_date
            )
        ).group_by(AgentUsageLog.llm_provider).all()
        
        return {result.llm_provider: float(result.total_cost) for result in results}
    
    def get_cost_breakdown_by_agent(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get cost breakdown by agent"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        results = self.session.query(
            AgentUsageLog.agent_id,
            Agent.agent_name,
            func.count(AgentUsageLog.log_id).label('request_count'),
            func.sum(AgentUsageLog.cost_usd).label('total_cost')
        ).join(Agent).filter(
            and_(
                AgentUsageLog.user_id == user_id,
                AgentUsageLog.created_at >= cutoff_date
            )
        ).group_by(AgentUsageLog.agent_id, Agent.agent_name).order_by(desc('total_cost')).all()
        
        return [
            {
                'agent_id': r.agent_id,
                'agent_name': r.agent_name,
                'request_count': r.request_count,
                'total_cost_usd': float(r.total_cost)
            }
            for r in results
        ]
    
    def get_fallback_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get fallback usage statistics"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        total = self.session.query(func.count(AgentUsageLog.log_id)).filter(
            AgentUsageLog.created_at >= cutoff_date
        ).scalar()
        
        fallback = self.session.query(func.count(AgentUsageLog.log_id)).filter(
            and_(
                AgentUsageLog.created_at >= cutoff_date,
                AgentUsageLog.was_fallback == True
            )
        ).scalar()
        
        return {
            'total_requests': total,
            'fallback_requests': fallback,
            'fallback_rate': (fallback / total * 100) if total else 0
        }


# ═══════════════════════════════════════════════════════════════════════════
# LLM PROVIDER REPOSITORY
# ═══════════════════════════════════════════════════════════════════════════

class LLMProviderRepository:
    """Repository for LLMProvider operations"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, provider_data: Dict[str, Any]) -> LLMProvider:
        """Create a new LLM provider"""
        provider = LLMProvider(**provider_data)
        self.session.add(provider)
        self.session.commit()
        self.session.refresh(provider)
        return provider
    
    def get_by_id(self, provider_id: str) -> Optional[LLMProvider]:
        """Get provider by ID"""
        return self.session.query(LLMProvider).filter(LLMProvider.provider_id == provider_id).first()
    
    def get_all_active(self) -> List[LLMProvider]:
        """Get all active providers"""
        return self.session.query(LLMProvider).filter(LLMProvider.is_active == True).all()
    
    def update_test_status(self, provider_id: str, status: str, error_message: Optional[str] = None) -> Optional[LLMProvider]:
        """Update provider test status"""
        provider = self.get_by_id(provider_id)
        if provider:
            provider.test_status = status
            provider.last_tested_at = datetime.utcnow()
            provider.test_error_message = error_message
            self.session.commit()
            self.session.refresh(provider)
        return provider
    
    def update_spend(self, provider_id: str, amount: float) -> None:
        """Add to provider's current month spend"""
        provider = self.get_by_id(provider_id)
        if provider:
            provider.current_month_spend += amount
            self.session.commit()
    
    def reset_monthly_spend(self) -> None:
        """Reset all providers' monthly spend"""
        self.session.query(LLMProvider).update({LLMProvider.current_month_spend: 0.00})
        self.session.commit()


# ═══════════════════════════════════════════════════════════════════════════
# BUDGET ALERT REPOSITORY
# ═══════════════════════════════════════════════════════════════════════════

class BudgetAlertRepository:
    """Repository for BudgetAlert operations"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, alert_data: Dict[str, Any]) -> BudgetAlert:
        """Create a new budget alert"""
        alert = BudgetAlert(**alert_data)
        self.session.add(alert)
        self.session.commit()
        self.session.refresh(alert)
        return alert
    
    def get_unacknowledged(self, user_id: str) -> List[BudgetAlert]:
        """Get unacknowledged alerts for user"""
        return self.session.query(BudgetAlert).filter(
            and_(
                BudgetAlert.user_id == user_id,
                BudgetAlert.acknowledged == False
            )
        ).order_by(desc(BudgetAlert.triggered_at)).all()
    
    def acknowledge(self, alert_id: str, action_taken: Optional[str] = None) -> Optional[BudgetAlert]:
        """Acknowledge an alert"""
        alert = self.session.query(BudgetAlert).filter(BudgetAlert.alert_id == alert_id).first()
        if alert:
            alert.acknowledged = True
            alert.acknowledged_at = datetime.utcnow()
            if action_taken:
                alert.action_taken = action_taken
            self.session.commit()
            self.session.refresh(alert)
        return alert
    
    def check_and_create_alerts(self, user_id: str) -> List[BudgetAlert]:
        """Check budget thresholds and create alerts if needed"""
        user_repo = UserRepository(self.session)
        budget_status = user_repo.get_budget_status(user_id)
        
        if not budget_status:
            return []
        
        percent_used = budget_status['percent_used']
        created_alerts = []
        
        # Check thresholds
        thresholds = [70, 85, 95, 100]
        for threshold in thresholds:
            if percent_used >= threshold:
                # Check if alert already exists for this threshold
                existing = self.session.query(BudgetAlert).filter(
                    and_(
                        BudgetAlert.user_id == user_id,
                        BudgetAlert.alert_type == 'global',
                        BudgetAlert.threshold_percent == threshold,
                        BudgetAlert.triggered_at >= datetime.utcnow() - timedelta(hours=24)
                    )
                ).first()
                
                if not existing:
                    alert = self.create({
                        'alert_id': f"alert_{user_id}_{threshold}_{int(datetime.utcnow().timestamp())}",
                        'user_id': user_id,
                        'alert_type': 'global',
                        'threshold_percent': threshold,
                        'budget_limit': budget_status['budget_limit'],
                        'current_spend': budget_status['current_spend']
                    })
                    created_alerts.append(alert)
        
        return created_alerts


# ═══════════════════════════════════════════════════════════════════════════
# EXAMPLE USAGE
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    from roady_models import Database
    
    # Initialize database
    db = Database("postgresql://user:password@localhost:5432/roady")
    
    # Example: Using repositories
    with db.get_session() as session:
        # User operations
        user_repo = UserRepository(session)
        user = user_repo.get_by_email("john@example.com")
        budget_status = user_repo.get_budget_status(user.user_id)
        print(f"Budget: {budget_status}")
        
        # Agent operations
        agent_repo = AgentRepository(session)
        active_agents = agent_repo.get_all_active()
        print(f"Active agents: {len(active_agents)}")
        
        # Task operations
        task_repo = TaskRepository(session)
        user_tasks = task_repo.get_by_user(user.user_id)
        task_stats = task_repo.get_statistics(user.user_id)
        print(f"Task stats: {task_stats}")
        
        # Usage log operations
        log_repo = AgentUsageLogRepository(session)
        cost_by_provider = log_repo.get_cost_breakdown_by_provider(user.user_id)
        print(f"Costs by provider: {cost_by_provider}")

