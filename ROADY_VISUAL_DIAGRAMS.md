# ROADY DATABASE - VISUAL DIAGRAMS
# Entity Relationship Diagrams and Architecture Diagrams

## 📊 Table of Contents
1. [Complete ER Diagram](#complete-er-diagram)
2. [Simplified ER Diagram](#simplified-er-diagram)
3. [Agent Hierarchy](#agent-hierarchy)
4. [System Architecture](#system-architecture)
5. [Workflow Diagram](#workflow-diagram)
6. [Budget Tracking Flow](#budget-tracking-flow)

---

## Complete ER Diagram

```mermaid
erDiagram
    USERS ||--o{ AGENTS : "activates"
    USERS ||--o{ TASKS : "submits"
    USERS ||--o{ WORKFLOWS : "creates"
    USERS ||--o{ BUDGET_ALERTS : "receives"
    
    LLM_PROVIDERS ||--o{ LLM_MODELS : "has"
    LLM_PROVIDERS ||--o{ AGENTS : "powers"
    
    AGENTS ||--o{ AGENTS : "reports_to"
    AGENTS ||--o{ AGENT_INTEGRATIONS : "has"
    AGENTS ||--o{ AGENT_USAGE_LOGS : "generates"
    AGENTS ||--o{ TASKS : "assigned"
    
    TASKS ||--o{ TASKS : "parent_of"
    TASKS ||--o{ AGENT_USAGE_LOGS : "generates"
    TASKS }o--|| WORKFLOWS : "part_of"
    
    USERS {
        string user_id PK
        string email UK
        string full_name
        string password_hash
        string role
        boolean is_active
        decimal monthly_budget_limit
        decimal current_month_spend
        int active_agents_count
        json preferences
        timestamp created_at
    }
    
    LLM_PROVIDERS {
        string provider_id PK
        string provider_name
        boolean is_active
        text api_key
        decimal monthly_budget_limit
        decimal current_month_spend
        string test_status
        timestamp added_at
    }
    
    LLM_MODELS {
        string model_id PK
        string provider_id FK
        string model_name
        string tier
        int context_window
        decimal pricing_input_per_1m
        decimal pricing_output_per_1m
        json capabilities
    }
    
    AGENTS {
        string agent_id PK
        string agent_name
        string department
        int level
        boolean is_active
        string activated_by_user_id FK
        string reports_to FK
        string primary_llm_provider FK
        string primary_llm_model
        string fallback_llm_provider
        decimal quality_threshold
        timestamp created_at
    }
    
    AGENT_INTEGRATIONS {
        string integration_id PK
        string agent_id FK
        string integration_name
        string integration_type
        boolean is_required
        boolean is_active
        text credentials
        json configuration
    }
    
    WORKFLOWS {
        string workflow_id PK
        string workflow_name
        string workflow_type
        string created_by_user_id FK
        json steps
        json required_agents
        int total_executions
        decimal avg_cost_usd
    }
    
    TASKS {
        string task_id PK
        string task_name
        string submitted_by_user_id FK
        string assigned_to_agent FK
        string status
        string priority
        string workflow_id FK
        string parent_task_id FK
        decimal total_cost_usd
        decimal quality_rating
        timestamp created_at
    }
    
    AGENT_USAGE_LOGS {
        string log_id PK
        string agent_id FK
        string task_id FK
        string user_id FK
        string llm_provider
        string llm_model
        int input_tokens
        int output_tokens
        decimal cost_usd
        boolean was_fallback
        timestamp created_at
    }
    
    BUDGET_ALERTS {
        string alert_id PK
        string user_id FK
        string alert_type
        int threshold_percent
        decimal budget_limit
        decimal current_spend
        boolean acknowledged
        timestamp triggered_at
    }
```

---

## Simplified ER Diagram (Core Tables Only)

```mermaid
erDiagram
    USERS ||--o{ AGENTS : activates
    USERS ||--o{ TASKS : submits
    
    AGENTS ||--o{ TASKS : "assigned to"
    AGENTS ||--o{ AGENT_USAGE_LOGS : generates
    
    TASKS ||--o{ AGENT_USAGE_LOGS : tracks
    
    USERS {
        string user_id PK
        string email
        decimal monthly_budget
    }
    
    AGENTS {
        string agent_id PK
        string agent_name
        int level
        boolean is_active
    }
    
    TASKS {
        string task_id PK
        string status
        decimal total_cost
    }
    
    AGENT_USAGE_LOGS {
        string log_id PK
        int total_tokens
        decimal cost_usd
    }
```

---

## Agent Hierarchy

```mermaid
graph TD
    HO[Human Owner<br/>L0] --> CO[Core Orchestrator<br/>L0]
    
    CO --> CCO[Chief Creative Officer<br/>L1]
    CO --> CCntO[Chief Content Officer<br/>L1]
    CO --> MD[Marketing Director<br/>L1]
    CO --> TD[Technology Director<br/>L1]
    CO --> DD[Data Director<br/>L1]
    CO --> CD[Construction Director<br/>L1]
    CO --> SD[Sales Director<br/>L1]
    CO --> etc[... 11 more L1 ...]
    
    CCO --> LD[Logo Designer<br/>L2]
    CCO --> GD[Graphic Designer<br/>L2]
    CCO --> VE[Video Editor<br/>L2]
    CCO --> etc1[... 32 more L2 ...]
    
    CCntO --> CW[Copywriter<br/>L2]
    CCntO --> BW[Blog Writer<br/>L2]
    CCntO --> etc2[... 12 more L2 ...]
    
    MD --> SEO[SEO Specialist<br/>L2]
    MD --> SMM[Social Media Manager<br/>L2]
    MD --> etc3[... 12 more L2 ...]
    
    TD --> BE[Backend Developer<br/>L2]
    TD --> FE[Frontend Developer<br/>L2]
    TD --> etc4[... 8 more L2 ...]
    
    style HO fill:#FFD700
    style CO fill:#4169E1
    style CCO fill:#32CD32
    style CCntO fill:#32CD32
    style MD fill:#32CD32
    style TD fill:#32CD32
    style DD fill:#32CD32
    style CD fill:#32CD32
    style SD fill:#32CD32
```

---

## System Architecture

```mermaid
graph TB
    subgraph "User Layer"
        U[User Interface<br/>Web/Mobile]
    end
    
    subgraph "API Layer"
        API[REST API<br/>FastAPI]
    end
    
    subgraph "Orchestration Layer"
        CO[Core Orchestrator]
        UED[User Experience Director]
        SO[System Observer]
    end
    
    subgraph "Agent Layer - L1 Directors"
        L1[18 L1 Directors]
    end
    
    subgraph "Agent Layer - L2 Specialists"
        L2[148 L2 Specialists]
    end
    
    subgraph "LLM Providers"
        ANT[Anthropic<br/>Claude]
        OAI[OpenAI<br/>GPT/o1]
        GOO[Google<br/>Gemini]
        COH[Cohere]
        DS[DeepSeek]
        MIS[Mistral]
        PER[Perplexity]
        OLL[Ollama<br/>Local]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Database)]
        REDIS[(Redis<br/>Cache)]
        S3[S3/Object Storage<br/>Files]
    end
    
    subgraph "Monitoring"
        PROM[Prometheus]
        GRAF[Grafana]
    end
    
    U --> API
    API --> CO
    CO --> UED
    CO --> SO
    CO --> L1
    L1 --> L2
    
    L2 --> ANT
    L2 --> OAI
    L2 --> GOO
    L2 --> COH
    L2 --> DS
    L2 --> MIS
    L2 --> PER
    L2 --> OLL
    
    API --> PG
    API --> REDIS
    L2 --> S3
    
    SO --> PROM
    PROM --> GRAF
    
    style U fill:#87CEEB
    style API fill:#90EE90
    style CO fill:#FFD700
    style PG fill:#DDA0DD
    style REDIS fill:#FFA07A
```

---

## Task Workflow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant CO as Core Orchestrator
    participant L1 as L1 Director
    participant L2A as L2 Agent A
    participant L2B as L2 Agent B
    participant LLM as LLM Provider
    participant UED as User Experience Director
    participant DB as Database
    
    U->>CO: Submit Task
    CO->>DB: Log task (pending)
    CO->>L1: Route to appropriate L1
    L1->>L1: Analyze & decompose
    
    par Parallel Execution
        L1->>L2A: Assign subtask A
        L2A->>LLM: API call (Claude)
        LLM-->>L2A: Response
        L2A->>DB: Log usage
    and
        L1->>L2B: Assign subtask B
        L2B->>LLM: API call (GPT-4o)
        LLM-->>L2B: Response
        L2B->>DB: Log usage
    end
    
    L2A-->>L1: Result A
    L2B-->>L1: Result B
    L1->>L1: Aggregate results
    L1->>UED: Send for presentation
    
    UED->>UED: Create 3 options
    UED->>U: Present options
    
    alt User approves
        U->>UED: ✅ GO
        UED->>CO: Finalize
        CO->>DB: Update task (completed)
    else User requests changes
        U->>UED: 🔧 Adjust
        UED->>L1: Route changes
        L1->>L2A: Refine
        Note over L2A,LLM: Iteration loop...
    else User rejects
        U->>UED: ❌ Refaire
        UED->>CO: Restart
        Note over CO,L1: Full restart...
    end
    
    CO->>U: Final delivery
```

---

## Budget Tracking Flow

```mermaid
graph TD
    Start[LLM API Call] --> Log[Log to agent_usage_logs]
    Log --> Calc[Calculate cost_usd]
    Calc --> Update1[Update user.current_month_spend]
    Update1 --> Update2[Update provider.current_month_spend]
    Update2 --> Update3[Update agent usage if tracked]
    
    Update3 --> Check{Check thresholds}
    
    Check -->|70%| Alert70[Create budget_alert<br/>threshold: 70%]
    Check -->|85%| Alert85[Create budget_alert<br/>threshold: 85%<br/>⚠️ Warning]
    Check -->|95%| Alert95[Create budget_alert<br/>threshold: 95%<br/>🚨 Critical]
    Check -->|100%| Alert100[Create budget_alert<br/>threshold: 100%<br/>💥 Limit reached]
    
    Alert70 --> Email[Send email notification]
    Alert85 --> Email
    Alert85 --> UI[Show dashboard warning]
    Alert95 --> Email
    Alert95 --> UI
    Alert95 --> Suggest[Suggest optimizations]
    Alert100 --> Email
    Alert100 --> UI
    Alert100 --> Action{Auto-action?}
    
    Action -->|Yes| Switch[Switch to cheaper models]
    Action -->|No| Pause[Pause new tasks]
    
    style Alert70 fill:#90EE90
    style Alert85 fill:#FFD700
    style Alert95 fill:#FFA500
    style Alert100 fill:#FF6347
```

---

## LLM Fallback Chain

```mermaid
graph LR
    Start[Agent needs LLM] --> Primary{Primary LLM<br/>Available?}
    
    Primary -->|Yes| Call1[Call Primary<br/>Claude Opus]
    Primary -->|No| Fallback1{Fallback 1<br/>Available?}
    
    Call1 -->|Success| Return[Return response]
    Call1 -->|Fail| Fallback1
    
    Fallback1 -->|Yes| Call2[Call Fallback 1<br/>GPT-4o]
    Fallback1 -->|No| Fallback2{Fallback 2<br/>Available?}
    
    Call2 -->|Success| LogFallback1[Log: used fallback 1] --> Return
    Call2 -->|Fail| Fallback2
    
    Fallback2 -->|Yes| Call3[Call Fallback 2<br/>Gemini Pro]
    Fallback2 -->|No| Local{Local Ollama<br/>Configured?}
    
    Call3 -->|Success| LogFallback2[Log: used fallback 2] --> Return
    Call3 -->|Fail| Local
    
    Local -->|Yes| Call4[Call Local<br/>Llama 3.1]
    Local -->|No| Error[Error: All LLMs<br/>unavailable]
    
    Call4 -->|Success| LogFallback3[Log: used fallback 3] --> Return
    Call4 -->|Fail| Error
    
    Error --> Alert[Alert System Observer<br/>& User]
    
    style Call1 fill:#90EE90
    style Call2 fill:#FFD700
    style Call3 fill:#FFA500
    style Call4 fill:#87CEEB
    style Error fill:#FF6347
```

---

## Agent Activation Flow

```mermaid
stateDiagram-v2
    [*] --> Inactive: Agent created
    
    Inactive --> Browsing: User browses agents
    Browsing --> Configuring: User clicks "Activate"
    
    Configuring --> SelectingLLM: Configure LLM
    SelectingLLM --> ConfiguringParams: Select model
    ConfiguringParams --> ConfiguringIntegrations: Set parameters
    
    ConfiguringIntegrations --> Testing: Add integrations
    Testing --> Active: Test passed
    Testing --> Configuring: Test failed
    
    Active --> InUse: Receives tasks
    InUse --> Active: Task completed
    
    Active --> Paused: Budget limit reached
    Paused --> Active: Budget increased
    
    Active --> Inactive: User deactivates
    
    Inactive --> [*]
```

---

## Multi-LLM Cost Optimization

```mermaid
graph TD
    Task[New Task] --> Analyze[Analyze complexity]
    
    Analyze --> Simple{Simple task?}
    Simple -->|Yes| Cheap[Use Haiku/GPT-4o-mini<br/>$0.15-0.25/1M tokens]
    Simple -->|No| Standard{Standard task?}
    
    Standard -->|Yes| Mid[Use Sonnet/GPT-4o<br/>$2.5-3/1M tokens]
    Standard -->|No| Complex{Complex task?}
    
    Complex -->|Yes| Premium[Use Opus/o1<br/>$15/1M tokens]
    
    Cheap --> Execute
    Mid --> Execute
    Premium --> Execute
    
    Execute[Execute task] --> Monitor[Monitor quality]
    
    Monitor --> Quality{Quality OK?}
    Quality -->|Yes| Success[✅ Task complete]
    Quality -->|No| Upgrade[Upgrade to better model]
    Upgrade --> Execute
    
    Success --> Budget{Check budget}
    Budget -->|Under 85%| Continue[Continue normal]
    Budget -->|Over 85%| Optimize[Auto-optimize:<br/>Switch to cheaper models]
    
    style Cheap fill:#90EE90
    style Mid fill:#FFD700
    style Premium fill:#FF6347
    style Optimize fill:#FFA500
```

---

## Data Flow Architecture

```mermaid
graph LR
    subgraph "Input"
        User[User Request]
    end
    
    subgraph "Processing"
        API[FastAPI]
        Queue[Task Queue<br/>Celery]
        Worker[Worker Processes]
    end
    
    subgraph "Storage"
        DB[(PostgreSQL)]
        Cache[(Redis)]
        Files[(S3)]
    end
    
    subgraph "External"
        LLM[LLM APIs]
        INT[Integrations<br/>Twitter, Gmail, etc]
    end
    
    subgraph "Output"
        Response[User Response]
        Webhook[Webhooks]
    end
    
    User --> API
    API --> Queue
    Queue --> Worker
    
    Worker --> DB
    Worker --> Cache
    Worker --> Files
    Worker --> LLM
    Worker --> INT
    
    DB --> API
    Cache --> API
    Files --> API
    
    API --> Response
    API --> Webhook
    
    style User fill:#87CEEB
    style API fill:#90EE90
    style DB fill:#DDA0DD
    style LLM fill:#FFD700
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/ALB]
    end
    
    subgraph "Application Tier"
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server 3]
    end
    
    subgraph "Worker Tier"
        W1[Worker 1]
        W2[Worker 2]
        W3[Worker 3]
        W4[Worker 4]
    end
    
    subgraph "Queue"
        RMQ[RabbitMQ<br/>Cluster]
    end
    
    subgraph "Database Tier"
        PG_Primary[(PostgreSQL<br/>Primary)]
        PG_Replica1[(PostgreSQL<br/>Replica 1)]
        PG_Replica2[(PostgreSQL<br/>Replica 2)]
    end
    
    subgraph "Cache Tier"
        Redis_Primary[(Redis<br/>Primary)]
        Redis_Replica[(Redis<br/>Replica)]
    end
    
    subgraph "Storage"
        S3[S3/Object<br/>Storage]
    end
    
    subgraph "Monitoring"
        Prom[Prometheus]
        Graf[Grafana]
        Logs[ELK Stack]
    end
    
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> RMQ
    API2 --> RMQ
    API3 --> RMQ
    
    RMQ --> W1
    RMQ --> W2
    RMQ --> W3
    RMQ --> W4
    
    API1 --> PG_Primary
    API2 --> PG_Primary
    API3 --> PG_Primary
    
    PG_Primary --> PG_Replica1
    PG_Primary --> PG_Replica2
    
    API1 --> Redis_Primary
    API2 --> Redis_Primary
    API3 --> Redis_Primary
    
    Redis_Primary --> Redis_Replica
    
    W1 --> S3
    W2 --> S3
    W3 --> S3
    W4 --> S3
    
    API1 --> Prom
    W1 --> Prom
    PG_Primary --> Prom
    
    Prom --> Graf
    API1 --> Logs
    
    style LB fill:#87CEEB
    style PG_Primary fill:#DDA0DD
    style Redis_Primary fill:#FFA07A
```

---

## Notes

- All diagrams are in Mermaid format
- Can be rendered in:
  - GitHub README
  - GitLab
  - VS Code (with Mermaid extension)
  - draw.io (import Mermaid)
  - Online: mermaid.live

- Color coding:
  - 🟦 Blue: User/Frontend
  - 🟩 Green: API/Backend
  - 🟪 Purple: Database
  - 🟨 Yellow: LLM/External
  - 🟥 Red: Critical/Error
