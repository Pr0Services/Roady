import React, { useState, useEffect } from 'react';

// Données simulées temps réel
const generateTeamData = () => {
  const baseWorkers = [
    { id: 'w1', name: 'Marc Tremblay', role: 'Superviseur', avatar: '👷', status: 'active', battery: 85 },
    { id: 'w2', name: 'Julie Côté', role: 'Ingénieure', avatar: '👩‍🔧', status: 'active', battery: 72 },
    { id: 'w3', name: 'Pierre Gagnon', role: 'Électricien', avatar: '⚡', status: 'active', battery: 45 },
    { id: 'w4', name: 'Sophie Martin', role: 'Plombière', avatar: '🔧', status: 'break', battery: 91 },
    { id: 'w5', name: 'Jean Dubois', role: 'Charpentier', avatar: '🪚', status: 'active', battery: 38 },
    { id: 'w6', name: 'Marie Roy', role: 'Inspectrice SST', avatar: '🦺', status: 'moving', battery: 67 },
    { id: 'w7', name: 'Luc Bergeron', role: 'Opérateur', avatar: '🏗️', status: 'active', battery: 55 },
    { id: 'w8', name: 'Anne Lefebvre', role: 'Architecte', avatar: '📐', status: 'offline', battery: 12 },
  ];
  
  return baseWorkers.map(w => ({
    ...w,
    lat: 45.5017 + (Math.random() - 0.5) * 0.02,
    lng: -73.5673 + (Math.random() - 0.5) * 0.03,
    speed: w.status === 'moving' ? Math.floor(Math.random() * 30) + 5 : 0,
    lastUpdate: new Date(Date.now() - Math.random() * 300000),
    project: ['Tour Centrale', 'Centre Commercial', 'Résidence Émeraude'][Math.floor(Math.random() * 3)],
    zone: ['Zone A', 'Zone B', 'Zone C', 'Extérieur'][Math.floor(Math.random() * 4)],
  }));
};

const projects = [
  { id: 'p1', name: 'Tour Centrale', lat: 45.5025, lng: -73.5680, radius: 150, color: '#3B82F6' },
  { id: 'p2', name: 'Centre Commercial', lat: 45.4990, lng: -73.5650, radius: 200, color: '#10B981' },
  { id: 'p3', name: 'Résidence Émeraude', lat: 45.5050, lng: -73.5700, radius: 100, color: '#F59E0B' },
];

const zones = [
  { id: 'z1', name: 'Zone A - Fondations', type: 'work', risk: 'high' },
  { id: 'z2', name: 'Zone B - Structure', type: 'work', risk: 'medium' },
  { id: 'z3', name: 'Zone C - Finition', type: 'work', risk: 'low' },
  { id: 'z4', name: 'Zone Danger', type: 'restricted', risk: 'critical' },
];

export default function GeolocationDashboard() {
  const [workers, setWorkers] = useState(generateTeamData());
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('map');
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warning', msg: 'Pierre Gagnon - Batterie faible (38%)', time: '5 min' },
    { id: 2, type: 'info', msg: 'Marie Roy en déplacement vers Zone B', time: '12 min' },
    { id: 3, type: 'error', msg: 'Anne Lefebvre hors ligne depuis 45 min', time: '45 min' },
  ]);
  const [trackingEnabled, setTrackingEnabled] = useState(true);

  // Mise à jour temps réel
  useEffect(() => {
    if (!trackingEnabled) return;
    const interval = setInterval(() => {
      setWorkers(generateTeamData());
    }, 3000);
    return () => clearInterval(interval);
  }, [trackingEnabled]);

  const filteredWorkers = workers.filter(w => {
    if (filter === 'all') return true;
    if (filter === 'active') return w.status === 'active';
    if (filter === 'offline') return w.status === 'offline';
    if (filter === 'alert') return w.battery < 40 || w.status === 'offline';
    return true;
  });

  const stats = {
    total: workers.length,
    active: workers.filter(w => w.status === 'active').length,
    onBreak: workers.filter(w => w.status === 'break').length,
    moving: workers.filter(w => w.status === 'moving').length,
    offline: workers.filter(w => w.status === 'offline').length,
    lowBattery: workers.filter(w => w.battery < 40).length,
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      active: 'bg-green-500',
      break: 'bg-yellow-500',
      moving: 'bg-blue-500',
      offline: 'bg-gray-400',
    };
    return (
      <span className={`inline-block w-2 h-2 rounded-full ${colors[status]} ${status !== 'offline' ? 'animate-pulse' : ''}`}></span>
    );
  };

  const WorkerCard = ({ worker, compact = false }) => (
    <div 
      onClick={() => setSelectedWorker(worker)}
      className={`bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow ${selectedWorker?.id === worker.id ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{worker.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{worker.name}</span>
            <StatusBadge status={worker.status} />
          </div>
          <div className="text-xs text-gray-500">{worker.role}</div>
          {!compact && (
            <div className="text-xs text-gray-400 mt-1">
              📍 {worker.project} • {worker.zone}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className={`text-xs ${worker.battery < 40 ? 'text-red-500' : 'text-gray-500'}`}>
            🔋 {worker.battery}%
          </div>
          {worker.speed > 0 && (
            <div className="text-xs text-blue-500">🚗 {worker.speed} km/h</div>
          )}
        </div>
      </div>
    </div>
  );

  const MapView = () => (
    <div className="relative bg-gradient-to-br from-green-100 to-blue-100 rounded-xl h-[400px] overflow-hidden">
      {/* Grille de fond */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>
      
      {/* Projets (cercles) */}
      {projects.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-20 border-2"
          style={{
            left: `${((p.lng + 73.58) / 0.04) * 100}%`,
            top: `${((45.51 - p.lat) / 0.025) * 100}%`,
            width: p.radius,
            height: p.radius,
            backgroundColor: p.color,
            borderColor: p.color,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap" style={{ color: p.color }}>
            {p.name}
          </div>
        </div>
      ))}
      
      {/* Workers (points) */}
      {filteredWorkers.map(w => (
        <div
          key={w.id}
          onClick={() => setSelectedWorker(w)}
          className={`absolute cursor-pointer transition-all duration-300 ${selectedWorker?.id === w.id ? 'z-20 scale-125' : 'z-10'}`}
          style={{
            left: `${((w.lng + 73.58) / 0.04) * 100}%`,
            top: `${((45.51 - w.lat) / 0.025) * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className={`relative`}>
            {/* Pulse animation for active */}
            {w.status === 'active' && (
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-40" style={{ width: 24, height: 24 }}></div>
            )}
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-lg border-2 ${
              w.status === 'active' ? 'bg-green-100 border-green-500' :
              w.status === 'moving' ? 'bg-blue-100 border-blue-500' :
              w.status === 'break' ? 'bg-yellow-100 border-yellow-500' :
              'bg-gray-100 border-gray-400'
            }`}>
              {w.avatar}
            </div>
            {/* Battery warning */}
            {w.battery < 40 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white">!</div>
            )}
          </div>
        </div>
      ))}
      
      {/* Légende */}
      <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg p-2 text-xs">
        <div className="font-medium mb-1">Légende</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Actif</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> En déplacement</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full"></span> Pause</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full"></span> Hors ligne</div>
      </div>
      
      {/* Contrôles */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50">+</button>
        <button className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50">−</button>
        <button className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50">📍</button>
      </div>
    </div>
  );

  const ListView = () => (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {filteredWorkers.map(w => <WorkerCard key={w.id} worker={w} />)}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">📍 Géolocalisation Terrain</h1>
          <p className="text-sm text-gray-500">Suivi temps réel des équipes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTrackingEnabled(!trackingEnabled)}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${trackingEnabled ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            {trackingEnabled ? '🟢 Tracking ON' : '⚪ Tracking OFF'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {[
          { label: 'Total', value: stats.total, icon: '👥', color: 'bg-gray-100' },
          { label: 'Actifs', value: stats.active, icon: '✅', color: 'bg-green-100' },
          { label: 'Pause', value: stats.onBreak, icon: '☕', color: 'bg-yellow-100' },
          { label: 'En route', value: stats.moving, icon: '🚗', color: 'bg-blue-100' },
          { label: 'Hors ligne', value: stats.offline, icon: '📵', color: 'bg-gray-100' },
          { label: 'Batterie ⚠️', value: stats.lowBattery, icon: '🔋', color: 'bg-red-100' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-lg p-2 text-center`}>
            <div className="text-lg">{s.icon}</div>
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'active', label: 'Actifs' },
            { key: 'offline', label: 'Hors ligne' },
            { key: 'alert', label: '⚠️ Alertes' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded-lg text-sm ${filter === f.key ? 'bg-blue-500 text-white' : 'bg-white border'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white rounded-lg p-1 border">
          <button
            onClick={() => setView('map')}
            className={`px-3 py-1 rounded text-sm ${view === 'map' ? 'bg-blue-500 text-white' : ''}`}
          >
            🗺️ Carte
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1 rounded text-sm ${view === 'list' ? 'bg-blue-500 text-white' : ''}`}
          >
            📋 Liste
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map/List */}
        <div className="lg:col-span-2">
          {view === 'map' ? <MapView /> : <ListView />}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Worker Details */}
          {selectedWorker && (
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-4xl">{selectedWorker.avatar}</div>
                <div>
                  <div className="font-bold">{selectedWorker.name}</div>
                  <div className="text-sm text-gray-500">{selectedWorker.role}</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Statut</span>
                  <span className="flex items-center gap-1">
                    <StatusBadge status={selectedWorker.status} />
                    {selectedWorker.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Projet</span>
                  <span>{selectedWorker.project}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Zone</span>
                  <span>{selectedWorker.zone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Batterie</span>
                  <span className={selectedWorker.battery < 40 ? 'text-red-500' : ''}>
                    🔋 {selectedWorker.battery}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dernière MAJ</span>
                  <span>{selectedWorker.lastUpdate.toLocaleTimeString()}</span>
                </div>
                {selectedWorker.speed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vitesse</span>
                    <span>🚗 {selectedWorker.speed} km/h</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm">📞 Appeler</button>
                <button className="flex-1 bg-gray-100 py-2 rounded-lg text-sm">💬 Message</button>
              </div>
            </div>
          )}

          {/* Alerts */}
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <h3 className="font-semibold mb-3">🔔 Alertes</h3>
            <div className="space-y-2">
              {alerts.map(a => (
                <div key={a.id} className={`p-2 rounded-lg text-sm ${
                  a.type === 'error' ? 'bg-red-50 text-red-700' :
                  a.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  <div>{a.msg}</div>
                  <div className="text-xs opacity-60 mt-1">Il y a {a.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Zones */}
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <h3 className="font-semibold mb-3">🏗️ Zones Actives</h3>
            <div className="space-y-2">
              {zones.map(z => (
                <div key={z.id} className="flex items-center justify-between text-sm">
                  <span>{z.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    z.risk === 'critical' ? 'bg-red-100 text-red-700' :
                    z.risk === 'high' ? 'bg-orange-100 text-orange-700' :
                    z.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {z.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
