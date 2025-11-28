"""
ROADY LLM Router - Complete Implementation
Handles LLM selection, fallback, budget optimization, and quality upgrades
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
from datetime import datetime
import anthropic
import openai
from google import generativeai as genai

class LLMProvider(Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GOOGLE = "google"
    COHERE = "cohere"
    DEEPSEEK = "deepseek"
    MISTRAL = "mistral"
    PERPLEXITY = "perplexity"
    OLLAMA = "ollama"

@dataclass
class LLMConfig:
    provider: LLMProvider
    model: str
    temperature: float = 0.7
    max_tokens: int = 4000
    top_p: float = 0.9

@dataclass
class FallbackChain:
    primary: LLMConfig
    fallback_1: Optional[LLMConfig] = None
    fallback_2: Optional[LLMConfig] = None
    fallback_3: Optional[LLMConfig] = None

@dataclass
class LLMResponse:
    content: str
    provider: LLMProvider
    model: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost_usd: float
    latency_ms: int
    was_fallback: bool = False
    fallback_level: Optional[int] = None

class LLMRouter:
    """
    Intelligent LLM Router with fallback, budget optimization, and quality upgrades
    """
    
    def __init__(self, database_session):
        self.db = database_session
        self.clients = {}
        self._initialize_clients()
        
    def _initialize_clients(self):
        """Initialize LLM provider clients"""
        # Anthropic
        try:
            self.clients[LLMProvider.ANTHROPIC] = anthropic.Anthropic(
                api_key=self._get_api_key(LLMProvider.ANTHROPIC)
            )
        except:
            pass
        
        # OpenAI
        try:
            openai.api_key = self._get_api_key(LLMProvider.OPENAI)
            self.clients[LLMProvider.OPENAI] = openai
        except:
            pass
        
        # Google
        try:
            genai.configure(api_key=self._get_api_key(LLMProvider.GOOGLE))
            self.clients[LLMProvider.GOOGLE] = genai
        except:
            pass
    
    def _get_api_key(self, provider: LLMProvider) -> str:
        """Get API key from database"""
        # Query from llm_providers table
        # For now, return from environment or config
        import os
        key_map = {
            LLMProvider.ANTHROPIC: os.getenv('ANTHROPIC_API_KEY'),
            LLMProvider.OPENAI: os.getenv('OPENAI_API_KEY'),
            LLMProvider.GOOGLE: os.getenv('GOOGLE_API_KEY'),
        }
        return key_map.get(provider, '')
    
    def get_llm_for_agent(self, agent_id: str, task_type: Optional[str] = None) -> LLMConfig:
        """
        Get appropriate LLM configuration for agent
        Considers: agent settings, budget, task type
        """
        # Get agent config from database
        agent_config = self._get_agent_config(agent_id)
        
        # Check if budget substitution needed
        if self._should_use_budget_substitution():
            return self._get_budget_optimized_llm(agent_config)
        
        # Check for task-specific override
        if task_type and task_type in ['code', 'math', 'vision']:
            return self._get_task_specific_llm(task_type, agent_config)
        
        # Return primary LLM
        return LLMConfig(
            provider=LLMProvider(agent_config['primary_llm_provider']),
            model=agent_config['primary_llm_model'],
            temperature=agent_config.get('temperature', 0.7),
            max_tokens=agent_config.get('max_tokens_per_request', 4000)
        )
    
    def _get_agent_config(self, agent_id: str) -> Dict:
        """Get agent configuration from database"""
        # Mock for now
        return {
            'primary_llm_provider': 'anthropic',
            'primary_llm_model': 'claude-sonnet-4-20250514',
            'fallback_llm_provider': 'openai',
            'fallback_llm_model': 'gpt-4o',
            'temperature': 0.7,
            'max_tokens_per_request': 4000
        }
    
    def _should_use_budget_substitution(self) -> bool:
        """Check if budget substitution should be triggered"""
        # Query current budget usage
        # Return True if >= 85% used
        return False  # Mock
    
    def _get_budget_optimized_llm(self, agent_config: Dict) -> LLMConfig:
        """Get cheaper LLM alternative"""
        # Mapping expensive -> cheap
        cheap_alternatives = {
            'claude-opus-4-20250514': 'claude-sonnet-4-20250514',
            'claude-sonnet-4-20250514': 'claude-haiku-4.5-20251001',
            'o1': 'o1-mini',
            'gpt-4o': 'gpt-4o-mini',
            'gemini-1.5-pro': 'gemini-1.5-flash'
        }
        
        primary_model = agent_config['primary_llm_model']
        cheaper_model = cheap_alternatives.get(primary_model, primary_model)
        
        return LLMConfig(
            provider=LLMProvider(agent_config['primary_llm_provider']),
            model=cheaper_model,
            temperature=agent_config.get('temperature', 0.7)
        )
    
    def _get_task_specific_llm(self, task_type: str, agent_config: Dict) -> LLMConfig:
        """Get task-specific optimal LLM"""
        task_llm_map = {
            'code': LLMConfig(LLMProvider.DEEPSEEK, 'deepseek-coder'),
            'math': LLMConfig(LLMProvider.OPENAI, 'o1-mini'),
            'vision': LLMConfig(LLMProvider.OPENAI, 'gpt-4o'),
            'long_context': LLMConfig(LLMProvider.GOOGLE, 'gemini-1.5-pro')
        }
        
        return task_llm_map.get(task_type) or self.get_llm_for_agent(agent_config['agent_id'])
    
    def get_fallback_chain(self, agent_id: str) -> FallbackChain:
        """Get complete fallback chain for agent"""
        agent_config = self._get_agent_config(agent_id)
        
        primary = LLMConfig(
            provider=LLMProvider(agent_config['primary_llm_provider']),
            model=agent_config['primary_llm_model']
        )
        
        fallback_1 = None
        if agent_config.get('fallback_llm_provider'):
            fallback_1 = LLMConfig(
                provider=LLMProvider(agent_config['fallback_llm_provider']),
                model=agent_config['fallback_llm_model']
            )
        
        fallback_2 = None
        if agent_config.get('secondary_fallback_provider'):
            fallback_2 = LLMConfig(
                provider=LLMProvider(agent_config['secondary_fallback_provider']),
                model=agent_config['secondary_fallback_model']
            )
        
        # Always add local Ollama as final fallback if available
        fallback_3 = None
        if self._is_ollama_configured():
            fallback_3 = LLMConfig(
                provider=LLMProvider.OLLAMA,
                model='llama3.1:70b'
            )
        
        return FallbackChain(primary, fallback_1, fallback_2, fallback_3)
    
    def _is_ollama_configured(self) -> bool:
        """Check if local Ollama is available"""
        try:
            import requests
            response = requests.get('http://localhost:11434/api/tags', timeout=1)
            return response.status_code == 200
        except:
            return False
    
    def execute_with_fallback(
        self, 
        agent_id: str, 
        prompt: str, 
        task_id: str,
        task_type: Optional[str] = None
    ) -> LLMResponse:
        """
        Execute LLM request with automatic fallback on failure
        """
        fallback_chain = self.get_fallback_chain(agent_id)
        
        # Try primary
        try:
            return self._execute_llm(fallback_chain.primary, prompt, agent_id, task_id)
        except Exception as e:
            print(f"⚠️ Primary LLM failed: {e}")
            
            # Try fallback 1
            if fallback_chain.fallback_1:
                try:
                    response = self._execute_llm(
                        fallback_chain.fallback_1, prompt, agent_id, task_id
                    )
                    response.was_fallback = True
                    response.fallback_level = 1
                    self._log_fallback(agent_id, task_id, 1, str(e))
                    return response
                except Exception as e2:
                    print(f"⚠️ Fallback 1 failed: {e2}")
            
            # Try fallback 2
            if fallback_chain.fallback_2:
                try:
                    response = self._execute_llm(
                        fallback_chain.fallback_2, prompt, agent_id, task_id
                    )
                    response.was_fallback = True
                    response.fallback_level = 2
                    self._log_fallback(agent_id, task_id, 2, str(e))
                    return response
                except Exception as e3:
                    print(f"⚠️ Fallback 2 failed: {e3}")
            
            # Try fallback 3 (local)
            if fallback_chain.fallback_3:
                try:
                    response = self._execute_llm(
                        fallback_chain.fallback_3, prompt, agent_id, task_id
                    )
                    response.was_fallback = True
                    response.fallback_level = 3
                    self._log_fallback(agent_id, task_id, 3, str(e))
                    return response
                except Exception as e4:
                    print(f"⚠️ Fallback 3 failed: {e4}")
            
            # All fallbacks exhausted
            raise Exception(f"All LLMs failed for agent {agent_id}")
    
    def _execute_llm(
        self, 
        config: LLMConfig, 
        prompt: str, 
        agent_id: str, 
        task_id: str
    ) -> LLMResponse:
        """Execute single LLM request"""
        start_time = datetime.utcnow()
        
        if config.provider == LLMProvider.ANTHROPIC:
            response = self._call_anthropic(config, prompt)
        elif config.provider == LLMProvider.OPENAI:
            response = self._call_openai(config, prompt)
        elif config.provider == LLMProvider.GOOGLE:
            response = self._call_google(config, prompt)
        elif config.provider == LLMProvider.OLLAMA:
            response = self._call_ollama(config, prompt)
        else:
            raise Exception(f"Provider {config.provider} not implemented")
        
        latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Calculate cost
        cost_usd = self._calculate_cost(
            config.provider, 
            config.model, 
            response['input_tokens'], 
            response['output_tokens']
        )
        
        # Log usage
        self._log_usage(
            agent_id, task_id, config, response, cost_usd, latency_ms
        )
        
        return LLMResponse(
            content=response['content'],
            provider=config.provider,
            model=config.model,
            input_tokens=response['input_tokens'],
            output_tokens=response['output_tokens'],
            total_tokens=response['input_tokens'] + response['output_tokens'],
            cost_usd=cost_usd,
            latency_ms=latency_ms
        )
    
    def _call_anthropic(self, config: LLMConfig, prompt: str) -> Dict:
        """Call Anthropic API"""
        client = self.clients[LLMProvider.ANTHROPIC]
        
        message = client.messages.create(
            model=config.model,
            max_tokens=config.max_tokens,
            temperature=config.temperature,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            'content': message.content[0].text,
            'input_tokens': message.usage.input_tokens,
            'output_tokens': message.usage.output_tokens
        }
    
    def _call_openai(self, config: LLMConfig, prompt: str) -> Dict:
        """Call OpenAI API"""
        client = self.clients[LLMProvider.OPENAI]
        
        response = client.chat.completions.create(
            model=config.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=config.max_tokens,
            temperature=config.temperature
        )
        
        return {
            'content': response.choices[0].message.content,
            'input_tokens': response.usage.prompt_tokens,
            'output_tokens': response.usage.completion_tokens
        }
    
    def _call_google(self, config: LLMConfig, prompt: str) -> Dict:
        """Call Google Gemini API"""
        model = genai.GenerativeModel(config.model)
        response = model.generate_content(prompt)
        
        return {
            'content': response.text,
            'input_tokens': response.usage_metadata.prompt_token_count,
            'output_tokens': response.usage_metadata.candidates_token_count
        }
    
    def _call_ollama(self, config: LLMConfig, prompt: str) -> Dict:
        """Call local Ollama"""
        import requests
        
        response = requests.post('http://localhost:11434/api/generate', json={
            'model': config.model,
            'prompt': prompt
        })
        
        result = response.json()
        return {
            'content': result['response'],
            'input_tokens': result.get('prompt_eval_count', 0),
            'output_tokens': result.get('eval_count', 0)
        }
    
    def _calculate_cost(
        self, 
        provider: LLMProvider, 
        model: str, 
        input_tokens: int, 
        output_tokens: int
    ) -> float:
        """Calculate cost in USD"""
        # Pricing per 1M tokens
        pricing = {
            ('anthropic', 'claude-opus-4-20250514'): (15.00, 75.00),
            ('anthropic', 'claude-sonnet-4-20250514'): (3.00, 15.00),
            ('anthropic', 'claude-haiku-4.5-20251001'): (0.25, 1.25),
            ('openai', 'o1'): (15.00, 60.00),
            ('openai', 'o1-mini'): (3.00, 12.00),
            ('openai', 'gpt-4o'): (2.50, 10.00),
            ('openai', 'gpt-4o-mini'): (0.15, 0.60),
            ('google', 'gemini-1.5-pro'): (1.25, 5.00),
            ('google', 'gemini-1.5-flash'): (0.075, 0.30),
            ('ollama', 'llama3.1:70b'): (0.00, 0.00),  # Local = free
        }
        
        key = (provider.value, model)
        if key not in pricing:
            return 0.0
        
        input_price, output_price = pricing[key]
        
        input_cost = (input_tokens / 1_000_000) * input_price
        output_cost = (output_tokens / 1_000_000) * output_price
        
        return round(input_cost + output_cost, 4)
    
    def _log_usage(
        self, 
        agent_id: str, 
        task_id: str, 
        config: LLMConfig, 
        response: Dict, 
        cost_usd: float, 
        latency_ms: int
    ):
        """Log usage to database"""
        print(f"💰 Cost: ${cost_usd} | Tokens: {response['input_tokens'] + response['output_tokens']}")
        # Insert into agent_usage_logs table
    
    def _log_fallback(self, agent_id: str, task_id: str, level: int, reason: str):
        """Log fallback event"""
        print(f"🔄 Fallback level {level} used for agent {agent_id}: {reason}")


# ═══════════════════════════════════════════════════════════════════════════
# EXAMPLE USAGE
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Create router
    router = LLMRouter(database_session=None)
    
    # Execute with fallback
    response = router.execute_with_fallback(
        agent_id="copywriter",
        prompt="Write a short email about AI automation",
        task_id="task_001"
    )
    
    print(f"✅ Response received:")
    print(f"  Provider: {response.provider.value}")
    print(f"  Model: {response.model}")
    print(f"  Cost: ${response.cost_usd}")
    print(f"  Tokens: {response.total_tokens}")
    print(f"  Fallback: {response.was_fallback}")

