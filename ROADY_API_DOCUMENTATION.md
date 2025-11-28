# ROADY REST API DOCUMENTATION

## Base URL
```
Production: https://api.roady.ai/v1
Staging: https://staging-api.roady.ai/v1
Development: http://localhost:8000/v1
```

## Authentication
All API requests require authentication using Bearer token.

```http
Authorization: Bearer YOUR_API_TOKEN
```

## Rate Limiting
- **Free tier:** 100 requests/hour
- **Pro tier:** 1000 requests/hour
- **Enterprise:** Unlimited

---

## 📋 TABLE OF CONTENTS

1. [Users](#users)
2. [Agents](#agents)
3. [Tasks](#tasks)
4. [Workflows](#workflows)
5. [LLM Providers](#llm-providers)
6. [Agent Integrations](#agent-integrations)
7. [Usage Logs](#usage-logs)
8. [Budget & Alerts](#budget--alerts)
9. [Analytics](#analytics)
10. [Webhooks](#webhooks)

---

## USERS

### GET /users/me
Get current authenticated user

**Response 200:**
```json
{
  "user_id": "user_001",
  "email": "john@example.com",
  "full_name": "John Smith",
  "role": "user",
  "is_active": true,
  "monthly_budget_limit": 1000.00,
  "current_month_spend": 423.50,
  "active_agents_count": 24,
  "total_tasks_submitted": 156,
  "avg_task_quality_rating": 4.3,
  "preferences": {
    "theme": "dark",
    "notifications": true
  },
  "created_at": "2024-11-28T08:00:00Z"
}
```

### PATCH /users/me
Update current user

**Request Body:**
```json
{
  "full_name": "John M. Smith",
  "monthly_budget_limit": 1500.00,
  "preferences": {
    "theme": "light",
    "notifications": false
  }
}
```

### GET /users/me/budget
Get budget status

**Response 200:**
```json
{
  "user_id": "user_001",
  "budget_limit": 1000.00,
  "current_spend": 423.50,
  "remaining": 576.50,
  "percent_used": 42.35,
  "status": "ok",
  "projected_end_of_month": 985.20
}
```

---

## AGENTS

### GET /agents
List all agents (with filters)

**Query Parameters:**
- `is_active` (boolean): Filter by active status
- `department` (string): Filter by department
- `level` (integer): Filter by level (0, 1, 2)
- `limit` (integer): Results per page (default: 50)
- `offset` (integer): Pagination offset

**Response 200:**
```json
{
  "agents": [
    {
      "agent_id": "copywriter",
      "agent_name": "Copywriter",
      "department": "creative_content_studio",
      "level": 2,
      "is_active": true,
      "primary_llm_model": "claude-sonnet-4-20250514",
      "monthly_budget_limit": 10.00,
      "reports_to": "chief_content_officer"
    }
  ],
  "total": 168,
  "limit": 50,
  "offset": 0
}
```

### GET /agents/{agent_id}
Get specific agent

**Response 200:**
```json
{
  "agent_id": "copywriter",
  "agent_name": "Copywriter",
  "department": "creative_content_studio",
  "level": 2,
  "is_active": true,
  "activated_at": "2024-12-01T10:30:00Z",
  "activated_by_user_id": "user_001",
  "reports_to": "chief_content_officer",
  "primary_llm_provider": "anthropic",
  "primary_llm_model": "claude-sonnet-4-20250514",
  "fallback_llm_provider": "openai",
  "fallback_llm_model": "gpt-4o",
  "max_tokens_per_request": 4000,
  "temperature": 0.7,
  "quality_threshold": 3.5,
  "monthly_budget_limit": 10.00,
  "performance_stats": {
    "total_requests": 145,
    "total_cost_usd": 2.70,
    "avg_quality_rating": 4.8,
    "avg_latency_ms": 2340
  }
}
```

### POST /agents/{agent_id}/activate
Activate an agent

**Request Body:**
```json
{
  "primary_llm_provider": "anthropic",
  "primary_llm_model": "claude-sonnet-4-20250514",
  "fallback_llm_provider": "openai",
  "fallback_llm_model": "gpt-4o",
  "monthly_budget_limit": 10.00,
  "temperature": 0.7
}
```

**Response 200:**
```json
{
  "agent_id": "copywriter",
  "is_active": true,
  "activated_at": "2024-12-01T15:30:00Z",
  "message": "Agent activated successfully"
}
```

### POST /agents/{agent_id}/deactivate
Deactivate an agent

**Response 200:**
```json
{
  "agent_id": "copywriter",
  "is_active": false,
  "message": "Agent deactivated successfully"
}
```

### PATCH /agents/{agent_id}
Update agent configuration

**Request Body:**
```json
{
  "primary_llm_model": "claude-opus-4-20250514",
  "temperature": 0.8,
  "monthly_budget_limit": 15.00
}
```

### GET /agents/{agent_id}/performance
Get agent performance metrics

**Query Parameters:**
- `days` (integer): Look back period (default: 30)

**Response 200:**
```json
{
  "agent_id": "copywriter",
  "period_days": 30,
  "total_requests": 145,
  "total_tokens": 425000,
  "total_cost_usd": 2.70,
  "avg_latency_ms": 2340,
  "avg_quality_rating": 4.8,
  "fallback_count": 2,
  "fallback_rate": 1.4,
  "cost_trend": "stable",
  "quality_trend": "improving"
}
```

---

## TASKS

### POST /tasks
Create a new task

**Request Body:**
```json
{
  "task_name": "Write blog post about AI",
  "task_description": "Write a 1000-word blog post about AI automation in business. Target audience: tech executives.",
  "priority": "medium",
  "workflow_id": "wf_blog_creation"
}
```

**Response 201:**
```json
{
  "task_id": "task_12345",
  "status": "pending",
  "assigned_to_agent": "blog_writer",
  "estimated_completion": "2024-12-01T15:00:00Z",
  "estimated_cost_usd": 0.12,
  "message": "Task created and assigned successfully"
}
```

### GET /tasks
List tasks

**Query Parameters:**
- `status` (string): Filter by status
- `priority` (string): Filter by priority
- `agent_id` (string): Filter by assigned agent
- `limit` (integer): Results per page
- `offset` (integer): Pagination offset

**Response 200:**
```json
{
  "tasks": [
    {
      "task_id": "task_12345",
      "task_name": "Write blog post about AI",
      "status": "completed",
      "priority": "medium",
      "assigned_to_agent": "blog_writer",
      "total_cost_usd": 0.0850,
      "quality_rating": 4.7,
      "created_at": "2024-12-01T14:20:00Z",
      "completed_at": "2024-12-01T14:28:30Z"
    }
  ],
  "total": 156,
  "limit": 50,
  "offset": 0
}
```

### GET /tasks/{task_id}
Get specific task

**Response 200:**
```json
{
  "task_id": "task_12345",
  "task_name": "Write blog post about AI",
  "task_description": "Write a 1000-word blog post...",
  "status": "completed",
  "priority": "medium",
  "assigned_to_agent": "blog_writer",
  "agents_involved": ["blog_writer", "seo_specialist", "editor"],
  "total_cost_usd": 0.0850,
  "total_tokens": 8500,
  "quality_rating": 4.7,
  "user_feedback": "Great work! Very thorough.",
  "output_files": ["blog_post_final.docx"],
  "created_at": "2024-12-01T14:20:00Z",
  "started_at": "2024-12-01T14:20:05Z",
  "completed_at": "2024-12-01T14:28:30Z",
  "duration_minutes": 8.4
}
```

### PATCH /tasks/{task_id}
Update task (e.g., add rating)

**Request Body:**
```json
{
  "quality_rating": 4.7,
  "user_feedback": "Great work! Very thorough."
}
```

### DELETE /tasks/{task_id}
Cancel a task

**Response 200:**
```json
{
  "task_id": "task_12345",
  "status": "cancelled",
  "message": "Task cancelled successfully"
}
```

### GET /tasks/{task_id}/logs
Get usage logs for a task

**Response 200:**
```json
{
  "task_id": "task_12345",
  "logs": [
    {
      "log_id": "log_001",
      "agent_id": "blog_writer",
      "llm_provider": "anthropic",
      "llm_model": "claude-sonnet-4-20250514",
      "input_tokens": 1250,
      "output_tokens": 850,
      "total_tokens": 2100,
      "cost_usd": 0.0165,
      "latency_ms": 2340,
      "was_fallback": false,
      "created_at": "2024-12-01T14:25:30Z"
    }
  ],
  "total_cost": 0.0850,
  "total_tokens": 8500
}
```

---

## WORKFLOWS

### GET /workflows
List workflows

**Response 200:**
```json
{
  "workflows": [
    {
      "workflow_id": "wf_001",
      "workflow_name": "Blog Post Creation & Publishing",
      "workflow_type": "content_creation",
      "is_active": true,
      "is_template": true,
      "required_agents": ["blog_writer", "seo_specialist", "editor"],
      "estimated_duration_minutes": 15,
      "estimated_cost_usd": 0.12,
      "total_executions": 42,
      "avg_quality_rating": 4.6
    }
  ]
}
```

### POST /workflows
Create a workflow

**Request Body:**
```json
{
  "workflow_name": "Custom Blog Workflow",
  "workflow_type": "content_creation",
  "description": "My custom blog creation workflow",
  "steps": [
    {"step": 1, "agent": "blog_writer", "action": "write_draft"},
    {"step": 2, "agent": "seo_specialist", "action": "optimize"},
    {"step": 3, "agent": "editor", "action": "final_edit"}
  ],
  "required_agents": ["blog_writer", "seo_specialist", "editor"]
}
```

---

## LLM PROVIDERS

### GET /llm-providers
List all LLM providers

**Response 200:**
```json
{
  "providers": [
    {
      "provider_id": "anthropic",
      "provider_name": "Anthropic",
      "is_active": true,
      "test_status": "success",
      "monthly_budget_limit": 500.00,
      "current_month_spend": 285.50,
      "budget_percent_used": 57.1,
      "models": [
        {
          "model_id": "claude-opus-4-20250514",
          "model_name": "Claude Opus 4",
          "tier": "premium",
          "pricing_input_per_1m": 15.00,
          "pricing_output_per_1m": 75.00
        }
      ]
    }
  ]
}
```

### POST /llm-providers
Add a new provider

**Request Body:**
```json
{
  "provider_id": "anthropic",
  "provider_name": "Anthropic",
  "api_key": "sk-ant-xxxxx",
  "monthly_budget_limit": 500.00
}
```

### POST /llm-providers/{provider_id}/test
Test provider connection

**Response 200:**
```json
{
  "provider_id": "anthropic",
  "test_status": "success",
  "latency_ms": 245,
  "message": "Connection successful"
}
```

---

## AGENT INTEGRATIONS

### GET /agents/{agent_id}/integrations
List agent integrations

**Response 200:**
```json
{
  "agent_id": "social_media_manager",
  "integrations": [
    {
      "integration_id": "int_001",
      "integration_name": "twitter_api",
      "integration_type": "oauth",
      "is_required": true,
      "is_active": true,
      "test_status": "success",
      "last_tested_at": "2024-12-01T07:00:00Z"
    }
  ]
}
```

### POST /agents/{agent_id}/integrations
Add integration to agent

**Request Body:**
```json
{
  "integration_name": "twitter_api",
  "integration_type": "oauth",
  "is_required": true,
  "credentials": "encrypted_oauth_token",
  "configuration": {
    "account": "@mybusiness",
    "rate_limit": 100
  }
}
```

### POST /agents/{agent_id}/integrations/{integration_id}/test
Test an integration

**Response 200:**
```json
{
  "integration_id": "int_001",
  "test_status": "success",
  "message": "Integration working properly"
}
```

---

## USAGE LOGS

### GET /usage-logs
Get usage logs with filters

**Query Parameters:**
- `agent_id` (string): Filter by agent
- `task_id` (string): Filter by task
- `llm_provider` (string): Filter by provider
- `start_date` (string): ISO date (2024-12-01)
- `end_date` (string): ISO date
- `limit` (integer): Results per page
- `offset` (integer): Pagination offset

**Response 200:**
```json
{
  "logs": [
    {
      "log_id": "log_001",
      "agent_id": "copywriter",
      "task_id": "task_12345",
      "llm_provider": "anthropic",
      "llm_model": "claude-sonnet-4-20250514",
      "input_tokens": 1250,
      "output_tokens": 850,
      "total_tokens": 2100,
      "cost_usd": 0.0165,
      "latency_ms": 2340,
      "quality_rating": 4.5,
      "was_fallback": false,
      "created_at": "2024-12-01T14:25:30Z"
    }
  ],
  "total": 1523,
  "limit": 50,
  "offset": 0
}
```

---

## BUDGET & ALERTS

### GET /budget/status
Get current budget status

**Response 200:**
```json
{
  "user_id": "user_001",
  "global": {
    "budget_limit": 1000.00,
    "current_spend": 423.50,
    "percent_used": 42.35,
    "status": "ok"
  },
  "by_provider": {
    "anthropic": {
      "budget_limit": 500.00,
      "current_spend": 285.50,
      "percent_used": 57.1
    },
    "openai": {
      "budget_limit": 300.00,
      "current_spend": 98.20,
      "percent_used": 32.7
    }
  },
  "by_agent": [
    {
      "agent_id": "copywriter",
      "budget_limit": 10.00,
      "current_spend": 2.70,
      "percent_used": 27.0
    }
  ]
}
```

### GET /budget/alerts
Get budget alerts

**Query Parameters:**
- `acknowledged` (boolean): Filter by acknowledgement status

**Response 200:**
```json
{
  "alerts": [
    {
      "alert_id": "alert_001",
      "alert_type": "global",
      "threshold_percent": 85,
      "budget_limit": 1000.00,
      "current_spend": 850.00,
      "triggered_at": "2024-12-01T13:45:00Z",
      "acknowledged": false
    }
  ]
}
```

### POST /budget/alerts/{alert_id}/acknowledge
Acknowledge an alert

**Request Body:**
```json
{
  "action_taken": "optimized"
}
```

---

## ANALYTICS

### GET /analytics/overview
Get analytics overview

**Query Parameters:**
- `period` (string): "7d", "30d", "90d", "all" (default: 30d)

**Response 200:**
```json
{
  "period": "30d",
  "tasks": {
    "total": 156,
    "completed": 142,
    "failed": 3,
    "cancelled": 2,
    "in_progress": 9,
    "success_rate": 91.0
  },
  "costs": {
    "total_usd": 423.50,
    "by_provider": {
      "anthropic": 285.50,
      "openai": 98.20,
      "google": 40.15
    },
    "by_agent_type": {
      "creative": 165.30,
      "technical": 198.40,
      "marketing": 59.80
    }
  },
  "quality": {
    "avg_rating": 4.3,
    "ratings_distribution": {
      "5": 45,
      "4": 78,
      "3": 15,
      "2": 3,
      "1": 1
    }
  },
  "performance": {
    "avg_duration_minutes": 12.5,
    "avg_latency_ms": 2450,
    "fallback_rate": 1.8
  }
}
```

### GET /analytics/agents
Get agent performance comparison

**Response 200:**
```json
{
  "agents": [
    {
      "agent_id": "copywriter",
      "agent_name": "Copywriter",
      "tasks_completed": 45,
      "total_cost_usd": 2.70,
      "avg_quality_rating": 4.8,
      "avg_latency_ms": 2340,
      "fallback_rate": 1.4,
      "cost_per_task": 0.06
    }
  ],
  "sort_by": "tasks_completed",
  "order": "desc"
}
```

### GET /analytics/trends
Get trend data

**Query Parameters:**
- `metric` (string): "cost", "tasks", "quality", "latency"
- `period` (string): "7d", "30d", "90d"
- `granularity` (string): "hour", "day", "week"

**Response 200:**
```json
{
  "metric": "cost",
  "period": "30d",
  "granularity": "day",
  "data": [
    {
      "date": "2024-12-01",
      "value": 14.50
    },
    {
      "date": "2024-12-02",
      "value": 16.20
    }
  ]
}
```

---

## WEBHOOKS

### POST /webhooks
Create a webhook

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["task.completed", "budget.alert", "agent.activated"],
  "secret": "your_webhook_secret"
}
```

### Webhook Payload Example

When a task completes:
```json
{
  "event": "task.completed",
  "timestamp": "2024-12-01T14:28:30Z",
  "data": {
    "task_id": "task_12345",
    "status": "completed",
    "assigned_to_agent": "blog_writer",
    "total_cost_usd": 0.0850,
    "quality_rating": 4.7,
    "duration_minutes": 8.4
  }
}
```

---

## ERROR RESPONSES

### Standard Error Format
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request body is invalid",
    "details": {
      "field": "monthly_budget_limit",
      "issue": "Must be a positive number"
    }
  }
}
```

### Common Error Codes
- `400 BAD_REQUEST` - Invalid request
- `401 UNAUTHORIZED` - Missing or invalid auth token
- `403 FORBIDDEN` - Insufficient permissions
- `404 NOT_FOUND` - Resource not found
- `409 CONFLICT` - Resource conflict
- `429 TOO_MANY_REQUESTS` - Rate limit exceeded
- `500 INTERNAL_SERVER_ERROR` - Server error

---

## PAGINATION

All list endpoints support pagination:

**Query Parameters:**
- `limit` (integer): Items per page (default: 50, max: 100)
- `offset` (integer): Number of items to skip (default: 0)

**Response includes:**
```json
{
  "items": [...],
  "total": 1523,
  "limit": 50,
  "offset": 0,
  "has_more": true
}
```

---

## FILTERING & SORTING

### Filtering
Use query parameters matching field names:
```
GET /tasks?status=completed&priority=high
```

### Sorting
Use `sort_by` and `order`:
```
GET /tasks?sort_by=created_at&order=desc
```

---

## SDKs & Libraries

### Python
```bash
pip install roady-python
```

```python
from roady import Client

client = Client(api_key="YOUR_API_KEY")

# Activate agent
client.agents.activate("copywriter", llm_model="claude-sonnet-4")

# Create task
task = client.tasks.create(
    name="Write blog post",
    description="Write about AI automation"
)

# Check status
status = client.tasks.get(task.id)
```

### JavaScript/TypeScript
```bash
npm install @roady/sdk
```

```javascript
import { Client } from '@roady/sdk';

const client = new Client({ apiKey: 'YOUR_API_KEY' });

// Activate agent
await client.agents.activate('copywriter', {
  llmModel: 'claude-sonnet-4'
});

// Create task
const task = await client.tasks.create({
  name: 'Write blog post',
  description: 'Write about AI automation'
});
```

---

## Rate Limit Headers

All responses include rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1701432000
```

---

## Changelog

### v1.0.0 (2024-12-01)
- Initial API release
- All core endpoints
- Webhook support
- Analytics endpoints

---

## Support

- **Documentation:** https://docs.roady.ai
- **API Status:** https://status.roady.ai
- **Support:** support@roady.ai
- **Discord:** https://discord.gg/roady
