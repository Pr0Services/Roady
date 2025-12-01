/*
╔══════════════════════════════════════════════════════════════════════════════╗
║   🌐 ROADY - SOCIAL MEDIA OAUTH MANAGER                                      ║
║   Connect all your social media platforms                                    ║
║   OAuth2 integration for 15+ platforms                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import React, { useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// PLATFORMS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const SOCIAL_PLATFORMS = {
  // Video Platforms
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    icon: '📺',
    color: '#FF0000',
    category: 'video',
    scopes: ['youtube.readonly', 'youtube.upload', 'youtube.force-ssl'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    features: ['Upload videos', 'Manage playlists', 'View analytics', 'Manage comments']
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
    category: 'video',
    scopes: ['user.info.basic', 'video.list', 'video.upload'],
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    features: ['Upload videos', 'View analytics', 'Manage profile']
  },
  twitch: {
    id: 'twitch',
    name: 'Twitch',
    icon: '🎮',
    color: '#9146FF',
    category: 'video',
    scopes: ['user:read:email', 'channel:manage:broadcast', 'clips:edit'],
    authUrl: 'https://id.twitch.tv/oauth2/authorize',
    features: ['Manage streams', 'Edit channel', 'View analytics', 'Manage clips']
  },
  
  // Social Networks
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    category: 'social',
    scopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
    authUrl: 'https://api.instagram.com/oauth/authorize',
    features: ['Post photos', 'Post reels', 'View insights', 'Manage comments']
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: '👤',
    color: '#1877F2',
    category: 'social',
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    features: ['Post to pages', 'Manage groups', 'View insights', 'Schedule posts']
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '🐦',
    color: '#000000',
    category: 'social',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    features: ['Post tweets', 'View analytics', 'Manage DMs', 'Schedule tweets']
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    category: 'social',
    scopes: ['r_liteprofile', 'w_member_social', 'r_organization_social'],
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    features: ['Post updates', 'Manage company page', 'View analytics']
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    icon: '🧵',
    color: '#000000',
    category: 'social',
    scopes: ['threads_basic', 'threads_content_publish'],
    authUrl: 'https://threads.net/oauth/authorize',
    features: ['Post threads', 'Reply to threads', 'View analytics']
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    color: '#E60023',
    category: 'social',
    scopes: ['boards:read', 'pins:read', 'pins:write'],
    authUrl: 'https://api.pinterest.com/oauth/',
    features: ['Create pins', 'Manage boards', 'View analytics']
  },
  
  // Messaging
  discord: {
    id: 'discord',
    name: 'Discord',
    icon: '💬',
    color: '#5865F2',
    category: 'messaging',
    scopes: ['identify', 'guilds', 'bot', 'messages.read'],
    authUrl: 'https://discord.com/api/oauth2/authorize',
    features: ['Manage servers', 'Send messages', 'Manage bots']
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    icon: '💼',
    color: '#4A154B',
    category: 'messaging',
    scopes: ['chat:write', 'channels:read', 'users:read'],
    authUrl: 'https://slack.com/oauth/v2/authorize',
    features: ['Send messages', 'Manage channels', 'Create workflows']
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    color: '#26A5E4',
    category: 'messaging',
    scopes: [],
    authUrl: 'https://oauth.telegram.org/auth',
    features: ['Send messages', 'Manage bots', 'Create channels']
  },
  
  // Other
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    icon: '🎧',
    color: '#1DB954',
    category: 'music',
    scopes: ['user-read-private', 'playlist-modify-public', 'user-read-recently-played'],
    authUrl: 'https://accounts.spotify.com/authorize',
    features: ['Manage playlists', 'View listening history', 'Share music']
  },
  reddit: {
    id: 'reddit',
    name: 'Reddit',
    icon: '🤖',
    color: '#FF4500',
    category: 'social',
    scopes: ['identity', 'submit', 'read', 'history'],
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    features: ['Post content', 'Manage subreddits', 'View analytics']
  },
  snapchat: {
    id: 'snapchat',
    name: 'Snapchat',
    icon: '👻',
    color: '#FFFC00',
    category: 'social',
    scopes: ['snapchat-marketing-api'],
    authUrl: 'https://accounts.snapchat.com/login/oauth2/authorize',
    features: ['Create ads', 'View analytics', 'Manage profile']
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL MEDIA MANAGER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const SocialMediaManager = ({
  connectedAccounts = {},
  onConnect,
  onDisconnect,
  onRefreshToken,
  apiKeys = {}
}) => {
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // CATEGORIES
  // ─────────────────────────────────────────────────────────────────────────
  
  const categories = [
    { id: 'all', label: '🌐 All', count: Object.keys(SOCIAL_PLATFORMS).length },
    { id: 'video', label: '📺 Video', count: Object.values(SOCIAL_PLATFORMS).filter(p => p.category === 'video').length },
    { id: 'social', label: '👥 Social', count: Object.values(SOCIAL_PLATFORMS).filter(p => p.category === 'social').length },
    { id: 'messaging', label: '💬 Messaging', count: Object.values(SOCIAL_PLATFORMS).filter(p => p.category === 'messaging').length },
    { id: 'music', label: '🎵 Music', count: Object.values(SOCIAL_PLATFORMS).filter(p => p.category === 'music').length }
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // FILTER PLATFORMS
  // ─────────────────────────────────────────────────────────────────────────
  
  const filteredPlatforms = Object.values(SOCIAL_PLATFORMS).filter(
    platform => activeCategory === 'all' || platform.category === activeCategory
  );

  const connectedCount = Object.keys(connectedAccounts).filter(k => connectedAccounts[k]?.connected).length;

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleConnect = (platform) => {
    setSelectedPlatform(platform);
    setShowConnectModal(true);
  };

  const initiateOAuth = async () => {
    if (!selectedPlatform) return;
    
    setIsConnecting(true);
    
    // Build OAuth URL
    const clientId = apiKeys[selectedPlatform.id]?.clientId || 'YOUR_CLIENT_ID';
    const redirectUri = `${window.location.origin}/oauth/callback/${selectedPlatform.id}`;
    const scope = selectedPlatform.scopes.join(' ');
    const state = btoa(JSON.stringify({ platform: selectedPlatform.id, timestamp: Date.now() }));
    
    const authUrl = `${selectedPlatform.authUrl}?` + new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      state: state,
      access_type: 'offline'
    }).toString();
    
    // Open OAuth popup
    const width = 600;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    const popup = window.open(
      authUrl,
      `Connect ${selectedPlatform.name}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    // Listen for OAuth callback
    const handleMessage = (event) => {
      if (event.data?.type === 'oauth_callback' && event.data?.platform === selectedPlatform.id) {
        window.removeEventListener('message', handleMessage);
        popup?.close();
        
        if (event.data.success) {
          onConnect?.(selectedPlatform.id, event.data.tokens);
        }
        
        setIsConnecting(false);
        setShowConnectModal(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Fallback timeout
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      setIsConnecting(false);
    }, 120000); // 2 minutes timeout
  };

  const handleDisconnect = (platformId) => {
    if (window.confirm(`Are you sure you want to disconnect ${SOCIAL_PLATFORMS[platformId]?.name}?`)) {
      onDisconnect?.(platformId);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  
  return (
    <div className="sm-manager">
      
      {/* Header */}
      <div className="sm-header">
        <div className="sm-header-info">
          <h1>🌐 Social Media Connections</h1>
          <p>Connect your accounts to enable cross-platform management</p>
        </div>
        <div className="sm-header-stats">
          <div className="sm-stat-badge">
            <span className="sm-stat-value">{connectedCount}</span>
            <span className="sm-stat-label">Connected</span>
          </div>
          <div className="sm-stat-badge">
            <span className="sm-stat-value">{Object.keys(SOCIAL_PLATFORMS).length}</span>
            <span className="sm-stat-label">Available</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="sm-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`sm-category ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Platforms Grid */}
      <div className="sm-platforms-grid">
        {filteredPlatforms.map(platform => {
          const isConnected = connectedAccounts[platform.id]?.connected;
          const accountInfo = connectedAccounts[platform.id];
          
          return (
            <div 
              key={platform.id} 
              className={`sm-platform-card ${isConnected ? 'connected' : ''}`}
              style={{ '--platform-color': platform.color }}
            >
              <div className="sm-platform-header">
                <span className="sm-platform-icon">{platform.icon}</span>
                <div className="sm-platform-info">
                  <h3>{platform.name}</h3>
                  <span className="sm-platform-category">{platform.category}</span>
                </div>
                <div className={`sm-status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                  {isConnected ? '✓ Connected' : 'Not connected'}
                </div>
              </div>
              
              {isConnected && accountInfo && (
                <div className="sm-account-info">
                  <span className="sm-account-name">
                    {accountInfo.username || accountInfo.email || 'Connected'}
                  </span>
                  {accountInfo.lastSync && (
                    <span className="sm-last-sync">
                      Last sync: {new Date(accountInfo.lastSync).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
              
              <div className="sm-platform-features">
                <h4>Features:</h4>
                <ul>
                  {platform.features.slice(0, 3).map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>
              
              <div className="sm-platform-actions">
                {isConnected ? (
                  <>
                    <button 
                      className="sm-btn sm-btn-refresh"
                      onClick={() => onRefreshToken?.(platform.id)}
                    >
                      🔄 Refresh
                    </button>
                    <button 
                      className="sm-btn sm-btn-disconnect"
                      onClick={() => handleDisconnect(platform.id)}
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button 
                    className="sm-btn sm-btn-connect"
                    onClick={() => handleConnect(platform)}
                  >
                    Connect {platform.name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect Modal */}
      {showConnectModal && selectedPlatform && (
        <div className="sm-modal-overlay" onClick={() => !isConnecting && setShowConnectModal(false)}>
          <div className="sm-modal" onClick={e => e.stopPropagation()}>
            <div className="sm-modal-header" style={{ background: selectedPlatform.color }}>
              <span className="sm-modal-icon">{selectedPlatform.icon}</span>
              <h2>Connect {selectedPlatform.name}</h2>
            </div>
            
            <div className="sm-modal-body">
              <p>You'll be redirected to {selectedPlatform.name} to authorize access.</p>
              
              <div className="sm-permissions">
                <h4>Permissions requested:</h4>
                <ul>
                  {selectedPlatform.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
              
              <div className="sm-privacy-note">
                <span>🔒</span>
                <p>Your credentials are securely stored and never shared.</p>
              </div>
            </div>
            
            <div className="sm-modal-footer">
              <button 
                className="sm-btn sm-btn-cancel"
                onClick={() => setShowConnectModal(false)}
                disabled={isConnecting}
              >
                Cancel
              </button>
              <button 
                className="sm-btn sm-btn-authorize"
                onClick={initiateOAuth}
                disabled={isConnecting}
                style={{ background: selectedPlatform.color }}
              >
                {isConnecting ? '⏳ Connecting...' : `Authorize ${selectedPlatform.name}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaManager;
