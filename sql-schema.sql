-- ============================================================
-- ROADY CONSTRUCTION - SCHEMA SQL COMPLET
-- PostgreSQL 16+
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Pour recherche full-text
CREATE EXTENSION IF NOT EXISTS "postgis";       -- Pour géolocalisation

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'super_admin', 'admin', 'directeur', 'chef_projet', 
    'superviseur', 'technicien', 'sous_traitant', 'client', 'invite'
);

CREATE TYPE project_status AS ENUM (
    'draft', 'planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived'
);

CREATE TYPE task_status AS ENUM (
    'backlog', 'todo', 'in_progress', 'review', 'completed', 'cancelled'
);

CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent', 'critical');

CREATE TYPE rfi_status AS ENUM ('draft', 'open', 'responded', 'closed', 'cancelled');

CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');

CREATE TYPE notification_type AS ENUM (
    'task_assigned', 'task_completed', 'rfi_created', 'rfi_response',
    'report_submitted', 'report_approved', 'sst_incident', 'budget_alert',
    'project_milestone', 'system_notification'
);

CREATE TYPE incident_severity AS ENUM ('minor', 'moderate', 'serious', 'critical');

-- ============================================================
-- TABLES - CORE
-- ============================================================

-- Companies
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    neq VARCHAR(20),                    -- Numéro d'entreprise Québec
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(50) DEFAULT 'QC',
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'Canada',
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role user_role DEFAULT 'technicien',
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_role ON users(role);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,   -- Ex: PRJ-2025-001
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255),
    client_contact VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    location GEOGRAPHY(POINT, 4326),    -- Coordonnées GPS
    status project_status DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    estimated_end_date DATE,
    budget_total DECIMAL(15,2) DEFAULT 0,
    budget_spent DECIMAL(15,2) DEFAULT 0,
    progress_percent INT DEFAULT 0,
    manager_id UUID REFERENCES users(id),
    settings JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_manager ON projects(manager_id);
CREATE INDEX idx_projects_location ON projects USING GIST(location);

-- Project Members
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100),
    permissions JSONB DEFAULT '[]',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);

-- ============================================================
-- TABLES - TASKS & WORKFLOWS
-- ============================================================

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    code VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'backlog',
    priority task_priority DEFAULT 'medium',
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id),
    zone VARCHAR(100),
    location VARCHAR(255),
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2) DEFAULT 0,
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    progress_percent INT DEFAULT 0,
    dependencies UUID[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Task Comments
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_comments_task ON task_comments(task_id);

-- Task Time Logs
CREATE TABLE task_time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hours DECIMAL(6,2) NOT NULL,
    description TEXT,
    logged_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_logs_task ON task_time_logs(task_id);
CREATE INDEX idx_time_logs_user ON task_time_logs(user_id);

-- ============================================================
-- TABLES - RFI (Request For Information)
-- ============================================================

CREATE TABLE rfis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,          -- Ex: RFI-001
    title VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    context TEXT,
    status rfi_status DEFAULT 'draft',
    priority task_priority DEFAULT 'medium',
    requester_id UUID NOT NULL REFERENCES users(id),
    assignee_id UUID REFERENCES users(id),
    zone VARCHAR(100),
    discipline VARCHAR(100),
    due_date DATE,
    responded_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rfis_project ON rfis(project_id);
CREATE INDEX idx_rfis_status ON rfis(status);
CREATE INDEX idx_rfis_requester ON rfis(requester_id);

-- RFI Responses
CREATE TABLE rfi_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    response TEXT NOT NULL,
    is_official BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rfi_responses_rfi ON rfi_responses(rfi_id);

-- ============================================================
-- TABLES - REPORTS
-- ============================================================

-- Daily Reports
CREATE TABLE daily_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id),
    status report_status DEFAULT 'draft',
    weather_am VARCHAR(50),
    weather_pm VARCHAR(50),
    temperature_am INT,
    temperature_pm INT,
    wind_conditions VARCHAR(100),
    work_summary TEXT,
    issues TEXT,
    delays TEXT,
    safety_notes TEXT,
    visitors TEXT,
    equipment_on_site JSONB DEFAULT '[]',
    workers_count JSONB DEFAULT '{}',     -- {"electriciens": 5, "plombiers": 3}
    materials_received JSONB DEFAULT '[]',
    photos JSONB DEFAULT '[]',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, report_date)
);

CREATE INDEX idx_daily_reports_project ON daily_reports(project_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);

-- ============================================================
-- TABLES - SST (Santé Sécurité Travail)
-- ============================================================

-- SST Incidents
CREATE TABLE sst_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    incident_date TIMESTAMPTZ NOT NULL,
    incident_type VARCHAR(100) NOT NULL,
    severity incident_severity DEFAULT 'minor',
    location VARCHAR(255),
    description TEXT NOT NULL,
    immediate_actions TEXT,
    root_cause TEXT,
    corrective_actions TEXT,
    reported_by UUID NOT NULL REFERENCES users(id),
    witnesses JSONB DEFAULT '[]',
    injured_persons JSONB DEFAULT '[]',
    photos JSONB DEFAULT '[]',
    is_cnesst_reportable BOOLEAN DEFAULT false,
    cnesst_report_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'open',
    closed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sst_incidents_project ON sst_incidents(project_id);
CREATE INDEX idx_sst_incidents_severity ON sst_incidents(severity);
CREATE INDEX idx_sst_incidents_date ON sst_incidents(incident_date);

-- SST Inspections
CREATE TABLE sst_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    inspection_date TIMESTAMPTZ NOT NULL,
    inspector_id UUID NOT NULL REFERENCES users(id),
    inspection_type VARCHAR(100),
    zone VARCHAR(100),
    checklist JSONB NOT NULL,           -- [{item: "EPI", status: "ok", notes: ""}]
    overall_score INT,
    findings TEXT,
    corrective_actions TEXT,
    photos JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'completed',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sst_inspections_project ON sst_inspections(project_id);

-- ============================================================
-- TABLES - GEOLOCATION
-- ============================================================

-- User Locations (for tracking)
CREATE TABLE user_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy DECIMAL(10,2),
    altitude DECIMAL(10,2),
    speed DECIMAL(10,2),
    heading DECIMAL(10,2),
    battery_level INT,
    is_moving BOOLEAN DEFAULT false,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_locations_user ON user_locations(user_id);
CREATE INDEX idx_user_locations_time ON user_locations(recorded_at);
CREATE INDEX idx_user_locations_geo ON user_locations USING GIST(location);

-- Partition by month for better performance
-- CREATE TABLE user_locations_2025_01 PARTITION OF user_locations
--     FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Geofences (Zones)
CREATE TABLE geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(50),              -- work, restricted, danger, parking
    risk_level VARCHAR(20),             -- low, medium, high, critical
    boundary GEOGRAPHY(POLYGON, 4326),
    center GEOGRAPHY(POINT, 4326),
    radius DECIMAL(10,2),               -- Pour zones circulaires
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geofences_project ON geofences(project_id);
CREATE INDEX idx_geofences_boundary ON geofences USING GIST(boundary);

-- ============================================================
-- TABLES - NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    is_pushed BOOLEAN DEFAULT false,
    pushed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Device Tokens (for push notifications)
CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL,      -- ios, android, web
    device_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);

-- ============================================================
-- TABLES - FILES & DOCUMENTS
-- ============================================================

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    project_id UUID REFERENCES projects(id),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    storage_path TEXT NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 's3',  -- s3, gcs, local
    is_public BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_files_project ON files(project_id);
CREATE INDEX idx_files_company ON files(company_id);

-- ============================================================
-- TABLES - AUDIT LOG
-- ============================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,        -- create, update, delete, login, etc.
    entity_type VARCHAR(100) NOT NULL,  -- user, project, task, etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================
-- TABLES - LLM USAGE
-- ============================================================

CREATE TABLE llm_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    agent_id VARCHAR(100),
    provider VARCHAR(50) NOT NULL,      -- claude, gpt, gemini
    model VARCHAR(100) NOT NULL,
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    cost_usd DECIMAL(10,6) DEFAULT 0,
    latency_ms INT,
    task_type VARCHAR(50),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_llm_usage_user ON llm_usage(user_id);
CREATE INDEX idx_llm_usage_created ON llm_usage(created_at);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.columns 
        WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        ', t, t, t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Project progress calculation
CREATE OR REPLACE FUNCTION calculate_project_progress(p_project_id UUID)
RETURNS INT AS $$
DECLARE
    total_tasks INT;
    completed_tasks INT;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
    INTO total_tasks, completed_tasks
    FROM tasks WHERE project_id = p_project_id;
    
    IF total_tasks = 0 THEN RETURN 0; END IF;
    RETURN ROUND((completed_tasks::DECIMAL / total_tasks) * 100);
END;
$$ LANGUAGE plpgsql;

-- Auto-update project progress on task change
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects 
    SET progress_percent = calculate_project_progress(
        COALESCE(NEW.project_id, OLD.project_id)
    )
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_progress_trigger
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- Generate project code
CREATE OR REPLACE FUNCTION generate_project_code()
RETURNS TRIGGER AS $$
DECLARE
    year_code TEXT;
    seq_num INT;
BEGIN
    year_code := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 10 FOR 3) AS INT)), 0) + 1
    INTO seq_num
    FROM projects WHERE code LIKE 'PRJ-' || year_code || '-%';
    
    NEW.code := 'PRJ-' || year_code || '-' || LPAD(seq_num::TEXT, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_project_code_trigger
BEFORE INSERT ON projects
FOR EACH ROW WHEN (NEW.code IS NULL)
EXECUTE FUNCTION generate_project_code();

-- ============================================================
-- VIEWS
-- ============================================================

-- Project Summary View
CREATE OR REPLACE VIEW v_project_summary AS
SELECT 
    p.id,
    p.code,
    p.name,
    p.status,
    p.progress_percent,
    p.budget_total,
    p.budget_spent,
    ROUND((p.budget_spent / NULLIF(p.budget_total, 0)) * 100, 2) as budget_percent,
    p.start_date,
    p.end_date,
    COUNT(DISTINCT pm.user_id) as team_size,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'open') as open_rfis,
    u.first_name || ' ' || u.last_name as manager_name
FROM projects p
LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.is_active = true
LEFT JOIN tasks t ON t.project_id = p.id
LEFT JOIN rfis r ON r.project_id = p.id
LEFT JOIN users u ON u.id = p.manager_id
GROUP BY p.id, u.first_name, u.last_name;

-- User Dashboard View
CREATE OR REPLACE VIEW v_user_dashboard AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status NOT IN ('completed', 'cancelled')) as pending_tasks,
    COUNT(DISTINCT t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled')) as overdue_tasks,
    COUNT(DISTINCT n.id) FILTER (WHERE n.is_read = false) as unread_notifications,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'open') as open_rfis
FROM users u
LEFT JOIN tasks t ON t.assignee_id = u.id
LEFT JOIN notifications n ON n.user_id = u.id
LEFT JOIN rfis r ON r.requester_id = u.id OR r.assignee_id = u.id
GROUP BY u.id;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert default company
INSERT INTO companies (id, name, legal_name, email) VALUES 
(uuid_generate_v4(), 'ROADY Construction', 'ROADY Construction Inc.', 'admin@roady.construction');

COMMIT;
