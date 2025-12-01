// 🧰 ROADY TOOLBOX - LIVE DEMO
const { useState, useMemo } = React;

const CATEGORIES = {
  communication: { name: 'Communication', icon: '💬', color: '#6366f1' },
  productivity: { name: 'Productivity', icon: '⚡', color: '#10b981' },
  data: { name: 'Data & Analytics', icon: '📊', color: '#f59e0b' },
  content: { name: 'Content', icon: '🎨', color: '#ec4899' },
  finance: { name: 'Finance', icon: '💰', color: '#22c55e' },
  development: { name: 'Development', icon: '💻', color: '#8b5cf6' },
  marketing: { name: 'Marketing', icon: '📱', color: '#0ea5e9' },
  integration: { name: 'Integrations', icon: '🔗', color: '#14b8a6' },
  ai: { name: 'AI & ML', icon: '🤖', color: '#f472b6' },
  utilities: { name: 'Utilities', icon: '🔧', color: '#64748b' }
};

const TOOLS = [
  { id: 'email', name: 'Email Sender', icon: '📧', cat: 'communication', desc: 'Send emails via SMTP/API', cost: 100, inputs: ['to', 'subject', 'body'], outputs: ['status'] },
  { id: 'slack', name: 'Slack', icon: '💬', cat: 'communication', desc: 'Send Slack messages', cost: 50, inputs: ['channel', 'message'], outputs: ['status'] },
  { id: 'sms', name: 'SMS Sender', icon: '📱', cat: 'communication', desc: 'Send SMS via Twilio', cost: 150, inputs: ['phone', 'message'], outputs: ['status'] },
  { id: 'webhook', name: 'Webhook', icon: '🔔', cat: 'communication', desc: 'Call webhooks', cost: 30, inputs: ['url', 'payload'], outputs: ['response'] },
  { id: 'task', name: 'Task Creator', icon: '✅', cat: 'productivity', desc: 'Create tasks', cost: 80, inputs: ['title', 'assignee'], outputs: ['taskId'] },
  { id: 'calendar', name: 'Calendar', icon: '📅', cat: 'productivity', desc: 'Manage events', cost: 100, inputs: ['title', 'time'], outputs: ['eventId'] },
  { id: 'meeting', name: 'Meeting Scheduler', icon: '🤝', cat: 'productivity', desc: 'Schedule meetings', cost: 200, inputs: ['participants'], outputs: ['meetingId'] },
  { id: 'doc', name: 'Doc Creator', icon: '📄', cat: 'productivity', desc: 'Generate docs', cost: 150, inputs: ['template'], outputs: ['docUrl'] },
  { id: 'fetch', name: 'Data Fetcher', icon: '📥', cat: 'data', desc: 'Fetch from APIs', cost: 50, inputs: ['url'], outputs: ['data'] },
  { id: 'transform', name: 'Transformer', icon: '🔄', cat: 'data', desc: 'Transform data', cost: 100, inputs: ['data'], outputs: ['result'] },
  { id: 'db', name: 'DB Query', icon: '🗄️', cat: 'data', desc: 'Database queries', cost: 100, inputs: ['query'], outputs: ['results'] },
  { id: 'report', name: 'Report Gen', icon: '📊', cat: 'data', desc: 'Generate reports', cost: 300, inputs: ['source'], outputs: ['reportUrl'] },
  { id: 'text', name: 'Text Generator', icon: '✍️', cat: 'content', desc: 'AI text generation', cost: 500, inputs: ['prompt'], outputs: ['text'] },
  { id: 'image', name: 'Image Generator', icon: '🖼️', cat: 'content', desc: 'AI images', cost: 1000, inputs: ['prompt'], outputs: ['imageUrl'] },
  { id: 'translate', name: 'Translator', icon: '🌐', cat: 'content', desc: 'Translate text', cost: 100, inputs: ['text', 'lang'], outputs: ['translated'] },
  { id: 'summarize', name: 'Summarizer', icon: '📝', cat: 'content', desc: 'Summarize content', cost: 200, inputs: ['content'], outputs: ['summary'] },
  { id: 'invoice', name: 'Invoice Gen', icon: '🧾', cat: 'finance', desc: 'Generate invoices', cost: 150, inputs: ['client', 'items'], outputs: ['invoiceUrl'] },
  { id: 'payment', name: 'Payment', icon: '💳', cat: 'finance', desc: 'Process payments', cost: 200, inputs: ['amount'], outputs: ['txId'] },
  { id: 'expense', name: 'Expense Track', icon: '📉', cat: 'finance', desc: 'Track expenses', cost: 50, inputs: ['amount'], outputs: ['id'] },
  { id: 'tax', name: 'Tax Calc', icon: '🧮', cat: 'finance', desc: 'Calculate taxes', cost: 100, inputs: ['amount'], outputs: ['tax'] },
  { id: 'code', name: 'Code Generator', icon: '💻', cat: 'development', desc: 'Generate code', cost: 400, inputs: ['description'], outputs: ['code'] },
  { id: 'review', name: 'Code Review', icon: '🔍', cat: 'development', desc: 'Review code', cost: 300, inputs: ['code'], outputs: ['issues'] },
  { id: 'api', name: 'API Tester', icon: '🧪', cat: 'development', desc: 'Test APIs', cost: 50, inputs: ['endpoint'], outputs: ['response'] },
  { id: 'deploy', name: 'Deploy', icon: '🚀', cat: 'development', desc: 'Deployments', cost: 300, inputs: ['env'], outputs: ['status'] },
  { id: 'social', name: 'Social Post', icon: '📱', cat: 'marketing', desc: 'Post to social', cost: 100, inputs: ['platform', 'content'], outputs: ['postId'] },
  { id: 'hashtag', name: 'Hashtags', icon: '#️⃣', cat: 'marketing', desc: 'Generate hashtags', cost: 50, inputs: ['content'], outputs: ['tags'] },
  { id: 'campaign', name: 'Campaign', icon: '📈', cat: 'marketing', desc: 'Track campaigns', cost: 150, inputs: ['id'], outputs: ['data'] },
  { id: 'lead', name: 'Lead Score', icon: '🎯', cat: 'marketing', desc: 'Score leads', cost: 200, inputs: ['lead'], outputs: ['score'] },
  { id: 'gdrive', name: 'Google Drive', icon: '📁', cat: 'integration', desc: 'Drive ops', cost: 80, inputs: ['action'], outputs: ['result'] },
  { id: 'notion', name: 'Notion', icon: '📓', cat: 'integration', desc: 'Notion sync', cost: 100, inputs: ['action'], outputs: ['result'] },
  { id: 'hubspot', name: 'HubSpot', icon: '🧲', cat: 'integration', desc: 'CRM integration', cost: 150, inputs: ['action'], outputs: ['result'] },
  { id: 'stripe', name: 'Stripe', icon: '💳', cat: 'integration', desc: 'Payments', cost: 100, inputs: ['action'], outputs: ['result'] },
  { id: 'sentiment', name: 'Sentiment', icon: '😊', cat: 'ai', desc: 'Analyze sentiment', cost: 100, inputs: ['text'], outputs: ['score'] },
  { id: 'entity', name: 'Entity Extract', icon: '🏷️', cat: 'ai', desc: 'Extract entities', cost: 150, inputs: ['text'], outputs: ['entities'] },
  { id: 'chatbot', name: 'Chatbot', icon: '🤖', cat: 'ai', desc: 'Conversational AI', cost: 300, inputs: ['message'], outputs: ['response'] },
  { id: 'predict', name: 'Predict', icon: '🔮', cat: 'ai', desc: 'ML predictions', cost: 400, inputs: ['data'], outputs: ['prediction'] },
  { id: 'timer', name: 'Timer', icon: '⏱️', cat: 'utilities', desc: 'Set timers', cost: 10, inputs: ['duration'], outputs: ['status'] },
  { id: 'convert', name: 'Converter', icon: '🔄', cat: 'utilities', desc: 'Convert files', cost: 100, inputs: ['file'], outputs: ['converted'] },
  { id: 'qr', name: 'QR Code', icon: '📱', cat: 'utilities', desc: 'Generate QR', cost: 20, inputs: ['data'], outputs: ['qrUrl'] },
  { id: 'scraper', name: 'Scraper', icon: '🕷️', cat: 'utilities', desc: 'Web scraping', cost: 150, inputs: ['url'], outputs: ['data'] },
];

export default function ToolboxDemo() {
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [assigned, setAssigned] = useState(['email', 'task', 'text']);
  const [note, setNote] = useState(null);

  const notify = (m) => { setNote(m); setTimeout(() => setNote(null), 2000); };
  
  const filtered = TOOLS.filter(t => (cat === 'all' || t.cat === cat) && (t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase())));
  
  const stats = { total: TOOLS.length, assigned: assigned.length, cost: assigned.reduce((s, id) => s + (TOOLS.find(t => t.id === id)?.cost || 0), 0) };

  const toggle = (id) => {
    if (assigned.includes(id)) { setAssigned(p => p.filter(x => x !== id)); notify('🗑️ Removed'); }
    else { setAssigned(p => [...p, id]); notify('✅ Added!'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {note && <div style={{ position: 'fixed', top: 20, right: 20, padding: '12px 24px', background: '#10b981', borderRadius: 10, zIndex: 100, boxShadow: '0 4px 20px rgba(16,185,129,0.4)' }}>{note}</div>}
      
      <header style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '2.5rem' }}>🧰</span>
          <div><h1 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(90deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ROADY Toolbox</h1><p style={{ margin: 0, color: '#888' }}>{stats.total} tools • {Object.keys(CATEGORIES).length} categories</p></div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ padding: '10px 20px', background: 'rgba(99,102,241,0.2)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.3)' }}><span style={{ color: '#a5b4fc' }}>🔧 {stats.assigned} assigned</span></div>
          <div style={{ padding: '10px 20px', background: 'rgba(245,158,11,0.2)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.3)' }}><span style={{ color: '#fbbf24' }}>🪙 {stats.cost} tokens/run</span></div>
        </div>
      </header>

      <div style={{ display: 'flex', height: 'calc(100vh - 85px)' }}>
        <aside style={{ width: 220, background: 'rgba(0,0,0,0.2)', borderRight: '1px solid rgba(255,255,255,0.08)', padding: 16, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#666' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tools..." style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.9rem' }} />
          </div>
          
          <button onClick={() => setCat('all')} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', background: cat === 'all' ? '#6366f1' : 'rgba(255,255,255,0.03)', border: 'none', borderRadius: 10, color: cat === 'all' ? '#fff' : '#aaa', cursor: 'pointer', marginBottom: 6, fontSize: '0.9rem' }}>
            <span>📚</span><span style={{ flex: 1, textAlign: 'left' }}>All Tools</span><span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.15)', borderRadius: 8, fontSize: '0.7rem' }}>{TOOLS.length}</span>
          </button>
          
          {Object.entries(CATEGORIES).map(([id, c]) => (
            <button key={id} onClick={() => setCat(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', background: cat === id ? c.color : 'rgba(255,255,255,0.03)', border: 'none', borderRadius: 10, color: cat === id ? '#fff' : '#aaa', cursor: 'pointer', marginBottom: 6, fontSize: '0.85rem' }}>
              <span>{c.icon}</span><span style={{ flex: 1, textAlign: 'left' }}>{c.name}</span><span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.15)', borderRadius: 8, fontSize: '0.7rem' }}>{TOOLS.filter(t => t.cat === id).length}</span>
            </button>
          ))}
        </aside>

        <main style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {filtered.map(tool => {
              const c = CATEGORIES[tool.cat];
              const isA = assigned.includes(tool.id);
              const isS = selected?.id === tool.id;
              return (
                <div key={tool.id} onClick={() => setSelected(tool)} style={{ padding: 16, background: isS ? `${c.color}20` : 'rgba(255,255,255,0.02)', border: `2px solid ${isS ? c.color : isA ? '#10b981' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
                  {isA && <div style={{ position: 'absolute', top: -1, right: -1, width: 24, height: 24, background: '#10b981', borderRadius: '0 12px 0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>✓</div>}
                  <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>{tool.icon}</div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: '#fff' }}>{tool.name}</h3>
                  <p style={{ margin: '0 0 12px', color: '#888', fontSize: '0.75rem', lineHeight: 1.4 }}>{tool.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: '0.7rem' }}>{c.icon} {c.name}</span>
                    <span style={{ padding: '3px 8px', background: `${c.color}30`, borderRadius: 10, color: c.color, fontSize: '0.7rem' }}>🪙 {tool.cost}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {selected && (
          <aside style={{ width: 300, background: 'rgba(0,0,0,0.3)', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 24, background: `${CATEGORIES[selected.cat].color}15`, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: '3rem' }}>{selected.icon}</span>
                <div><h2 style={{ margin: '0 0 4px', fontSize: '1.2rem' }}>{selected.name}</h2><span style={{ color: CATEGORIES[selected.cat].color, fontSize: '0.85rem' }}>{CATEGORIES[selected.cat].icon} {CATEGORIES[selected.cat].name}</span></div>
              </div>
            </div>
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
              <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>{selected.desc}</p>
              
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 10px', color: '#888', fontSize: '0.85rem' }}>📥 Inputs</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selected.inputs.map((i, idx) => <span key={idx} style={{ padding: '6px 12px', background: 'rgba(99,102,241,0.2)', borderRadius: 20, color: '#a5b4fc', fontSize: '0.8rem' }}>{i}</span>)}
                </div>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 10px', color: '#888', fontSize: '0.85rem' }}>📤 Outputs</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selected.outputs.map((o, idx) => <span key={idx} style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.2)', borderRadius: 20, color: '#34d399', fontSize: '0.8rem' }}>{o}</span>)}
                </div>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 10px', color: '#888', fontSize: '0.85rem' }}>🪙 Token Cost</h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{selected.cost} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#888' }}>per call</span></div>
              </div>
            </div>
            <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 12 }}>
              <button style={{ flex: 1, padding: 14, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }}>⚙️ Configure</button>
              <button onClick={() => toggle(selected.id)} style={{ flex: 1, padding: 14, background: assigned.includes(selected.id) ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                {assigned.includes(selected.id) ? '🗑️ Remove' : '➕ Add'}
              </button>
            </div>
          </aside>
        )}
      </div>
      
      <style>{`* { box-sizing: border-box; } button:hover { opacity: 0.9; }`}</style>
    </div>
  );
}
