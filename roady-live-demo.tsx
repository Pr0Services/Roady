// 🚀 ROADY - LIVE DEMO - All Components Interactive
const { useState } = React;

// Sample Data
const SAMPLE_AGENTS = [
  { id: 'a1', name: 'Max', role: 'Developer', avatar: '🤖', status: 'available', department: 'Engineering', tokenBudget: 15000 },
  { id: 'a2', name: 'Luna', role: 'Designer', avatar: '🎨', status: 'active', department: 'Creative', tokenBudget: 12000 },
  { id: 'a3', name: 'Atlas', role: 'Analyst', avatar: '📊', status: 'available', department: 'Finance', tokenBudget: 10000 },
  { id: 'a4', name: 'Nova', role: 'Writer', avatar: '✍️', status: 'busy', department: 'Marketing', tokenBudget: 8000 },
];

const SAMPLE_OFFICES = [
  { id: 'o1', name: 'Engineering', icon: '💻', type: 'department', agentCount: 5 },
  { id: 'o2', name: 'Marketing', icon: '📱', type: 'department', agentCount: 3 },
  { id: 'o3', name: 'Finance', icon: '💰', type: 'department', agentCount: 4 },
  { id: 'o4', name: 'Accounting', icon: '🏦', type: 'department', agentCount: 6 },
];

const ACCOUNTING_ROLES = [
  { id: 'cfo', name: 'CFO', avatar: '💼', level: 1, budget: 50000 },
  { id: 'controller', name: 'Controller', avatar: '🎯', level: 2, budget: 35000 },
  { id: 'treasurer', name: 'Treasurer', avatar: '🏦', level: 2, budget: 30000 },
  { id: 'acc_mgr', name: 'Accounting Manager', avatar: '📚', level: 3, budget: 25000 },
  { id: 'payroll_mgr', name: 'Payroll Manager', avatar: '👥', level: 3, budget: 20000 },
  { id: 'ar_spec', name: 'AR Specialist', avatar: '💸', level: 4, budget: 12000 },
  { id: 'ap_spec', name: 'AP Specialist', avatar: '💳', level: 4, budget: 12000 },
  { id: 'bookkeeper', name: 'Bookkeeper', avatar: '✍️', level: 5, budget: 8000 },
];

// Main App
export default function RoadyDemo() {
  const [activeModule, setActiveModule] = useState(null);
  const [agents, setAgents] = useState(SAMPLE_AGENTS);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (msg) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const modules = [
    { id: 'agents', name: 'Agent Creator', icon: '🤖', color: '#6366f1', desc: 'Create & manage AI agents' },
    { id: 'meetings', name: 'Meeting System', icon: '📅', color: '#10b981', desc: 'Token budgeting & workflows' },
    { id: 'creative', name: 'Creative Studio', icon: '🎨', color: '#ec4899', desc: 'AI content generation' },
    { id: 'analytics', name: 'Analytics', icon: '📊', color: '#f59e0b', desc: 'Performance metrics' },
    { id: 'workflow', name: 'Workflow Editor', icon: '🔄', color: '#8b5cf6', desc: 'Visual automation builder' },
    { id: 'database', name: 'Database', icon: '💾', color: '#14b8a6', desc: 'Data management' },
    { id: 'accounting', name: 'Accounting', icon: '🏦', color: '#22c55e', desc: 'Financial department' },
    { id: 'social', name: 'Social Media', icon: '📱', color: '#0ea5e9', desc: 'Multi-platform manager' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Notifications */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifications.map(n => (
          <div key={n.id} style={{ padding: '12px 20px', background: '#10b981', borderRadius: 10, animation: 'fadeIn 0.3s', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>{n.msg}</div>
        ))}
      </div>

      {/* Header */}
      <header style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '2.5rem' }}>🚀</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(90deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ROADY</h1>
            <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>AI-Powered Business Platform</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ padding: '8px 16px', background: 'rgba(99,102,241,0.2)', borderRadius: 20, fontSize: '0.85rem' }}>
            🤖 {agents.length} Agents
          </div>
          <div style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.2)', borderRadius: 20, fontSize: '0.85rem' }}>
            🏢 {SAMPLE_OFFICES.length} Offices
          </div>
        </div>
      </header>

      {/* Main Content */}
      {!activeModule ? (
        <main style={{ padding: 40 }}>
          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
            {[
              { icon: '🤖', value: agents.length, label: 'Active Agents', color: '#6366f1' },
              { icon: '📅', value: '12', label: 'Meetings Today', color: '#10b981' },
              { icon: '🪙', value: '125k', label: 'Tokens Used', color: '#f59e0b' },
              { icon: '✅', value: '89%', label: 'Task Completion', color: '#ec4899' },
            ].map((stat, i) => (
              <div key={i} style={{ padding: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: '2rem', width: 50, height: 50, background: `${stat.color}30`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stat.icon}</span>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stat.value}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Module Grid */}
          <h2 style={{ marginBottom: 24, fontSize: '1.3rem' }}>🎯 Modules</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {modules.map(m => (
              <div key={m.id} onClick={() => setActiveModule(m.id)} style={{ padding: 24, background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.08)', borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 16 }}>{m.icon}</span>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>{m.name}</h3>
                <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>{m.desc}</p>
              </div>
            ))}
          </div>

          {/* Active Agents */}
          <h2 style={{ margin: '40px 0 24px', fontSize: '1.3rem' }}>🤖 Active Agents</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {agents.map(agent => (
              <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                <span style={{ fontSize: '2rem' }}>{agent.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{agent.name}</div>
                  <div style={{ color: '#888', fontSize: '0.8rem' }}>{agent.role}</div>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem', background: agent.status === 'available' ? 'rgba(16,185,129,0.2)' : agent.status === 'active' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)', color: agent.status === 'available' ? '#10b981' : agent.status === 'active' ? '#818cf8' : '#fbbf24' }}>{agent.status}</span>
              </div>
            ))}
          </div>
        </main>
      ) : (
        <main style={{ padding: 40 }}>
          <button onClick={() => setActiveModule(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', marginBottom: 24 }}>
            ← Back to Dashboard
          </button>

          {/* Agent Creator Module */}
          {activeModule === 'agents' && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 30 }}>
              <h2 style={{ margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>🤖 Agent Creator</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#888', fontSize: '0.85rem' }}>Agent Name</label>
                  <input placeholder="Enter name..." style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#888', fontSize: '0.85rem' }}>Role</label>
                  <select style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff' }}>
                    <option>Developer</option><option>Designer</option><option>Analyst</option><option>Writer</option><option>Manager</option>
                  </select>
                </div>
              </div>
              <button onClick={() => { setAgents(prev => [...prev, { id: `a${Date.now()}`, name: 'New Agent', role: 'Assistant', avatar: '🤖', status: 'available' }]); addNotification('✅ Agent created!'); }} style={{ marginTop: 24, padding: '14px 28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>🚀 Create Agent</button>
            </div>
          )}

          {/* Meeting Module */}
          {activeModule === 'meetings' && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 30 }}>
              <h2 style={{ margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>📅 Meeting System</h2>
              <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                {['💡 Brainstorm', '📋 Planning', '🔍 Review', '🌅 Standup'].map((t, i) => (
                  <button key={i} style={{ padding: '12px 20px', background: i === 0 ? '#10b981' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', cursor: 'pointer' }}>{t}</button>
                ))}
              </div>
              <div style={{ padding: 24, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>🪙 Token Budget</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>50,000</span>
                </div>
                <input type="range" min="5000" max="200000" defaultValue="50000" style={{ width: '100%' }} />
              </div>
              <button onClick={() => addNotification('🚀 Meeting created!')} style={{ marginTop: 24, padding: '14px 28px', background: 'linear-gradient(135deg, #10b981, #14b8a6)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>▶️ Start Meeting</button>
            </div>
          )}

          {/* Accounting Module */}
          {activeModule === 'accounting' && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 30 }}>
              <h2 style={{ margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>🏦 Accounting Department</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[{ l: 'Total Roles', v: '18' }, { l: 'Departments', v: '6' }, { l: 'Total Budget', v: '280k' }, { l: 'Workflows', v: '5' }].map((s, i) => (
                  <div key={i} style={{ padding: 20, background: 'rgba(16,185,129,0.1)', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>{s.v}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ marginBottom: 16, color: '#10b981' }}>Role Hierarchy</h3>
              {[1, 2, 3, 4, 5].map(level => (
                <div key={level} style={{ marginBottom: 16 }}>
                  <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: 8, paddingLeft: 8, borderLeft: '3px solid #10b981' }}>LEVEL {level}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {ACCOUNTING_ROLES.filter(r => r.level === level).map(role => (
                      <div key={role.id} onClick={() => addNotification(`🤖 Creating ${role.name} agent...`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, cursor: 'pointer' }}>
                        <span style={{ fontSize: '1.5rem' }}>{role.avatar}</span>
                        <div><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{role.name}</div><div style={{ color: '#10b981', fontSize: '0.75rem' }}>🪙 {(role.budget/1000)}k</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Analytics Module */}
          {activeModule === 'analytics' && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 30 }}>
              <h2 style={{ margin: '0 0 24px' }}>📊 Analytics Dashboard</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[{ icon: '🪙', v: '125k', l: 'Tokens', c: '#6366f1', t: '↑12%' }, { icon: '✅', v: '47', l: 'Tasks Done', c: '#10b981', t: '↑8%' }, { icon: '💰', v: '$12.50', l: 'Cost', c: '#f59e0b', t: '↓5%' }, { icon: '🤖', v: '8/12', l: 'Agents', c: '#ec4899', t: '→' }].map((s, i) => (
                  <div key={i} style={{ padding: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: '1.8rem', width: 50, height: 50, background: `${s.c}30`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</span>
                    <div style={{ flex: 1 }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{s.v}</div><div style={{ color: '#888', fontSize: '0.8rem' }}>{s.l}</div></div>
                    <span style={{ padding: '4px 10px', background: s.t.includes('↑') ? 'rgba(16,185,129,0.2)' : s.t.includes('↓') ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)', borderRadius: 20, fontSize: '0.75rem', color: s.t.includes('↑') ? '#10b981' : s.t.includes('↓') ? '#ef4444' : '#888' }}>{s.t}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 14 }}>
                  <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>🪙 Token Usage (7 Days)</h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 150 }}>
                    {[60, 80, 65, 90, 75, 40, 30].map((h, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '100%', height: h * 1.5, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)', borderRadius: '6px 6px 0 0' }}></div>
                        <span style={{ marginTop: 8, color: '#888', fontSize: '0.75rem' }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other modules placeholder */}
          {['creative', 'workflow', 'database', 'social'].includes(activeModule) && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 60, textAlign: 'center' }}>
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: 20 }}>{modules.find(m => m.id === activeModule)?.icon}</span>
              <h2>{modules.find(m => m.id === activeModule)?.name}</h2>
              <p style={{ color: '#888' }}>Full component available in exported files</p>
              <button onClick={() => addNotification('📥 Component ready for export!')} style={{ marginTop: 20, padding: '14px 28px', background: modules.find(m => m.id === activeModule)?.color, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>View Full Component</button>
            </div>
          )}
        </main>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
