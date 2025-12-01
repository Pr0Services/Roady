"""
ROADY Construction - Intégration LLM Multi-Provider
Claude (Anthropic) + GPT (OpenAI) + Gemini (Google) + Local (Ollama)
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional, List, Dict, Any, AsyncGenerator, Callable
from enum import Enum
from pydantic import BaseModel, Field
import asyncio
import json
import httpx

# ============================================================
# CONFIGURATION
# ============================================================

class LLMProvider(str, Enum):
    CLAUDE = "claude"
    GPT = "gpt"
    GEMINI = "gemini"
    OLLAMA = "ollama"

class LLMModel(str, Enum):
    # Claude
    CLAUDE_OPUS = "claude-opus-4-20250514"
    CLAUDE_SONNET = "claude-sonnet-4-5-20250514"
    CLAUDE_HAIKU = "claude-haiku-4-5-20250514"
    
    # GPT
    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"
    GPT_4_TURBO = "gpt-4-turbo"
    
    # Gemini
    GEMINI_PRO = "gemini-1.5-pro"
    GEMINI_FLASH = "gemini-1.5-flash"
    
    # Local
    LLAMA_3 = "llama3:70b"
    MISTRAL = "mistral:latest"
    CODELLAMA = "codellama:34b"

# Mapping Provider -> Models
PROVIDER_MODELS = {
    LLMProvider.CLAUDE: [LLMModel.CLAUDE_OPUS, LLMModel.CLAUDE_SONNET, LLMModel.CLAUDE_HAIKU],
    LLMProvider.GPT: [LLMModel.GPT_4O, LLMModel.GPT_4O_MINI, LLMModel.GPT_4_TURBO],
    LLMProvider.GEMINI: [LLMModel.GEMINI_PRO, LLMModel.GEMINI_FLASH],
    LLMProvider.OLLAMA: [LLMModel.LLAMA_3, LLMModel.MISTRAL, LLMModel.CODELLAMA],
}

# Coûts par 1M tokens (input/output)
MODEL_COSTS = {
    LLMModel.CLAUDE_OPUS: {"input": 15.0, "output": 75.0},
    LLMModel.CLAUDE_SONNET: {"input": 3.0, "output": 15.0},
    LLMModel.CLAUDE_HAIKU: {"input": 0.25, "output": 1.25},
    LLMModel.GPT_4O: {"input": 5.0, "output": 15.0},
    LLMModel.GPT_4O_MINI: {"input": 0.15, "output": 0.60},
    LLMModel.GPT_4_TURBO: {"input": 10.0, "output": 30.0},
    LLMModel.GEMINI_PRO: {"input": 3.5, "output": 10.5},
    LLMModel.GEMINI_FLASH: {"input": 0.35, "output": 1.05},
    LLMModel.LLAMA_3: {"input": 0.0, "output": 0.0},  # Local
    LLMModel.MISTRAL: {"input": 0.0, "output": 0.0},
    LLMModel.CODELLAMA: {"input": 0.0, "output": 0.0},
}

class LLMConfig(BaseModel):
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    ollama_base_url: str = "http://localhost:11434"
    default_provider: LLMProvider = LLMProvider.CLAUDE
    default_model: LLMModel = LLMModel.CLAUDE_SONNET
    max_retries: int = 3
    timeout: int = 120

# ============================================================
# MODÈLES
# ============================================================

class Message(BaseModel):
    role: str  # system, user, assistant
    content: str
    name: Optional[str] = None
    
class Tool(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]
    
class ToolCall(BaseModel):
    id: str
    name: str
    arguments: Dict[str, Any]
    
class LLMRequest(BaseModel):
    messages: List[Message]
    model: Optional[LLMModel] = None
    provider: Optional[LLMProvider] = None
    temperature: float = 0.7
    max_tokens: int = 4096
    tools: Optional[List[Tool]] = None
    stream: bool = False
    metadata: Dict[str, Any] = {}

class LLMResponse(BaseModel):
    content: str
    model: LLMModel
    provider: LLMProvider
    tool_calls: Optional[List[ToolCall]] = None
    usage: Dict[str, int] = {}
    cost: float = 0.0
    latency_ms: int = 0
    metadata: Dict[str, Any] = {}

# ============================================================
# PROVIDERS ABSTRAITS
# ============================================================

class BaseLLMProvider(ABC):
    def __init__(self, config: LLMConfig):
        self.config = config
        self.client = httpx.AsyncClient(timeout=config.timeout)
    
    @abstractmethod
    async def complete(self, request: LLMRequest) -> LLMResponse:
        pass
    
    @abstractmethod
    async def stream(self, request: LLMRequest) -> AsyncGenerator[str, None]:
        pass
    
    def calculate_cost(self, model: LLMModel, input_tokens: int, output_tokens: int) -> float:
        costs = MODEL_COSTS.get(model, {"input": 0, "output": 0})
        return (input_tokens * costs["input"] + output_tokens * costs["output"]) / 1_000_000

# ============================================================
# CLAUDE PROVIDER
# ============================================================

class ClaudeProvider(BaseLLMProvider):
    BASE_URL = "https://api.anthropic.com/v1/messages"
    
    async def complete(self, request: LLMRequest) -> LLMResponse:
        start = datetime.now()
        
        # Préparer les messages
        system_msg = None
        messages = []
        for msg in request.messages:
            if msg.role == "system":
                system_msg = msg.content
            else:
                messages.append({"role": msg.role, "content": msg.content})
        
        # Préparer les outils
        tools = None
        if request.tools:
            tools = [{
                "name": t.name,
                "description": t.description,
                "input_schema": t.parameters
            } for t in request.tools]
        
        payload = {
            "model": request.model.value if request.model else LLMModel.CLAUDE_SONNET.value,
            "max_tokens": request.max_tokens,
            "messages": messages,
        }
        if system_msg:
            payload["system"] = system_msg
        if tools:
            payload["tools"] = tools
        
        response = await self.client.post(
            self.BASE_URL,
            headers={
                "x-api-key": self.config.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        
        # Parser la réponse
        content = ""
        tool_calls = []
        for block in data.get("content", []):
            if block["type"] == "text":
                content += block["text"]
            elif block["type"] == "tool_use":
                tool_calls.append(ToolCall(
                    id=block["id"],
                    name=block["name"],
                    arguments=block["input"]
                ))
        
        usage = data.get("usage", {})
        latency = int((datetime.now() - start).total_seconds() * 1000)
        
        return LLMResponse(
            content=content,
            model=LLMModel(data["model"]),
            provider=LLMProvider.CLAUDE,
            tool_calls=tool_calls if tool_calls else None,
            usage={
                "input_tokens": usage.get("input_tokens", 0),
                "output_tokens": usage.get("output_tokens", 0)
            },
            cost=self.calculate_cost(
                LLMModel(data["model"]),
                usage.get("input_tokens", 0),
                usage.get("output_tokens", 0)
            ),
            latency_ms=latency
        )
    
    async def stream(self, request: LLMRequest) -> AsyncGenerator[str, None]:
        # Implémentation streaming Claude
        pass

# ============================================================
# GPT PROVIDER
# ============================================================

class GPTProvider(BaseLLMProvider):
    BASE_URL = "https://api.openai.com/v1/chat/completions"
    
    async def complete(self, request: LLMRequest) -> LLMResponse:
        start = datetime.now()
        
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        
        tools = None
        if request.tools:
            tools = [{
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": t.description,
                    "parameters": t.parameters
                }
            } for t in request.tools]
        
        payload = {
            "model": request.model.value if request.model else LLMModel.GPT_4O.value,
            "messages": messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }
        if tools:
            payload["tools"] = tools
        
        response = await self.client.post(
            self.BASE_URL,
            headers={
                "Authorization": f"Bearer {self.config.openai_api_key}",
                "Content-Type": "application/json"
            },
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        
        choice = data["choices"][0]
        message = choice["message"]
        
        tool_calls = []
        if message.get("tool_calls"):
            for tc in message["tool_calls"]:
                tool_calls.append(ToolCall(
                    id=tc["id"],
                    name=tc["function"]["name"],
                    arguments=json.loads(tc["function"]["arguments"])
                ))
        
        usage = data.get("usage", {})
        latency = int((datetime.now() - start).total_seconds() * 1000)
        
        return LLMResponse(
            content=message.get("content", ""),
            model=LLMModel(data["model"]),
            provider=LLMProvider.GPT,
            tool_calls=tool_calls if tool_calls else None,
            usage={
                "input_tokens": usage.get("prompt_tokens", 0),
                "output_tokens": usage.get("completion_tokens", 0)
            },
            cost=self.calculate_cost(
                LLMModel(data["model"]),
                usage.get("prompt_tokens", 0),
                usage.get("completion_tokens", 0)
            ),
            latency_ms=latency
        )
    
    async def stream(self, request: LLMRequest) -> AsyncGenerator[str, None]:
        pass

# ============================================================
# LLM ROUTER - INTELLIGENT ROUTING
# ============================================================

class RoutingStrategy(str, Enum):
    COST_OPTIMIZED = "cost_optimized"
    QUALITY_OPTIMIZED = "quality_optimized"
    LATENCY_OPTIMIZED = "latency_optimized"
    BALANCED = "balanced"
    FALLBACK = "fallback"

class TaskType(str, Enum):
    ANALYSIS = "analysis"           # Claude Opus
    CODING = "coding"               # Claude Sonnet / GPT-4o
    CHAT = "chat"                   # Haiku / GPT-4o-mini
    SUMMARIZATION = "summarization" # Sonnet / Gemini
    TRANSLATION = "translation"     # Gemini / Sonnet
    DATA_EXTRACTION = "extraction"  # Haiku / Flash

# Mapping Task -> Modèle recommandé
TASK_MODEL_MAP = {
    TaskType.ANALYSIS: [LLMModel.CLAUDE_OPUS, LLMModel.GPT_4O],
    TaskType.CODING: [LLMModel.CLAUDE_SONNET, LLMModel.GPT_4O, LLMModel.CODELLAMA],
    TaskType.CHAT: [LLMModel.CLAUDE_HAIKU, LLMModel.GPT_4O_MINI, LLMModel.GEMINI_FLASH],
    TaskType.SUMMARIZATION: [LLMModel.CLAUDE_SONNET, LLMModel.GEMINI_PRO],
    TaskType.TRANSLATION: [LLMModel.GEMINI_PRO, LLMModel.CLAUDE_SONNET],
    TaskType.DATA_EXTRACTION: [LLMModel.CLAUDE_HAIKU, LLMModel.GEMINI_FLASH],
}

class LLMRouter:
    """Router intelligent pour choisir le meilleur LLM"""
    
    def __init__(self, config: LLMConfig):
        self.config = config
        self.providers: Dict[LLMProvider, BaseLLMProvider] = {
            LLMProvider.CLAUDE: ClaudeProvider(config),
            LLMProvider.GPT: GPTProvider(config),
            # Ajouter Gemini et Ollama
        }
        self.usage_stats: Dict[str, Any] = {}
    
    def select_model(
        self,
        task_type: Optional[TaskType] = None,
        strategy: RoutingStrategy = RoutingStrategy.BALANCED,
        budget_limit: Optional[float] = None,
        required_features: Optional[List[str]] = None
    ) -> tuple[LLMProvider, LLMModel]:
        """Sélectionne le meilleur modèle selon les critères"""
        
        candidates = []
        
        if task_type:
            candidates = TASK_MODEL_MAP.get(task_type, [])
        else:
            candidates = list(LLMModel)
        
        # Filtrer par budget
        if budget_limit:
            candidates = [m for m in candidates if MODEL_COSTS[m]["output"] < budget_limit * 10]
        
        # Appliquer la stratégie
        if strategy == RoutingStrategy.COST_OPTIMIZED:
            candidates.sort(key=lambda m: MODEL_COSTS[m]["output"])
        elif strategy == RoutingStrategy.QUALITY_OPTIMIZED:
            quality_order = [LLMModel.CLAUDE_OPUS, LLMModel.GPT_4O, LLMModel.CLAUDE_SONNET]
            candidates.sort(key=lambda m: quality_order.index(m) if m in quality_order else 999)
        elif strategy == RoutingStrategy.LATENCY_OPTIMIZED:
            latency_order = [LLMModel.CLAUDE_HAIKU, LLMModel.GEMINI_FLASH, LLMModel.GPT_4O_MINI]
            candidates.sort(key=lambda m: latency_order.index(m) if m in latency_order else 999)
        
        selected = candidates[0] if candidates else self.config.default_model
        
        # Trouver le provider
        for provider, models in PROVIDER_MODELS.items():
            if selected in models:
                return provider, selected
        
        return self.config.default_provider, self.config.default_model
    
    async def complete(
        self,
        request: LLMRequest,
        task_type: Optional[TaskType] = None,
        strategy: RoutingStrategy = RoutingStrategy.BALANCED
    ) -> LLMResponse:
        """Exécute une completion avec routing intelligent"""
        
        # Sélectionner le modèle si non spécifié
        if not request.provider or not request.model:
            provider, model = self.select_model(task_type, strategy)
            request.provider = provider
            request.model = model
        
        # Obtenir le provider
        llm_provider = self.providers.get(request.provider)
        if not llm_provider:
            raise ValueError(f"Provider {request.provider} non configuré")
        
        # Exécuter avec retry
        for attempt in range(self.config.max_retries):
            try:
                response = await llm_provider.complete(request)
                self._log_usage(response)
                return response
            except Exception as e:
                if attempt == self.config.max_retries - 1:
                    # Fallback vers un autre provider
                    if strategy == RoutingStrategy.FALLBACK:
                        return await self._fallback_complete(request)
                    raise
                await asyncio.sleep(2 ** attempt)
        
        raise Exception("Échec après tous les retries")
    
    async def _fallback_complete(self, request: LLMRequest) -> LLMResponse:
        """Fallback vers un autre provider"""
        fallback_order = [LLMProvider.CLAUDE, LLMProvider.GPT, LLMProvider.GEMINI, LLMProvider.OLLAMA]
        
        for provider in fallback_order:
            if provider == request.provider:
                continue
            if provider in self.providers:
                request.provider = provider
                request.model = PROVIDER_MODELS[provider][0]
                try:
                    return await self.providers[provider].complete(request)
                except:
                    continue
        
        raise Exception("Tous les providers ont échoué")
    
    def _log_usage(self, response: LLMResponse):
        """Log l'utilisation pour analytics"""
        key = f"{response.provider.value}:{response.model.value}"
        if key not in self.usage_stats:
            self.usage_stats[key] = {
                "requests": 0,
                "input_tokens": 0,
                "output_tokens": 0,
                "total_cost": 0.0,
                "avg_latency_ms": 0
            }
        
        stats = self.usage_stats[key]
        stats["requests"] += 1
        stats["input_tokens"] += response.usage.get("input_tokens", 0)
        stats["output_tokens"] += response.usage.get("output_tokens", 0)
        stats["total_cost"] += response.cost
        stats["avg_latency_ms"] = (
            (stats["avg_latency_ms"] * (stats["requests"] - 1) + response.latency_ms)
            / stats["requests"]
        )

# ============================================================
# AGENT LLM - POUR LES AGENTS ROADY
# ============================================================

class AgentLLM:
    """Interface LLM pour les agents ROADY Construction"""
    
    def __init__(self, router: LLMRouter, agent_id: str, agent_role: str):
        self.router = router
        self.agent_id = agent_id
        self.agent_role = agent_role
        self.conversation_history: List[Message] = []
        self.system_prompt = self._build_system_prompt()
    
    def _build_system_prompt(self) -> str:
        return f"""Tu es {self.agent_role} dans le système ROADY Construction.

CONTEXTE:
- Tu fais partie d'une équipe d'agents IA spécialisés dans la construction
- Tu as accès à des outils spécifiques pour ton domaine
- Tu communiques avec d'autres agents et les utilisateurs humains

COMPORTEMENT:
- Sois précis et professionnel
- Utilise les termes techniques de construction quand approprié
- Fournis des réponses actionables et concrètes
- Signale les risques SST si pertinents

Agent ID: {self.agent_id}
Date: {datetime.now().strftime('%Y-%m-%d')}
"""
    
    async def think(
        self,
        prompt: str,
        tools: Optional[List[Tool]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> LLMResponse:
        """L'agent réfléchit et répond"""
        
        messages = [Message(role="system", content=self.system_prompt)]
        messages.extend(self.conversation_history)
        
        # Ajouter le contexte
        if context:
            context_str = f"\n\nCONTEXTE ACTUEL:\n{json.dumps(context, indent=2, ensure_ascii=False)}"
            prompt = prompt + context_str
        
        messages.append(Message(role="user", content=prompt))
        
        request = LLMRequest(
            messages=messages,
            tools=tools,
            temperature=0.7,
            metadata={"agent_id": self.agent_id}
        )
        
        # Déterminer le type de tâche
        task_type = self._detect_task_type(prompt)
        
        response = await self.router.complete(request, task_type=task_type)
        
        # Sauvegarder dans l'historique
        self.conversation_history.append(Message(role="user", content=prompt))
        self.conversation_history.append(Message(role="assistant", content=response.content))
        
        # Limiter l'historique
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]
        
        return response
    
    def _detect_task_type(self, prompt: str) -> TaskType:
        """Détecte le type de tâche depuis le prompt"""
        prompt_lower = prompt.lower()
        
        if any(w in prompt_lower for w in ["analyse", "évalue", "examine", "diagnostic"]):
            return TaskType.ANALYSIS
        elif any(w in prompt_lower for w in ["code", "script", "fonction", "programme"]):
            return TaskType.CODING
        elif any(w in prompt_lower for w in ["résume", "synthèse", "récapitule"]):
            return TaskType.SUMMARIZATION
        elif any(w in prompt_lower for w in ["traduis", "translate"]):
            return TaskType.TRANSLATION
        elif any(w in prompt_lower for w in ["extrais", "parse", "données"]):
            return TaskType.DATA_EXTRACTION
        else:
            return TaskType.CHAT
    
    async def execute_tool(self, tool_call: ToolCall, tool_executor: Callable) -> str:
        """Exécute un outil et retourne le résultat"""
        result = await tool_executor(tool_call.name, tool_call.arguments)
        return json.dumps(result, ensure_ascii=False)
    
    def reset_conversation(self):
        """Remet à zéro l'historique de conversation"""
        self.conversation_history = []

# ============================================================
# EXEMPLE D'UTILISATION
# ============================================================

async def main():
    config = LLMConfig(
        anthropic_api_key="sk-ant-xxx",
        openai_api_key="sk-xxx",
    )
    
    router = LLMRouter(config)
    
    # Créer un agent
    agent = AgentLLM(
        router=router,
        agent_id="superviseur-001",
        agent_role="Superviseur de Chantier"
    )
    
    # L'agent réfléchit
    response = await agent.think(
        prompt="Quels sont les points de sécurité à vérifier avant le coulage de béton demain?",
        context={
            "projet": "Tour Centrale",
            "zone": "Niveau 5",
            "météo_prévue": "Pluie légère",
            "équipe": 12
        }
    )
    
    print(f"Réponse ({response.model.value}): {response.content}")
    print(f"Coût: ${response.cost:.4f} | Latence: {response.latency_ms}ms")

if __name__ == "__main__":
    asyncio.run(main())
