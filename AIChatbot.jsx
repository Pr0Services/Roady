/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🤖 ROADY - AI CHATBOT ASSISTANT                                            ║
║   Personal assistant with full database access                               ║
║                                                                              ║
║   Features:                                                                  ║
║   • Full conversation interface                                              ║
║   • Access to all user data                                                  ║
║   • Integrates with OpenAI or Claude                                         ║
║   • Context-aware responses                                                  ║
║   • Action suggestions                                                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// 🤖 AI CHATBOT COMPONENT
// ============================================================================

const AIChatbot = ({
  isExpanded = false,
  onToggleExpand,
  // Data access
  userData = {},
  businesses = [],
  currentBusiness = null,
  agents = [],
  projects = [],
  meetings = [],
  databases = [],
  // API Config
  apiProvider = 'openai', // 'openai' or 'anthropic'
  apiKey = null,
  // Callbacks
  onCreateMeeting,
  onCreateTask,
  onHireAgent,
  onNavigate
}) => {
  
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Bonjour! 👋 Je suis ton assistant personnel ROADY. 

J'ai accès à toutes tes données:
• ${businesses.length} business(es)
• ${agents.length} agent(s)
• ${projects.length} projet(s)
• ${meetings.length} meeting(s)

Comment puis-je t'aider aujourd'hui?`,
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState([
    { label: '📊 Résumé de mon business', action: 'business_summary' },
    { label: '📅 Créer un meeting', action: 'create_meeting' },
    { label: '🤖 Suggérer des agents', action: 'suggest_agents' },
    { label: '📈 Analyser ma productivité', action: 'analyze_productivity' }
  ]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Auto-scroll to bottom
  // ─────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Build context for AI
  // ─────────────────────────────────────────────────────────────────────────
  
  const buildContext = () => {
    return `
Tu es l'assistant personnel de ${userData.name || 'l'utilisateur'} dans l'application ROADY.
Tu as accès aux données suivantes:

UTILISATEUR:
- Nom: ${userData.name || 'Non défini'}
- Email: ${userData.email || 'Non défini'}

BUSINESSES (${businesses.length}):
${businesses.map(b => `- ${b.name} (${b.industry || 'Pas d\'industrie'})`).join('\n') || 'Aucun business'}

BUSINESS ACTUEL: ${currentBusiness?.name || 'Aucun sélectionné'}

AGENTS (${agents.length}):
${agents.slice(0, 10).map(a => `- ${a.name}: ${a.role || 'Agent'} (${a.status || 'disponible'})`).join('\n') || 'Aucun agent'}

PROJETS (${projects.length}):
${projects.slice(0, 5).map(p => `- ${p.name}: ${p.status || 'actif'}`).join('\n') || 'Aucun projet'}

MEETINGS RÉCENTS (${meetings.length}):
${meetings.slice(0, 5).map(m => `- ${m.name}: ${m.status || 'actif'}`).join('\n') || 'Aucun meeting'}

Tu peux:
1. Répondre aux questions sur les données
2. Suggérer des actions (créer meeting, assigner tâches, embaucher agents)
3. Analyser et donner des insights
4. Aider à organiser le travail

Réponds de manière concise et utile. Utilise des emojis pour être plus amical.
Si tu suggères une action, indique-la clairement avec [ACTION: nom_action].
`;
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // Send message to AI
  // ─────────────────────────────────────────────────────────────────────────
  
  const sendToAI = async (userMessage) => {
    if (!apiKey) {
      return {
        content: "⚠️ Aucune clé API configurée. Va dans les paramètres pour ajouter ta clé OpenAI ou Claude.",
        actions: []
      };
    }
    
    const context = buildContext();
    
    try {
      if (apiProvider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: context },
              ...messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
              })),
              { role: 'user', content: userMessage }
            ],
            max_tokens: 1000,
            temperature: 0.7
          })
        });
        
        const data = await response.json();
        return {
          content: data.choices?.[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.",
          actions: []
        };
        
      } else if (apiProvider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            system: context,
            messages: [
              ...messages.slice(-10).map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
              })),
              { role: 'user', content: userMessage }
            ]
          })
        });
        
        const data = await response.json();
        return {
          content: data.content?.[0]?.text || "Désolé, je n'ai pas pu générer une réponse.",
          actions: []
        };
      }
      
    } catch (error) {
      console.error('AI Error:', error);
      return {
        content: `❌ Erreur de connexion à l'API: ${error.message}`,
        actions: []
      };
    }
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // Handle send message
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    
    // Show typing indicator
    setIsLoading(true);
    setIsTyping(true);
    
    // Get AI response
    const response = await sendToAI(userMessage);
    
    // Add AI response
    const aiMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      actions: response.actions
    };
    
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
    setIsTyping(false);
    
    // Update suggested actions based on conversation
    updateSuggestedActions(userMessage, response.content);
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // Handle quick action
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleQuickAction = (action) => {
    const actionMessages = {
      'business_summary': `Donne-moi un résumé complet de mon business "${currentBusiness?.name || 'principal'}"`,
      'create_meeting': 'Je veux créer un nouveau meeting',
      'suggest_agents': 'Quels agents me suggères-tu d\'embaucher pour améliorer mon équipe?',
      'analyze_productivity': 'Analyse ma productivité et donne-moi des recommandations'
    };
    
    setInputValue(actionMessages[action] || '');
    inputRef.current?.focus();
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // Update suggested actions
  // ─────────────────────────────────────────────────────────────────────────
  
  const updateSuggestedActions = (userMessage, aiResponse) => {
    // Simple logic to update suggestions based on conversation
    const lowerMsg = userMessage.toLowerCase();
    const lowerResp = aiResponse.toLowerCase();
    
    let newSuggestions = [];
    
    if (lowerMsg.includes('meeting') || lowerResp.includes('meeting')) {
      newSuggestions.push({ label: '📅 Créer le meeting', action: 'create_meeting' });
    }
    if (lowerMsg.includes('agent') || lowerResp.includes('agent')) {
      newSuggestions.push({ label: '🤖 Voir les agents disponibles', action: 'view_agents' });
    }
    if (lowerMsg.includes('projet') || lowerMsg.includes('project')) {
      newSuggestions.push({ label: '📁 Créer un projet', action: 'create_project' });
    }
    
    // Keep some defaults
    if (newSuggestions.length < 4) {
      newSuggestions.push({ label: '💡 Autres suggestions', action: 'more_suggestions' });
    }
    
    setSuggestedActions(newSuggestions.slice(0, 4));
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // Handle key press
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // Format timestamp
  // ─────────────────────────────────────────────────────────────────────────
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  
  return (
    <div className={`ai-chatbot ${isExpanded ? 'expanded' : 'collapsed'}`}>
      
      {/* Header */}
      <div className="chatbot-header" onClick={onToggleExpand}>
        <div className="chatbot-avatar">
          <span className="avatar-icon">🤖</span>
          <span className={`status-dot ${isLoading ? 'thinking' : 'online'}`}></span>
        </div>
        <div className="chatbot-info">
          <h3>ROADY Assistant</h3>
          <p>{isTyping ? 'En train d\'écrire...' : 'En ligne'}</p>
        </div>
        <button className="expand-btn">
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>
      
      {isExpanded && (
        <>
          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`message ${message.role}`}
              >
                {message.role === 'assistant' && (
                  <div className="message-avatar">🤖</div>
                )}
                <div className="message-content">
                  <div className="message-text">
                    {message.content.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < message.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
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
          
          {/* Quick Actions */}
          <div className="chatbot-quick-actions">
            {suggestedActions.map((action, index) => (
              <button
                key={index}
                className="quick-action-btn"
                onClick={() => handleQuickAction(action.action)}
              >
                {action.label}
              </button>
            ))}
          </div>
          
          {/* Input */}
          <div className="chatbot-input">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Écris ton message..."
              rows={1}
              disabled={isLoading}
            />
            <button 
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>
          
          {/* API Status */}
          {!apiKey && (
            <div className="api-warning">
              ⚠️ Configure ta clé API dans les paramètres
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AIChatbot;
