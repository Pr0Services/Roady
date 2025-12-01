/**
 * ROADY - Advanced Analytics Dashboard
 * KPIs, graphiques, métriques en temps réel
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle,
  Clock, DollarSign, Users, Shield, Target, Calendar, RefreshCw,
  Download, Filter, ChevronRight, BarChart3, Activity
} from 'lucide-react';

interface KPI {
  name: string;
  value: number;
  unit: string;
  trend: number;
  trend_direction: 'up' | 'down' | 'stable';
  target?: number;
  benchmark?: number;
}

interface ProjectMetric {
  project_id: string;
  name: string;
  progress: number;
  budget_used: number;
  budget_total: number;
  days_remaining: number;
  tasks_completed: number;
  tasks_total: number;
  team_size: number;
  productivity_score: number;
  safety_score: number;
  on_schedule: boolean;
  on_budget: boolean;
}

interface Alert {
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  action: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const AnalyticsDashboard: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'quarter'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [projects, setProjects] = useState<ProjectMetric[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/dashboard?period=${period}`);
      const data = await response.json();
      
      setKpis(data.kpis || []);
      setProjects(data.projects_overview || []);
      setTimelineData(data.timeline_data || []);
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      // Mock data for demo
      setKpis([
        { name: 'Taux de complétion', value: 87.5, unit: '%', trend: 5.2, trend_direction: 'up', target: 95, benchmark: 87 },
        { name: 'Livraison à temps', value: 82.3, unit: '%', trend: 3.1, trend_direction: 'up', target: 90, benchmark: 78 },
        { name: 'Respect du budget', value: 94.2, unit: '%', trend: -2.1, trend_direction: 'down', target: 100, benchmark: 92 },
        { name: 'Productivité', value: 12.4, unit: 'tasks/j', trend: 8.5, trend_direction: 'up', target: 15, benchmark: 12 },
        { name: 'Score sécurité', value: 91.0, unit: '%', trend: 3.0, trend_direction: 'up', target: 95, benchmark: 88 },
        { name: 'Utilisation', value: 78.5, unit: '%', trend: 1.5, trend_direction: 'up', target: 85, benchmark: 75 },
      ]);
      setProjects([
        { project_id: '1', name: 'Tour Montréal', progress: 72, budget_used: 680000, budget_total: 890000, days_remaining: 45, tasks_completed: 156, tasks_total: 210, team_size: 8, productivity_score: 8.5, safety_score: 92, on_schedule: true, on_budget: true },
        { project_id: '2', name: 'Résidence Laval', progress: 100, budget_used: 450000, budget_total: 450000, days_remaining: 0, tasks_completed: 98, tasks_total: 98, team_size: 5, productivity_score: 9.2, safety_score: 95, on_schedule: true, on_budget: true },
        { project_id: '3', name: 'Entrepôt Logistique', progress: 45, budget_used: 380000, budget_total: 620000, days_remaining: 60, tasks_completed: 67, tasks_total: 145, team_size: 6, productivity_score: 7.1, safety_score: 78, on_schedule: false, on_budget: true },
      ]);
      setTimelineData([
        { date: '01/11', tasks: 12, hours: 85 },
        { date: '02/11', tasks: 15, hours: 92 },
        { date: '03/11', tasks: 8, hours: 65 },
        { date: '04/11', tasks: 18, hours: 110 },
        { date: '05/11', tasks: 14, hours: 88 },
        { date: '06/11', tasks: 22, hours: 125 },
        { date: '07/11', tasks: 16, hours: 95 },
      ]);
      setAlerts([
        { type: 'warning', title: '3 tâches en retard', description: 'Projet Entrepôt Logistique', action: 'Voir' },
        { type: 'critical', title: 'Score sécurité bas', description: 'Score de 78% détecté', action: 'Détails' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (direction: string) => {
    if (direction === 'up') return <TrendingUp size={16} className="text-green-400" />;
    if (direction === 'down') return <TrendingDown size={16} className="text-red-400" />;
    return <Minus size={16} className="text-slate-400" />;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Radar chart data for project comparison
  const radarData = projects.map(p => ({
    name: p.name.substring(0, 10),
    progress: p.progress,
    budget: (p.budget_used / p.budget_total) * 100,
    productivity: p.productivity_score * 10,
    safety: p.safety_score,
    team: p.team_size * 10
  }));

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="text-blue-400" />
              Analytics Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Vue d'ensemble des performances</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
            >
              <option value="day">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
            </select>
            
            <button
              onClick={fetchDashboardData}
              className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600">
              <Download size={18} />
              Exporter
            </button>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  alert.type === 'critical' 
                    ? 'bg-red-500/10 border-red-500/50' 
                    : 'bg-yellow-500/10 border-yellow-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className={alert.type === 'critical' ? 'text-red-400' : 'text-yellow-400'} />
                  <div>
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm text-slate-400">{alert.description}</div>
                  </div>
                </div>
                <button className="text-sm text-blue-400 hover:underline">{alert.action}</button>
              </div>
            ))}
          </div>
        )}

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">{kpi.name}</span>
                {getTrendIcon(kpi.trend_direction)}
              </div>
              <div className="text-2xl font-bold">
                {kpi.value.toLocaleString()}<span className="text-sm text-slate-400 ml-1">{kpi.unit}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs ${kpi.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {kpi.trend >= 0 ? '+' : ''}{kpi.trend}%
                </span>
                {kpi.target && (
                  <span className="text-xs text-slate-500">
                    Cible: {kpi.target}{kpi.unit}
                  </span>
                )}
              </div>
              {/* Progress to target */}
              {kpi.target && (
                <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${kpi.value >= kpi.target ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (kpi.value / kpi.target) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Timeline Chart */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity size={20} className="text-blue-400" />
              Activité quotidienne
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorTasks)"
                  name="Tâches"
                />
                <Line type="monotone" dataKey="hours" stroke="#10b981" name="Heures" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Comparison */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target size={20} className="text-purple-400" />
              Comparaison projets
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData[0] ? [
                { metric: 'Progression', ...Object.fromEntries(projects.map(p => [p.name, p.progress])) },
                { metric: 'Budget', ...Object.fromEntries(projects.map(p => [p.name, (p.budget_used/p.budget_total)*100])) },
                { metric: 'Productivité', ...Object.fromEntries(projects.map(p => [p.name, p.productivity_score*10])) },
                { metric: 'Sécurité', ...Object.fromEntries(projects.map(p => [p.name, p.safety_score])) },
              ] : []}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" stroke="#64748b" fontSize={11} />
                <PolarRadiusAxis stroke="#64748b" fontSize={10} />
                {projects.slice(0, 3).map((p, i) => (
                  <Radar
                    key={p.project_id}
                    name={p.name}
                    dataKey={p.name}
                    stroke={COLORS[i]}
                    fill={COLORS[i]}
                    fillOpacity={0.2}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Projets en cours</h3>
            <button className="text-blue-400 text-sm hover:underline flex items-center gap-1">
              Voir tout <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50">
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Projet</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Progression</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Budget</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Équipe</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Sécurité</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.project_id} className="border-t border-slate-700 hover:bg-slate-700/30">
                    <td className="p-4">
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-slate-400">
                        {project.tasks_completed}/{project.tasks_total} tâches • {project.days_remaining}j restants
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(project.progress)}`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        ${(project.budget_used / 1000).toFixed(0)}K / ${(project.budget_total / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-slate-400">
                        {((project.budget_used / project.budget_total) * 100).toFixed(0)}% utilisé
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-400" />
                        <span>{project.team_size}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                        project.safety_score >= 90 ? 'bg-green-500/20 text-green-400' :
                        project.safety_score >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        <Shield size={14} />
                        {project.safety_score}%
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {project.on_schedule ? (
                          <span className="flex items-center gap-1 text-green-400 text-sm">
                            <CheckCircle size={14} /> À temps
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 text-sm">
                            <Clock size={14} /> En retard
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
