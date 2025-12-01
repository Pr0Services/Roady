/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🤖 ROADY - ADVANCED AGENT CREATOR                                          ║
║   Complete agent creation/editing interface                                  ║
║                                                                              ║
║   Features:                                                                  ║
║   • Full customization (name, role, avatar, department)                     ║
║   • System prompt editing                                                    ║
║   • API management (suggested, connected, replaceable)                      ║
║   • Skills management                                                        ║
║   • Live preview                                                             ║
║   • Cost calculation                                                         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import React, { useState, useEffect } from 'react';

// ============================================================================
// 📦 AVAILABLE APIS REGISTRY
// ============================================================================

const AVAILABLE_APIS = {
  // Video Generation
  sora: { name: "Sora", icon: "🎬", category: "Video Gen", cost: 0.02, description: "OpenAI video generation" },
  runway: { name: "Runway ML", icon: "🎥", category: "Video Gen", cost: 0.015, description: "Gen-3 video + editing" },
  pika: { name: "Pika Labs", icon: "🎞️", category: "Video Gen", cost: 0.01, description: "Creative video AI" },
  heygen: { name: "HeyGen", icon: "🗣️", category: "Avatar", cost: 0.02, description: "AI avatars with lip-sync" },
  luma: { name: "Luma AI", icon: "🌙", category: "Video Gen", cost: 0.015, description: "Dream Machine" },
  
  // Music & Audio
  suno: { name: "Suno AI", icon: "🎵", category: "Music", cost: 0.01, description: "Full songs with vocals" },
  udio: { name: "Udio", icon: "🎶", category: "Music", cost: 0.01, description: "High-quality music" },
  elevenlabs: { name: "ElevenLabs", icon: "🗣️", category: "Voice", cost: 0.015, description: "Realistic AI voices" },
  mubert: { name: "Mubert", icon: "🎹", category: "Music", cost: 0.005, description: "Royalty-free music" },
  
  // Image Generation
  midjourney: { name: "Midjourney", icon: "🎨", category: "Image", cost: 0.02, description: "Artistic images" },
  dall_e: { name: "DALL-E 3", icon: "🖼️", category: "Image", cost: 0.02, description: "OpenAI images" },
  stable_diffusion: { name: "Stable Diffusion", icon: "🌀", category: "Image", cost: 0.005, description: "Open-source images" },
  leonardo: { name: "Leonardo.AI", icon: "🦁", category: "Image", cost: 0.01, description: "Game assets" },
  ideogram: { name: "Ideogram", icon: "✏️", category: "Image", cost: 0.01, description: "Text in images" },
  
  // LLM
  openai: { name: "OpenAI GPT-4", icon: "🧠", category: "LLM", cost: 0.03, description: "ChatGPT API" },
  anthropic: { name: "Claude", icon: "🤖", category: "LLM", cost: 0.025, description: "Anthropic Claude" },
  
  // YouTube & Social
  youtube_api: { name: "YouTube API", icon: "📺", category: "Social", cost: 0.001, description: "YouTube management" },
  vidiq: { name: "VidIQ", icon: "📈", category: "YouTube", cost: 0.005, description: "YouTube SEO" },
  tubebuddy: { name: "TubeBuddy", icon: "🤝", category: "YouTube", cost: 0.005, description: "YouTube tools" },
  
  // Storage & Tools
  google_drive: { name: "Google Drive", icon: "📁", category: "Storage", cost: 0.001, description: "Cloud storage" },
  notion: { name: "Notion", icon: "📝", category: "Organization", cost: 0.002, description: "Wiki & Database" },
  zapier: { name: "Zapier", icon: "⚡", category: "Automation", cost: 0.005, description: "Workflow automation" },
};

// ============================================================================
// 🏢 DEPARTMENTS
// ============================================================================

const DEPARTMENTS = [
  { id: "general", name: "🏢 General", color: "#6B7280" },
  { id: "creative", name: "🎨 Creative", color: "#EC4899" },
  { id: "marketing", name: "📣 Marketing", color: "#F59E0B" },
  { id: "development", name: "💻 Development", color: "#3B82F6" },
  { id: "data", name: "📊 Data & Analytics", color: "#10B981" },
  { id: "content", name: "✍️ Content", color: "#8B5CF6" },
  { id: "video", name: "🎬 Video Production", color: "#EF4444" },
  { id: "music", name: "🎵 Music & Audio", color: "#06B6D4" },
  { id: "social", name: "🌐 Social Media", color: "#6366F1" },
  { id: "support", name: "💬 Support", color: "#84CC16" },
];

// ============================================================================
// 😀 EMOJI PICKER
// ============================================================================

const AGENT_EMOJIS = [
  "🤖", "👨‍💼", "👩‍💼", "🧑‍💻", "👨‍🎨", "👩‍🎨", "🎬", "🎵", "🎨", "📊",
  "📝", "💡", "🚀", "⚡", "🔥", "💎", "🌟", "✨", "🎯", "🏆",
  "📸", "🎥", "🎤", "🎧", "🎹", "🎸", "📺", "📱", "💻", "🖥️",
  "📈", "📉", "💰", "💵", "🏦", "📣", "📢", "🔔", "💬", "💭",
  "📁", "📂", "🗂️", "📋", "📌", "🔧", "⚙️", "🛠️", "🔌", "🔗",
];

// ============================================================================
// 🎯 SKILL SUGGESTIONS
// ============================================================================

const SKILL_SUGGESTIONS = [
  "Writing", "Coding", "Design", "Video Editing", "Music Production",
  "SEO", "Marketing", "Analytics", "Social Media", "Customer Support",
  "Research", "Translation", "Voice Over", "Animation", "3D Modeling",
  "Copywriting", "Email Marketing", "Data Analysis", "Project Management",
  "Content Strategy", "Brand Design", "UI/UX", "Photography", "Podcasting",
];

// ============================================================================
// 🤖 AGENT CREATOR COMPONENT
// ============================================================================

const AgentCreator = ({ 
  isOpen, 
  onClose, 
  onSave, 
  template = null,  // If editing from template
  existingAgent = null,  // If editing existing agent
  connectedApis = {}  // User's connected APIs with keys
}) => {
  
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────
  
  const [agent, setAgent] = useState({
    name: "",
    role: "",
    avatar: "🤖",
    department: "general",
    personality: "",
    systemPrompt: "",
    skills: [],
    apis: [],
    catchphrase: "",
    level: 3,
  });
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showApiSelector, setShowApiSelector] = useState(false);
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [activeTab, setActiveTab] = useState("basic"); // basic, personality, apis, preview
  
  // ─────────────────────────────────────────────────────────────────────────
  // Initialize from template or existing agent
  // ─────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (template) {
      setAgent({
        name: template.name || "",
        role: template.role || "",
        avatar: template.icon || template.avatar || "🤖",
        department: template.department || "general",
        personality: template.personality || "",
        systemPrompt: template.system_prompt || template.systemPrompt || "",
        skills: template.skills ? (typeof template.skills === 'string' ? template.skills.split(',') : template.skills) : [],
        apis: template.compatible_apis || template.apis || [],
        catchphrase: template.catchphrase || "",
        level: template.level || 3,
      });
    } else if (existingAgent) {
      setAgent({
        ...existingAgent,
        skills: existingAgent.skills || [],
        apis: existingAgent.apis || [],
      });
    }
  }, [template, existingAgent]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Calculate cost based on selected APIs
  // ─────────────────────────────────────────────────────────────────────────
  
  const calculateCost = () => {
    let baseCost = 0.01;
    agent.apis.forEach(apiId => {
      const api = AVAILABLE_APIS[apiId];
      if (api) baseCost += api.cost;
    });
    return Math.round(baseCost * 1000) / 1000;
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleChange = (field, value) => {
    setAgent(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddApi = (apiId) => {
    if (!agent.apis.includes(apiId)) {
      setAgent(prev => ({ ...prev, apis: [...prev.apis, apiId] }));
    }
    setShowApiSelector(false);
  };
  
  const handleRemoveApi = (apiId) => {
    setAgent(prev => ({ ...prev, apis: prev.apis.filter(a => a !== apiId) }));
  };
  
  const handleReplaceApi = (oldApiId, newApiId) => {
    setAgent(prev => ({
      ...prev,
      apis: prev.apis.map(a => a === oldApiId ? newApiId : a)
    }));
  };
  
  const handleAddSkill = (skill) => {
    const skillToAdd = skill || newSkill.trim();
    if (skillToAdd && !agent.skills.includes(skillToAdd)) {
      setAgent(prev => ({ ...prev, skills: [...prev.skills, skillToAdd] }));
      setNewSkill("");
    }
    setShowSkillInput(false);
  };
  
  const handleRemoveSkill = (skill) => {
    setAgent(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };
  
  const handleSave = () => {
    const agentToSave = {
      ...agent,
      cost_per_request: calculateCost(),
      skills: agent.skills,
      compatible_apis: agent.apis,
    };
    onSave(agentToSave);
    onClose();
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  
  if (!isOpen) return null;
  
  return (
    <div className="agent-creator-overlay">
      <div className="agent-creator-modal">
        
        {/* Header */}
        <div className="agent-creator-header">
          <h2>{existingAgent ? "✏️ Modifier Agent" : template ? "🤖 Créer depuis Template" : "🤖 Créer un Agent"}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        {/* Tabs */}
        <div className="agent-creator-tabs">
          <button 
            className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            📋 Base
          </button>
          <button 
            className={`tab ${activeTab === 'personality' ? 'active' : ''}`}
            onClick={() => setActiveTab('personality')}
          >
            🧠 Personnalité
          </button>
          <button 
            className={`tab ${activeTab === 'apis' ? 'active' : ''}`}
            onClick={() => setActiveTab('apis')}
          >
            🔌 APIs
          </button>
          <button 
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            👁️ Preview
          </button>
        </div>
        
        {/* Content */}
        <div className="agent-creator-content">
          
          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB: Basic Info */}
          {/* ══════════════════════════════════════════════════════════════ */}
          
          {activeTab === 'basic' && (
            <div className="tab-content">
              
              {/* Avatar & Name Row */}
              <div className="form-row avatar-name-row">
                <div className="avatar-picker">
                  <label>Avatar</label>
                  <button 
                    className="avatar-button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    {agent.avatar}
                  </button>
                  {showEmojiPicker && (
                    <div className="emoji-picker">
                      {AGENT_EMOJIS.map(emoji => (
                        <button 
                          key={emoji}
                          className="emoji-option"
                          onClick={() => {
                            handleChange('avatar', emoji);
                            setShowEmojiPicker(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="form-field flex-1">
                  <label>Nom de l'agent</label>
                  <input
                    type="text"
                    value={agent.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ex: Max Marketing"
                  />
                </div>
              </div>
              
              {/* Role */}
              <div className="form-field">
                <label>Rôle / Titre</label>
                <input
                  type="text"
                  value={agent.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  placeholder="Ex: Marketing Specialist"
                />
              </div>
              
              {/* Department */}
              <div className="form-field">
                <label>Département</label>
                <select
                  value={agent.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Level */}
              <div className="form-field">
                <label>Niveau d'expertise: {agent.level}</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={agent.level}
                  onChange={(e) => handleChange('level', parseInt(e.target.value))}
                />
                <div className="level-labels">
                  <span>Junior</span>
                  <span>Mid</span>
                  <span>Senior</span>
                  <span>Expert</span>
                  <span>Master</span>
                </div>
              </div>
              
              {/* Catchphrase */}
              <div className="form-field">
                <label>Catchphrase / Citation</label>
                <input
                  type="text"
                  value={agent.catchphrase}
                  onChange={(e) => handleChange('catchphrase', e.target.value)}
                  placeholder="Ex: Let's make your brand unforgettable!"
                />
              </div>
              
              {/* Skills */}
              <div className="form-field">
                <label>Skills</label>
                <div className="skills-container">
                  {agent.skills.map(skill => (
                    <span key={skill} className="skill-tag">
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)}>✕</button>
                    </span>
                  ))}
                  <button 
                    className="add-skill-btn"
                    onClick={() => setShowSkillInput(true)}
                  >
                    + Ajouter
                  </button>
                </div>
                
                {showSkillInput && (
                  <div className="skill-input-container">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Nouveau skill..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    />
                    <div className="skill-suggestions">
                      {SKILL_SUGGESTIONS.filter(s => !agent.skills.includes(s)).slice(0, 8).map(skill => (
                        <button 
                          key={skill}
                          onClick={() => handleAddSkill(skill)}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          )}
          
          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB: Personality */}
          {/* ══════════════════════════════════════════════════════════════ */}
          
          {activeTab === 'personality' && (
            <div className="tab-content">
              
              <div className="form-field">
                <label>Personnalité (description courte)</label>
                <input
                  type="text"
                  value={agent.personality}
                  onChange={(e) => handleChange('personality', e.target.value)}
                  placeholder="Ex: Créatif, énergique, orienté résultats"
                />
              </div>
              
              <div className="form-field">
                <label>
                  System Prompt (Instructions détaillées)
                  <span className="label-hint">Définit comment l'agent se comporte et répond</span>
                </label>
                <textarea
                  value={agent.systemPrompt}
                  onChange={(e) => handleChange('systemPrompt', e.target.value)}
                  placeholder={`Tu es ${agent.name || '[Nom]'}, un ${agent.role || '[Rôle]'} expert.

Ton style de communication:
- ...

Tes responsabilités:
- ...

Tu dois toujours:
- ...

Tu ne dois jamais:
- ...`}
                  rows={15}
                />
              </div>
              
              <div className="prompt-tips">
                <h4>💡 Conseils pour un bon System Prompt:</h4>
                <ul>
                  <li>Définis clairement le rôle et l'expertise</li>
                  <li>Décris le ton et le style de communication</li>
                  <li>Liste les responsabilités principales</li>
                  <li>Ajoute des contraintes (ce qu'il ne doit PAS faire)</li>
                  <li>Inclus des exemples si possible</li>
                </ul>
              </div>
              
            </div>
          )}
          
          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB: APIs */}
          {/* ══════════════════════════════════════════════════════════════ */}
          
          {activeTab === 'apis' && (
            <div className="tab-content">
              
              <div className="apis-section">
                <h3>🔌 APIs Connectées</h3>
                <p className="section-desc">
                  Sélectionne les APIs que cet agent peut utiliser. Le coût par requête sera calculé automatiquement.
                </p>
                
                {/* Connected APIs */}
                <div className="connected-apis">
                  {agent.apis.length === 0 ? (
                    <div className="no-apis">
                      <p>Aucune API sélectionnée</p>
                    </div>
                  ) : (
                    agent.apis.map(apiId => {
                      const api = AVAILABLE_APIS[apiId];
                      const isConnected = connectedApis[apiId];
                      
                      if (!api) return null;
                      
                      return (
                        <div key={apiId} className={`api-card ${isConnected ? 'connected' : 'not-connected'}`}>
                          <div className="api-icon">{api.icon}</div>
                          <div className="api-info">
                            <div className="api-name">{api.name}</div>
                            <div className="api-category">{api.category}</div>
                          </div>
                          <div className="api-status">
                            {isConnected ? (
                              <span className="status-badge connected">✓ Connecté</span>
                            ) : (
                              <span className="status-badge not-connected">⚠ Non connecté</span>
                            )}
                          </div>
                          <div className="api-cost">+${api.cost}</div>
                          <div className="api-actions">
                            <button 
                              className="btn-replace"
                              onClick={() => {
                                // TODO: Show replacement picker
                              }}
                              title="Remplacer par une autre API"
                            >
                              🔄
                            </button>
                            <button 
                              className="btn-remove"
                              onClick={() => handleRemoveApi(apiId)}
                              title="Retirer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* Add API Button */}
                <button 
                  className="add-api-btn"
                  onClick={() => setShowApiSelector(true)}
                >
                  + Ajouter une API
                </button>
                
                {/* API Selector Modal */}
                {showApiSelector && (
                  <div className="api-selector">
                    <div className="api-selector-header">
                      <h4>Sélectionner une API</h4>
                      <button onClick={() => setShowApiSelector(false)}>✕</button>
                    </div>
                    <div className="api-grid">
                      {Object.entries(AVAILABLE_APIS).map(([id, api]) => {
                        const isSelected = agent.apis.includes(id);
                        const isConnected = connectedApis[id];
                        
                        return (
                          <button
                            key={id}
                            className={`api-option ${isSelected ? 'selected' : ''} ${isConnected ? 'connected' : ''}`}
                            onClick={() => !isSelected && handleAddApi(id)}
                            disabled={isSelected}
                          >
                            <span className="api-option-icon">{api.icon}</span>
                            <span className="api-option-name">{api.name}</span>
                            <span className="api-option-category">{api.category}</span>
                            {isConnected && <span className="api-option-connected">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Cost Summary */}
                <div className="cost-summary">
                  <div className="cost-label">Coût estimé par requête:</div>
                  <div className="cost-value">${calculateCost()}</div>
                </div>
                
              </div>
              
            </div>
          )}
          
          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB: Preview */}
          {/* ══════════════════════════════════════════════════════════════ */}
          
          {activeTab === 'preview' && (
            <div className="tab-content">
              
              <div className="agent-preview-card">
                <div className="preview-header">
                  <div className="preview-avatar">{agent.avatar}</div>
                  <div className="preview-title">
                    <h3>{agent.name || "Nom de l'agent"}</h3>
                    <p className="preview-role">{agent.role || "Rôle"}</p>
                  </div>
                  <div className="preview-level">
                    {"⭐".repeat(agent.level)}
                  </div>
                </div>
                
                <div className="preview-department">
                  {DEPARTMENTS.find(d => d.id === agent.department)?.name || agent.department}
                </div>
                
                {agent.catchphrase && (
                  <div className="preview-catchphrase">
                    "{agent.catchphrase}"
                  </div>
                )}
                
                {agent.personality && (
                  <div className="preview-personality">
                    <strong>Personnalité:</strong> {agent.personality}
                  </div>
                )}
                
                <div className="preview-skills">
                  <strong>Skills:</strong>
                  <div className="preview-skills-list">
                    {agent.skills.length > 0 ? (
                      agent.skills.map(skill => (
                        <span key={skill} className="preview-skill">{skill}</span>
                      ))
                    ) : (
                      <span className="no-skills">Aucun skill défini</span>
                    )}
                  </div>
                </div>
                
                <div className="preview-apis">
                  <strong>APIs:</strong>
                  <div className="preview-apis-list">
                    {agent.apis.length > 0 ? (
                      agent.apis.map(apiId => {
                        const api = AVAILABLE_APIS[apiId];
                        const isConnected = connectedApis[apiId];
                        return api ? (
                          <span 
                            key={apiId} 
                            className={`preview-api ${isConnected ? 'connected' : 'not-connected'}`}
                          >
                            {api.icon} {api.name}
                            {isConnected ? ' ✓' : ' ⚠'}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span className="no-apis">Aucune API</span>
                    )}
                  </div>
                </div>
                
                <div className="preview-cost">
                  <strong>Coût par requête:</strong>
                  <span className="cost-badge">${calculateCost()}</span>
                </div>
                
                {agent.systemPrompt && (
                  <div className="preview-prompt">
                    <strong>System Prompt:</strong>
                    <pre>{agent.systemPrompt.substring(0, 200)}...</pre>
                  </div>
                )}
              </div>
              
            </div>
          )}
          
        </div>
        
        {/* Footer */}
        <div className="agent-creator-footer">
          <button className="btn-cancel" onClick={onClose}>
            Annuler
          </button>
          <button 
            className="btn-save"
            onClick={handleSave}
            disabled={!agent.name || !agent.role}
          >
            💾 {existingAgent ? "Sauvegarder" : "Créer l'Agent"}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default AgentCreator;
