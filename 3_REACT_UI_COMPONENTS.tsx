/**
 * ROADY React UI Components
 * Main dashboard and agent activation interface
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, DollarSign, Activity, AlertTriangle, 
  CheckCircle, XCircle, Clock, Zap 
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const Dashboard = () => {
  const [stats, setStats] = useState({
    activeAgents: 24,
    totalAgents: 168,
    budget: { used: 423.50, limit: 1000 },
    tasksToday: 47,
    avgQuality: 4.3
  });

  const budgetPercent = (stats.budget.used / stats.budget.limit) * 100;
  const budgetStatus = budgetPercent >= 95 ? 'critical' : budgetPercent >= 85 ? 'warning' : 'ok';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ROADY Dashboard</h1>
        <Button onClick={() => window.location.href = '/activate-agent'}>
          + Activate Agent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Active Agents"
          value={`${stats.activeAgents}/${stats.totalAgents}`}
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="Budget Used"
          value={`$${stats.budget.used}/$${stats.budget.limit}`}
          icon={<DollarSign className="h-6 w-6" />}
          color={budgetStatus === 'critical' ? 'red' : budgetStatus === 'warning' ? 'yellow' : 'green'}
          subtitle={`${budgetPercent.toFixed(1)}% used`}
        />
        <StatsCard
          title="Tasks Today"
          value={stats.tasksToday}
          icon={<Activity className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="Avg Quality"
          value={stats.avgQuality.toFixed(1)}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
          subtitle="out of 5.0"
        />
      </div>

      {/* Budget Alert */}
      {budgetStatus !== 'ok' && (
        <BudgetAlert status={budgetStatus} percent={budgetPercent} />
      )}

      {/* Active Agents */}
      <Card>
        <CardHeader>
          <CardTitle>Active Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <AgentsList />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline />
        </CardContent>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STATS CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const StatsCard = ({ title, value, icon, color, subtitle }) => {
  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`${colorMap[color]} p-3 rounded-lg text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// BUDGET ALERT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const BudgetAlert = ({ status, percent }) => {
  const alerts = {
    warning: {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Budget Warning',
      message: `You've used ${percent.toFixed(1)}% of your monthly budget. Consider optimizing LLM usage.`,
      color: 'yellow'
    },
    critical: {
      icon: <XCircle className="h-5 w-5" />,
      title: 'Budget Critical',
      message: `You've used ${percent.toFixed(1)}% of your monthly budget! Auto-optimization will trigger soon.`,
      color: 'red'
    }
  };

  const alert = alerts[status];

  return (
    <div className={`border-l-4 border-${alert.color}-500 bg-${alert.color}-50 p-4 rounded`}>
      <div className="flex items-start">
        <div className={`text-${alert.color}-600 mr-3`}>
          {alert.icon}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-${alert.color}-800`}>{alert.title}</h3>
          <p className={`text-sm text-${alert.color}-700 mt-1`}>{alert.message}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline">View Details</Button>
            <Button size="sm">Optimize Now</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// AGENTS LIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const AgentsList = () => {
  const agents = [
    { 
      id: 'copywriter', 
      name: 'Copywriter', 
      department: 'Creative',
      llm: 'Claude Sonnet 4',
      usage: 145,
      cost: 2.70,
      quality: 4.8,
      status: 'active'
    },
    { 
      id: 'graphic_designer', 
      name: 'Graphic Designer', 
      department: 'Creative',
      llm: 'GPT-4o',
      usage: 89,
      cost: 3.20,
      quality: 4.9,
      status: 'active'
    },
    { 
      id: 'backend_developer', 
      name: 'Backend Developer', 
      department: 'Technology',
      llm: 'DeepSeek Coder',
      usage: 203,
      cost: 0.98,
      quality: 4.2,
      status: 'active'
    },
  ];

  return (
    <div className="space-y-3">
      {agents.map(agent => (
        <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold">{agent.name}</h4>
              <Badge variant="outline">{agent.department}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">Using: {agent.llm}</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-gray-500">Requests</p>
              <p className="font-semibold">{agent.usage}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Cost</p>
              <p className="font-semibold">${agent.cost}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Quality</p>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{agent.quality}</span>
                <span className="text-yellow-500">★</span>
              </div>
            </div>
            <Button size="sm" variant="ghost">Details</Button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY TIMELINE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const ActivityTimeline = () => {
  const activities = [
    { 
      id: 1, 
      type: 'task_completed',
      agent: 'Copywriter',
      message: 'Completed: Write blog post about AI',
      time: '2 minutes ago',
      icon: <CheckCircle className="h-4 w-4 text-green-500" />
    },
    { 
      id: 2, 
      type: 'agent_activated',
      agent: 'SEO Specialist',
      message: 'Agent activated',
      time: '15 minutes ago',
      icon: <Zap className="h-4 w-4 text-blue-500" />
    },
    { 
      id: 3, 
      type: 'budget_alert',
      message: 'Budget reached 85%',
      time: '1 hour ago',
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />
    },
  ];

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className="mt-1">{activity.icon}</div>
          <div className="flex-1">
            <p className="text-sm">
              {activity.agent && <span className="font-semibold">{activity.agent}: </span>}
              {activity.message}
            </p>
            <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// AGENT ACTIVATION PAGE
// ═══════════════════════════════════════════════════════════════════════════

export const AgentActivationPage = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedLLM, setSelectedLLM] = useState('claude-sonnet-4-20250514');
  const [step, setStep] = useState(1);

  const agents = [
    { id: 'copywriter', name: 'Copywriter', department: 'Creative', required_integrations: [] },
    { id: 'seo_specialist', name: 'SEO Specialist', department: 'Marketing', required_integrations: ['google_search_console'] },
    { id: 'backend_developer', name: 'Backend Developer', department: 'Technology', required_integrations: ['github'] },
  ];

  const llmOptions = [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', cost: '$3/1M tokens', tier: 'standard' },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', cost: '$15/1M tokens', tier: 'premium' },
    { id: 'gpt-4o', name: 'GPT-4o', cost: '$2.50/1M tokens', tier: 'standard' },
    { id: 'gemini-1.5-flash', name: 'Gemini Flash', cost: '$0.075/1M tokens', tier: 'fast' },
  ];

  const handleActivate = () => {
    // API call to activate agent
    console.log('Activating agent:', selectedAgent, 'with LLM:', selectedLLM);
    alert('Agent activated successfully!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Activate New Agent</h1>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        <Step number={1} title="Select Agent" active={step === 1} completed={step > 1} />
        <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
        <Step number={2} title="Choose LLM" active={step === 2} completed={step > 2} />
        <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
        <Step number={3} title="Configure" active={step === 3} completed={step > 3} />
      </div>

      {/* Step 1: Select Agent */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select an Agent</h2>
          {agents.map(agent => (
            <Card 
              key={agent.id}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${selectedAgent?.id === agent.id ? 'border-blue-500 border-2' : ''}`}
              onClick={() => setSelectedAgent(agent)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-sm text-gray-500">{agent.department}</p>
                  </div>
                  {selectedAgent?.id === agent.id && (
                    <CheckCircle className="h-6 w-6 text-blue-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          <Button 
            className="w-full" 
            disabled={!selectedAgent}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: Choose LLM */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Choose LLM Model</h2>
          {llmOptions.map(llm => (
            <Card 
              key={llm.id}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${selectedLLM === llm.id ? 'border-blue-500 border-2' : ''}`}
              onClick={() => setSelectedLLM(llm.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{llm.name}</h3>
                    <p className="text-sm text-gray-500">{llm.cost}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{llm.tier}</Badge>
                    {selectedLLM === llm.id && (
                      <CheckCircle className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1" onClick={() => setStep(3)}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 3: Configure */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Configuration</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Monthly Budget Limit</label>
                <input 
                  type="number" 
                  className="w-full border rounded p-2" 
                  placeholder="$10.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quality Threshold</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="1"
                  max="5"
                  className="w-full border rounded p-2" 
                  placeholder="3.5"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span className="text-sm">Auto-upgrade on low quality</span>
                </label>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button className="flex-1" onClick={handleActivate}>Activate Agent</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const Step = ({ number, title, active, completed }) => (
  <div className="flex items-center gap-2">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold
      ${completed ? 'bg-green-500 text-white' : active ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
      {completed ? '✓' : number}
    </div>
    <span className={`text-sm ${active ? 'font-semibold' : ''}`}>{title}</span>
  </div>
);

export default Dashboard;

