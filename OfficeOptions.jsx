/*
╔══════════════════════════════════════════════════════════════════════════════╗
║   🏢 ROADY - OFFICE OPTIONS & SETTINGS                                       ║
║   Complete configuration panel for all office types                          ║
║   Customization, Permissions, Integrations, Appearance                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import React, { useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_OFFICE_SETTINGS = {
  general: {
    name: '',
    description: '',
    icon: '🏢',
    color: '#6366f1',
    visibility: 'private', // private, team, public
    timezone: 'America/Toronto',
    language: 'fr'
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    meetingReminders: true,
    taskDeadlines: true,
    agentActivity: true,
    dailyDigest: false,
    weeklyReport: true
  },
  permissions: {
    canInviteMembers: true,
    canCreateProjects: true,
    canCreateMeetings: true,
    canAssignAgents: true,
    canAccessDatabase: true,
    canExportData: true,
    canDeleteItems: false
  },
  automation: {
    autoAssignAgents: false,
    autoCreateTasks: false,
    autoScheduleMeetings: false,
    autoBackup: true,
    backupFrequency: 'daily' // hourly, daily, weekly
  },
  integrations: {
    googleDrive: { enabled: false, folderId: '' },
    github: { enabled: false, repoUrl: '' },
    slack: { enabled: false, channelId: '' },
    notion: { enabled: false, pageId: '' },
    zapier: { enabled: false, webhookUrl: '' }
  },
  appearance: {
    theme: 'dark', // dark, light, auto
    accentColor: '#6366f1',
    compactMode: false,
    showAnimations: true,
    sidebarPosition: 'left' // left, right
  },
  ai: {
    defaultModel: 'gpt-4o-mini',
    apiProvider: 'openai', // openai, anthropic
    temperature: 0.7,
    maxTokens: 2000,
    contextMemory: true,
    autoSuggestions: true
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// OFFICE OPTIONS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const OfficeOptions = ({
  isOpen,
  onClose,
  officeType = 'user',
  officeName = 'My Office',
  currentSettings = {},
  onSave,
  availableAgents = [],
  connectedIntegrations = {}
}) => {
  
  const [settings, setSettings] = useState({
    ...DEFAULT_OFFICE_SETTINGS,
    ...currentSettings,
    general: { ...DEFAULT_OFFICE_SETTINGS.general, ...currentSettings.general, name: officeName }
  });
  
  const [activeSection, setActiveSection] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // SECTIONS CONFIG
  // ─────────────────────────────────────────────────────────────────────────
  
  const sections = [
    { id: 'general', label: '⚙️ General', icon: '⚙️' },
    { id: 'notifications', label: '🔔 Notifications', icon: '🔔' },
    { id: 'permissions', label: '🔐 Permissions', icon: '🔐' },
    { id: 'automation', label: '🤖 Automation', icon: '🤖' },
    { id: 'integrations', label: '🔗 Integrations', icon: '🔗' },
    { id: 'appearance', label: '🎨 Appearance', icon: '🎨' },
    { id: 'ai', label: '🧠 AI Settings', icon: '🧠' },
    { id: 'danger', label: '⚠️ Danger Zone', icon: '⚠️' }
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  
  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const updateNestedSetting = (section, subsection, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(settings);
    setHasChanges(false);
    onClose?.();
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to default?')) {
      setSettings({ ...DEFAULT_OFFICE_SETTINGS, general: { ...DEFAULT_OFFICE_SETTINGS.general, name: officeName } });
      setHasChanges(true);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ICON PICKER
  // ─────────────────────────────────────────────────────────────────────────
  
  const officeIcons = ['🏢', '🏠', '🏪', '🏭', '🏛️', '🎯', '💼', '📊', '🚀', '⚡', '💡', '🔥', '✨', '🌟', '💎', '🎨', '🎬', '🎵', '📱', '💻', '🌐', '☁️', '🔮', '🎪'];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  
  if (!isOpen) return null;

  return (
    <div className="oo-overlay">
      <div className="oo-modal">
        
        {/* Header */}
        <div className="oo-header">
          <div className="oo-header-info">
            <span className="oo-header-icon">{settings.general.icon}</span>
            <div>
              <h2>Office Settings</h2>
              <p>{officeName}</p>
            </div>
          </div>
          <button className="oo-close" onClick={onClose}>✕</button>
        </div>

        <div className="oo-body">
          
          {/* Sidebar */}
          <nav className="oo-sidebar">
            {sections.map(section => (
              <button
                key={section.id}
                className={`oo-nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span>{section.icon}</span>
                {section.label.split(' ').slice(1).join(' ')}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="oo-content">
            
            {/* ═══════════════ GENERAL ═══════════════ */}
            {activeSection === 'general' && (
              <div className="oo-section">
                <h3>⚙️ General Settings</h3>
                
                <div className="oo-field">
                  <label>Office Name</label>
                  <input
                    type="text"
                    value={settings.general.name}
                    onChange={(e) => updateSetting('general', 'name', e.target.value)}
                    placeholder="Enter office name..."
                  />
                </div>

                <div className="oo-field">
                  <label>Description</label>
                  <textarea
                    value={settings.general.description}
                    onChange={(e) => updateSetting('general', 'description', e.target.value)}
                    placeholder="Describe this office..."
                    rows={3}
                  />
                </div>

                <div className="oo-field">
                  <label>Icon</label>
                  <div className="oo-icon-picker">
                    {officeIcons.map(icon => (
                      <button
                        key={icon}
                        className={`oo-icon-btn ${settings.general.icon === icon ? 'selected' : ''}`}
                        onClick={() => updateSetting('general', 'icon', icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="oo-field">
                  <label>Color</label>
                  <div className="oo-color-picker">
                    <input
                      type="color"
                      value={settings.general.color}
                      onChange={(e) => updateSetting('general', 'color', e.target.value)}
                    />
                    <span>{settings.general.color}</span>
                  </div>
                </div>

                <div className="oo-field">
                  <label>Visibility</label>
                  <select
                    value={settings.general.visibility}
                    onChange={(e) => updateSetting('general', 'visibility', e.target.value)}
                  >
                    <option value="private">🔒 Private - Only you</option>
                    <option value="team">👥 Team - Invited members</option>
                    <option value="public">🌐 Public - Anyone with link</option>
                  </select>
                </div>

                <div className="oo-row">
                  <div className="oo-field">
                    <label>Timezone</label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                    >
                      <option value="America/Toronto">Eastern (Toronto)</option>
                      <option value="America/New_York">Eastern (New York)</option>
                      <option value="America/Los_Angeles">Pacific (LA)</option>
                      <option value="Europe/Paris">Europe (Paris)</option>
                      <option value="Europe/London">Europe (London)</option>
                      <option value="Asia/Tokyo">Asia (Tokyo)</option>
                    </select>
                  </div>
                  <div className="oo-field">
                    <label>Language</label>
                    <select
                      value={settings.general.language}
                      onChange={(e) => updateSetting('general', 'language', e.target.value)}
                    >
                      <option value="fr">🇫🇷 Français</option>
                      <option value="en">🇬🇧 English</option>
                      <option value="es">🇪🇸 Español</option>
                      <option value="de">🇩🇪 Deutsch</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════ NOTIFICATIONS ═══════════════ */}
            {activeSection === 'notifications' && (
              <div className="oo-section">
                <h3>🔔 Notification Settings</h3>
                
                <div className="oo-toggle-group">
                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>📧 Email Notifications</span>
                      <small>Receive updates via email</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailNotifications}
                        onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>🔔 Push Notifications</span>
                      <small>Browser push notifications</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.notifications.pushNotifications}
                        onChange={(e) => updateSetting('notifications', 'pushNotifications', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>📅 Meeting Reminders</span>
                      <small>Get notified before meetings</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.notifications.meetingReminders}
                        onChange={(e) => updateSetting('notifications', 'meetingReminders', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>⏰ Task Deadlines</span>
                      <small>Alerts for upcoming deadlines</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.notifications.taskDeadlines}
                        onChange={(e) => updateSetting('notifications', 'taskDeadlines', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>🤖 Agent Activity</span>
                      <small>When agents complete tasks</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.notifications.agentActivity}
                        onChange={(e) => updateSetting('notifications', 'agentActivity', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>📊 Daily Digest</span>
                      <small>Summary of daily activity</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.notifications.dailyDigest}
                        onChange={(e) => updateSetting('notifications', 'dailyDigest', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>📈 Weekly Report</span>
                      <small>Weekly performance summary</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.notifications.weeklyReport}
                        onChange={(e) => updateSetting('notifications', 'weeklyReport', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════ PERMISSIONS ═══════════════ */}
            {activeSection === 'permissions' && (
              <div className="oo-section">
                <h3>🔐 Permissions</h3>
                <p className="oo-description">Control what members can do in this office</p>
                
                <div className="oo-toggle-group">
                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>👥 Invite Members</span>
                      <small>Allow inviting new members</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.permissions.canInviteMembers}
                        onChange={(e) => updateSetting('permissions', 'canInviteMembers', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>📁 Create Projects</span>
                      <small>Allow creating new projects</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.permissions.canCreateProjects}
                        onChange={(e) => updateSetting('permissions', 'canCreateProjects', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>📅 Create Meetings</span>
                      <small>Allow scheduling meetings</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.permissions.canCreateMeetings}
                        onChange={(e) => updateSetting('permissions', 'canCreateMeetings', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>🤖 Assign Agents</span>
                      <small>Allow assigning AI agents</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.permissions.canAssignAgents}
                        onChange={(e) => updateSetting('permissions', 'canAssignAgents', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>💾 Access Database</span>
                      <small>Allow viewing database</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.permissions.canAccessDatabase}
                        onChange={(e) => updateSetting('permissions', 'canAccessDatabase', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>📤 Export Data</span>
                      <small>Allow exporting data</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.permissions.canExportData}
                        onChange={(e) => updateSetting('permissions', 'canExportData', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item danger">
                    <div className="oo-toggle-info">
                      <span>🗑️ Delete Items</span>
                      <small>Allow permanent deletion</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.permissions.canDeleteItems}
                        onChange={(e) => updateSetting('permissions', 'canDeleteItems', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════ AUTOMATION ═══════════════ */}
            {activeSection === 'automation' && (
              <div className="oo-section">
                <h3>🤖 Automation Settings</h3>
                <p className="oo-description">Automate repetitive tasks</p>
                
                <div className="oo-toggle-group">
                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>🤖 Auto-Assign Agents</span>
                      <small>Automatically assign best-fit agents to tasks</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.automation.autoAssignAgents}
                        onChange={(e) => updateSetting('automation', 'autoAssignAgents', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>✅ Auto-Create Tasks</span>
                      <small>Create tasks from meeting notes</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.automation.autoCreateTasks}
                        onChange={(e) => updateSetting('automation', 'autoCreateTasks', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>📅 Auto-Schedule Meetings</span>
                      <small>AI suggests optimal meeting times</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.automation.autoScheduleMeetings}
                        onChange={(e) => updateSetting('automation', 'autoScheduleMeetings', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>💾 Auto-Backup</span>
                      <small>Automatically backup data</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.automation.autoBackup}
                        onChange={(e) => updateSetting('automation', 'autoBackup', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>
                </div>

                {settings.automation.autoBackup && (
                  <div className="oo-field">
                    <label>Backup Frequency</label>
                    <select
                      value={settings.automation.backupFrequency}
                      onChange={(e) => updateSetting('automation', 'backupFrequency', e.target.value)}
                    >
                      <option value="hourly">Every Hour</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════ INTEGRATIONS ═══════════════ */}
            {activeSection === 'integrations' && (
              <div className="oo-section">
                <h3>🔗 Integrations</h3>
                <p className="oo-description">Connect external services</p>
                
                <div className="oo-integrations-grid">
                  {/* Google Drive */}
                  <div className={`oo-integration-card ${settings.integrations.googleDrive.enabled ? 'enabled' : ''}`}>
                    <div className="oo-integration-header">
                      <span className="oo-integration-icon">📁</span>
                      <div>
                        <h4>Google Drive</h4>
                        <small>Sync files automatically</small>
                      </div>
                      <label className="oo-switch">
                        <input
                          type="checkbox"
                          checked={settings.integrations.googleDrive.enabled}
                          onChange={(e) => updateNestedSetting('integrations', 'googleDrive', 'enabled', e.target.checked)}
                        />
                        <span className="oo-slider"></span>
                      </label>
                    </div>
                    {settings.integrations.googleDrive.enabled && (
                      <div className="oo-integration-config">
                        <input
                          type="text"
                          placeholder="Folder ID..."
                          value={settings.integrations.googleDrive.folderId}
                          onChange={(e) => updateNestedSetting('integrations', 'googleDrive', 'folderId', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* GitHub */}
                  <div className={`oo-integration-card ${settings.integrations.github.enabled ? 'enabled' : ''}`}>
                    <div className="oo-integration-header">
                      <span className="oo-integration-icon">🐙</span>
                      <div>
                        <h4>GitHub</h4>
                        <small>Sync with repository</small>
                      </div>
                      <label className="oo-switch">
                        <input
                          type="checkbox"
                          checked={settings.integrations.github.enabled}
                          onChange={(e) => updateNestedSetting('integrations', 'github', 'enabled', e.target.checked)}
                        />
                        <span className="oo-slider"></span>
                      </label>
                    </div>
                    {settings.integrations.github.enabled && (
                      <div className="oo-integration-config">
                        <input
                          type="text"
                          placeholder="Repository URL..."
                          value={settings.integrations.github.repoUrl}
                          onChange={(e) => updateNestedSetting('integrations', 'github', 'repoUrl', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Slack */}
                  <div className={`oo-integration-card ${settings.integrations.slack.enabled ? 'enabled' : ''}`}>
                    <div className="oo-integration-header">
                      <span className="oo-integration-icon">💬</span>
                      <div>
                        <h4>Slack</h4>
                        <small>Send notifications</small>
                      </div>
                      <label className="oo-switch">
                        <input
                          type="checkbox"
                          checked={settings.integrations.slack.enabled}
                          onChange={(e) => updateNestedSetting('integrations', 'slack', 'enabled', e.target.checked)}
                        />
                        <span className="oo-slider"></span>
                      </label>
                    </div>
                    {settings.integrations.slack.enabled && (
                      <div className="oo-integration-config">
                        <input
                          type="text"
                          placeholder="Channel ID..."
                          value={settings.integrations.slack.channelId}
                          onChange={(e) => updateNestedSetting('integrations', 'slack', 'channelId', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Notion */}
                  <div className={`oo-integration-card ${settings.integrations.notion.enabled ? 'enabled' : ''}`}>
                    <div className="oo-integration-header">
                      <span className="oo-integration-icon">📝</span>
                      <div>
                        <h4>Notion</h4>
                        <small>Sync with workspace</small>
                      </div>
                      <label className="oo-switch">
                        <input
                          type="checkbox"
                          checked={settings.integrations.notion.enabled}
                          onChange={(e) => updateNestedSetting('integrations', 'notion', 'enabled', e.target.checked)}
                        />
                        <span className="oo-slider"></span>
                      </label>
                    </div>
                    {settings.integrations.notion.enabled && (
                      <div className="oo-integration-config">
                        <input
                          type="text"
                          placeholder="Page ID..."
                          value={settings.integrations.notion.pageId}
                          onChange={(e) => updateNestedSetting('integrations', 'notion', 'pageId', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Zapier */}
                  <div className={`oo-integration-card ${settings.integrations.zapier.enabled ? 'enabled' : ''}`}>
                    <div className="oo-integration-header">
                      <span className="oo-integration-icon">⚡</span>
                      <div>
                        <h4>Zapier</h4>
                        <small>Custom automations</small>
                      </div>
                      <label className="oo-switch">
                        <input
                          type="checkbox"
                          checked={settings.integrations.zapier.enabled}
                          onChange={(e) => updateNestedSetting('integrations', 'zapier', 'enabled', e.target.checked)}
                        />
                        <span className="oo-slider"></span>
                      </label>
                    </div>
                    {settings.integrations.zapier.enabled && (
                      <div className="oo-integration-config">
                        <input
                          type="text"
                          placeholder="Webhook URL..."
                          value={settings.integrations.zapier.webhookUrl}
                          onChange={(e) => updateNestedSetting('integrations', 'zapier', 'webhookUrl', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════ APPEARANCE ═══════════════ */}
            {activeSection === 'appearance' && (
              <div className="oo-section">
                <h3>🎨 Appearance</h3>
                
                <div className="oo-field">
                  <label>Theme</label>
                  <div className="oo-theme-picker">
                    <button
                      className={`oo-theme-btn ${settings.appearance.theme === 'dark' ? 'selected' : ''}`}
                      onClick={() => updateSetting('appearance', 'theme', 'dark')}
                    >
                      🌙 Dark
                    </button>
                    <button
                      className={`oo-theme-btn ${settings.appearance.theme === 'light' ? 'selected' : ''}`}
                      onClick={() => updateSetting('appearance', 'theme', 'light')}
                    >
                      ☀️ Light
                    </button>
                    <button
                      className={`oo-theme-btn ${settings.appearance.theme === 'auto' ? 'selected' : ''}`}
                      onClick={() => updateSetting('appearance', 'theme', 'auto')}
                    >
                      🔄 Auto
                    </button>
                  </div>
                </div>

                <div className="oo-field">
                  <label>Accent Color</label>
                  <div className="oo-color-picker">
                    <input
                      type="color"
                      value={settings.appearance.accentColor}
                      onChange={(e) => updateSetting('appearance', 'accentColor', e.target.value)}
                    />
                    <span>{settings.appearance.accentColor}</span>
                  </div>
                </div>

                <div className="oo-toggle-group">
                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>📐 Compact Mode</span>
                      <small>Reduce spacing and padding</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.appearance.compactMode}
                        onChange={(e) => updateSetting('appearance', 'compactMode', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>✨ Animations</span>
                      <small>Enable smooth animations</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.appearance.showAnimations}
                        onChange={(e) => updateSetting('appearance', 'showAnimations', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="oo-field">
                  <label>Sidebar Position</label>
                  <select
                    value={settings.appearance.sidebarPosition}
                    onChange={(e) => updateSetting('appearance', 'sidebarPosition', e.target.value)}
                  >
                    <option value="left">← Left</option>
                    <option value="right">→ Right</option>
                  </select>
                </div>
              </div>
            )}

            {/* ═══════════════ AI SETTINGS ═══════════════ */}
            {activeSection === 'ai' && (
              <div className="oo-section">
                <h3>🧠 AI Settings</h3>
                
                <div className="oo-field">
                  <label>AI Provider</label>
                  <select
                    value={settings.ai.apiProvider}
                    onChange={(e) => updateSetting('ai', 'apiProvider', e.target.value)}
                  >
                    <option value="openai">OpenAI (GPT)</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                  </select>
                </div>

                <div className="oo-field">
                  <label>Default Model</label>
                  <select
                    value={settings.ai.defaultModel}
                    onChange={(e) => updateSetting('ai', 'defaultModel', e.target.value)}
                  >
                    {settings.ai.apiProvider === 'openai' ? (
                      <>
                        <option value="gpt-4o">GPT-4o (Best)</option>
                        <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      </>
                    ) : (
                      <>
                        <option value="claude-3-opus">Claude 3 Opus (Best)</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        <option value="claude-3-haiku">Claude 3 Haiku (Fast)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="oo-field">
                  <label>Temperature: {settings.ai.temperature}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.ai.temperature}
                    onChange={(e) => updateSetting('ai', 'temperature', parseFloat(e.target.value))}
                  />
                  <div className="oo-range-labels">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div className="oo-field">
                  <label>Max Tokens: {settings.ai.maxTokens}</label>
                  <input
                    type="range"
                    min="500"
                    max="4000"
                    step="100"
                    value={settings.ai.maxTokens}
                    onChange={(e) => updateSetting('ai', 'maxTokens', parseInt(e.target.value))}
                  />
                </div>

                <div className="oo-toggle-group">
                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>🧠 Context Memory</span>
                      <small>Remember conversation history</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.ai.contextMemory}
                        onChange={(e) => updateSetting('ai', 'contextMemory', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>

                  <div className="oo-toggle-item">
                    <div className="oo-toggle-info">
                      <span>💡 Auto Suggestions</span>
                      <small>AI suggests actions</small>
                    </div>
                    <label className="oo-switch">
                      <input
                        type="checkbox"
                        checked={settings.ai.autoSuggestions}
                        onChange={(e) => updateSetting('ai', 'autoSuggestions', e.target.checked)}
                      />
                      <span className="oo-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════ DANGER ZONE ═══════════════ */}
            {activeSection === 'danger' && (
              <div className="oo-section oo-danger-section">
                <h3>⚠️ Danger Zone</h3>
                <p className="oo-description">These actions are irreversible</p>
                
                <div className="oo-danger-actions">
                  <div className="oo-danger-item">
                    <div>
                      <h4>🔄 Reset Settings</h4>
                      <p>Reset all settings to default values</p>
                    </div>
                    <button className="oo-btn-danger-secondary" onClick={handleReset}>
                      Reset
                    </button>
                  </div>

                  <div className="oo-danger-item">
                    <div>
                      <h4>📤 Export Data</h4>
                      <p>Download all office data as JSON</p>
                    </div>
                    <button className="oo-btn-secondary">
                      Export
                    </button>
                  </div>

                  <div className="oo-danger-item">
                    <div>
                      <h4>🗑️ Delete Office</h4>
                      <p>Permanently delete this office and all its data</p>
                    </div>
                    <button className="oo-btn-danger">
                      Delete Office
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="oo-footer">
          <button className="oo-btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="oo-btn-primary" 
            onClick={handleSave}
            disabled={!hasChanges}
          >
            💾 Save Changes
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default OfficeOptions;
