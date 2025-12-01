import React, { useState } from 'react';

export default function ROADYOverview() {
  const [activeTab, setActiveTab] = useState('architecture');

  const tabs = [
    { id: 'architecture', label: '🏗️ Architecture', color: 'blue' },
    { id: 'agents', label: '🤖 Agents', color: 'purple' },
    { id: 'construction', label: '🏠 Construction', color: 'orange' },
    { id: 'tech', label: '💻 Tech Stack', color: 'green' },
    { id: 'status', label: '✅ Status', color: 'emerald' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          🚀 ROADY
        </h1>
        <p className="text-slate-400 mt-2">Resourceful Orchestrated AI for Dynamic Yields</p>
        <p className="text-sm text-slate-500 mt-1">Système Multi-Agents IA • Gestion Construction • 168+ Agents</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id 
                ? `bg-${tab.color}-600 text-white shadow-lg` 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 text-blue-400">📊 Hiérarchie des Agents</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 bg-red-900/30 rounded-lg border border-red-700">
                  <span className="text-2xl">👑</span>
                  <div>
                    <div className="font-bold text-red-400">L0 - Supreme Owner</div>
                    <div className="text-sm text-slate-400">2 agents • Décisions critiques, vision globale</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-purple-900/30 rounded-lg border border-purple-700">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <div className="font-bold text-purple-400">L1 - Directeurs</div>
                    <div className="text-sm text-slate-400">18 agents • Direction stratégique par département</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-blue-900/30 rounded-lg border border-blue-700">
                  <span className="text-2xl">👔</span>
                  <div>
                    <div className="font-bold text-blue-400">L2 - Managers</div>
                    <div className="text-sm text-slate-400">27 agents • Coordination d'équipes, gestion projets</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-green-900/30 rounded-lg border border-green-700">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="font-bold text-green-400">L3 - Spécialistes</div>
                    <div className="text-sm text-slate-400">100+ agents • Exécution des tâches spécialisées</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-amber-900/30 rounded-lg border border-amber-700">
                  <span className="text-2xl">🔧</span>
                  <div>
                    <div className="font-bold text-amber-400">L5 - Tools</div>
                    <div className="text-sm text-slate-400">75+ outils • Actions atomiques, intégrations</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 text-purple-400">🔄 Flow de Travail</h2>
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="px-3 py-2 bg-red-900/50 rounded-lg">User Request</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-2 bg-purple-900/50 rounded-lg">Core Orchestrator</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-2 bg-blue-900/50 rounded-lg">L1 Director</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-2 bg-green-900/50 rounded-lg">L2/L3 Agents</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-2 bg-amber-900/50 rounded-lg">Tools</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-2 bg-emerald-900/50 rounded-lg">Result</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: "Creative Director", icon: "🎬", dept: "Création", agents: 12 },
              { name: "Marketing Director", icon: "📊", dept: "Marketing", agents: 8 },
              { name: "Construction Director", icon: "🏗️", dept: "Construction", agents: 30 },
              { name: "Tech Director", icon: "💻", dept: "Tech", agents: 15 },
              { name: "Data Director", icon: "📈", dept: "Data", agents: 10 },
              { name: "Finance Director", icon: "💰", dept: "Finance", agents: 8 },
              { name: "Legal Director", icon: "⚖️", dept: "Légal", agents: 6 },
              { name: "HR Director", icon: "👥", dept: "RH", agents: 8 },
              { name: "Sales Director", icon: "🤝", dept: "Ventes", agents: 10 },
              { name: "Support Director", icon: "🎧", dept: "Support", agents: 6 },
              { name: "Content Director", icon: "📝", dept: "Contenu", agents: 12 },
              { name: "UX Director", icon: "🎨", dept: "UX", agents: 8 }
            ].map((dir, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-purple-500 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{dir.icon}</span>
                  <div>
                    <div className="font-bold">{dir.name}</div>
                    <div className="text-sm text-slate-400">{dir.dept} • {dir.agents} agents</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'construction' && (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 text-orange-400">🏗️ Module Construction - 7 Départements</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: "Estimation & Coûts", icon: "💵", tools: 6, agents: 4 },
                  { name: "Architecture & Design", icon: "🏛️", tools: 6, agents: 5 },
                  { name: "Ingénierie Structure", icon: "🔩", tools: 7, agents: 5 },
                  { name: "MEP", icon: "⚡", tools: 8, agents: 4 },
                  { name: "Gestion Chantier", icon: "👷", tools: 6, agents: 5 },
                  { name: "Conformité & Sécurité", icon: "🛡️", tools: 6, agents: 4 },
                  { name: "BIM & Coordination", icon: "🔷", tools: 6, agents: 3 }
                ].map((dept, i) => (
                  <div key={i} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{dept.icon}</span>
                      <span className="font-bold">{dept.name}</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      {dept.agents} agents • {dept.tools} outils
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="font-bold mb-3 text-amber-400">🧮 8 Calculateurs</h3>
                <div className="flex flex-wrap gap-2">
                  {["Béton", "Charges", "Peinture", "Bois", "Armature", "Gypse", "Plancher", "Toiture"].map((c, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-900/30 rounded-full text-sm">{c}</span>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="font-bold mb-3 text-blue-400">📄 24 Templates</h3>
                <div className="flex flex-wrap gap-2">
                  {["Soumissions", "Contrats", "Rapports", "RFI", "Inspections", "Avenants"].map((t, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-900/30 rounded-full text-sm">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tech' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="font-bold mb-4 text-green-400">🔧 Backend</h3>
              <div className="space-y-2">
                {[
                  { name: "FastAPI", desc: "Framework API Python" },
                  { name: "PostgreSQL", desc: "Base de données" },
                  { name: "Redis", desc: "Cache & Sessions" },
                  { name: "Celery", desc: "Task Queue" },
                  { name: "SQLAlchemy", desc: "ORM" }
                ].map((tech, i) => (
                  <div key={i} className="flex justify-between p-2 bg-slate-700 rounded">
                    <span className="font-medium">{tech.name}</span>
                    <span className="text-sm text-slate-400">{tech.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="font-bold mb-4 text-blue-400">🎨 Frontend</h3>
              <div className="space-y-2">
                {[
                  { name: "React 18", desc: "UI Framework" },
                  { name: "TypeScript", desc: "Type Safety" },
                  { name: "Tailwind CSS", desc: "Styling" },
                  { name: "Vite", desc: "Build Tool" },
                  { name: "React Query", desc: "Data Fetching" }
                ].map((tech, i) => (
                  <div key={i} className="flex justify-between p-2 bg-slate-700 rounded">
                    <span className="font-medium">{tech.name}</span>
                    <span className="text-sm text-slate-400">{tech.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="font-bold mb-4 text-purple-400">🤖 LLM</h3>
              <div className="space-y-2">
                {[
                  { name: "Claude Opus", desc: "Tâches complexes" },
                  { name: "Claude Sonnet", desc: "Usage général" },
                  { name: "GPT-4", desc: "Alternative" },
                  { name: "Gemini Pro", desc: "Backup" }
                ].map((tech, i) => (
                  <div key={i} className="flex justify-between p-2 bg-slate-700 rounded">
                    <span className="font-medium">{tech.name}</span>
                    <span className="text-sm text-slate-400">{tech.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="font-bold mb-4 text-orange-400">☁️ Déploiement</h3>
              <div className="space-y-2">
                {[
                  { name: "Docker", desc: "Conteneurisation" },
                  { name: "Kubernetes", desc: "Orchestration" },
                  { name: "GCP/AWS", desc: "Cloud Provider" },
                  { name: "GitHub Actions", desc: "CI/CD" }
                ].map((tech, i) => (
                  <div key={i} className="flex justify-between p-2 bg-slate-700 rounded">
                    <span className="font-medium">{tech.name}</span>
                    <span className="text-sm text-slate-400">{tech.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 text-emerald-400">✅ Composants Complétés</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  "🔐 Authentification (OAuth2, JWT, RBAC)",
                  "📊 Dashboard Analytics",
                  "🔔 Notifications Push (Firebase)",
                  "📍 Géolocalisation (Suivi équipes)",
                  "🤖 Intégration LLM (Routing intelligent)",
                  "☁️ Docker Compose Production",
                  "📋 requirements.txt",
                  "📦 package.json",
                  "🏗️ 30+ Agents Construction",
                  "🔧 52+ Outils Construction",
                  "🧮 8 Calculateurs",
                  "📄 24 Templates Documents",
                  "🔄 6 Workflows Automatisés",
                  "📱 App Mobile Responsive",
                  "🔗 API Backend FastAPI"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-emerald-900/20 rounded border border-emerald-800">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 text-amber-400">🚀 Prochaines Étapes Suggérées</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  "🧪 Tests Unitaires & Intégration",
                  "🔄 CI/CD Pipeline Complet",
                  "📈 Monitoring & Observabilité",
                  "📚 Documentation API (OpenAPI)",
                  "🔒 Audit Sécurité",
                  "⚡ Optimisation Performance"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-amber-900/20 rounded border border-amber-800">
                    <span className="text-amber-400">○</span>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
        {[
          { label: "Agents", value: "168+", color: "purple" },
          { label: "Outils", value: "75+", color: "blue" },
          { label: "Calculateurs", value: "8", color: "amber" },
          { label: "Templates", value: "24", color: "green" },
          { label: "Workflows", value: "6", color: "pink" }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
            <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
            <div className="text-sm text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
