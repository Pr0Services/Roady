/**
 * ROADY Meeting Rooms - Revolutionary Multi-Agent Collaboration
 * React Component - Full Implementation
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, MessageSquare, Settings, DollarSign, Zap, 
  UserPlus, UserMinus, Send, Paperclip, Download,
  Play, Pause, Square, BarChart3, Archive
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface Agent {
  id: string;
  name: string;
  department: string;
  priority: number;
  status: 'active' | 'available' | 'busy' | 'inactive';
  avatar?: string;
  costPerRequest: number;
}

interface Message {
  id: string;
  senderId: string;
  senderType: 'user' | 'agent';
  senderName: string;
  content: string;
  timestamp: Date;
  tokens: number;
  cost: number;
}

interface Meeting {
  id: string;
  name: string;
  participants: Agent[];
  status: 'active' | 'paused' | 'ended';
  startedAt: Date;
  tokensUsed: number;
  tokensLimit: number;
  costSoFar: number;
  costLimit: number;
  messages: Message[];
  mode: 'round-robin' | 'free' | 'moderated' | 'hierarchical';
  projectId?: string;
  taskId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MEETING ROOM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const MeetingRoom: React.FC<{ meetingId: string }> = ({ meetingId }) => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [message, setMessage] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showTokenPanel, setShowTokenPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/meetings/${meetingId}/ws`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
        setMeeting(prev => prev ? {
          ...prev,
          messages: [...prev.messages, data.message],
          tokensUsed: data.tokensUsed,
          costSoFar: data.costSoFar
        } : null);
      } else if (data.type === 'agent_joined') {
        setMeeting(prev => prev ? {
          ...prev,
          participants: [...prev.participants, data.agent]
        } : null);
      } else if (data.type === 'agent_left') {
        setMeeting(prev => prev ? {
          ...prev,
          participants: prev.participants.filter(a => a.id !== data.agentId)
        } : null);
      }
    };

    wsRef.current = ws;

    return () => ws.close();
  }, [meetingId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [meeting?.messages]);

  // Load meeting data
  useEffect(() => {
    fetch(`/api/meetings/${meetingId}`)
      .then(res => res.json())
      .then(data => setMeeting(data));
  }, [meetingId]);

  const sendMessage = async () => {
    if (!message.trim() || !meeting) return;

    const response = await fetch(`/api/meetings/${meetingId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message,
        mode: meeting.mode,
        targetAgentId: selectedAgent
      })
    });

    if (response.ok) {
      setMessage('');
      setSelectedAgent(null);
    }
  };

  const addAgent = async (agentId: string) => {
    await fetch(`/api/meetings/${meetingId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId })
    });
    setShowAddAgent(false);
  };

  const removeAgent = async (agentId: string) => {
    await fetch(`/api/meetings/${meetingId}/participants/${agentId}`, {
      method: 'DELETE'
    });
  };

  const pauseMeeting = async () => {
    await fetch(`/api/meetings/${meetingId}/pause`, { method: 'POST' });
  };

  const endMeeting = async () => {
    if (confirm('End this meeting? You can view the transcript later.')) {
      await fetch(`/api/meetings/${meetingId}/end`, { method: 'POST' });
      window.location.href = '/meetings';
    }
  };

  if (!meeting) return <div className="p-8 text-center">Loading meeting...</div>;

  const tokenPercentage = (meeting.tokensUsed / meeting.tokensLimit) * 100;
  const costPercentage = (meeting.costSoFar / meeting.costLimit) * 100;

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Left Sidebar - Participants */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">{meeting.name}</h2>
          <p className="text-sm text-gray-500">
            {meeting.participants.length}/8 participants
          </p>
        </div>

        {/* Active Participants */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            In Meeting
          </h3>
          {meeting.participants.map(agent => (
            <div 
              key={agent.id}
              className="flex items-center justify-between p-2 mb-2 rounded hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  agent.status === 'active' ? 'bg-green-500' :
                  agent.status === 'busy' ? 'bg-yellow-500' :
                  'bg-gray-300'
                }`} />
                <div>
                  <p className="text-sm font-medium">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.department}</p>
                </div>
              </div>
              <button
                onClick={() => removeAgent(agent.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <UserMinus className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={() => setShowAddAgent(true)}
            className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Agent
          </button>
        </div>

        {/* Meeting Info */}
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">
                {Math.floor((Date.now() - meeting.startedAt.getTime()) / 60000)}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tokens:</span>
              <span className={`font-medium ${tokenPercentage > 75 ? 'text-orange-500' : ''}`}>
                {meeting.tokensUsed.toLocaleString()}/{meeting.tokensLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  tokenPercentage > 90 ? 'bg-red-500' :
                  tokenPercentage > 75 ? 'bg-orange-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${Math.min(tokenPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cost:</span>
              <span className="font-medium">
                ${meeting.costSoFar.toFixed(2)}/${meeting.costLimit.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={pauseMeeting}
              className="flex-1 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center justify-center gap-1"
            >
              <Pause className="w-4 h-4" />
            </button>
            <button
              onClick={endMeeting}
              className="flex-1 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center gap-1"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTokenPanel(!showTokenPanel)}
              className="flex-1 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center justify-center gap-1"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <MessageSquare className="w-5 h-5 text-gray-500" />
            <div>
              <h1 className="font-semibold">{meeting.name}</h1>
              <p className="text-sm text-gray-500">
                Mode: {meeting.mode.replace('-', ' ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded">
              <Paperclip className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Download className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {meeting.messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.senderType === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                msg.senderType === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {msg.senderName[0]}
              </div>
              <div className={`max-w-lg ${
                msg.senderType === 'user' ? 'items-end' : 'items-start'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{msg.senderName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className={`rounded-lg p-3 ${
                  msg.senderType === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200'
                }`}>
                  {msg.content}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{msg.tokens} tokens</span>
                  <span>${msg.cost.toFixed(4)}</span>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          {meeting.mode === 'moderated' && (
            <div className="mb-2 flex gap-2">
              <span className="text-sm text-gray-600">Call agent:</span>
              {meeting.participants.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedAgent === agent.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {agent.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            @ mention an agent or use / commands
          </p>
        </div>
      </div>

      {/* Token Management Panel (Conditional) */}
      {showTokenPanel && (
        <TokenManagementPanel
          meeting={meeting}
          onClose={() => setShowTokenPanel(false)}
        />
      )}

      {/* Add Agent Modal (Conditional) */}
      {showAddAgent && (
        <AddAgentModal
          meetingId={meetingId}
          currentParticipants={meeting.participants}
          onAdd={addAgent}
          onClose={() => setShowAddAgent(false)}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN MANAGEMENT PANEL
// ═══════════════════════════════════════════════════════════════════════════

const TokenManagementPanel: React.FC<{
  meeting: Meeting;
  onClose: () => void;
}> = ({ meeting, onClose }) => {
  
  const [optimizations, setOptimizations] = useState({
    compression: false,
    pruning: false,
    summarization: false
  });

  const applyOptimization = async (type: string) => {
    await fetch(`/api/meetings/${meeting.id}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
  };

  // Calculate per-agent token usage
  const agentUsage = meeting.participants.map(agent => {
    const agentMessages = meeting.messages.filter(m => m.senderId === agent.id);
    const tokens = agentMessages.reduce((sum, m) => sum + m.tokens, 0);
    return { agent, tokens, percentage: (tokens / meeting.tokensUsed) * 100 };
  });

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Token Management</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Overall Usage */}
        <div>
          <h4 className="text-sm font-medium mb-2">Overall Usage</h4>
          <div className="text-2xl font-bold">
            {meeting.tokensUsed.toLocaleString()}
            <span className="text-sm text-gray-500 font-normal">
              /{meeting.tokensLimit.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${(meeting.tokensUsed / meeting.tokensLimit) * 100}%` }}
            />
          </div>
        </div>

        {/* Per-Agent Usage */}
        <div>
          <h4 className="text-sm font-medium mb-2">Per-Agent Usage</h4>
          {agentUsage.map(({ agent, tokens, percentage }) => (
            <div key={agent.id} className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>{agent.name}</span>
                <span className="text-gray-600">{tokens} tokens</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="h-1.5 rounded-full bg-blue-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Optimization Options */}
        <div>
          <h4 className="text-sm font-medium mb-2">Optimization Options</h4>
          
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">Compress History</p>
                  <p className="text-xs text-gray-500">Saves ~2,000 tokens</p>
                </div>
                <button
                  onClick={() => applyOptimization('compression')}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="p-3 border border-gray-200 rounded">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">Context Pruning</p>
                  <p className="text-xs text-gray-500">Saves ~30-40%</p>
                </div>
                <button
                  onClick={() => applyOptimization('pruning')}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Enable
                </button>
              </div>
            </div>

            <div className="p-3 border border-gray-200 rounded">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">Smart Summarization</p>
                  <p className="text-xs text-gray-500">Auto-compress long messages</p>
                </div>
                <button
                  onClick={() => applyOptimization('summarization')}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Enable
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projected Usage */}
        <div className="p-3 bg-blue-50 rounded">
          <h4 className="text-sm font-medium mb-1">Projection</h4>
          <p className="text-xs text-gray-600">
            At current rate: {Math.round(meeting.tokensUsed * 1.5).toLocaleString()} tokens in 60 min
          </p>
          <p className="text-xs text-gray-600">
            Estimated cost: ${(meeting.costSoFar * 1.5).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ADD AGENT MODAL
// ═══════════════════════════════════════════════════════════════════════════

const AddAgentModal: React.FC<{
  meetingId: string;
  currentParticipants: Agent[];
  onAdd: (agentId: string) => void;
  onClose: () => void;
}> = ({ meetingId, currentParticipants, onAdd, onClose }) => {
  
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);

  useEffect(() => {
    fetch('/api/agents?status=available')
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(
          (agent: Agent) => !currentParticipants.find(p => p.id === agent.id)
        );
        setAvailableAgents(filtered);
      });
  }, [currentParticipants]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add Agent to Meeting</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-gray-600 mb-4">
            {availableAgents.length} agents available • {8 - currentParticipants.length} spots remaining
          </p>

          <div className="grid gap-3">
            {availableAgents.map(agent => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded hover:border-blue-500"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                    {agent.name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-gray-500">{agent.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-gray-600">~${agent.costPerRequest.toFixed(2)}/request</p>
                    <p className="text-xs text-gray-500">Priority: {'⭐'.repeat(agent.priority)}</p>
                  </div>
                  <button
                    onClick={() => onAdd(agent.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
