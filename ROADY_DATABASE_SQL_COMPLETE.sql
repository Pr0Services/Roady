-- ═══════════════════════════════════════════════════════════════════════════
-- ROADY DATABASE - COMPLETE SQL SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════
-- Database: PostgreSQL 15+
-- Version: 2.0
-- Created: 2024-11-28
-- 
-- This script creates the complete ROADY database with:
--   ✓ 9 core tables
--   ✓ All indexes
--   ✓ All foreign key constraints
--   ✓ Sample data
--   ✓ Useful views
--   ✓ Triggers
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing database if exists (CAREFUL!)
-- DROP DATABASE IF EXISTS roady;

-- Create database
CREATE DATABASE roady
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Connect to database
\c roady;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 1: USERS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE users (
    user_id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(200) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    monthly_budget_limit DECIMAL(10,2),
    current_month_spend DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    active_agents_count INTEGER NOT NULL DEFAULT 0,
    total_tasks_submitted INTEGER NOT NULL DEFAULT 0,
    avg_task_quality_rating DECIMAL(3,2),
    preferences JSONB,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User accounts and preferences';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password';
COMMENT ON COLUMN users.preferences IS 'JSON object with user preferences (theme, notifications, etc)';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 2: LLM_PROVIDERS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE llm_providers (
    provider_id VARCHAR(50) PRIMARY KEY,
    provider_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    api_key TEXT,  -- Should be encrypted in production
    api_endpoint VARCHAR(500),
    organization_id VARCHAR(100),
    monthly_budget_limit DECIMAL(10,2),
    current_month_spend DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    last_tested_at TIMESTAMP,
    test_status VARCHAR(20) NOT NULL DEFAULT 'not_tested' CHECK (test_status IN ('success', 'failed', 'not_tested')),
    test_error_message TEXT,
    added_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE llm_providers IS 'Configured LLM providers (Anthropic, OpenAI, Google, etc)';
COMMENT ON COLUMN llm_providers.api_key IS 'ENCRYPTED - API key for provider';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 3: LLM_MODELS (Reference Table)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE llm_models (
    model_id VARCHAR(100) PRIMARY KEY,
    provider_id VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('premium', 'standard', 'fast', 'local', 'specialized')),
    context_window INTEGER NOT NULL,
    max_output_tokens INTEGER NOT NULL,
    pricing_input_per_1m DECIMAL(10,4) NOT NULL,
    pricing_output_per_1m DECIMAL(10,4) NOT NULL,
    capabilities JSONB,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    added_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (provider_id) REFERENCES llm_providers(provider_id) ON DELETE CASCADE
);

COMMENT ON TABLE llm_models IS 'Reference table of all available LLM models with pricing';
COMMENT ON COLUMN llm_models.capabilities IS 'JSON array of capabilities: text, vision, code, reasoning, etc';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 4: AGENTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE agents (
    agent_id VARCHAR(100) PRIMARY KEY,
    agent_name VARCHAR(200) NOT NULL,
    department VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL CHECK (level IN (0, 1, 2)),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    activated_at TIMESTAMP,
    activated_by_user_id VARCHAR(100),
    reports_to VARCHAR(100),
    
    -- LLM Configuration
    primary_llm_provider VARCHAR(50) NOT NULL,
    primary_llm_model VARCHAR(100) NOT NULL,
    fallback_llm_provider VARCHAR(50),
    fallback_llm_model VARCHAR(100),
    secondary_fallback_provider VARCHAR(50),
    secondary_fallback_model VARCHAR(100),
    
    -- Model Parameters
    custom_system_prompt TEXT,
    max_tokens_per_request INTEGER NOT NULL DEFAULT 4000,
    temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    top_p DECIMAL(3,2) NOT NULL DEFAULT 0.9 CHECK (top_p >= 0 AND top_p <= 1),
    
    -- Budget & Quality
    monthly_budget_limit DECIMAL(10,2),
    quality_threshold DECIMAL(3,2) NOT NULL DEFAULT 3.5 CHECK (quality_threshold >= 1 AND quality_threshold <= 5),
    auto_upgrade_on_low_quality BOOLEAN NOT NULL DEFAULT FALSE,
    auto_downgrade_on_budget BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Keys
    FOREIGN KEY (activated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (reports_to) REFERENCES agents(agent_id) ON DELETE SET NULL,
    FOREIGN KEY (primary_llm_provider) REFERENCES llm_providers(provider_id) ON DELETE RESTRICT
);

COMMENT ON TABLE agents IS 'Agent configurations (168 agents: 3 L0 + 18 L1 + 148 L2)';
COMMENT ON COLUMN agents.level IS '0=system, 1=director, 2=specialist';
COMMENT ON COLUMN agents.reports_to IS 'Self-referential: L2 reports to L1, L1 reports to L0';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 5: AGENT_INTEGRATIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE agent_integrations (
    integration_id VARCHAR(100) PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL,
    integration_name VARCHAR(100) NOT NULL,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('api', 'oauth', 'webhook', 'database')),
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    credentials TEXT,  -- Should be encrypted
    configuration JSONB,
    last_tested_at TIMESTAMP,
    test_status VARCHAR(20) NOT NULL DEFAULT 'not_tested' CHECK (test_status IN ('success', 'failed', 'not_tested')),
    test_error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
);

COMMENT ON TABLE agent_integrations IS 'Third-party integrations per agent (Twitter, Gmail, GitHub, etc)';
COMMENT ON COLUMN agent_integrations.credentials IS 'ENCRYPTED - API keys, OAuth tokens, etc';
COMMENT ON COLUMN agent_integrations.configuration IS 'Integration-specific settings (JSON)';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 6: WORKFLOWS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE workflows (
    workflow_id VARCHAR(100) PRIMARY KEY,
    workflow_name VARCHAR(200) NOT NULL,
    workflow_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_by_user_id VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_template BOOLEAN NOT NULL DEFAULT FALSE,
    steps JSONB NOT NULL,
    required_agents JSONB NOT NULL,
    estimated_duration_minutes INTEGER,
    estimated_cost_usd DECIMAL(10,4),
    total_executions INTEGER NOT NULL DEFAULT 0,
    avg_duration_minutes INTEGER,
    avg_cost_usd DECIMAL(10,4),
    avg_quality_rating DECIMAL(3,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

COMMENT ON TABLE workflows IS 'Workflow definitions and execution statistics';
COMMENT ON COLUMN workflows.steps IS 'JSON array of workflow steps with agents';
COMMENT ON COLUMN workflows.required_agents IS 'JSON array of agent IDs required';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 7: TASKS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE tasks (
    task_id VARCHAR(100) PRIMARY KEY,
    task_name VARCHAR(200) NOT NULL,
    task_description TEXT NOT NULL,
    submitted_by_user_id VARCHAR(100) NOT NULL,
    assigned_to_agent VARCHAR(100) NOT NULL,
    assigned_by_orchestrator VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    workflow_id VARCHAR(100),
    parent_task_id VARCHAR(100),
    agents_involved JSONB,
    total_cost_usd DECIMAL(10,4),
    total_tokens INTEGER,
    quality_rating DECIMAL(3,2) CHECK (quality_rating >= 1 AND quality_rating <= 5),
    user_feedback TEXT,
    output_data TEXT,
    output_files JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_completion TIMESTAMP,
    
    FOREIGN KEY (submitted_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_agent) REFERENCES agents(agent_id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_by_orchestrator) REFERENCES agents(agent_id) ON DELETE RESTRICT,
    FOREIGN KEY (workflow_id) REFERENCES workflows(workflow_id) ON DELETE SET NULL,
    FOREIGN KEY (parent_task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);

COMMENT ON TABLE tasks IS 'User-submitted tasks and their execution status';
COMMENT ON COLUMN tasks.agents_involved IS 'JSON array of all agent IDs that worked on task';
COMMENT ON COLUMN tasks.output_files IS 'JSON array of file paths/URLs';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 8: AGENT_USAGE_LOGS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE agent_usage_logs (
    log_id VARCHAR(100) PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL,
    task_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    llm_provider VARCHAR(50) NOT NULL,
    llm_model VARCHAR(100) NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost_usd DECIMAL(10,4) NOT NULL,
    latency_ms INTEGER NOT NULL,
    quality_rating DECIMAL(3,2) CHECK (quality_rating >= 1 AND quality_rating <= 5),
    was_fallback BOOLEAN NOT NULL DEFAULT FALSE,
    fallback_level INTEGER CHECK (fallback_level IN (1, 2, 3)),
    fallback_reason TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

COMMENT ON TABLE agent_usage_logs IS 'Every LLM API call logged with tokens, cost, and performance';
COMMENT ON COLUMN agent_usage_logs.was_fallback IS 'Whether fallback LLM was used instead of primary';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 9: BUDGET_ALERTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE budget_alerts (
    alert_id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('global', 'provider', 'agent', 'department')),
    threshold_percent INTEGER NOT NULL CHECK (threshold_percent IN (70, 85, 95, 100)),
    target_id VARCHAR(100),
    budget_limit DECIMAL(10,2) NOT NULL,
    current_spend DECIMAL(10,2) NOT NULL,
    triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_at TIMESTAMP,
    action_taken VARCHAR(50) CHECK (action_taken IN ('ignored', 'optimized', 'increased_budget', 'paused')),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

COMMENT ON TABLE budget_alerts IS 'Budget threshold alerts (70%, 85%, 95%, 100%)';
COMMENT ON COLUMN budget_alerts.target_id IS 'provider_id, agent_id, or department name depending on alert_type';

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- Agents indexes
CREATE INDEX idx_agents_user ON agents(activated_by_user_id);
CREATE INDEX idx_agents_active ON agents(is_active);
CREATE INDEX idx_agents_provider ON agents(primary_llm_provider);
CREATE INDEX idx_agents_department ON agents(department);
CREATE INDEX idx_agents_level ON agents(level);
CREATE INDEX idx_agents_reports_to ON agents(reports_to);

-- Agent Integrations indexes
CREATE INDEX idx_integrations_agent ON agent_integrations(agent_id);
CREATE INDEX idx_integrations_active ON agent_integrations(is_active);

-- Tasks indexes
CREATE INDEX idx_tasks_user ON tasks(submitted_by_user_id);
CREATE INDEX idx_tasks_agent ON tasks(assigned_to_agent);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_workflow ON tasks(workflow_id);
CREATE INDEX idx_tasks_created ON tasks(created_at);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);

-- Usage Logs indexes (CRITICAL - table will grow large)
CREATE INDEX idx_usage_agent ON agent_usage_logs(agent_id);
CREATE INDEX idx_usage_task ON agent_usage_logs(task_id);
CREATE INDEX idx_usage_user ON agent_usage_logs(user_id);
CREATE INDEX idx_usage_date ON agent_usage_logs(created_at);
CREATE INDEX idx_usage_provider ON agent_usage_logs(llm_provider);
CREATE INDEX idx_usage_model ON agent_usage_logs(llm_model);

-- Budget Alerts indexes
CREATE INDEX idx_alerts_user ON budget_alerts(user_id);
CREATE INDEX idx_alerts_acknowledged ON budget_alerts(acknowledged);

-- Workflows indexes
CREATE INDEX idx_workflows_user ON workflows(created_by_user_id);
CREATE INDEX idx_workflows_active ON workflows(is_active);
CREATE INDEX idx_workflows_template ON workflows(is_template);

-- LLM Models indexes
CREATE INDEX idx_models_provider ON llm_models(provider_id);
CREATE INDEX idx_models_tier ON llm_models(tier);

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- View: Agent Performance Dashboard
CREATE OR REPLACE VIEW v_agent_performance AS
SELECT 
    a.agent_id,
    a.agent_name,
    a.department,
    a.level,
    a.is_active,
    a.primary_llm_model,
    COUNT(DISTINCT l.log_id) as total_requests,
    SUM(l.input_tokens) as total_input_tokens,
    SUM(l.output_tokens) as total_output_tokens,
    SUM(l.total_tokens) as total_tokens,
    SUM(l.cost_usd) as total_cost_usd,
    AVG(l.latency_ms) as avg_latency_ms,
    AVG(l.quality_rating) as avg_quality_rating,
    COUNT(CASE WHEN l.was_fallback = TRUE THEN 1 END) as fallback_count,
    COUNT(DISTINCT t.task_id) as tasks_completed
FROM agents a
LEFT JOIN agent_usage_logs l ON a.agent_id = l.agent_id
LEFT JOIN tasks t ON a.agent_id = t.assigned_to_agent AND t.status = 'completed'
GROUP BY a.agent_id, a.agent_name, a.department, a.level, a.is_active, a.primary_llm_model;

COMMENT ON VIEW v_agent_performance IS 'Performance metrics per agent';

-- View: User Budget Dashboard
CREATE OR REPLACE VIEW v_user_budget_dashboard AS
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    u.monthly_budget_limit,
    u.current_month_spend,
    ROUND((u.current_month_spend / NULLIF(u.monthly_budget_limit, 0) * 100), 2) as budget_percent_used,
    u.active_agents_count,
    COUNT(DISTINCT t.task_id) as tasks_this_month,
    SUM(t.total_cost_usd) as task_costs_this_month,
    AVG(t.quality_rating) as avg_task_quality
FROM users u
LEFT JOIN tasks t ON u.user_id = t.submitted_by_user_id 
    AND t.created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY u.user_id, u.full_name, u.email, u.monthly_budget_limit, 
         u.current_month_spend, u.active_agents_count;

COMMENT ON VIEW v_user_budget_dashboard IS 'User budget and usage overview';

-- View: LLM Provider Costs
CREATE OR REPLACE VIEW v_provider_costs AS
SELECT 
    lp.provider_id,
    lp.provider_name,
    lp.monthly_budget_limit,
    lp.current_month_spend,
    ROUND((lp.current_month_spend / NULLIF(lp.monthly_budget_limit, 0) * 100), 2) as budget_percent_used,
    COUNT(DISTINCT l.agent_id) as agents_using,
    COUNT(l.log_id) as total_requests,
    SUM(l.total_tokens) as total_tokens,
    SUM(l.cost_usd) as total_cost
FROM llm_providers lp
LEFT JOIN agent_usage_logs l ON lp.provider_id = l.llm_provider
    AND l.created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY lp.provider_id, lp.provider_name, lp.monthly_budget_limit, lp.current_month_spend;

COMMENT ON VIEW v_provider_costs IS 'LLM provider usage and costs';

-- View: Task Status Overview
CREATE OR REPLACE VIEW v_task_status_overview AS
SELECT 
    status,
    COUNT(*) as task_count,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_duration_minutes,
    AVG(total_cost_usd) as avg_cost_usd,
    AVG(quality_rating) as avg_quality_rating
FROM tasks
WHERE created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY status;

COMMENT ON VIEW v_task_status_overview IS 'Task statistics by status';

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Function: Update timestamp on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate task cost from usage logs
CREATE OR REPLACE FUNCTION calculate_task_cost(p_task_id VARCHAR)
RETURNS DECIMAL AS $$
DECLARE
    v_total_cost DECIMAL(10,4);
BEGIN
    SELECT COALESCE(SUM(cost_usd), 0)
    INTO v_total_cost
    FROM agent_usage_logs
    WHERE task_id = p_task_id;
    
    RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Trigger: Update updated_at on all tables
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_llm_providers_updated_at BEFORE UPDATE ON llm_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_agent_integrations_updated_at BEFORE UPDATE ON agent_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- SAMPLE DATA
-- ═══════════════════════════════════════════════════════════════════════════

-- Insert Users
INSERT INTO users (user_id, email, full_name, password_hash, role, monthly_budget_limit, current_month_spend) VALUES
('user_001', 'john@example.com', 'John Smith', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7C8FyXP5gG', 'user', 1000.00, 423.50),
('user_002', 'sarah@example.com', 'Sarah Johnson', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7C8FyXP5gG', 'admin', 5000.00, 1250.80);

-- Insert LLM Providers
INSERT INTO llm_providers (provider_id, provider_name, is_active, monthly_budget_limit, current_month_spend, test_status) VALUES
('anthropic', 'Anthropic', TRUE, 500.00, 285.50, 'success'),
('openai', 'OpenAI', TRUE, 300.00, 98.20, 'success'),
('google', 'Google AI', TRUE, 200.00, 40.15, 'success'),
('cohere', 'Cohere', FALSE, NULL, 0.00, 'not_tested');

-- Insert LLM Models
INSERT INTO llm_models (model_id, provider_id, model_name, tier, context_window, max_output_tokens, pricing_input_per_1m, pricing_output_per_1m, capabilities) VALUES
('claude-opus-4-20250514', 'anthropic', 'Claude Opus 4', 'premium', 200000, 16384, 15.0000, 75.0000, '["text", "reasoning", "creative", "complex"]'),
('claude-sonnet-4-20250514', 'anthropic', 'Claude Sonnet 4', 'standard', 200000, 16384, 3.0000, 15.0000, '["text", "general"]'),
('claude-haiku-4.5-20251001', 'anthropic', 'Claude Haiku 4.5', 'fast', 200000, 8192, 0.2500, 1.2500, '["text", "fast"]'),
('gpt-4o', 'openai', 'GPT-4o', 'standard', 128000, 16384, 2.5000, 10.0000, '["text", "vision", "multimodal"]'),
('o1', 'openai', 'OpenAI o1', 'premium', 128000, 32768, 15.0000, 60.0000, '["reasoning", "math", "strategic"]'),
('gemini-1.5-pro', 'google', 'Gemini 1.5 Pro', 'premium', 2000000, 8192, 1.2500, 5.0000, '["long_context", "multimodal"]'),
('gemini-1.5-flash', 'google', 'Gemini 1.5 Flash', 'fast', 1000000, 8192, 0.0750, 0.3000, '["fast", "cheap", "multimodal"]');

-- Insert System Agents (L0)
INSERT INTO agents (agent_id, agent_name, department, level, is_active, primary_llm_provider, primary_llm_model) VALUES
('core_orchestrator', 'Core Orchestrator', 'system', 0, TRUE, 'anthropic', 'claude-sonnet-4-20250514'),
('system_observer', 'System Observer', 'system', 0, TRUE, 'anthropic', 'claude-haiku-4.5-20251001');

-- Insert Sample L1 Directors
INSERT INTO agents (agent_id, agent_name, department, level, is_active, reports_to, primary_llm_provider, primary_llm_model, activated_by_user_id, activated_at) VALUES
('chief_creative_officer', 'Chief Creative Officer', 'creative_content_studio', 1, TRUE, 'core_orchestrator', 'anthropic', 'claude-opus-4-20250514', 'user_001', NOW()),
('chief_content_officer', 'Chief Content Officer', 'creative_content_studio', 1, TRUE, 'core_orchestrator', 'anthropic', 'claude-opus-4-20250514', 'user_001', NOW()),
('marketing_director', 'Marketing Director', 'marketing', 1, TRUE, 'core_orchestrator', 'anthropic', 'claude-opus-4-20250514', 'user_001', NOW()),
('technology_director', 'Technology Director', 'technology_systems', 1, TRUE, 'core_orchestrator', 'anthropic', 'claude-opus-4-20250514', 'user_001', NOW());

-- Insert Sample L2 Specialists
INSERT INTO agents (agent_id, agent_name, department, level, is_active, reports_to, primary_llm_provider, primary_llm_model, fallback_llm_provider, fallback_llm_model, activated_by_user_id, activated_at) VALUES
('copywriter', 'Copywriter', 'creative_content_studio', 2, TRUE, 'chief_content_officer', 'anthropic', 'claude-sonnet-4-20250514', 'openai', 'gpt-4o', 'user_001', NOW()),
('graphic_designer', 'Graphic Designer', 'creative_content_studio', 2, TRUE, 'chief_creative_officer', 'openai', 'gpt-4o', 'anthropic', 'claude-sonnet-4-20250514', 'user_001', NOW()),
('backend_developer', 'Backend Developer', 'technology_systems', 2, TRUE, 'technology_director', 'openai', 'o1', 'anthropic', 'claude-sonnet-4-20250514', 'user_001', NOW()),
('seo_specialist', 'SEO Specialist', 'marketing', 2, TRUE, 'marketing_director', 'anthropic', 'claude-sonnet-4-20250514', 'google', 'gemini-1.5-flash', 'user_001', NOW());

-- Insert Sample Integrations
INSERT INTO agent_integrations (integration_id, agent_id, integration_name, integration_type, is_required, is_active, test_status) VALUES
('int_001', 'seo_specialist', 'google_search_console', 'oauth', TRUE, TRUE, 'success'),
('int_002', 'graphic_designer', 'unsplash_api', 'api', FALSE, TRUE, 'success'),
('int_003', 'backend_developer', 'github_api', 'oauth', FALSE, FALSE, 'not_tested');

-- Insert Sample Workflow
INSERT INTO workflows (workflow_id, workflow_name, workflow_type, created_by_user_id, steps, required_agents) VALUES
('wf_001', 'Blog Post Creation', 'content_creation', 'user_001', 
'[{"step": 1, "agent": "copywriter", "action": "write_draft"}, {"step": 2, "agent": "seo_specialist", "action": "optimize"}]',
'["copywriter", "seo_specialist"]');

-- Insert Sample Tasks
INSERT INTO tasks (task_id, task_name, task_description, submitted_by_user_id, assigned_to_agent, assigned_by_orchestrator, status, total_cost_usd, quality_rating) VALUES
('task_001', 'Write blog post', 'Write a 1000-word blog post about AI automation', 'user_001', 'copywriter', 'core_orchestrator', 'completed', 0.0850, 4.7),
('task_002', 'Create logo', 'Design a modern logo for tech startup', 'user_001', 'graphic_designer', 'core_orchestrator', 'completed', 0.0420, 4.9),
('task_003', 'Debug API', 'Fix 500 error on /api/users', 'user_001', 'backend_developer', 'core_orchestrator', 'in_progress', NULL, NULL);

-- Insert Sample Usage Logs
INSERT INTO agent_usage_logs (log_id, agent_id, task_id, user_id, llm_provider, llm_model, input_tokens, output_tokens, total_tokens, cost_usd, latency_ms, quality_rating) VALUES
('log_001', 'copywriter', 'task_001', 'user_001', 'anthropic', 'claude-sonnet-4-20250514', 1250, 850, 2100, 0.0165, 2340, 4.5),
('log_002', 'graphic_designer', 'task_002', 'user_001', 'openai', 'gpt-4o', 980, 450, 1430, 0.0070, 1890, 4.8),
('log_003', 'backend_developer', 'task_003', 'user_001', 'openai', 'o1', 2100, 1200, 3300, 0.0186, 8540, 4.2);

-- ═══════════════════════════════════════════════════════════════════════════
-- GRANTS (Adjust based on your user setup)
-- ═══════════════════════════════════════════════════════════════════════════

-- Create application user
-- CREATE USER roady_app WITH PASSWORD 'your_secure_password';

-- Grant permissions
-- GRANT CONNECT ON DATABASE roady TO roady_app;
-- GRANT USAGE ON SCHEMA public TO roady_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO roady_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO roady_app;

-- ═══════════════════════════════════════════════════════════════════════════
-- COMPLETION
-- ═══════════════════════════════════════════════════════════════════════════

-- Display summary
DO $$
BEGIN
    RAISE NOTICE '✅ ROADY Database created successfully!';
    RAISE NOTICE '📊 Tables: 9';
    RAISE NOTICE '🔍 Indexes: 25+';
    RAISE NOTICE '👁️ Views: 4';
    RAISE NOTICE '⚡ Triggers: 5';
    RAISE NOTICE '📝 Sample data: Loaded';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Review sample data';
    RAISE NOTICE '2. Configure application user permissions';
    RAISE NOTICE '3. Set up backup schedule';
    RAISE NOTICE '4. Connect your application!';
END $$;
