/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🚀 ROADY V4.0 - BEAUTIFUL FRONTEND                                         ║
║   "Empowering Dreams, Enabling Abundance"                                    ║
║                                                                              ║
║   Made with ❤️ for dreamers, builders, and creators                          ║
║                                                                              ║
║   PART 1: Core App Structure                                                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// 🎨 ICONS (Lucide-style SVG Icons)
// ============================================================================

const Icons = {
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Bot: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v4"/>
      <line x1="8" y1="16" x2="8" y2="16"/>
      <line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  ),
  MessageSquare: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/><path d="M16 6h.01"/>
      <path d="M12 6h.01"/><path d="M12 10h.01"/>
      <path d="M12 14h.01"/><path d="M16 10h.01"/>
      <path d="M16 14h.01"/><path d="M8 10h.01"/>
      <path d="M8 14h.01"/>
    </svg>
  ),
  FolderKanban: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
      <path d="M8 10v4"/><path d="M12 10v2"/><path d="M16 10v6"/>
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Database: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  Plug: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22v-5"/>
      <path d="M9 8V2"/><path d="M15 8V2"/>
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/>
      <path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/>
      <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  ),
  Send: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
    </svg>
  ),
  Sparkles: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  ),
  Share: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
    </svg>
  ),
  ExternalLink: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>
    </svg>
  ),
  Heart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  ),
  Globe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" x2="22" y1="12" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  TrendingDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>
      <polyline points="16 17 22 17 22 11"/>
    </svg>
  ),
  MoreVertical: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Copy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
    </svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/>
      <line x1="4" x2="20" y1="18" y2="18"/>
    </svg>
  ),
  Loader: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  )
};

// ============================================================================
// 🎯 CONFIGURATION
// ============================================================================

const API_URL = 'http://127.0.0.1:8000';
const CURRENT_USER_ID = 'demo-user-123';

// Navigation items
const NAV_ITEMS = [
  { id: 'home', label: 'My Office', icon: 'Home', emoji: '🏠' },
  { id: 'assistant', label: 'Personal Assistant', icon: 'Sparkles', emoji: '✨' },
  { id: 'meetings', label: 'Meetings', icon: 'MessageSquare', emoji: '💬' },
  { id: 'businesses', label: 'Businesses', icon: 'Building', emoji: '🏢' },
  { id: 'projects', label: 'Projects', icon: 'FolderKanban', emoji: '📁' },
  { id: 'agents', label: 'Agents & Teams', icon: 'Users', emoji: '🤖' },
  { id: 'database', label: 'Database', icon: 'Database', emoji: '🗄️' },
  { id: 'integrations', label: 'Integrations', icon: 'Plug', emoji: '🔌' },
  { id: 'social', label: 'Social Media', icon: 'Globe', emoji: '🌐' },
  { id: 'account', label: 'My Account', icon: 'Settings', emoji: '⚙️' },
];

// Social platforms configuration
const SOCIAL_PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2', description: 'Connect with billions. Share content and manage pages.' },
  { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E4405F', description: 'Visual storytelling. Share photos, videos, and reels.' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2', description: 'Professional networking. Build your brand.' },
  { id: 'youtube', name: 'YouTube', icon: '🎬', color: '#FF0000', description: 'Video platform. Upload and manage content.' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000', description: 'Short-form video. Reach Gen Z.' },
  { id: 'twitter', name: 'X (Twitter)', icon: '🐦', color: '#1DA1F2', description: 'Real-time conversations. Share thoughts.' },
  { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#E60023', description: 'Visual discovery. Inspire with pins.' },
  { id: 'threads', name: 'Threads', icon: '🧵', color: '#000000', description: 'Text-based conversations by Meta.' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', color: '#FFFC00', description: 'Ephemeral content. AR experiences.' },
  { id: 'reddit', name: 'Reddit', icon: '🤖', color: '#FF4500', description: 'Community discussions. Niche audiences.' },
  { id: 'twitch', name: 'Twitch', icon: '📺', color: '#9146FF', description: 'Live streaming. Gaming and creative.' },
  { id: 'spotify', name: 'Spotify', icon: '🎶', color: '#1DB954', description: 'Music platform. Playlists and podcasts.' },
];

// ============================================================================
// 🔧 UTILITY FUNCTIONS
// ============================================================================

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
};

const formatTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date(date));
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// ============================================================================
// 🎨 REUSABLE COMPONENTS
// ============================================================================

// Button Component
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
  };
  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  return (
    <button
      className={classNames(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="spinner spinner-sm" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon />}
          {children}
          {Icon && iconPosition === 'right' && <Icon />}
        </>
      )}
    </button>
  );
};

// Input Component
const Input = ({ 
  label, 
  icon: Icon, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div className={Icon ? 'input-wrapper' : ''}>
        {Icon && <span className="input-icon"><Icon /></span>}
        <input className={classNames('input', error && 'input-error', className)} {...props} />
      </div>
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

// Card Component
const Card = ({ 
  children, 
  className = '', 
  interactive = false, 
  onClick,
  ...props 
}) => {
  return (
    <div 
      className={classNames('card', interactive && 'card-interactive', className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// Badge Component
const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variantClasses = {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    gray: 'badge-gray',
  };

  return (
    <span className={classNames('badge', variantClasses[variant], className)}>
      {children}
    </span>
  );
};

// Avatar Component
const Avatar = ({ src, alt, fallback, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
  };

  return (
    <div className={classNames('avatar', sizeClasses[size], className)}>
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  );
};

// Modal Component
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  size = 'md', 
  children,
  footer 
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
    xl: 'modal-xl',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={classNames('modal', sizeClasses[size])}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <Icons.X />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Toast Notification Component
const Toast = ({ message, type = 'info', onClose }) => {
  const icons = {
    success: Icons.Check,
    error: Icons.X,
    warning: Icons.Bell,
    info: Icons.Bell,
  };
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={classNames('toast', `toast-${type}`)}>
      <span className="toast-icon"><Icon /></span>
      <div className="toast-content">
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>
        <Icons.X />
      </button>
    </div>
  );
};

// Loading Spinner
const Spinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'spinner-sm',
    md: '',
    lg: 'spinner-lg',
  };
  return <div className={classNames('spinner', sizeClasses[size])} />;
};

// Empty State Component
const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="empty-state">
      {Icon && <div className="empty-state-icon"><Icon /></div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, iconColor = 'purple', value, label, trend, trendDirection }) => {
  return (
    <div className="stat-card hover-lift">
      <div className="stat-card-header">
        <div className={classNames('stat-card-icon', iconColor)}>
          {icon}
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {trend && (
        <div className={classNames('stat-card-trend', trendDirection)}>
          {trendDirection === 'up' ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
          {trend}
        </div>
      )}
    </div>
  );
};

// Export components and configuration for Part 2
export { 
  Icons, 
  API_URL, 
  CURRENT_USER_ID, 
  NAV_ITEMS, 
  SOCIAL_PLATFORMS,
  formatDate, 
  formatTime, 
  formatCurrency, 
  classNames,
  Button,
  Input,
  Card,
  Badge,
  Avatar,
  Modal,
  Toast,
  Spinner,
  EmptyState,
  StatCard
};
/*
╔══════════════════════════════════════════════════════════════════════════════╗
║   🚀 ROADY V4.0 - BEAUTIFUL FRONTEND                                         ║
║   PART 2: Main App Component & Sections                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

// ============================================================================
// 🏠 MAIN APP COMPONENT
// ============================================================================

function App() {
  // ─────────────────────────────────────────────────────────────────────────
  // 📦 STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  
  // Theme & UI
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('roady_darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  
  // Data
  const [user, setUser] = useState({ id: CURRENT_USER_ID, name: 'Demo User', email: 'demo@roady.ai' });
  const [businesses, setBusinesses] = useState([]);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [agents, setAgents] = useState([]);
  const [agentTemplates, setAgentTemplates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [databases, setDatabases] = useState([]);
  
  // Social Media
  const [connectedSocials, setConnectedSocials] = useState({});
  
  // Integrations
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('roady_apiKeys');
    return saved ? JSON.parse(saved) : {};
  });
  const [connectedProviders, setConnectedProviders] = useState(() => {
    const saved = localStorage.getItem('roady_connectedProviders');
    return saved ? JSON.parse(saved) : [];
  });
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showCreateBusinessModal, setShowCreateBusinessModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
  const [showHireAgentModal, setShowHireAgentModal] = useState(false);
  const [selectedAgentTemplate, setSelectedAgentTemplate] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // 🔄 EFFECTS
  // ─────────────────────────────────────────────────────────────────────────
  
  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('roady_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);
  
  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Load business data when current business changes
  useEffect(() => {
    if (currentBusiness) {
      loadBusinessData(currentBusiness.id);
    }
  }, [currentBusiness]);

  // ─────────────────────────────────────────────────────────────────────────
  // 📡 API FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load businesses
      const bizRes = await fetch(`${API_URL}/api/users/${CURRENT_USER_ID}/businesses`);
      if (bizRes.ok) {
        const bizData = await bizRes.json();
        setBusinesses(bizData.businesses || []);
        if (bizData.businesses?.length > 0) {
          setCurrentBusiness(bizData.businesses[0]);
        }
      }
      
      // Load agent templates
      const templatesRes = await fetch(`${API_URL}/api/agent-templates`);
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setAgentTemplates(templatesData.templates || []);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      addNotification('Failed to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const loadBusinessData = async (businessId) => {
    try {
      // Load agents
      const agentsRes = await fetch(`${API_URL}/api/businesses/${businessId}/agents`);
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData.agents || []);
      }
      
      // Load projects
      const projectsRes = await fetch(`${API_URL}/api/businesses/${businessId}/projects`);
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }
      
      // Load meetings
      const meetingsRes = await fetch(`${API_URL}/api/businesses/${businessId}/meetings`);
      if (meetingsRes.ok) {
        const meetingsData = await meetingsRes.json();
        setMeetings(meetingsData.meetings || []);
      }
      
      // Load databases
      const dbRes = await fetch(`${API_URL}/api/businesses/${businessId}/databases`);
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setDatabases(dbData.databases || []);
      }
    } catch (error) {
      console.error('Failed to load business data:', error);
    }
  };
  
  const createBusiness = async (name, industry) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${CURRENT_USER_ID}/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, industry })
      });
      
      if (res.ok) {
        const data = await res.json();
        addNotification(`Business "${name}" created! 🎉`, 'success');
        loadInitialData();
        setShowCreateBusinessModal(false);
        return data;
      }
    } catch (error) {
      addNotification('Failed to create business', 'error');
    }
  };
  
  const createProject = async (name, description) => {
    if (!currentBusiness) return;
    try {
      const res = await fetch(`${API_URL}/api/businesses/${currentBusiness.id}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      
      if (res.ok) {
        addNotification(`Project "${name}" created! 📁`, 'success');
        loadBusinessData(currentBusiness.id);
        setShowCreateProjectModal(false);
      }
    } catch (error) {
      addNotification('Failed to create project', 'error');
    }
  };
  
  const hireAgent = async (templateId, name) => {
    if (!currentBusiness) return;
    try {
      const res = await fetch(`${API_URL}/api/businesses/${currentBusiness.id}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId, name })
      });
      
      if (res.ok) {
        addNotification(`Agent "${name}" hired! 🤖`, 'success');
        loadBusinessData(currentBusiness.id);
        setShowHireAgentModal(false);
        setSelectedAgentTemplate(null);
      }
    } catch (error) {
      addNotification('Failed to hire agent', 'error');
    }
  };
  
  const createMeeting = async (name, agentIds = []) => {
    if (!currentBusiness) return;
    try {
      const res = await fetch(`${API_URL}/api/meetings?business_id=${currentBusiness.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, initial_agent_ids: agentIds })
      });
      
      if (res.ok) {
        addNotification(`Meeting "${name}" started! 💬`, 'success');
        loadBusinessData(currentBusiness.id);
        setShowCreateMeetingModal(false);
      }
    } catch (error) {
      addNotification('Failed to create meeting', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 🔔 NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  };
  
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 📱 SOCIAL MEDIA FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  const connectSocial = (platformId) => {
    // In production, this would initiate OAuth flow
    setConnectedSocials(prev => ({ ...prev, [platformId]: true }));
    addNotification(`Connected to ${SOCIAL_PLATFORMS.find(p => p.id === platformId)?.name}! 🎉`, 'success');
  };
  
  const disconnectSocial = (platformId) => {
    setConnectedSocials(prev => {
      const updated = { ...prev };
      delete updated[platformId];
      return updated;
    });
    addNotification(`Disconnected from ${SOCIAL_PLATFORMS.find(p => p.id === platformId)?.name}`, 'info');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 🎨 RENDER
  // ─────────────────────────────────────────────────────────────────────────
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-logo">
            <span className="loading-emoji">🚀</span>
            <span className="loading-text">ROADY</span>
          </div>
          <Spinner size="lg" />
          <p className="loading-message">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={classNames('app', darkMode && 'dark')}>
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentBusiness={currentBusiness}
        businesses={businesses}
        onBusinessChange={setCurrentBusiness}
      />
      
      {/* Topbar */}
      <Topbar 
        sidebarCollapsed={sidebarCollapsed}
        activeSection={activeSection}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        user={user}
      />
      
      {/* Main Content */}
      <main className={classNames('main-content', sidebarCollapsed && 'sidebar-collapsed')}>
        <div className="content-container animate-fade-in-up">
          {activeSection === 'home' && (
            <HomeSection 
              businesses={businesses}
              agents={agents}
              projects={projects}
              meetings={meetings}
              currentBusiness={currentBusiness}
              onCreateBusiness={() => setShowCreateBusinessModal(true)}
              onCreateProject={() => setShowCreateProjectModal(true)}
              onCreateMeeting={() => setShowCreateMeetingModal(true)}
              onNavigate={setActiveSection}
            />
          )}
          
          {activeSection === 'assistant' && (
            <AssistantSection />
          )}
          
          {activeSection === 'meetings' && (
            <MeetingsSection 
              meetings={meetings}
              agents={agents}
              onCreateMeeting={() => setShowCreateMeetingModal(true)}
            />
          )}
          
          {activeSection === 'businesses' && (
            <BusinessesSection 
              businesses={businesses}
              currentBusiness={currentBusiness}
              onSelectBusiness={setCurrentBusiness}
              onCreateBusiness={() => setShowCreateBusinessModal(true)}
            />
          )}
          
          {activeSection === 'projects' && (
            <ProjectsSection 
              projects={projects}
              onCreateProject={() => setShowCreateProjectModal(true)}
            />
          )}
          
          {activeSection === 'agents' && (
            <AgentsSection 
              agents={agents}
              templates={agentTemplates}
              onHireAgent={(template) => {
                setSelectedAgentTemplate(template);
                setShowHireAgentModal(true);
              }}
            />
          )}
          
          {activeSection === 'database' && (
            <DatabaseSection 
              databases={databases}
              currentBusiness={currentBusiness}
            />
          )}
          
          {activeSection === 'integrations' && (
            <IntegrationsSection 
              apiKeys={apiKeys}
              connectedProviders={connectedProviders}
              onSaveApiKey={(provider, key) => {
                const updated = { ...apiKeys, [provider]: key };
                setApiKeys(updated);
                localStorage.setItem('roady_apiKeys', JSON.stringify(updated));
                if (!connectedProviders.includes(provider)) {
                  const updatedProviders = [...connectedProviders, provider];
                  setConnectedProviders(updatedProviders);
                  localStorage.setItem('roady_connectedProviders', JSON.stringify(updatedProviders));
                }
                addNotification(`${provider} API key saved! 🔑`, 'success');
              }}
              onDisconnect={(provider) => {
                const updated = { ...apiKeys };
                delete updated[provider];
                setApiKeys(updated);
                localStorage.setItem('roady_apiKeys', JSON.stringify(updated));
                const updatedProviders = connectedProviders.filter(p => p !== provider);
                setConnectedProviders(updatedProviders);
                localStorage.setItem('roady_connectedProviders', JSON.stringify(updatedProviders));
                addNotification(`${provider} disconnected`, 'info');
              }}
            />
          )}
          
          {activeSection === 'social' && (
            <SocialMediaSection 
              platforms={SOCIAL_PLATFORMS}
              connectedSocials={connectedSocials}
              onConnect={connectSocial}
              onDisconnect={disconnectSocial}
            />
          )}
          
          {activeSection === 'account' && (
            <AccountSection 
              user={user}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
            />
          )}
        </div>
      </main>
      
      {/* Notifications */}
      <div className="toast-container">
        {notifications.map(notification => (
          <Toast 
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
      
      {/* Modals */}
      <CreateBusinessModal 
        isOpen={showCreateBusinessModal}
        onClose={() => setShowCreateBusinessModal(false)}
        onCreate={createBusiness}
      />
      
      <CreateProjectModal 
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onCreate={createProject}
      />
      
      <CreateMeetingModal 
        isOpen={showCreateMeetingModal}
        onClose={() => setShowCreateMeetingModal(false)}
        onCreate={createMeeting}
        agents={agents}
      />
      
      <HireAgentModal 
        isOpen={showHireAgentModal}
        onClose={() => {
          setShowHireAgentModal(false);
          setSelectedAgentTemplate(null);
        }}
        template={selectedAgentTemplate}
        onHire={hireAgent}
      />
    </div>
  );
}

// ============================================================================
// 📌 SIDEBAR COMPONENT
// ============================================================================

const Sidebar = ({ 
  collapsed, 
  activeSection, 
  onSectionChange, 
  onToggleCollapse,
  currentBusiness,
  businesses,
  onBusinessChange
}) => {
  return (
    <aside className={classNames('sidebar', collapsed && 'collapsed')}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          🚀
        </div>
        {!collapsed && (
          <div className="sidebar-brand">
            <span className="sidebar-brand-name">ROADY</span>
            <span className="sidebar-brand-version">v4.0</span>
          </div>
        )}
        <button className="btn-icon btn-ghost sidebar-toggle" onClick={onToggleCollapse}>
          {collapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
        </button>
      </div>
      
      {/* Business Selector */}
      {!collapsed && currentBusiness && (
        <div className="sidebar-business-selector">
          <select 
            value={currentBusiness.id}
            onChange={(e) => {
              const biz = businesses.find(b => b.id === e.target.value);
              if (biz) onBusinessChange(biz);
            }}
            className="business-select"
          >
            {businesses.map(biz => (
              <option key={biz.id} value={biz.id}>{biz.name}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <div className="nav-section-title">Main</div>}
          {NAV_ITEMS.slice(0, 6).map(item => {
            const Icon = Icons[item.icon];
            return (
              <div
                key={item.id}
                className={classNames('nav-item', activeSection === item.id && 'active')}
                onClick={() => onSectionChange(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-item-icon">{item.emoji}</span>
                {!collapsed && <span className="nav-item-text">{item.label}</span>}
              </div>
            );
          })}
        </div>
        
        <div className="nav-section">
          {!collapsed && <div className="nav-section-title">Settings</div>}
          {NAV_ITEMS.slice(6).map(item => {
            const Icon = Icons[item.icon];
            return (
              <div
                key={item.id}
                className={classNames('nav-item', activeSection === item.id && 'active')}
                onClick={() => onSectionChange(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-item-icon">{item.emoji}</span>
                {!collapsed && <span className="nav-item-text">{item.label}</span>}
              </div>
            );
          })}
        </div>
      </nav>
      
      {/* Footer */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-footer-content">
            <span className="sidebar-footer-text">Made with ❤️</span>
          </div>
        </div>
      )}
    </aside>
  );
};

// ============================================================================
// 🔝 TOPBAR COMPONENT
// ============================================================================

const Topbar = ({ 
  sidebarCollapsed, 
  activeSection, 
  searchQuery, 
  onSearchChange,
  darkMode,
  onToggleDarkMode,
  user
}) => {
  const currentNav = NAV_ITEMS.find(item => item.id === activeSection);
  
  return (
    <header className={classNames('topbar', sidebarCollapsed && 'sidebar-collapsed')}>
      <div className="topbar-left">
        <h1 className="topbar-title">
          {currentNav?.emoji} {currentNav?.label}
        </h1>
      </div>
      
      <div className="topbar-center">
        <div className="search-bar">
          <span className="search-icon"><Icons.Search /></span>
          <input 
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="topbar-right">
        <button className="btn-icon btn-ghost" onClick={onToggleDarkMode}>
          {darkMode ? <Icons.Sun /> : <Icons.Moon />}
        </button>
        
        <button className="btn-icon btn-ghost">
          <Icons.Bell />
        </button>
        
        <div className="user-menu">
          <div className="user-avatar">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// 🏠 HOME SECTION
// ============================================================================

const HomeSection = ({ 
  businesses, 
  agents, 
  projects, 
  meetings,
  currentBusiness,
  onCreateBusiness,
  onCreateProject,
  onCreateMeeting,
  onNavigate
}) => {
  return (
    <div className="home-section">
      {/* Welcome Banner */}
      <div className="welcome-banner animate-fade-in">
        <div className="welcome-content">
          <h1 className="welcome-title">Welcome back! 👋</h1>
          <p className="welcome-subtitle">
            {currentBusiness 
              ? `Managing ${currentBusiness.name} • ${agents.length} agents • ${projects.length} projects`
              : 'Create your first business to get started'
            }
          </p>
        </div>
        <div className="welcome-actions">
          <Button onClick={onCreateMeeting} icon={Icons.MessageSquare}>
            New Meeting
          </Button>
          <Button variant="secondary" onClick={onCreateProject} icon={Icons.Plus}>
            New Project
          </Button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="stats-grid stagger-container">
        <StatCard 
          icon="🏢"
          iconColor="purple"
          value={businesses.length}
          label="Businesses"
          trend="+12%"
          trendDirection="up"
        />
        <StatCard 
          icon="🤖"
          iconColor="teal"
          value={agents.length}
          label="Active Agents"
          trend="+8%"
          trendDirection="up"
        />
        <StatCard 
          icon="📁"
          iconColor="orange"
          value={projects.length}
          label="Projects"
        />
        <StatCard 
          icon="💬"
          iconColor="purple"
          value={meetings.length}
          label="Meetings"
        />
      </div>
      
      {/* Quick Actions */}
      <div className="section-header">
        <h2 className="section-title">Quick Actions</h2>
      </div>
      <div className="quick-actions-grid">
        <Card interactive onClick={() => onNavigate('agents')} className="quick-action-card">
          <span className="quick-action-icon">🤖</span>
          <h3>Hire Agent</h3>
          <p>Add AI agents to your team</p>
        </Card>
        <Card interactive onClick={() => onNavigate('meetings')} className="quick-action-card">
          <span className="quick-action-icon">💬</span>
          <h3>Start Meeting</h3>
          <p>Collaborate with your agents</p>
        </Card>
        <Card interactive onClick={() => onNavigate('social')} className="quick-action-card">
          <span className="quick-action-icon">🌐</span>
          <h3>Connect Social</h3>
          <p>Link your social accounts</p>
        </Card>
        <Card interactive onClick={() => onNavigate('integrations')} className="quick-action-card">
          <span className="quick-action-icon">🔌</span>
          <h3>Add Integration</h3>
          <p>Connect external services</p>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <div className="section-header">
        <h2 className="section-title">Recent Projects</h2>
        <Button variant="ghost" size="sm" onClick={() => onNavigate('projects')}>
          View All <Icons.ChevronRight />
        </Button>
      </div>
      <div className="projects-grid stagger-container">
        {projects.slice(0, 4).map(project => (
          <Card key={project.id} className="project-card hover-lift">
            <div className="project-card-header">
              <span className="project-icon">📁</span>
              <Badge variant={project.status === 'active' ? 'success' : 'gray'}>
                {project.status}
              </Badge>
            </div>
            <h3 className="project-name">{project.name}</h3>
            <p className="project-description">{project.description || 'No description'}</p>
            <div className="project-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${project.progress || 0}%` }} />
              </div>
              <span className="progress-text">{project.progress || 0}%</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 🌐 SOCIAL MEDIA SECTION
// ============================================================================

const SocialMediaSection = ({ platforms, connectedSocials, onConnect, onDisconnect }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  
  const categories = [
    { id: 'all', name: 'All Platforms' },
    { id: 'social', name: 'Social Networks' },
    { id: 'video', name: 'Video Platforms' },
    { id: 'messaging', name: 'Messaging' },
  ];
  
  const filteredPlatforms = activeCategory === 'all' 
    ? platforms 
    : platforms.filter(p => p.category === activeCategory);

  return (
    <div className="social-section">
      {/* Header */}
      <div className="section-banner gradient-purple">
        <div className="banner-content">
          <h1 className="banner-title">🌐 Social Media Hub</h1>
          <p className="banner-subtitle">
            Connect all your social accounts in one place. Manage, schedule, and analyze your social presence.
          </p>
        </div>
        <div className="banner-stats">
          <div className="banner-stat">
            <span className="stat-value">{Object.keys(connectedSocials).length}</span>
            <span className="stat-label">Connected</span>
          </div>
          <div className="banner-stat">
            <span className="stat-value">{platforms.length}</span>
            <span className="stat-label">Available</span>
          </div>
        </div>
      </div>
      
      {/* Category Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          {categories.map(cat => (
            <button 
              key={cat.id}
              className={classNames('tab', activeCategory === cat.id && 'active')}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Platforms Grid */}
      <div className="social-platforms-grid stagger-container">
        {filteredPlatforms.map(platform => (
          <div 
            key={platform.id}
            className="social-card hover-lift"
            data-platform={platform.id}
            style={{ '--platform-color': platform.color }}
          >
            <div className="platform-icon" style={{ background: platform.color }}>
              {platform.icon}
            </div>
            <h3 className="platform-name">{platform.name}</h3>
            <p className="platform-description">{platform.description}</p>
            
            <div className="platform-actions">
              {connectedSocials[platform.id] ? (
                <>
                  <div className="platform-status connected">
                    <Icons.Check /> Connected
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDisconnect(platform.id)}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => onConnect(platform.id)}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Features Info */}
      <div className="features-section">
        <h2 className="section-title">What You Can Do</h2>
        <div className="features-grid">
          <Card className="feature-card">
            <span className="feature-icon">📅</span>
            <h3>Schedule Posts</h3>
            <p>Plan and schedule content across all platforms</p>
          </Card>
          <Card className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Analytics</h3>
            <p>Track performance and engagement metrics</p>
          </Card>
          <Card className="feature-card">
            <span className="feature-icon">🤖</span>
            <h3>AI Content</h3>
            <p>Generate content with your AI agents</p>
          </Card>
          <Card className="feature-card">
            <span className="feature-icon">💬</span>
            <h3>Auto-Reply</h3>
            <p>Automated responses to comments and DMs</p>
          </Card>
        </div>
      </div>
    </div>
  );
};



const AssistantSection = () => {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hello! I\'m your personal AI assistant. How can I help you today? ✨' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const sendMessage = () => {
    if (!inputValue.trim()) return;
    
    const userMessage = { id: Date.now(), role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I'd be happy to help with that! Let me think about the best approach... 🤔",
        "Great question! Here's what I suggest... ✨",
        "I understand. Let me analyze this for you... 📊",
        "Absolutely! I can help you with that. Here's my recommendation... 💡",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: randomResponse
      }]);
      setIsTyping(false);
    }, 1500);
  };
  
  const suggestions = [
    "📊 Analyze my business performance",
    "📝 Help me write a proposal",
    "🎯 Create a marketing strategy",
    "💡 Brainstorm new ideas",
  ];

  return (
    <div className="assistant-section">
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="assistant-avatar">✨</div>
            <div>
              <h2>Personal Assistant</h2>
              <span className="status-online">● Online</span>
            </div>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'assistant' ? '✨' : '👤'}
              </div>
              <div className="message-content">
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message assistant">
              <div className="message-avatar">✨</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="chat-suggestions">
            {suggestions.map((suggestion, i) => (
              <button 
                key={i} 
                className="suggestion-btn"
                onClick={() => {
                  setInputValue(suggestion);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        
        {/* Chat Input */}
        <div className="chat-input-container">
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask me anything..."
            className="chat-input"
          />
          <Button onClick={sendMessage} icon={Icons.Send}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 💬 MEETINGS SECTION
// ============================================================================

const MeetingsSection = ({ meetings, agents, onCreateMeeting }) => {
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  return (
    <div className="meetings-section">
      {/* Header */}
      <div className="section-header-large">
        <div>
          <h1>💬 Meeting Room</h1>
          <p>Collaborate with your AI agents in real-time</p>
        </div>
        <Button onClick={onCreateMeeting} icon={Icons.Plus}>
          New Meeting
        </Button>
      </div>
      
      {selectedMeeting ? (
        <MeetingRoom 
          meeting={selectedMeeting}
          agents={agents}
          onBack={() => setSelectedMeeting(null)}
        />
      ) : (
        <div className="meetings-grid stagger-container">
          {meetings.length === 0 ? (
            <EmptyState 
              icon={Icons.MessageSquare}
              title="No meetings yet"
              description="Start a meeting to collaborate with your AI agents"
              action={
                <Button onClick={onCreateMeeting} icon={Icons.Plus}>
                  Start Meeting
                </Button>
              }
            />
          ) : (
            meetings.map(meeting => (
              <Card 
                key={meeting.id}
                interactive
                className="meeting-card hover-lift"
                onClick={() => setSelectedMeeting(meeting)}
              >
                <div className="meeting-card-header">
                  <span className="meeting-icon">💬</span>
                  <Badge variant={meeting.status === 'active' ? 'success' : 'gray'}>
                    {meeting.status}
                  </Badge>
                </div>
                <h3 className="meeting-name">{meeting.name}</h3>
                <div className="meeting-stats">
                  <span>🤖 {meeting.active_agent_count || 0} agents</span>
                  <span>💬 {meeting.total_messages || 0} messages</span>
                </div>
                <Button variant="secondary" className="meeting-join-btn">
                  Join Meeting
                </Button>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Meeting Room Component
const MeetingRoom = ({ meeting, agents, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  
  const sendMessage = () => {
    if (!inputValue.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      content: inputValue,
      sender_type: 'user',
      sender_name: 'You'
    }]);
    setInputValue('');
  };

  return (
    <div className="meeting-room">
      {/* Header */}
      <div className="meeting-room-header">
        <button className="back-btn" onClick={onBack}>
          <Icons.ChevronLeft /> Back
        </button>
        <h2>{meeting.name}</h2>
        <Badge variant="success">Live</Badge>
      </div>
      
      <div className="meeting-room-content">
        {/* Messages Area */}
        <div className="meeting-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.sender_type}`}>
              <div className="message-avatar">
                {msg.sender_type === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <span className="message-sender">{msg.sender_name}</span>
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="meeting-input-container">
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="meeting-input"
          />
          <Button onClick={sendMessage} icon={Icons.Send}>Send</Button>
        </div>
      </div>
      
      {/* Agents Sidebar */}
      <div className="meeting-agents-sidebar">
        <h3>Active Agents</h3>
        <div className="meeting-agents-list">
          {agents.slice(0, 3).map(agent => (
            <div key={agent.id} className="meeting-agent-item">
              <span className="agent-icon">{agent.icon || '🤖'}</span>
              <span className="agent-name">{agent.name}</span>
              <span className="status-dot status-dot-online" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 🏢 BUSINESSES SECTION
// ============================================================================

const BusinessesSection = ({ businesses, currentBusiness, onSelectBusiness, onCreateBusiness }) => {
  return (
    <div className="businesses-section">
      <div className="section-header-large">
        <div>
          <h1>🏢 My Businesses</h1>
          <p>Manage all your businesses in one place</p>
        </div>
        <Button onClick={onCreateBusiness} icon={Icons.Plus}>
          Add Business
        </Button>
      </div>
      
      <div className="businesses-grid stagger-container">
        {businesses.map(business => (
          <Card 
            key={business.id}
            interactive
            className={classNames(
              'business-card hover-lift',
              currentBusiness?.id === business.id && 'active'
            )}
            onClick={() => onSelectBusiness(business)}
          >
            <div className="business-card-header">
              <span className="business-icon">🏢</span>
              {business.is_primary && <Badge variant="primary">Primary</Badge>}
            </div>
            <h3 className="business-name">{business.name}</h3>
            <p className="business-industry">{business.industry || 'No industry'}</p>
            <div className="business-stats">
              <div className="business-stat">
                <span className="stat-value">{business.agent_count || 0}</span>
                <span className="stat-label">Agents</span>
              </div>
              <div className="business-stat">
                <span className="stat-value">{business.project_count || 0}</span>
                <span className="stat-label">Projects</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 📁 PROJECTS SECTION
// ============================================================================

const ProjectsSection = ({ projects, onCreateProject }) => {
  return (
    <div className="projects-section">
      <div className="section-header-large">
        <div>
          <h1>📁 Projects</h1>
          <p>Track and manage all your projects</p>
        </div>
        <Button onClick={onCreateProject} icon={Icons.Plus}>
          New Project
        </Button>
      </div>
      
      <div className="projects-grid stagger-container">
        {projects.length === 0 ? (
          <EmptyState 
            icon={Icons.FolderKanban}
            title="No projects yet"
            description="Create your first project to get started"
            action={
              <Button onClick={onCreateProject} icon={Icons.Plus}>
                Create Project
              </Button>
            }
          />
        ) : (
          projects.map(project => (
            <Card key={project.id} className="project-card hover-lift">
              <div className="project-card-header">
                <span className="project-icon">📁</span>
                <Badge variant={project.status === 'active' ? 'success' : 'gray'}>
                  {project.status}
                </Badge>
              </div>
              <h3 className="project-name">{project.name}</h3>
              <p className="project-description">{project.description || 'No description'}</p>
              <div className="project-footer">
                <div className="project-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${project.progress || 0}%` }} />
                  </div>
                  <span className="progress-text">{project.progress || 0}%</span>
                </div>
                <span className="project-tasks">{project.task_count || 0} tasks</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 🤖 AGENTS SECTION
// ============================================================================

const AgentsSection = ({ agents, templates, onHireAgent }) => {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  
  const departments = ['all', ...new Set(templates.map(t => t.department))];
  
  const filteredTemplates = selectedDepartment === 'all'
    ? templates
    : templates.filter(t => t.department === selectedDepartment);

  return (
    <div className="agents-section">
      <div className="section-header-large">
        <div>
          <h1>🤖 Agents & Teams</h1>
          <p>Build your AI workforce with specialized agents</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={classNames('tab', activeTab === 'templates' && 'active')}
            onClick={() => setActiveTab('templates')}
          >
            📦 Agent Templates ({templates.length})
          </button>
          <button 
            className={classNames('tab', activeTab === 'hired' && 'active')}
            onClick={() => setActiveTab('hired')}
          >
            🤖 My Agents ({agents.length})
          </button>
        </div>
      </div>
      
      {activeTab === 'templates' && (
        <>
          {/* Department Filter */}
          <div className="filter-bar">
            <span className="filter-label">Department:</span>
            <div className="filter-chips">
              {departments.map(dept => (
                <button 
                  key={dept}
                  className={classNames('filter-chip', selectedDepartment === dept && 'active')}
                  onClick={() => setSelectedDepartment(dept)}
                >
                  {dept === 'all' ? 'All' : dept}
                </button>
              ))}
            </div>
          </div>
          
          {/* Templates Grid */}
          <div className="agents-grid stagger-container">
            {filteredTemplates.map(template => (
              <div key={template.id} className="agent-card hover-lift">
                <div className="agent-avatar">
                  {template.icon || '🤖'}
                </div>
                <h3 className="agent-name">{template.name}</h3>
                <p className="agent-role">{template.department}</p>
                <p className="agent-description">{template.description}</p>
                <div className="agent-footer">
                  <Badge variant="secondary">{template.department}</Badge>
                  <span className="agent-cost">{formatCurrency(template.cost || 0)}/req</span>
                </div>
                <Button 
                  variant="primary" 
                  size="sm"
                  className="hire-btn"
                  onClick={() => onHireAgent(template)}
                >
                  Hire Agent
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
      
      {activeTab === 'hired' && (
        <div className="agents-grid stagger-container">
          {agents.length === 0 ? (
            <EmptyState 
              icon={Icons.Users}
              title="No agents hired yet"
              description="Browse templates and hire your first agent"
              action={
                <Button onClick={() => setActiveTab('templates')}>
                  Browse Templates
                </Button>
              }
            />
          ) : (
            agents.map(agent => (
              <div key={agent.id} className="agent-card hired hover-lift">
                <div className="agent-avatar">
                  {agent.icon || '🤖'}
                </div>
                <h3 className="agent-name">{agent.name}</h3>
                <p className="agent-role">{agent.department}</p>
                <div className="agent-status">
                  <span className={classNames('status-dot', `status-dot-${agent.status === 'available' ? 'online' : 'busy'}`)} />
                  {agent.status}
                </div>
                <div className="agent-stats">
                  <span>{agent.total_requests || 0} requests</span>
                  <span>{formatCurrency(agent.total_cost || 0)} spent</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 🗄️ DATABASE SECTION
// ============================================================================

const DatabaseSection = ({ databases, currentBusiness }) => {
  return (
    <div className="database-section">
      <div className="section-header-large">
        <div>
          <h1>🗄️ Databases</h1>
          <p>Manage your business data</p>
        </div>
        <Button icon={Icons.Plus}>
          New Database
        </Button>
      </div>
      
      <div className="databases-grid stagger-container">
        {databases.length === 0 ? (
          <EmptyState 
            icon={Icons.Database}
            title="No databases yet"
            description="Create a database to store your business data"
            action={<Button icon={Icons.Plus}>Create Database</Button>}
          />
        ) : (
          databases.map(db => (
            <Card key={db.id} className="database-card hover-lift">
              <span className="database-icon">🗄️</span>
              <h3>{db.name}</h3>
              <p>{db.description || 'No description'}</p>
              <span className="database-tables">{db.table_count || 0} tables</span>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 🔌 INTEGRATIONS SECTION
// ============================================================================

const IntegrationsSection = ({ apiKeys, connectedProviders, onSaveApiKey, onDisconnect }) => {
  const [showKey, setShowKey] = useState({});
  const [editingKey, setEditingKey] = useState({});
  
  const llmProviders = [
    { id: 'anthropic', name: 'Anthropic', icon: '🧠', description: 'Claude AI models' },
    { id: 'openai', name: 'OpenAI', icon: '🤖', description: 'GPT models' },
    { id: 'google', name: 'Google AI', icon: '🔮', description: 'Gemini models' },
    { id: 'mistral', name: 'Mistral', icon: '🌬️', description: 'Mistral models' },
    { id: 'cohere', name: 'Cohere', icon: '💬', description: 'Command models' },
    { id: 'deepseek', name: 'DeepSeek', icon: '🔍', description: 'DeepSeek models' },
    { id: 'perplexity', name: 'Perplexity', icon: '🌐', description: 'Online LLM' },
    { id: 'ollama', name: 'Ollama', icon: '🦙', description: 'Local models' },
  ];

  return (
    <div className="integrations-section">
      <div className="section-header-large">
        <div>
          <h1>🔌 Integrations</h1>
          <p>Connect your favorite tools and AI providers</p>
        </div>
      </div>
      
      {/* LLM Providers */}
      <div className="integration-category">
        <h2>🧠 AI Language Models</h2>
        <div className="integrations-grid stagger-container">
          {llmProviders.map(provider => (
            <Card key={provider.id} className="integration-card">
              <div className="integration-header">
                <span className="integration-icon">{provider.icon}</span>
                <div>
                  <h3>{provider.name}</h3>
                  <p>{provider.description}</p>
                </div>
                {connectedProviders.includes(provider.id) && (
                  <Badge variant="success">Connected</Badge>
                )}
              </div>
              
              <div className="api-key-input">
                <div className="input-with-toggle">
                  <input 
                    type={showKey[provider.id] ? 'text' : 'password'}
                    value={editingKey[provider.id] ?? apiKeys[provider.id] ?? ''}
                    onChange={(e) => setEditingKey({ ...editingKey, [provider.id]: e.target.value })}
                    placeholder="Enter API key..."
                  />
                  <button 
                    className="toggle-visibility"
                    onClick={() => setShowKey({ ...showKey, [provider.id]: !showKey[provider.id] })}
                  >
                    {showKey[provider.id] ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>
                <div className="api-key-actions">
                  <Button 
                    size="sm"
                    onClick={() => {
                      onSaveApiKey(provider.id, editingKey[provider.id] || apiKeys[provider.id]);
                      setEditingKey({ ...editingKey, [provider.id]: undefined });
                    }}
                  >
                    Save
                  </Button>
                  {connectedProviders.includes(provider.id) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDisconnect(provider.id)}
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ⚙️ ACCOUNT SECTION
// ============================================================================

const AccountSection = ({ user, darkMode, onToggleDarkMode }) => {
  return (
    <div className="account-section">
      <div className="section-header-large">
        <div>
          <h1>⚙️ My Account</h1>
          <p>Manage your profile and preferences</p>
        </div>
      </div>
      
      {/* Profile Card */}
      <Card className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.name.charAt(0)}
          </div>
          <div className="profile-info">
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
          <Button variant="secondary" icon={Icons.Edit}>
            Edit Profile
          </Button>
        </div>
      </Card>
      
      {/* Settings */}
      <Card className="settings-card">
        <h3>Preferences</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-icon">{darkMode ? '🌙' : '☀️'}</span>
            <div>
              <h4>Dark Mode</h4>
              <p>Use dark theme for the interface</p>
            </div>
          </div>
          <div 
            className={classNames('toggle', darkMode && 'active')}
            onClick={onToggleDarkMode}
          />
        </div>
        
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-icon">🔔</span>
            <div>
              <h4>Notifications</h4>
              <p>Receive alerts and updates</p>
            </div>
          </div>
          <div className="toggle active" />
        </div>
        
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-icon">🔒</span>
            <div>
              <h4>Two-Factor Authentication</h4>
              <p>Add an extra layer of security</p>
            </div>
          </div>
          <Button variant="secondary" size="sm">Enable</Button>
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// 📝 MODALS
// ============================================================================

// Create Business Modal
const CreateBusinessModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name, industry);
    setLoading(false);
    setName('');
    setIndustry('');
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Create New Business"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} loading={loading}>Create Business</Button>
        </>
      }
    >
      <div className="modal-form">
        <Input 
          label="Business Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter business name..."
        />
        <Input 
          label="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g., Technology, Healthcare, Finance..."
        />
      </div>
    </Modal>
  );
};

// Create Project Modal
const CreateProjectModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name, description);
    setLoading(false);
    setName('');
    setDescription('');
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Create New Project"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} loading={loading}>Create Project</Button>
        </>
      }
    >
      <div className="modal-form">
        <Input 
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter project name..."
        />
        <div className="input-group">
          <label className="input-label">Description</label>
          <textarea 
            className="input textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your project..."
            rows={4}
          />
        </div>
      </div>
    </Modal>
  );
};

// Create Meeting Modal
const CreateMeetingModal = ({ isOpen, onClose, onCreate, agents }) => {
  const [name, setName] = useState('');
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name, selectedAgents);
    setLoading(false);
    setName('');
    setSelectedAgents([]);
  };
  
  const toggleAgent = (agentId) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Start New Meeting"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} loading={loading}>Start Meeting</Button>
        </>
      }
    >
      <div className="modal-form">
        <Input 
          label="Meeting Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter meeting name..."
        />
        
        <div className="input-group">
          <label className="input-label">Invite Agents (optional)</label>
          <div className="agent-select-grid">
            {agents.map(agent => (
              <div 
                key={agent.id}
                className={classNames('agent-select-item', selectedAgents.includes(agent.id) && 'selected')}
                onClick={() => toggleAgent(agent.id)}
              >
                <span className="agent-icon">{agent.icon || '🤖'}</span>
                <span className="agent-name">{agent.name}</span>
                {selectedAgents.includes(agent.id) && <Icons.Check />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Hire Agent Modal
const HireAgentModal = ({ isOpen, onClose, template, onHire }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (template) {
      setName(template.name);
    }
  }, [template]);
  
  const handleHire = async () => {
    if (!template) return;
    setLoading(true);
    await onHire(template.id, name || template.name);
    setLoading(false);
    setName('');
  };

  if (!template) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Hire Agent"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleHire} loading={loading}>Hire Agent</Button>
        </>
      }
    >
      <div className="hire-agent-preview">
        <div className="agent-preview-card">
          <div className="agent-avatar large">
            {template.icon || '🤖'}
          </div>
          <h3>{template.name}</h3>
          <Badge variant="secondary">{template.department}</Badge>
          <p>{template.description}</p>
          <div className="agent-preview-cost">
            <span>Cost per request:</span>
            <strong>{formatCurrency(template.cost || 0)}</strong>
          </div>
        </div>
        
        <div className="modal-form">
          <Input 
            label="Agent Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customize agent name..."
          />
        </div>
      </div>
    </Modal>
  );
};

export default App;
