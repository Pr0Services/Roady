/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🏢 ROADY - BUSINESS BUILDER                                                ║
║   Visual interface to create and manage business structure                   ║
║                                                                              ║
║   Features:                                                                  ║
║   • Pre-made business templates                                              ║
║   • Visual hierarchy builder                                                 ║
║   • Drag & drop departments                                                  ║
║   • Assign agents to positions                                               ║
║   • Save & modify structure                                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import React, { useState, useEffect } from 'react';

// ============================================================================
// 📋 BUSINESS TEMPLATES
// ============================================================================

const BUSINESS_TEMPLATES = {
  startup: {
    id: 'startup',
    name: '🚀 Tech Startup',
    description: 'Lean structure for fast-moving startups',
    icon: '🚀',
    color: '#6366f1',
    structure: {
      ceo: {
        title: 'CEO / Founder',
        role: 'orchestrator',
        icon: '👔',
        children: ['cto', 'cmo', 'coo']
      },
      cto: {
        title: 'CTO',
        role: 'tech_lead',
        icon: '💻',
        children: ['dev_lead', 'devops']
      },
      cmo: {
        title: 'CMO',
        role: 'marketing_lead',
        icon: '📣',
        children: ['content', 'social', 'growth']
      },
      coo: {
        title: 'COO',
        role: 'operations_lead',
        icon: '⚙️',
        children: ['support', 'hr']
      },
      dev_lead: { title: 'Dev Lead', role: 'developer', icon: '👨‍💻', children: [] },
      devops: { title: 'DevOps', role: 'devops', icon: '🔧', children: [] },
      content: { title: 'Content Manager', role: 'content_creator', icon: '✍️', children: [] },
      social: { title: 'Social Media Manager', role: 'social_media', icon: '📱', children: [] },
      growth: { title: 'Growth Hacker', role: 'growth', icon: '📈', children: [] },
      support: { title: 'Customer Support', role: 'support', icon: '💬', children: [] },
      hr: { title: 'HR Manager', role: 'hr', icon: '👥', children: [] }
    }
  },
  
  agency: {
    id: 'agency',
    name: '🎨 Creative Agency',
    description: 'Structure for marketing/creative agencies',
    icon: '🎨',
    color: '#ec4899',
    structure: {
      director: {
        title: 'Creative Director',
        role: 'orchestrator',
        icon: '🎬',
        children: ['art_director', 'copy_director', 'account_manager']
      },
      art_director: {
        title: 'Art Director',
        role: 'art_director',
        icon: '🎨',
        children: ['designer', 'video_editor', 'motion']
      },
      copy_director: {
        title: 'Copy Director',
        role: 'copywriter_lead',
        icon: '✍️',
        children: ['copywriter', 'seo_specialist']
      },
      account_manager: {
        title: 'Account Manager',
        role: 'account_manager',
        icon: '🤝',
        children: ['project_manager']
      },
      designer: { title: 'Graphic Designer', role: 'designer', icon: '🖼️', children: [] },
      video_editor: { title: 'Video Editor', role: 'video_editor', icon: '🎥', children: [] },
      motion: { title: 'Motion Designer', role: 'motion_designer', icon: '✨', children: [] },
      copywriter: { title: 'Copywriter', role: 'copywriter', icon: '📝', children: [] },
      seo_specialist: { title: 'SEO Specialist', role: 'seo', icon: '🔍', children: [] },
      project_manager: { title: 'Project Manager', role: 'project_manager', icon: '📋', children: [] }
    }
  },
  
  ecommerce: {
    id: 'ecommerce',
    name: '🛒 E-Commerce',
    description: 'Structure for online retail businesses',
    icon: '🛒',
    color: '#10b981',
    structure: {
      ceo: {
        title: 'CEO',
        role: 'orchestrator',
        icon: '👔',
        children: ['marketing', 'operations', 'tech']
      },
      marketing: {
        title: 'Marketing Director',
        role: 'marketing_lead',
        icon: '📣',
        children: ['social_media', 'email_marketing', 'ads_manager']
      },
      operations: {
        title: 'Operations Manager',
        role: 'operations_lead',
        icon: '📦',
        children: ['inventory', 'customer_service']
      },
      tech: {
        title: 'Tech Lead',
        role: 'tech_lead',
        icon: '💻',
        children: ['web_dev', 'data_analyst']
      },
      social_media: { title: 'Social Media', role: 'social_media', icon: '📱', children: [] },
      email_marketing: { title: 'Email Marketing', role: 'email_marketing', icon: '📧', children: [] },
      ads_manager: { title: 'Ads Manager', role: 'ads_manager', icon: '🎯', children: [] },
      inventory: { title: 'Inventory Manager', role: 'inventory', icon: '📊', children: [] },
      customer_service: { title: 'Customer Service', role: 'support', icon: '💬', children: [] },
      web_dev: { title: 'Web Developer', role: 'developer', icon: '🌐', children: [] },
      data_analyst: { title: 'Data Analyst', role: 'data_analyst', icon: '📈', children: [] }
    }
  },
  
  youtube: {
    id: 'youtube',
    name: '📺 YouTube Channel',
    description: 'Structure for content creators',
    icon: '📺',
    color: '#ef4444',
    structure: {
      creator: {
        title: 'Creator / Host',
        role: 'orchestrator',
        icon: '🎤',
        children: ['production', 'growth', 'community']
      },
      production: {
        title: 'Production Manager',
        role: 'production_lead',
        icon: '🎬',
        children: ['video_editor', 'thumbnail', 'scriptwriter']
      },
      growth: {
        title: 'Growth Manager',
        role: 'growth_lead',
        icon: '📈',
        children: ['seo', 'social_media']
      },
      community: {
        title: 'Community Manager',
        role: 'community_lead',
        icon: '💬',
        children: ['moderator']
      },
      video_editor: { title: 'Video Editor', role: 'video_editor', icon: '🎥', children: [] },
      thumbnail: { title: 'Thumbnail Designer', role: 'designer', icon: '🖼️', children: [] },
      scriptwriter: { title: 'Scriptwriter', role: 'scriptwriter', icon: '📝', children: [] },
      seo: { title: 'SEO Specialist', role: 'seo', icon: '🔍', children: [] },
      social_media: { title: 'Social Media', role: 'social_media', icon: '📱', children: [] },
      moderator: { title: 'Moderator', role: 'moderator', icon: '🛡️', children: [] }
    }
  },
  
  restaurant: {
    id: 'restaurant',
    name: '🍽️ Restaurant',
    description: 'Structure for food service businesses',
    icon: '🍽️',
    color: '#f59e0b',
    structure: {
      owner: {
        title: 'Owner / Manager',
        role: 'orchestrator',
        icon: '👔',
        children: ['front_house', 'back_house', 'marketing']
      },
      front_house: {
        title: 'Front of House Manager',
        role: 'foh_manager',
        icon: '🤵',
        children: ['reservations', 'customer_service']
      },
      back_house: {
        title: 'Kitchen Manager',
        role: 'kitchen_manager',
        icon: '👨‍🍳',
        children: ['inventory', 'quality']
      },
      marketing: {
        title: 'Marketing Manager',
        role: 'marketing_lead',
        icon: '📣',
        children: ['social_media', 'reviews']
      },
      reservations: { title: 'Reservations', role: 'reservations', icon: '📅', children: [] },
      customer_service: { title: 'Customer Relations', role: 'support', icon: '💬', children: [] },
      inventory: { title: 'Inventory', role: 'inventory', icon: '📦', children: [] },
      quality: { title: 'Quality Control', role: 'quality', icon: '✅', children: [] },
      social_media: { title: 'Social Media', role: 'social_media', icon: '📱', children: [] },
      reviews: { title: 'Review Manager', role: 'review_manager', icon: '⭐', children: [] }
    }
  },
  
  custom: {
    id: 'custom',
    name: '⚡ Custom',
    description: 'Build from scratch',
    icon: '⚡',
    color: '#8b5cf6',
    structure: {
      leader: {
        title: 'Leader',
        role: 'orchestrator',
        icon: '👔',
        children: []
      }
    }
  }
};

// ============================================================================
// 🏢 BUSINESS BUILDER COMPONENT
// ============================================================================

const BusinessBuilder = ({
  isOpen,
  onClose,
  onSave,
  existingBusiness = null,
  availableAgents = []
}) => {
  
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────
  
  const [step, setStep] = useState(existingBusiness ? 'edit' : 'template'); // template, customize, edit
  const [businessName, setBusinessName] = useState(existingBusiness?.name || '');
  const [businessIndustry, setBusinessIndustry] = useState(existingBusiness?.industry || '');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [structure, setStructure] = useState(existingBusiness?.structure || {});
  const [assignedAgents, setAssignedAgents] = useState(existingBusiness?.assignedAgents || {});
  const [officeName, setOfficeName] = useState(existingBusiness?.officeName || 'Main Office');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Initialize from existing business
  // ─────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (existingBusiness) {
      setBusinessName(existingBusiness.name);
      setBusinessIndustry(existingBusiness.industry || '');
      setStructure(existingBusiness.structure || {});
      setAssignedAgents(existingBusiness.assignedAgents || {});
      setOfficeName(existingBusiness.officeName || 'Main Office');
      setStep('edit');
    }
  }, [existingBusiness]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleSelectTemplate = (templateId) => {
    const template = BUSINESS_TEMPLATES[templateId];
    setSelectedTemplate(template);
    setStructure(JSON.parse(JSON.stringify(template.structure))); // Deep copy
    setBusinessIndustry(template.name);
    setStep('customize');
  };
  
  const handleAddPosition = (parentId = null) => {
    const newId = `position_${Date.now()}`;
    const newPosition = {
      title: 'New Position',
      role: 'general',
      icon: '👤',
      children: []
    };
    
    setStructure(prev => {
      const updated = { ...prev, [newId]: newPosition };
      
      if (parentId && updated[parentId]) {
        updated[parentId] = {
          ...updated[parentId],
          children: [...(updated[parentId].children || []), newId]
        };
      }
      
      return updated;
    });
  };
  
  const handleUpdatePosition = (positionId, updates) => {
    setStructure(prev => ({
      ...prev,
      [positionId]: { ...prev[positionId], ...updates }
    }));
  };
  
  const handleDeletePosition = (positionId) => {
    setStructure(prev => {
      const updated = { ...prev };
      
      // Remove from parent's children
      Object.keys(updated).forEach(key => {
        if (updated[key].children?.includes(positionId)) {
          updated[key] = {
            ...updated[key],
            children: updated[key].children.filter(c => c !== positionId)
          };
        }
      });
      
      // Delete the position
      delete updated[positionId];
      
      return updated;
    });
  };
  
  const handleAssignAgent = (positionId, agentId) => {
    setAssignedAgents(prev => ({
      ...prev,
      [positionId]: agentId
    }));
  };
  
  const handleSave = () => {
    const businessData = {
      name: businessName,
      industry: businessIndustry,
      officeName: officeName,
      structure: structure,
      assignedAgents: assignedAgents,
      templateId: selectedTemplate?.id || 'custom',
      createdAt: existingBusiness?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    onSave(businessData);
    onClose();
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // Render Org Chart Node
  // ─────────────────────────────────────────────────────────────────────────
  
  const renderOrgNode = (positionId, depth = 0) => {
    const position = structure[positionId];
    if (!position) return null;
    
    const assignedAgent = availableAgents.find(a => a.id === assignedAgents[positionId]);
    
    return (
      <div key={positionId} className="org-node-wrapper">
        <div className={`org-node depth-${Math.min(depth, 3)}`}>
          <div className="org-node-header">
            <span className="org-node-icon">{position.icon}</span>
            <input
              type="text"
              value={position.title}
              onChange={(e) => handleUpdatePosition(positionId, { title: e.target.value })}
              className="org-node-title"
            />
            <button 
              className="org-node-delete"
              onClick={() => handleDeletePosition(positionId)}
              title="Delete position"
            >
              ✕
            </button>
          </div>
          
          <div className="org-node-agent">
            {assignedAgent ? (
              <div className="assigned-agent">
                <span className="agent-avatar-mini">{assignedAgent.avatar || '🤖'}</span>
                <span className="agent-name-mini">{assignedAgent.name}</span>
                <button 
                  className="btn-unassign"
                  onClick={() => handleAssignAgent(positionId, null)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <select
                value=""
                onChange={(e) => handleAssignAgent(positionId, e.target.value)}
                className="agent-select"
              >
                <option value="">+ Assign Agent</option>
                {availableAgents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.avatar || '🤖'} {agent.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <button 
            className="btn-add-child"
            onClick={() => handleAddPosition(positionId)}
          >
            + Add Report
          </button>
        </div>
        
        {position.children && position.children.length > 0 && (
          <div className="org-children">
            {position.children.map(childId => renderOrgNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // Find root nodes (nodes that are not children of any other node)
  // ─────────────────────────────────────────────────────────────────────────
  
  const getRootNodes = () => {
    const allChildren = new Set();
    Object.values(structure).forEach(pos => {
      (pos.children || []).forEach(child => allChildren.add(child));
    });
    
    return Object.keys(structure).filter(id => !allChildren.has(id));
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  
  if (!isOpen) return null;
  
  return (
    <div className="business-builder-overlay">
      <div className="business-builder-modal">
        
        {/* Header */}
        <div className="builder-header">
          <h2>
            {step === 'template' && '🏢 Choose a Business Template'}
            {step === 'customize' && '⚙️ Customize Your Business'}
            {step === 'edit' && `✏️ Edit: ${businessName}`}
          </h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        {/* Content */}
        <div className="builder-content">
          
          {/* ════════════════════════════════════════════════════════════ */}
          {/* STEP 1: Template Selection */}
          {/* ════════════════════════════════════════════════════════════ */}
          
          {step === 'template' && (
            <div className="template-grid">
              {Object.values(BUSINESS_TEMPLATES).map(template => (
                <div 
                  key={template.id}
                  className="template-card"
                  style={{ '--template-color': template.color }}
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <div className="template-icon">{template.icon}</div>
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <div className="template-positions">
                    {Object.keys(template.structure).length} positions
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* ════════════════════════════════════════════════════════════ */}
          {/* STEP 2 & 3: Customize / Edit */}
          {/* ════════════════════════════════════════════════════════════ */}
          
          {(step === 'customize' || step === 'edit') && (
            <div className="customize-container">
              
              {/* Business Info */}
              <div className="business-info-form">
                <div className="form-row">
                  <div className="form-field">
                    <label>Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="My Awesome Business"
                    />
                  </div>
                  <div className="form-field">
                    <label>Industry</label>
                    <input
                      type="text"
                      value={businessIndustry}
                      onChange={(e) => setBusinessIndustry(e.target.value)}
                      placeholder="Tech, Marketing, etc."
                    />
                  </div>
                  <div className="form-field">
                    <label>🏢 Office Name</label>
                    <input
                      type="text"
                      value={officeName}
                      onChange={(e) => setOfficeName(e.target.value)}
                      placeholder="Main Office, HQ, etc."
                    />
                  </div>
                </div>
              </div>
              
              {/* Org Chart */}
              <div className="org-chart-container">
                <div className="org-chart-header">
                  <h3>📊 Organization Structure</h3>
                  <button 
                    className="btn-add-root"
                    onClick={() => handleAddPosition(null)}
                  >
                    + Add Top Position
                  </button>
                </div>
                
                <div className="org-chart">
                  {getRootNodes().map(rootId => renderOrgNode(rootId, 0))}
                </div>
              </div>
              
              {/* Stats */}
              <div className="structure-stats">
                <div className="stat">
                  <span className="stat-value">{Object.keys(structure).length}</span>
                  <span className="stat-label">Positions</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{Object.values(assignedAgents).filter(Boolean).length}</span>
                  <span className="stat-label">Agents Assigned</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{Object.keys(structure).length - Object.values(assignedAgents).filter(Boolean).length}</span>
                  <span className="stat-label">Vacant</span>
                </div>
              </div>
              
            </div>
          )}
          
        </div>
        
        {/* Footer */}
        <div className="builder-footer">
          {step === 'customize' && (
            <button className="btn-back" onClick={() => setStep('template')}>
              ← Back to Templates
            </button>
          )}
          <div className="footer-right">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            {(step === 'customize' || step === 'edit') && (
              <button 
                className="btn-save"
                onClick={handleSave}
                disabled={!businessName}
              >
                💾 {existingBusiness ? 'Save Changes' : 'Create Business'}
              </button>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default BusinessBuilder;
