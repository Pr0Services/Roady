"""
ROADY Construction - Intégration LLM Multi-Provider
Support Claude, GPT-4, Gemini avec routing intelligent
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, AsyncGenerator
from enum import Enum
from datetime import datetime
from abc import ABC, abstractmethod
import asyncio
import json
import httpx

# ============================================
# CONFIGURATION LLM
# ============================================

class LLMProvider(str, Enum):
    CLAUDE = "claude"
    OPENAI = "openai"
    GEMINI = "gemini"

class ModelTier(str, Enum):
    PREMIUM = "premium"      # Claude Opus, GPT-4
    STANDARD = "standard"    # Claude Sonnet, GPT-4-mini
    FAST = "fast"            # Claude Haiku, GPT-3.5

@dataclass
class LLMConfig:
    provider: LLMProvider
    model: str
    api_key: str
    base_url: str
    max_tokens: int = 4096
    temperature: float = 0.7
    timeout: int = 60
    requests_per_minute: int = 60

# Configurations par défaut
MODELS = {
    LLMProvider.CLAUDE: {
        ModelTier.PREMIUM: {"model": "claude-opus-4-20250514", "base_url": "https://api.anthropic.com/v1"},
        ModelTier.STANDARD: {"model": "claude-sonnet-4-20250514", "base_url": "https://api.anthropic.com/v1"},
        ModelTier.FAST: {"model": "claude-haiku-4-20250514", "base_url": "https://api.anthropic.com/v1"},
    },
    LLMProvider.OPENAI: {
        ModelTier.PREMIUM: {"model": "gpt-4-turbo", "base_url": "https://api.openai.com/v1"},
        ModelTier.STANDARD: {"model": "gpt-4o-mini", "base_url": "https://api.openai.com/v1"},
        ModelTier.FAST: {"model": "gpt-3.5-turbo", "base_url": "https://api.openai.com/v1"},
    },
    LLMProvider.GEMINI: {
        ModelTier.PREMIUM: {"model": "gemini-pro", "base_url": "https://generativelanguage.googleapis.com/v1"},
        ModelTier.STANDARD: {"model": "gemini-pro", "base_url": "https://generativelanguage.googleapis.com/v1"},
        ModelTier.FAST: {"model": "gemini-pro", "base_url": "https://generativelanguage.googleapis.com/v1"},
    },
}

# ============================================
# MESSAGES ET CONTEXTE
# ============================================

class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"

@dataclass
class Message:
    role: MessageRole
    content: str
    name: Optional[str] = None
    tool_calls: Optional[List[Dict]] = None
    tool_call_id: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)

@dataclass
class LLMResponse:
    content: str
    model: str
    provider: LLMProvider
    usage: Dict[str, int]
    latency_ms: float
    tool_calls: Optional[List[Dict]] = None
    finish_reason: str = "stop"

# ============================================
# CLIENTS LLM
# ============================================

class BaseLLMClient(ABC):
    def __init__(self, config: LLMConfig):
        self.config = config
        self.client = httpx.AsyncClient(timeout=config.timeout)
    
    @abstractmethod
    async def complete(self, messages: List[Message], **kwargs) -> LLMResponse:
        pass
    
    @abstractmethod
    async def stream(self, messages: List[Message], **kwargs) -> AsyncGenerator[str, None]:
        pass

class ClaudeClient(BaseLLMClient):
    async def complete(self, messages: List[Message], **kwargs) -> LLMResponse:
        start = datetime.utcnow()
        system = next((m.content for m in messages if m.role == MessageRole.SYSTEM), None)
        chat_messages = [{"role": m.role.value, "content": m.content} 
                        for m in messages if m.role != MessageRole.SYSTEM]
        
        payload = {
            "model": self.config.model,
            "max_tokens": kwargs.get("max_tokens", self.config.max_tokens),
            "temperature": kwargs.get("temperature", self.config.temperature),
            "messages": chat_messages,
        }
        if system:
            payload["system"] = system
        
        response = await self.client.post(
            f"{self.config.base_url}/messages",
            headers={
                "x-api-key": self.config.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json=payload
        )
        data = response.json()
        latency = (datetime.utcnow() - start).total_seconds() * 1000
        
        return LLMResponse(
            content=data["content"][0]["text"],
            model=self.config.model,
            provider=LLMProvider.CLAUDE,
            usage={"input": data["usage"]["input_tokens"], "output": data["usage"]["output_tokens"]},
            latency_ms=latency,
            finish_reason=data.get("stop_reason", "stop")
        )
    
    async def stream(self, messages: List[Message], **kwargs) -> AsyncGenerator[str, None]:
        # Streaming implementation
        pass

class OpenAIClient(BaseLLMClient):
    async def complete(self, messages: List[Message], **kwargs) -> LLMResponse:
        start = datetime.utcnow()
        chat_messages = [{"role": m.role.value, "content": m.content} for m in messages]
        
        response = await self.client.post(
            f"{self.config.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": self.config.model,
                "messages": chat_messages,
                "max_tokens": kwargs.get("max_tokens", self.config.max_tokens),
                "temperature": kwargs.get("temperature", self.config.temperature),
            }
        )
        data = response.json()
        latency = (datetime.utcnow() - start).total_seconds() * 1000
        
        return LLMResponse(
            content=data["choices"][0]["message"]["content"],
            model=self.config.model,
            provider=LLMProvider.OPENAI,
            usage={"input": data["usage"]["prompt_tokens"], "output": data["usage"]["completion_tokens"]},
            latency_ms=latency,
            finish_reason=data["choices"][0].get("finish_reason", "stop")
        )
    
    async def stream(self, messages: List[Message], **kwargs) -> AsyncGenerator[str, None]:
        pass

# ============================================
# ROUTER INTELLIGENT
# ============================================

@dataclass
class TaskClassification:
    complexity: str  # simple, medium, complex
    domain: str      # construction, finance, legal, etc.
    urgency: str     # low, medium, high
    requires_reasoning: bool
    estimated_tokens: int

class LLMRouter:
    def __init__(self, api_keys: Dict[LLMProvider, str]):
        self.api_keys = api_keys
        self.clients: Dict[str, BaseLLMClient] = {}
        self.metrics: Dict[str, List[float]] = {}
        self._init_clients()
    
    def _init_clients(self):
        for provider, tiers in MODELS.items():
            if provider not in self.api_keys:
                continue
            for tier, config in tiers.items():
                key = f"{provider.value}_{tier.value}"
                llm_config = LLMConfig(
                    provider=provider,
                    model=config["model"],
                    api_key=self.api_keys[provider],
                    base_url=config["base_url"]
                )
                if provider == LLMProvider.CLAUDE:
                    self.clients[key] = ClaudeClient(llm_config)
                elif provider == LLMProvider.OPENAI:
                    self.clients[key] = OpenAIClient(llm_config)
    
    def classify_task(self, messages: List[Message], agent_level: str = "L3") -> TaskClassification:
        """Classifie la tâche pour déterminer le meilleur modèle"""
        content = " ".join([m.content for m in messages])
        word_count = len(content.split())
        
        # Analyse de complexité basée sur le niveau d'agent et le contenu
        complexity = "simple"
        if agent_level in ["L0", "L1"] or word_count > 500:
            complexity = "complex"
        elif agent_level == "L2" or word_count > 200:
            complexity = "medium"
        
        # Détection du domaine
        domain_keywords = {
            "construction": ["béton", "structure", "chantier", "plans", "permis", "estimation"],
            "finance": ["budget", "coût", "facture", "paiement", "marge"],
            "legal": ["contrat", "clause", "responsabilité", "conformité"],
            "technical": ["calcul", "ingénierie", "spécification", "norme"]
        }
        domain = "general"
        for d, keywords in domain_keywords.items():
            if any(kw in content.lower() for kw in keywords):
                domain = d
                break
        
        return TaskClassification(
            complexity=complexity,
            domain=domain,
            urgency="medium",
            requires_reasoning=complexity == "complex",
            estimated_tokens=word_count * 4
        )
    
    def select_model(self, classification: TaskClassification, 
                     preferred_provider: Optional[LLMProvider] = None) -> str:
        """Sélectionne le meilleur modèle basé sur la classification"""
        provider = preferred_provider or LLMProvider.CLAUDE
        
        tier_map = {
            "complex": ModelTier.PREMIUM,
            "medium": ModelTier.STANDARD,
            "simple": ModelTier.FAST
        }
        tier = tier_map.get(classification.complexity, ModelTier.STANDARD)
        
        # Fallback si le provider préféré n'est pas disponible
        key = f"{provider.value}_{tier.value}"
        if key not in self.clients:
            for p in LLMProvider:
                alt_key = f"{p.value}_{tier.value}"
                if alt_key in self.clients:
                    return alt_key
        return key
    
    async def route(self, messages: List[Message], agent_level: str = "L3",
                    preferred_provider: Optional[LLMProvider] = None, **kwargs) -> LLMResponse:
        """Route la requête vers le meilleur modèle"""
        classification = self.classify_task(messages, agent_level)
        model_key = self.select_model(classification, preferred_provider)
        client = self.clients[model_key]
        
        response = await client.complete(messages, **kwargs)
        
        # Enregistrer les métriques
        if model_key not in self.metrics:
            self.metrics[model_key] = []
        self.metrics[model_key].append(response.latency_ms)
        
        return response

# ============================================
# AGENT LLM WRAPPER
# ============================================

class AgentLLM:
    """Wrapper pour utiliser le LLM Router avec les agents ROADY"""
    
    def __init__(self, router: LLMRouter):
        self.router = router
        self.conversation_history: List[Message] = []
    
    def set_system_prompt(self, prompt: str):
        self.conversation_history = [Message(role=MessageRole.SYSTEM, content=prompt)]
    
    async def chat(self, user_message: str, agent_level: str = "L3", **kwargs) -> str:
        self.conversation_history.append(Message(role=MessageRole.USER, content=user_message))
        response = await self.router.route(self.conversation_history, agent_level, **kwargs)
        self.conversation_history.append(Message(role=MessageRole.ASSISTANT, content=response.content))
        return response.content
    
    def clear_history(self):
        system = next((m for m in self.conversation_history if m.role == MessageRole.SYSTEM), None)
        self.conversation_history = [system] if system else []

# ============================================
# EXEMPLE D'UTILISATION
# ============================================

async def main():
    router = LLMRouter({
        LLMProvider.CLAUDE: "sk-ant-...",
        LLMProvider.OPENAI: "sk-..."
    })
    
    agent = AgentLLM(router)
    agent.set_system_prompt("""Tu es l'Agent Estimateur de ROADY Construction.
    Tu analyses les projets et fournis des estimations précises.""")
    
    response = await agent.chat(
        "Estime le coût pour une fondation de 100m² avec semelles filantes.",
        agent_level="L2"
    )
    print(response)

if __name__ == "__main__":
    asyncio.run(main())
