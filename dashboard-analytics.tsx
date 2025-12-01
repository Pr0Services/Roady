import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// Données simulées temps réel
const generateData = () => ({
  kpis: {
    projetsActifs: Math.floor(Math.random() * 5) + 23,
    tachesTerminees: Math.floor(Math.random() * 10) + 145,
    rfisOuverts: Math.floor(Math.random() * 3) + 8,
    budgetUtilise: Math.floor(Math.random() * 5) + 72,
    equipeTerrain: Math.floor(Math.random() * 5) + 34,
    incidentsSST: Math.floor(Math.random() * 2),
  },
  progression: [
    { mois: 'Jan', planifie: 10, reel: 8 },
    { mois: 'Fév', planifie: 25, reel: 22 },
    { mois: 'Mar', planifie: 40, reel: 38 },
    { mois: 'Avr', planifie: 55, reel: 52 },
    { mois: 'Mai', planifie: 70, reel: 65 },
    { mois: 'Juin', planifie: 85, reel: 78 + Math.floor(Math.random() * 5) },
  ],
  budget: [
    { cat: 'Main-d\'œuvre', budget: 450000, depense: 380000 + Math.floor(Math.random() * 20000) },
    { cat: 'Matériaux', budget: 320000, depense: 290000 + Math.floor(Math.random() * 15000) },
    { cat: 'Équipement', budget: 180000, depense: 145000 + Math.floor(Math.random() * 10000) },
    { cat: 'Sous-traitants', budget: 250000, depense: 220000 + Math.floor(Math.random() * 12000) },
    { cat: 'Autres', budget: 80000, depense: 55000 + Math.floor(Math.random() * 8000) },
  ],
  taches: [
    { name: 'Terminées', value: 145 + Math.floor(Math.random() * 5), color: '#10B981' },
    { name: 'En cours', value: 38 + Math.floor(Math.random() * 3), color: '#3B82F6' },
    { name: 'En retard', value: 12 + Math.floor(Math.random() * 2), color: '#EF4444' },
    { name: 'À venir', value: 25, color: '#9CA3AF' },
  ],
  activiteHebdo: [
    { jour: 'Lun', rapports: 12, rfis: 3, inspections: 5 },
    { jour: 'Mar', rapports: 15, rfis: 2, inspections: 4 },
    { jour: 'Mer', rapports: 18, rfis: 5, inspections: 6 },
    { jour: 'Jeu', rapports: 14, rfis: 1, inspections: 3 },
    { jour: 'Ven', rapports: 20, rfis: 4, inspections: 7 },
    { jour: 'Sam', rapports: 5, rfis: 0, inspections: 2 },
    { jour: 'Dim', rapports: 2, rfis: 0, inspections: 0 },
  ],
  projets: [
    { nom: 'Tour Centrale', progress: 78, status: 'on-track' },
    { nom: 'Centre Commercial Nord', progress: 45, status: 'delayed' },
    { nom: 'Résidence Émeraude', progress: 92, status: 'on-track' },
    { nom: 'Pont Saint-Laurent', progress: 33, status: 'on-track' },
    { nom: 'École Primaire Est', progress: 65, status: 'at-risk' },
  ],
  alertes: [
    { type: 'warning', msg: 'RFI #234 en attente depuis 5 jours', time: '2h' },
    { type: 'error', msg: 'Retard livraison béton - Projet Tour', time: '4h' },
    { type: 'info', msg: 'Inspection planifiée demain 9h', time: '6h' },
    { type: 'success', msg: 'Permis approuvé - Résidence Émeraude', time: '1j' },
  ]
});

export default function Dashboard() {
  const [data, setData] = useState(generateData());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('semaine');
  const [darkMode, setDarkMode] = useState(false);

  // Mise à jour temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateData());
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const KPICard = ({ icon, label, value, unit, trend, color }) => (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {value}{unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </div>
      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
    </div>
  );

  const AlertItem = ({ type, msg, time }) => {
    const colors = {
      error: 'bg-red-50 border-red-200 text-red-700',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      info: 'bg-blue-50 border-blue-200 text-blue-700',
      success: 'bg-green-50 border-green-200 text-green-700',
    };
    const icons = { error: '🚨', warning: '⚠️', info: 'ℹ️', success: '✅' };
    return (
      <div className={`p-3 rounded-lg border ${colors[type]} flex items-start gap-3`}>
        <span>{icons[type]}</span>
        <div className="flex-1">
          <p className="text-sm">{msg}</p>
          <p className="text-xs opacity-60 mt-1">Il y a {time}</p>
        </div>
      </div>
    );
  };

  const bg = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${bg} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${text}`}>📊 Dashboard ROADY</h1>
          <p className={`text-sm ${textMuted}`}>
            Dernière MAJ: {lastUpdate.toLocaleTimeString()} • 
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse"></span> Temps réel
          </p>
        </div>
        <div className="flex gap-2">
          {['jour', 'semaine', 'mois', 'année'].map(p => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-3 py-1 rounded-lg text-sm ${selectedPeriod === p ? 'bg-blue-500 text-white' : `${cardBg} ${text}`}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <button onClick={() => setDarkMode(!darkMode)} className={`px-3 py-1 rounded-lg ${cardBg}`}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KPICard icon="🏗️" label="Projets Actifs" value={data.kpis.projetsActifs} trend={5} />
        <KPICard icon="✅" label="Tâches Terminées" value={data.kpis.tachesTerminees} trend={12} />
        <KPICard icon="❓" label="RFIs Ouverts" value={data.kpis.rfisOuverts} trend={-8} />
        <KPICard icon="💰" label="Budget Utilisé" value={data.kpis.budgetUtilise} unit="%" trend={3} />
        <KPICard icon="👷" label="Équipe Terrain" value={data.kpis.equipeTerrain} />
        <KPICard icon="🦺" label="Incidents SST" value={data.kpis.incidentsSST} trend={data.kpis.incidentsSST > 0 ? 100 : -100} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Progression */}
        <div className={`${cardBg} rounded-xl p-4 shadow-sm`}>
          <h3 className={`font-semibold mb-4 ${text}`}>📈 Progression Projet vs Planifié</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.progression}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="planifie" stroke="#9CA3AF" fill="#E5E7EB" name="Planifié %" />
              <Area type="monotone" dataKey="reel" stroke="#3B82F6" fill="#93C5FD" name="Réel %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Budget */}
        <div className={`${cardBg} rounded-xl p-4 shadow-sm`}>
          <h3 className={`font-semibold mb-4 ${text}`}>💵 Budget par Catégorie</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.budget} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000)}k`} />
              <YAxis type="category" dataKey="cat" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v) => `${(v/1000).toFixed(0)}k $`} />
              <Legend />
              <Bar dataKey="budget" fill="#E5E7EB" name="Budget" />
              <Bar dataKey="depense" fill="#3B82F6" name="Dépensé" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Tâches Pie */}
        <div className={`${cardBg} rounded-xl p-4 shadow-sm`}>
          <h3 className={`font-semibold mb-4 ${text}`}>📋 Statut Tâches</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data.taches} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${value}`}>
                {data.taches.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {data.taches.map((t, i) => (
              <span key={i} className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }}></span>
                {t.name}
              </span>
            ))}
          </div>
        </div>

        {/* Activité Hebdo */}
        <div className={`${cardBg} rounded-xl p-4 shadow-sm`}>
          <h3 className={`font-semibold mb-4 ${text}`}>📅 Activité Hebdomadaire</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.activiteHebdo}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="rapports" fill="#3B82F6" name="Rapports" stackId="a" />
              <Bar dataKey="rfis" fill="#F59E0B" name="RFIs" stackId="a" />
              <Bar dataKey="inspections" fill="#10B981" name="Inspections" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alertes */}
        <div className={`${cardBg} rounded-xl p-4 shadow-sm`}>
          <h3 className={`font-semibold mb-4 ${text}`}>🔔 Alertes Récentes</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {data.alertes.map((a, i) => <AlertItem key={i} {...a} />)}
          </div>
        </div>
      </div>

      {/* Projets Table */}
      <div className={`${cardBg} rounded-xl p-4 shadow-sm`}>
        <h3 className={`font-semibold mb-4 ${text}`}>🏢 Statut des Projets</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`text-left py-2 ${textMuted}`}>Projet</th>
                <th className={`text-left py-2 ${textMuted}`}>Progression</th>
                <th className={`text-left py-2 ${textMuted}`}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.projets.map((p, i) => (
                <tr key={i} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <td className={`py-3 ${text}`}>{p.nom}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${p.status === 'on-track' ? 'bg-green-500' : p.status === 'delayed' ? 'bg-red-500' : 'bg-yellow-500'}`}
                          style={{ width: `${p.progress}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs ${textMuted}`}>{p.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      p.status === 'on-track' ? 'bg-green-100 text-green-700' :
                      p.status === 'delayed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.status === 'on-track' ? '✓ Sur la cible' : p.status === 'delayed' ? '⚠ En retard' : '⚡ À risque'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
