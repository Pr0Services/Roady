/*
╔══════════════════════════════════════════════════════════════════════════════╗
║   🏢 ROADY - OFFICE SYSTEM v1.0                                              ║
║   Architecture Fractale - Un bureau à chaque niveau                          ║
║   FICHIER COMPLET ET VÉRIFIÉ                                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import React, { useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const OFFICE_TYPES = {
  user: { type: 'user', icon: '👤', color: '#6366f1', label: 'Personal Office', features: ['meetings', 'database', 'agents', 'projects', 'businesses'] },
  business: { type: 'business', icon: '🏪', color: '#10b981', label: 'Business Office', features: ['meetings', 'database', 'agents', 'projects', 'departments'] },
  project: { type: 'project', icon: '📁', color: '#f59e0b', label: 'Project Office', features: ['meetings', 'tasks', 'agents', 'files', 'timeline'] },
  task: { type: 'task', icon: '✅', color: '#ec4899', label: 'Task Office', features: ['agents', 'notes', 'files', 'checklist'] }
};

const TABS_CONFIG = {
  user: ['overview', 'meetings', 'agents', 'projects', 'children', 'database'],
  business: ['overview', 'meetings', 'agents', 'projects', 'children', 'database'],
  project: ['overview', 'meetings', 'agents', 'tasks', 'files'],
  task: ['overview', 'agents', 'checklist', 'notes', 'files']
};

// ═══════════════════════════════════════════════════════════════════════════
// OFFICE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const Office = ({
  type = 'user',
  name = 'My Office',
  data = {},
  parentPath = [],
  meetings = [],
  agents = [],
  projects = [],
  tasks = [],
  files = [],
  notes = [],
  childOffices = [],
  onCreateMeeting,
  onAssignAgent,
  onCreateProject,
  onCreateTask,
  onAddNote,
  onUploadFile,
  onNavigateToChild,
  onNavigateBack,
  onOpenDatabase
}) => {
  
  const config = OFFICE_TYPES[type];
  const [activeTab, setActiveTab] = useState('overview');
  const [showActions, setShowActions] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [checklist, setChecklist] = useState(data.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState('');

  // ─────────────────────────────────────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────────────────────────────────────
  
  const stats = {
    meetings: { total: meetings.length, active: meetings.filter(m => m.status === 'active').length },
    agents: { total: agents.length, available: agents.filter(a => a.status !== 'busy').length },
    projects: { total: projects.length, active: projects.filter(p => p.status === 'active').length },
    tasks: { total: tasks.length, done: tasks.filter(t => t.status === 'done' || t.status === 'completed').length },
    checklist: { total: checklist.length, done: checklist.filter(c => c.done).length }
  };
  
  const progress = stats.tasks.total > 0 
    ? Math.round((stats.tasks.done / stats.tasks.total) * 100) 
    : (data.progress || 0);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  
  const addCheckItem = () => {
    if (newCheckItem.trim()) {
      setChecklist([...checklist, { id: Date.now(), text: newCheckItem, done: false }]);
      setNewCheckItem('');
    }
  };

  const toggleCheck = (id) => {
    setChecklist(checklist.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  const deleteCheck = (id) => {
    setChecklist(checklist.filter(c => c.id !== id));
  };

  const handleAddNote = () => {
    if (noteText.trim() && onAddNote) {
      onAddNote({ id: Date.now(), content: noteText, timestamp: new Date().toISOString() });
      setNoteText('');
    }
  };

  const closeActions = () => setShowActions(false);

  // ─────────────────────────────────────────────────────────────────────────
  // TAB LABELS
  // ─────────────────────────────────────────────────────────────────────────
  
  const getTabLabel = (tab) => ({
    overview: '📊 Overview',
    meetings: `📅 Meetings (${stats.meetings.total})`,
    agents: `🤖 Agents (${stats.agents.total})`,
    projects: `📁 Projects (${stats.projects.total})`,
    tasks: `✅ Tasks (${stats.tasks.total})`,
    files: `📄 Files (${files.length})`,
    children: `🏢 Offices (${childOffices.length})`,
    database: '💾 Database',
    checklist: `☑️ Checklist (${stats.checklist.done}/${stats.checklist.total})`,
    notes: `📝 Notes (${notes.length})`
  }[tab]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="os-container" style={{ '--os-color': config.color }}>
      
      {/* ════════════════════════ HEADER ════════════════════════ */}
      <header className="os-header">
        
        {/* Breadcrumb */}
        {parentPath.length > 0 && (
          <nav className="os-breadcrumb">
            {parentPath.map((item, i) => (
              <React.Fragment key={i}>
                <button className="os-bc-btn" onClick={() => onNavigateBack?.(i)}>
                  {item.icon} {item.name}
                </button>
                <span className="os-bc-sep">›</span>
              </React.Fragment>
            ))}
            <span className="os-bc-current">{config.icon} {name}</span>
          </nav>
        )}

        {/* Title */}
        <div className="os-title-row">
          <div className="os-title-icon">{config.icon}</div>
          <div className="os-title-text">
            <h1>{name}</h1>
            <p>{config.label}</p>
          </div>
          <button className="os-actions-btn" onClick={() => setShowActions(!showActions)}>
            ⚡ Actions
          </button>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="os-actions-menu">
            {config.features.includes('meetings') && (
              <button onClick={() => { onCreateMeeting?.(); closeActions(); }}>📅 New Meeting</button>
            )}
            {config.features.includes('projects') && (
              <button onClick={() => { onCreateProject?.(); closeActions(); }}>📁 New Project</button>
            )}
            {config.features.includes('tasks') && (
              <button onClick={() => { onCreateTask?.(); closeActions(); }}>✅ New Task</button>
            )}
            {config.features.includes('agents') && (
              <button onClick={() => { onAssignAgent?.(); closeActions(); }}>🤖 Assign Agent</button>
            )}
            <button onClick={() => { onUploadFile?.(); closeActions(); }}>📄 Upload File</button>
            {config.features.includes('database') && (
              <button onClick={() => { onOpenDatabase?.(); closeActions(); }}>💾 Database</button>
            )}
          </div>
        )}
      </header>

      {/* ════════════════════════ STATS BAR ════════════════════════ */}
      <div className="os-stats">
        {config.features.includes('meetings') && (
          <div className="os-stat">
            <span className="os-stat-icon">📅</span>
            <strong>{stats.meetings.active}</strong>
            <small>Active</small>
          </div>
        )}
        {config.features.includes('agents') && (
          <div className="os-stat">
            <span className="os-stat-icon">🤖</span>
            <strong>{stats.agents.available}/{stats.agents.total}</strong>
            <small>Ready</small>
          </div>
        )}
        {config.features.includes('projects') && (
          <div className="os-stat">
            <span className="os-stat-icon">📁</span>
            <strong>{stats.projects.active}</strong>
            <small>Active</small>
          </div>
        )}
        {config.features.includes('tasks') && (
          <div className="os-stat">
            <span className="os-stat-icon">✅</span>
            <strong>{stats.tasks.done}/{stats.tasks.total}</strong>
            <small>Done</small>
          </div>
        )}
        {(type === 'project' || type === 'task') && (
          <div className="os-stat os-stat-progress">
            <div className="os-progress-mini">
              <div className="os-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <strong>{progress}%</strong>
          </div>
        )}
      </div>

      {/* ════════════════════════ TABS ════════════════════════ */}
      <nav className="os-tabs">
        {TABS_CONFIG[type]?.map(tab => (
          <button
            key={tab}
            className={`os-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </nav>

      {/* ════════════════════════ CONTENT ════════════════════════ */}
      <main className="os-main">
        
        {/* ──────────── OVERVIEW ──────────── */}
        {activeTab === 'overview' && (
          <div className="os-overview">
            <div className="os-grid">
              
              {/* Summary */}
              <div className="os-card">
                <h3>📋 Summary</h3>
                <p>{data.description || `Welcome to ${name}. This is your workspace.`}</p>
                {data.nextSteps && data.nextSteps.length > 0 && (
                  <div className="os-next-steps">
                    <h4>🎯 Next Steps</h4>
                    <ul>{data.nextSteps.map((step, i) => <li key={i}>{step}</li>)}</ul>
                  </div>
                )}
              </div>

              {/* Team */}
              <div className="os-card">
                <div className="os-card-head">
                  <h3>🤖 Team ({stats.agents.total})</h3>
                  <button className="os-btn-sm" onClick={onAssignAgent}>+ Add</button>
                </div>
                <div className="os-team">
                  {agents.slice(0, 6).map((agent, i) => (
                    <div key={i} className="os-team-item">
                      <span className="os-avatar">{agent.avatar || '🤖'}</span>
                      <span className="os-name">{agent.name}</span>
                      <span className={`os-dot ${agent.status === 'busy' ? 'busy' : 'ok'}`}></span>
                    </div>
                  ))}
                </div>
                {agents.length === 0 && <p className="os-empty">No agents assigned</p>}
              </div>

              {/* Activity */}
              <div className="os-card">
                <h3>⚡ Recent Activity</h3>
                <div className="os-activity">
                  {meetings.slice(0, 2).map((m, i) => (
                    <div key={`m${i}`} className="os-activity-item">
                      <span>📅</span> {m.name} <small>{m.status}</small>
                    </div>
                  ))}
                  {tasks.slice(0, 2).map((t, i) => (
                    <div key={`t${i}`} className="os-activity-item">
                      <span>✅</span> {t.name} <small>{t.status}</small>
                    </div>
                  ))}
                </div>
                {meetings.length === 0 && tasks.length === 0 && <p className="os-empty">No recent activity</p>}
              </div>

              {/* Child Offices */}
              {childOffices.length > 0 && (
                <div className="os-card">
                  <h3>🏢 Sub-Offices ({childOffices.length})</h3>
                  <div className="os-children">
                    {childOffices.map((child, i) => (
                      <button key={i} className="os-child-btn" onClick={() => onNavigateToChild?.(child)}>
                        {OFFICE_TYPES[child.type]?.icon || '🏢'} {child.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────── MEETINGS ──────────── */}
        {activeTab === 'meetings' && (
          <div className="os-tab-content">
            <div className="os-tab-header">
              <h2>📅 Meetings</h2>
              <button className="os-btn-primary" onClick={onCreateMeeting}>+ New Meeting</button>
            </div>
            <div className="os-items-grid">
              {meetings.map((meeting, i) => (
                <div key={i} className="os-item-card">
                  <div className={`os-item-badge ${meeting.status === 'active' ? 'live' : ''}`}>
                    {meeting.status === 'active' ? '🔴 Live' : '⚪ Scheduled'}
                  </div>
                  <h4>{meeting.name}</h4>
                  <p>{meeting.description || 'No description'}</p>
                  <div className="os-item-meta">
                    <span>🤖 {meeting.agents?.length || 0}</span>
                    <span>👥 {meeting.participants?.length || 0}</span>
                  </div>
                  <button className="os-btn">{meeting.status === 'active' ? 'Join' : 'Open'}</button>
                </div>
              ))}
            </div>
            {meetings.length === 0 && (
              <div className="os-empty-state">
                <span className="os-empty-icon">📅</span>
                <p>No meetings yet</p>
                <button className="os-btn-primary" onClick={onCreateMeeting}>Create Meeting</button>
              </div>
            )}
          </div>
        )}

        {/* ──────────── AGENTS ──────────── */}
        {activeTab === 'agents' && (
          <div className="os-tab-content">
            <div className="os-tab-header">
              <h2>🤖 Agents</h2>
              <button className="os-btn-primary" onClick={onAssignAgent}>+ Assign Agent</button>
            </div>
            <div className="os-items-grid">
              {agents.map((agent, i) => (
                <div key={i} className="os-item-card os-agent-card">
                  <div className="os-agent-header">
                    <span className="os-agent-avatar">{agent.avatar || '🤖'}</span>
                    <span className={`os-agent-status ${agent.status || 'available'}`}>
                      {agent.status === 'busy' ? '🔴 Busy' : '🟢 Ready'}
                    </span>
                  </div>
                  <h4>{agent.name}</h4>
                  <p>{agent.role || 'Agent'}</p>
                  <div className="os-skills">
                    {(agent.skills || []).slice(0, 3).map((skill, j) => (
                      <span key={j} className="os-skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {agents.length === 0 && (
              <div className="os-empty-state">
                <span className="os-empty-icon">🤖</span>
                <p>No agents assigned</p>
                <button className="os-btn-primary" onClick={onAssignAgent}>Assign Agent</button>
              </div>
            )}
          </div>
        )}

        {/* ──────────── PROJECTS ──────────── */}
        {activeTab === 'projects' && (
          <div className="os-tab-content">
            <div className="os-tab-header">
              <h2>📁 Projects</h2>
              <button className="os-btn-primary" onClick={onCreateProject}>+ New Project</button>
            </div>
            <div className="os-items-grid">
              {projects.map((project, i) => (
                <div 
                  key={i} 
                  className="os-item-card os-project-card"
                  onClick={() => onNavigateToChild?.({ ...project, type: 'project' })}
                >
                  <h4>📁 {project.name}</h4>
                  <p>{project.description || 'No description'}</p>
                  <div className="os-project-progress">
                    <div className="os-progress-bar-mini">
                      <div style={{ width: `${project.progress || 0}%` }}></div>
                    </div>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div className="os-item-meta">
                    <span>🤖 {project.agents?.length || 0}</span>
                    <span>✅ {project.tasks?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
            {projects.length === 0 && (
              <div className="os-empty-state">
                <span className="os-empty-icon">📁</span>
                <p>No projects yet</p>
                <button className="os-btn-primary" onClick={onCreateProject}>Create Project</button>
              </div>
            )}
          </div>
        )}

        {/* ──────────── TASKS ──────────── */}
        {activeTab === 'tasks' && (
          <div className="os-tab-content">
            <div className="os-tab-header">
              <h2>✅ Tasks</h2>
              <button className="os-btn-primary" onClick={onCreateTask}>+ New Task</button>
            </div>
            <div className="os-tasks-list">
              {tasks.map((task, i) => (
                <div 
                  key={i} 
                  className={`os-task-item ${task.status === 'done' ? 'done' : ''}`}
                  onClick={() => onNavigateToChild?.({ ...task, type: 'task' })}
                >
                  <div className={`os-task-check ${task.status === 'done' ? 'checked' : ''}`}>
                    {task.status === 'done' && '✓'}
                  </div>
                  <div className="os-task-info">
                    <h4>{task.name}</h4>
                    <p>{task.description || 'No description'}</p>
                  </div>
                  <div className="os-task-meta">
                    <span>🤖 {task.agents?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
            {tasks.length === 0 && (
              <div className="os-empty-state">
                <span className="os-empty-icon">✅</span>
                <p>No tasks yet</p>
                <button className="os-btn-primary" onClick={onCreateTask}>Create Task</button>
              </div>
            )}
          </div>
        )}

        {/* ──────────── CHECKLIST ──────────── */}
        {activeTab === 'checklist' && (
          <div className="os-tab-content">
            <div className="os-tab-header">
              <h2>☑️ Checklist</h2>
            </div>
            <div className="os-checklist-input">
              <input
                type="text"
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                placeholder="Add new item..."
                onKeyPress={(e) => e.key === 'Enter' && addCheckItem()}
              />
              <button onClick={addCheckItem}>+ Add</button>
            </div>
            <div className="os-checklist">
              {checklist.map((item) => (
                <div key={item.id} className={`os-check-item ${item.done ? 'done' : ''}`}>
                  <button className="os-check-box" onClick={() => toggleCheck(item.id)}>
                    {item.done && '✓'}
                  </button>
                  <span className="os-check-text">{item.text}</span>
                  <button className="os-check-del" onClick={() => deleteCheck(item.id)}>✕</button>
                </div>
              ))}
            </div>
            {checklist.length === 0 && <p className="os-empty">No items in checklist</p>}
          </div>
        )}

        {/* ──────────── NOTES ──────────── */}
        {activeTab === 'notes' && (
          <div className="os-tab-content">
            <div className="os-tab-header">
              <h2>📝 Notes</h2>
            </div>
            <div className="os-notes-input">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write a note..."
                rows={3}
              />
              <button onClick={handleAddNote}>+ Add Note</button>
            </div>
            <div className="os-notes-list">
              {notes.map((note, i) => (
                <div key={i} className="os-note-item">
                  <p>{note.content}</p>
                  <small>{new Date(note.timestamp).toLocaleString()}</small>
                </div>
              ))}
            </div>
            {notes.length === 0 && <p className="os-empty">No notes yet</p>}
          </div>
        )}

        {/* ──────────── FILES ──────────── */}
        {activeTab === 'files' && (
          <div className="os-tab-content">
            <div className="os-tab-header">
              <h2>📄 Files</h2>
              <button className="os-btn-primary" onClick={onUploadFile}>+ Upload</button>
            </div>
            <div className="os-files-grid">
              {files.map((file, i) => (
                <div key={i} className="os-file-item">
                  <span className="os-file-icon">
                    {file.type?.includes('image') ? '🖼️' : 
                     file.type?.includes('pdf') ? '📕' : 
                     file.type?.includes('doc') ? '📄' : '📁'}
                  </span>
                  <span className="os-file-name">{file.name}</span>
                  <small>{file.size || 'Unknown size'}</small>
                </div>
              ))}
            </div>
            {files.length === 0 && (
              <div className="os-empty-state">
                <span className="os-empty-icon">📄</span>
                <p>No files yet</p>
                <button className="os-btn-primary" onClick={onUploadFile}>Upload File</button>
              </div>
            )}
          </div>
        )}

        {/* ──────────── CHILDREN (Sub-Offices) ──────────── */}
        {activeTab === 'children' && (
          <div className="os-tab-content">
            <div className="os-tab-header">
              <h2>🏢 Sub-Offices</h2>
              {type === 'user' && <button className="os-btn-primary" onClick={onCreateProject}>+ New Business</button>}
              {type === 'business' && <button className="os-btn-primary" onClick={onCreateProject}>+ New Project</button>}
            </div>
            <div className="os-children-grid">
              {childOffices.map((child, i) => (
                <div 
                  key={i} 
                  className="os-child-card"
                  onClick={() => onNavigateToChild?.(child)}
                >
                  <span className="os-child-icon">{OFFICE_TYPES[child.type]?.icon || '🏢'}</span>
                  <h4>{child.name}</h4>
                  <p>{OFFICE_TYPES[child.type]?.label || 'Office'}</p>
                </div>
              ))}
            </div>
            {childOffices.length === 0 && (
              <div className="os-empty-state">
                <span className="os-empty-icon">🏢</span>
                <p>No sub-offices yet</p>
              </div>
            )}
          </div>
        )}

        {/* ──────────── DATABASE ──────────── */}
        {activeTab === 'database' && (
          <div className="os-tab-content">
            <div className="os-tab-header">
              <h2>💾 Database</h2>
              <button className="os-btn-primary" onClick={onOpenDatabase}>Open Full Database</button>
            </div>
            <div className="os-database-preview">
              <div className="os-db-stat">
                <span>📅</span>
                <strong>{meetings.length}</strong>
                <p>Meetings</p>
              </div>
              <div className="os-db-stat">
                <span>🤖</span>
                <strong>{agents.length}</strong>
                <p>Agents</p>
              </div>
              <div className="os-db-stat">
                <span>📁</span>
                <strong>{projects.length}</strong>
                <p>Projects</p>
              </div>
              <div className="os-db-stat">
                <span>✅</span>
                <strong>{tasks.length}</strong>
                <p>Tasks</p>
              </div>
              <div className="os-db-stat">
                <span>📄</span>
                <strong>{files.length}</strong>
                <p>Files</p>
              </div>
              <div className="os-db-stat">
                <span>📝</span>
                <strong>{notes.length}</strong>
                <p>Notes</p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Office;
