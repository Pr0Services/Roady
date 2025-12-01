// 🧰 ROADY TOOLBOX - LIVE DEMO
const { useState, useMemo } = React;

const CATEGORIES = {
  communication: { name: 'Communication', icon: '💬', color: '#6366f1' },
  productivity: { name: 'Productivity', icon: '⚡', color: '#10b981' },
  data: { name: 'Data & Analytics', icon: '📊', color: '#f59e0b' },
  content: { name: 'Content Creation', icon: '🎨', color: '#ec4899' },
  finance: { name: 'Finance', icon: '💰', color: '#22c55e' },
  development: { name: 'Development', icon: '💻', color: '#8b5cf6' },
  marketing: { name: 'Marketing', icon: '📱', color: '#0ea5e9' },
  integration: { name: 'Integrations', icon: '🔗', color: '#14b8a6' },
  ai: { name: 'AI & ML', icon: '🤖', color: '#f472b6' },
  utilities: { name: 'Utilities', icon: '🔧', color: '#64748b' }
};

const TOOLS = [
  // Communication
  { id: 'email', name: 'Email Sender', icon: '📧', cat: 'communication', desc: 'Send emails via SMTP/API', cost: 100, inputs: ['to', 'subject', 'body'], outputs: ['status', 'messageId'] },
  { id: 'slack', name: 'Slack Messenger', icon: '💬', cat: 'communication', desc: 'Send Slack messages', cost: 50, inputs: ['channel', 'message'], outputs: ['status'] },
  { id: 'sms', name: 'SMS Sender', icon: '📱', cat: 'communication', desc: 'Send SMS via Twilio', cost: 150, inputs: ['phone', 'message'], outputs: ['status'] },
  { id: 'webhook', name: 'Webhook Caller', icon: '🔔', cat: 'communication', desc: 'Call external webhooks', cost: 30, inputs: ['url', 'payload'], outputs: ['response'] },
  // Productivity
  { id: 'task', name: 'Task Creator', icon: '✅', cat: 'productivity', desc: 'Create tasks in project tools', cost: 80, inputs: ['title', 'assignee', 'dueDate'], outputs: ['taskId'] },
  { id: 'calendar', name: 'Calendar Manager', icon: '📅', cat: 'productivity', desc: 'Manage calendar events', cost: 100, inputs: ['title', 'time', 'attendees'], outputs: ['eventId'] },
  { id: 'meeting', name: 'Meeting Scheduler', icon: '🤝', cat: 'productivity', desc: 'Schedule meetings', cost: 200, inputs: ['participants', 'duration'], outputs: ['meetingId'] },
  { id: 'doc', name: 'Document Creator', icon: '📄', cat: 'productivity', desc: 'Generate documents', cost: 150, inputs: ['template', 'data'], outputs: ['docUrl'] },
  // Data
  { id: 'fetch', name: 'Data Fetcher', icon: '📥', cat: 'data', desc: 'Fetch data from APIs', cost: 50, inputs: ['url', 'params'], outputs: ['data'] },
  { id: 'transform', name: 'Data Transformer', icon: '🔄', cat: 'data', desc: 'Transform data formats', cost: 100, inputs: ['data', 'rules'], outputs: ['result'] },
  { id: 'db', name: 'Database Query', icon: '🗄️', cat: 'data', desc: 'Execute database queries', cost: 100, inputs: ['query', 'params'], outputs: ['results'] },
  { id: 'report', name: 'Report Generator', icon: '📊', cat: 'data', desc: 'Generate reports', cost: 300, inputs: ['source', 'template'], outputs: ['reportUrl'] },
  // Content
  { id: 'text', name: 'Text Generator', icon: '✍️', cat: 'content', desc: 'Generate text with AI', cost: 500, inputs: ['prompt', 'style'], outputs: ['text'] },
  { id: 'image', name: 'Image Generator', icon: '🖼️', cat: 'content', desc: 'Generate images with AI', cost: 1000, inputs: ['prompt', 'style'], outputs: ['imageUrl'] },
  { id: 'translate', name: 'Translator', icon: '🌐', cat: 'content', desc: 'Translate text', cost: 100, inputs: ['text', 'targetLang'], outputs: ['translated'] },
  { id: 'summarize', name: 'Summarizer', icon: '📝', cat: 'content', desc: 'Summarize content', cost: 200, inputs: ['content', 'length'], outputs: ['summary'] },
  // Finance
  { id: 'invoice', name: 'Invoice Generator', icon: '🧾', cat: 'finance', desc: 'Generate invoices', cost: 150, inputs: ['client', 'items'], outputs: ['invoiceUrl'] },
  { id: 'payment', name: 'Payment Processor', icon: '💳', cat: 'finance', desc: 'Process payments', cost: 200, inputs: ['amount', 'method'], outputs: ['transactionId'] },
  { id: 'expense', name: 'Expense Tracker', icon: '📉', cat: 'finance', desc: 'Track expenses', cost: 50, inputs: ['amount', 'category'], outputs: ['expenseId'] },
  { id: 'tax', name: 'Tax Calculator', icon: '🧮', cat: 'finance', desc: 'Calculate taxes', cost: 100, inputs: ['amount', 'type'], outputs: ['taxAmount'] },
  // Development
  { id: 'code', name: 'Code Generator', icon: '💻', cat: 'development', desc: 'Generate code snippets', cost: 400, inputs: ['description', 'language'], outputs: ['code'] },
  { id: 'review', name: 'Code Reviewer', icon: '🔍', cat: 'development', desc: 'Review code for issues', cost: 300, inputs: ['code', 'rules'], outputs: ['issues'] },
  { id: 'api', name: 'API Tester', icon: '🧪', cat: 'development', desc: 'Test API endpoints', cost: 50, inputs: ['endpoint', 'method'], outputs: ['response'] },
  { id: 'deploy', name: 'Deployment Manager', icon: '🚀', cat: 'development', desc: 'Manage deployments', cost: 300, inputs: ['env', 'version'], outputs: ['status'] },
  // Marketing
  { id: 'social', name: 'Social Poster', icon: '📱', cat: 'marketing', desc: 'Post to social media', cost: 100, inputs: ['platform', 'content'], outputs: ['postId'] },
  { id: 'hashtag', name: 'Hashtag Generator', icon: '#️⃣', cat: 'marketing', desc: 'Generate hashtags', cost: 50, inputs: ['content', 'count'], outputs: ['hashtags'] },
  { id: 'campaign', name: 'Campaign Tracker', icon: '📈', cat: 'marketing', desc: 'Track campaigns', cost: 150, inputs: ['campaignId', 'metrics'], outputs: ['data'] },
  { id: 'lead', name: 'Lead Scorer', icon: '🎯', cat: 'marketing', desc: 'Score leads', cost: 200, inputs: ['leadData', 'criteria'], outputs: ['score'] },
  // Integrations
  { id: 'gdrive', name: 'Google Drive', icon: '📁', cat: 'integration', desc: 'Google Drive ops', cost: 80, inputs: ['action', 'fileId'], outputs: ['result'] },
  { id: 'notion', name: 'Notion', icon: '📓', cat: 'integration', desc: 'Notion integration', cost: 100, inputs: ['action', 'pageId'], outputs: ['result'] },
  { id: 'hubspot', name: 'HubSpot', icon: '🧲', cat: 'integration', desc: 'HubSpot CRM', cost: 150, inputs: ['action', 'data'], outputs: ['result'] },
  { id: 'stripe', name: 'Stripe', icon: '💳', cat: 'integration', desc: 'Stripe payments', cost: 100, inputs: ['action', 'data'], outputs: ['result'] },
  // AI
  { id: 'sentiment', name: 'Sentiment Analyzer', icon: '😊', cat: 'ai', desc: 'Analyze sentiment', cost: 100, inputs: ['text'], outputs: ['sentiment', 'score'] },
  { id: 'entity', name: 'Entity Extractor', icon: '🏷️', cat: 'ai', desc: 'Extract entities', cost: 150, inputs: ['text', 'types'], outputs: ['entities'] },
  { id: 'chatbot', name: 'Chatbot Engine', icon: '🤖', cat: 'ai', desc: 'Conversational AI', cost: 300, inputs: ['message', 'context'], outputs: ['response'] },
  { id: 'predict', name: 'Prediction Model', icon: '🔮', cat: 'ai', desc: 'Make predictions', cost: 400, inputs: ['data', 'model'], outputs: ['prediction'] },
  // Utilities
  { id: 'timer', name: 'Timer', icon: '⏱️', cat: 'utilities', desc: 'Set timers', cost: 10, inputs: ['duration'], outputs: ['status'] },
  { id: 'convert', name: 'File Converter', icon: '🔄', cat: 'utilities', desc: 'Convert files', cost: 100, inputs: ['file', 'format'], outputs: ['convertedFile'] },
  { id: 'qr', name: 'QR Generator', icon: '📱', cat: 'utilities', desc: 'Generate QR codes', cost: 20, inputs: ['data'], outputs: ['qrUrl'] },
  { id: 'scraper', name: 'Web Scraper', icon: '🕷️', cat: 'utilities', desc: 'Scrape web content', cost: 150, inputs: ['url', 'selectors'], outputs: ['data'] },
];

export default function ToolboxDemo() {
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [notification, setNotification] = useState(null);

  const notify = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 2500); };

  const filtered = useMemo(() => TOOLS.filter(t => {
    const matchCat = activeCat === 'all' || t.cat === activeCat;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [activeCat, search]);

  const stats = useMemo(() => ({
    total: TOOLS.length,
    assigned: assigned.length,
    totalCost: assigned.reduce((s, id) => s + (TOOLS.find(t => t.id === id)?.cost || 0), 0)
  }), [assigned]);

  const toggleAssign = (toolId) => {
    if (assigned.includes(toolId)) {
      setAssigned(prev => prev.filter(id => id !== toolId));
      notify('🗑️ Tool removed');
    } else {
      setAssigned(prev => [...prev, toolId]);
      notify('✅ Tool added!');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff', fontFamily: 'system-ui' }}>
      {notification && (
        <div style={{ position: 'fixed', top: 20, right: 20, padding: '12px 24px', background: '#10b981', borderRadius: 10, zIndex: 100, animation: 'fadeIn 0.3s' }}>{notification}</div>
      )}
      
      {/* Header */}
      <header style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '2.5rem' }}>🧰</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>ROADY Toolbox</h1>
            <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>{stats.total} tools available</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ padding: '10px 20px', background: 'rgba(99,102,241,0.2)', borderRadius: 10 }}>
            <span style={{ color: '#a5b4fc' }}>🔧 {stats.assigned} assigned</span>
          </div>
          <div style={{ padding: '10px 20px', background: 'rgba(245,158,11,0.2)', borderRadius: 10 }}>
            <span style={{ color: '#fbbf24' }}>🪙 {stats.totalCost} tokens/run</span>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        {/* Sidebar */}
        <aside style={{ width: 220, background: 'rgba(0,0,0,0.2)', borderRight: '1px solid rgba(255,255,255,0.08)', padding: 16, overflowY: 'auto' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
              <span>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none' }} />
            </div>
          </div>
          
          <button onClick={() => setActiveCat('all')} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', background: activeCat === 'all' ? '#6366f1' : 'transparent', border: 'none', borderRadius: 10, color: activeCat === 'all' ? '#fff' : '#888', cursor: 'pointer', marginBottom: 6, textAlign: 'left' }}>
            <span>📚</span><span style={{ flex: 1 }}>All Tools</span><span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 10, fontSize: '0.75rem' }}>{TOOLS.length}</span>
          </button>
          
          {Object.entries(CATEGORIES).map(([id, cat]) => {
            const count = TOOLS.filter(t => t.cat === id).length;
            return (
              <button key={id} onClick={() => setActiveCat(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', background: activeCat === id ? cat.color : 'transparent', border: 'none', borderRadius: 10, color: activeCat === id ? '#fff' : '#888', cursor: 'pointer', marginBottom: 6, textAlign: 'left' }}>
                <span>{cat.icon}</span><span style={{ flex: 1, fontSize: '0.9rem' }}>{cat.name}</span><span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 10, fontSize: '0.75rem' }}>{count}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Grid */}
        <main style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {filtered.map(tool => {
              const cat = CATEGORIES[tool.cat];
              const isAssigned = assigned.includes(tool.id);
              const isSelected = selected?.id === tool.id;
              return (
                <div key={tool.id} onClick={() => setSelected(tool)} style={{ padding: 18, background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', border: `2px solid ${isSelected ? '#6366f1' : isAssigned ? '#10b981' : 'rgba(