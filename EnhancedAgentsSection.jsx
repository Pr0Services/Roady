/*
╔══════════════════════════════════════════════════════════════════════════════╗
║   🤖 ENHANCED AGENTS SECTION                                                 ║
║   With Advanced Agent Creator Integration                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import React, { useState } from 'react';

// Cette section remplace l'ancienne AgentsSection dans App.jsx
// Elle inclut le bouton "Create Custom Agent" et gère mieux l'affichage

const EnhancedAgentsSection = ({ 
  agents, 
  templates, 
  onHireAgent,        // Ouvre le creator avec un template
  onCreateFromScratch, // Ouvre le creator vide
  onEditAgent,         // Ouvre le creator avec un agent existant
  onFireAgent,         // Supprime un agent
  formatCurrency       // Fonction de formatage
}) => {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  
  // Extraire les départements uniques
  const departments = ['all', ...new Set(templates.map(t => t.department).filter(Boolean))];
  
  // Filtrer les templates
  const filteredTemplates = templates.filter(template => {
    const matchesDept = selectedDepartment === 'all' || template.department === selectedDepartment;
    const matchesSearch = !searchQuery || 
      template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });
  
  // Filtrer les agents hired
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = !searchQuery ||
      agent.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="agents-section">
      {/* Header */}
      <div className="section-header-large">
        <div>
          <h1>🤖 Agents & Teams</h1>
          <p>Build your AI workforce with specialized agents</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-create-custom"
            onClick={onCreateFromScratch}
          >
            ✨ Create Custom Agent
          </button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            ▦
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            ☰
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            📦 Agent Templates ({filteredTemplates.length})
          </button>
          <button 
            className={`tab ${activeTab === 'hired' ? 'active' : ''}`}
            onClick={() => setActiveTab('hired')}
          >
            🤖 My Agents ({agents.length})
          </button>
        </div>
      </div>
      
      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <>
          {/* Department Filter */}
          <div className="filter-bar">
            <span className="filter-label">Department:</span>
            <div className="filter-chips">
              {departments.map(dept => (
                <button 
                  key={dept}
                  className={`filter-chip ${selectedDepartment === dept ? 'active' : ''}`}
                  onClick={() => setSelectedDepartment(dept)}
                >
                  {dept === 'all' ? '🌐 All' : dept}
                </button>
              ))}
            </div>
          </div>
          
          {/* Templates Grid */}
          <div className={`agents-${viewMode}`}>
            {filteredTemplates.length === 0 ? (
              <div className="empty-state">
                <p>No templates found</p>
              </div>
            ) : (
              filteredTemplates.map(template => (
                <div key={template.id} className="agent-card hover-lift">
                  <div className="agent-card-header">
                    <div className="agent-avatar">
                      {template.icon || '🤖'}
                    </div>
                    <div className="agent-level">
                      {'⭐'.repeat(template.level || 3)}
                    </div>
                  </div>
                  
                  <h3 className="agent-name">{template.name}</h3>
                  <p className="agent-role">{template.role}</p>
                  
                  <div className="agent-department-badge">
                    {template.department}
                  </div>
                  
                  <p className="agent-description">
                    {template.description?.substring(0, 100)}
                    {template.description?.length > 100 ? '...' : ''}
                  </p>
                  
                  {/* Skills Preview */}
                  {template.skills && (
                    <div className="agent-skills-preview">
                      {(typeof template.skills === 'string' 
                        ? template.skills.split(',') 
                        : template.skills
                      ).slice(0, 3).map((skill, i) => (
                        <span key={i} className="skill-mini">{skill.trim()}</span>
                      ))}
                      {(typeof template.skills === 'string' 
                        ? template.skills.split(',').length 
                        : template.skills.length) > 3 && (
                        <span className="skill-more">+{(typeof template.skills === 'string' 
                          ? template.skills.split(',').length 
                          : template.skills.length) - 3}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="agent-footer">
                    <span className="agent-cost">
                      {formatCurrency ? formatCurrency(template.cost_per_request || template.cost || 0) : `$${template.cost_per_request || template.cost || 0}`}/req
                    </span>
                    <button 
                      className="btn-hire"
                      onClick={() => onHireAgent(template)}
                    >
                      ➕ Hire & Customize
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
      
      {/* My Agents Tab */}
      {activeTab === 'hired' && (
        <div className={`agents-${viewMode}`}>
          {filteredAgents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🤖</div>
              <h3>No agents hired yet</h3>
              <p>Browse templates or create a custom agent to get started</p>
              <div className="empty-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setActiveTab('templates')}
                >
                  Browse Templates
                </button>
                <button 
                  className="btn-primary"
                  onClick={onCreateFromScratch}
                >
                  ✨ Create Custom
                </button>
              </div>
            </div>
          ) : (
            filteredAgents.map(agent => (
              <div key={agent.id} className="agent-card hired hover-lift">
                <div className="agent-card-header">
                  <div className="agent-avatar">
                    {agent.template?.icon || agent.avatar || '🤖'}
                  </div>
                  <div className={`agent-status ${agent.status || 'available'}`}>
                    {agent.status === 'busy' ? '🔴 Busy' : '🟢 Available'}
                  </div>
                </div>
                
                <h3 className="agent-name">{agent.name}</h3>
                <p className="agent-role">
                  {agent.template?.role || agent.role || 'Agent'}
                </p>
                
                {agent.catchphrase && (
                  <p className="agent-catchphrase">"{agent.catchphrase}"</p>
                )}
                
                <div className="agent-stats">
                  <div className="stat">
                    <span className="stat-value">{agent.total_requests || 0}</span>
                    <span className="stat-label">Requests</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{formatCurrency ? formatCurrency(agent.total_cost || 0) : `$${agent.total_cost || 0}`}</span>
                    <span className="stat-label">Total Cost</span>
                  </div>
                </div>
                
                <div className="agent-actions">
                  <button 
                    className="btn-action btn-edit"
                    onClick={() => onEditAgent && onEditAgent(agent)}
                    title="Edit Agent"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-action btn-chat"
                    title="Chat with Agent"
                  >
                    💬
                  </button>
                  <button 
                    className="btn-action btn-fire"
                    onClick={() => onFireAgent && onFireAgent(agent.id)}
                    title="Remove Agent"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedAgentsSection;
