"""
ROADY Core Orchestrator - The Brain of the System
Routes tasks to appropriate agents and coordinates execution
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import json
from datetime import datetime

class TaskPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class Task:
    task_id: str
    task_name: str
    task_description: str
    submitted_by_user_id: str
    priority: TaskPriority
    status: TaskStatus
    assigned_to_agent: Optional[str] = None
    created_at: datetime = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()

class CoreOrchestrator:
    """
    The brain of ROADY - routes tasks to appropriate agents
    """
    
    def __init__(self, database_session, llm_router):
        self.db = database_session
        self.llm_router = llm_router
        self.agent_capabilities = self._load_agent_capabilities()
        
    def _load_agent_capabilities(self) -> Dict[str, Dict]:
        """Load agent capabilities from database"""
        # This would load from your agents table
        return {
            # L1 Directors
            "chief_creative_officer": {
                "keywords": ["design", "visual", "logo", "graphic", "video", "creative"],
                "departments": ["creative_content_studio"],
                "level": 1
            },
            "chief_content_officer": {
                "keywords": ["write", "content", "blog", "copy", "article", "text"],
                "departments": ["creative_content_studio"],
                "level": 1
            },
            "marketing_director": {
                "keywords": ["marketing", "campaign", "seo", "social", "promote", "ads"],
                "departments": ["marketing"],
                "level": 1
            },
            "technology_director": {
                "keywords": ["code", "develop", "api", "bug", "fix", "deploy", "database"],
                "departments": ["technology_systems"],
                "level": 1
            },
            "construction_director": {
                "keywords": ["construction", "build", "renovate", "architect", "permit"],
                "departments": ["construction_real_estate"],
                "level": 1
            },
            # Add all your L1 directors...
        }
    
    def analyze_task(self, task_description: str) -> Dict[str, Any]:
        """
        Analyze task using LLM to understand intent and requirements
        """
        analysis_prompt = f"""
        Analyze this task and extract key information:
        
        Task: {task_description}
        
        Return JSON with:
        {{
            "intent": "brief description of what user wants",
            "complexity": "simple|medium|complex",
            "keywords": ["keyword1", "keyword2"],
            "required_agents": ["agent_type1", "agent_type2"],
            "estimated_duration_minutes": 10,
            "department": "department_name"
        }}
        """
        
        # Call LLM for analysis
        response = self.llm_router.execute_with_fallback(
            agent_id="core_orchestrator",
            prompt=analysis_prompt,
            task_id="analysis"
        )
        
        try:
            # Parse JSON response
            analysis = json.loads(response['content'])
            return analysis
        except json.JSONDecodeError:
            # Fallback to keyword matching if LLM doesn't return valid JSON
            return self._fallback_analysis(task_description)
    
    def _fallback_analysis(self, task_description: str) -> Dict[str, Any]:
        """Simple keyword-based analysis as fallback"""
        description_lower = task_description.lower()
        keywords = []
        
        # Extract keywords
        if any(word in description_lower for word in ["write", "blog", "article"]):
            keywords.extend(["write", "content"])
        if any(word in description_lower for word in ["design", "logo", "graphic"]):
            keywords.extend(["design", "visual"])
        if any(word in description_lower for word in ["code", "develop", "bug"]):
            keywords.extend(["code", "development"])
            
        return {
            "intent": task_description[:100],
            "complexity": "medium",
            "keywords": keywords,
            "department": self._guess_department(keywords)
        }
    
    def _guess_department(self, keywords: List[str]) -> str:
        """Guess department based on keywords"""
        keyword_to_dept = {
            "write": "creative_content_studio",
            "design": "creative_content_studio",
            "code": "technology_systems",
            "marketing": "marketing",
            "construction": "construction_real_estate"
        }
        
        for keyword in keywords:
            if keyword in keyword_to_dept:
                return keyword_to_dept[keyword]
        
        return "unknown"
    
    def route_to_agent(self, task: Task) -> str:
        """
        Route task to appropriate L1 director
        """
        # Analyze task
        analysis = self.analyze_task(task.task_description)
        
        # Find best matching L1 director
        best_match = None
        best_score = 0
        
        for agent_id, capabilities in self.agent_capabilities.items():
            score = 0
            
            # Check keyword matches
            for keyword in analysis.get('keywords', []):
                if keyword in capabilities['keywords']:
                    score += 10
            
            # Check department match
            if analysis.get('department') in capabilities['departments']:
                score += 20
            
            if score > best_score:
                best_score = score
                best_match = agent_id
        
        return best_match or "chief_content_officer"  # Default fallback
    
    def delegate_task(self, task: Task) -> Dict[str, Any]:
        """
        Main entry point: delegate task to appropriate agent
        """
        # Route to L1 director
        assigned_agent = self.route_to_agent(task)
        
        # Update task
        task.assigned_to_agent = assigned_agent
        task.status = TaskStatus.IN_PROGRESS
        
        # Log to database
        self._log_task(task)
        
        # Execute task (this would call the actual agent)
        result = self._execute_agent_task(assigned_agent, task)
        
        return {
            "task_id": task.task_id,
            "assigned_to": assigned_agent,
            "status": task.status.value,
            "result": result
        }
    
    def _log_task(self, task: Task):
        """Log task to database"""
        # Insert into tasks table
        print(f"📝 Logged task {task.task_id} assigned to {task.assigned_to_agent}")
    
    def _execute_agent_task(self, agent_id: str, task: Task) -> Dict[str, Any]:
        """Execute task with assigned agent"""
        print(f"🤖 Agent {agent_id} executing task {task.task_id}")
        
        # This would call the actual agent's execute method
        # For now, return mock result
        return {
            "status": "success",
            "output": f"Task completed by {agent_id}",
            "cost_usd": 0.15,
            "duration_seconds": 12.5
        }


# ═══════════════════════════════════════════════════════════════════════════
# EXAMPLE USAGE
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    from llm_router import LLMRouter  # Import your LLM Router
    
    # Mock database and router for demo
    db_session = None  # Your database session
    llm_router = None  # Your LLM Router instance
    
    # Create orchestrator
    orchestrator = CoreOrchestrator(db_session, llm_router)
    
    # Example task
    task = Task(
        task_id="task_001",
        task_name="Write blog post about AI",
        task_description="Write a 1000-word blog post about AI automation in business",
        submitted_by_user_id="user_001",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.PENDING
    )
    
    # Delegate task
    result = orchestrator.delegate_task(task)
    
    print(f"✅ Task delegated:")
    print(f"  Assigned to: {result['assigned_to']}")
    print(f"  Status: {result['status']}")

