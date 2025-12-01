import React, { useState } from 'react';

const sections = {
  intro: {
    title: "🚀 Introduction",
    content: [
      {
        title: "Qu'est-ce que ROADY?",
        text: `ROADY (Resourceful Orchestrated AI for Dynamic Yields) est une plateforme de gestion de construction intelligente propulsée par l'IA. Elle combine plus de 168 agents spécialisés pour automatiser et optimiser tous les aspects de vos projets de construction.`
      },
      {
        title: "Pour qui?",
        list: ["Entrepreneurs généraux", "Gestionnaires de projets", "Estimateurs", "Architectes et ingénieurs", "Sous-traitants", "Clients finaux"]
      },
      {
        title: "Fonctionnalités clés",
        list: ["Estimation automatisée des coûts", "Génération de rapports intelligents", "Suivi de chantier en temps réel", "Calculateurs de construction", "Workflows automatisés", "Collaboration d'équipe"]
      }
    ]
  },
  quickstart: {
    title: "⚡ Démarrage Rapide",
    content: [
      {
        title: "Étape 1: Connexion",
        text: "Connectez-vous avec votre email professionnel. Si c'est votre première connexion, utilisez le lien d'invitation reçu par email.",
        tip: "Activez l'authentification à deux facteurs pour plus de sécurité."
      },
      {
        title: "Étape 2: Créer votre premier projet",
        steps: [
          "Cliquez sur '+ Nouveau Projet' dans le dashboard",
          "Remplissez les informations de base (nom, client, budget)",
          "Ajoutez les dates de début et fin prévues",
          "Invitez les membres de votre équipe",
          "Cliquez sur 'Créer le projet'"
        ]
      },
      {
        title: "Étape 3: Utiliser les agents IA",
        text: "Dans votre projet, cliquez sur l'icône 🤖 pour ouvrir le chat avec les agents. Posez votre question en langage naturel.",
        examples: ["\"Estime le coût du béton pour une fondation de 80m²\"", "\"Génère un rapport journalier pour aujourd'hui\"", "\"Quelles sont les tâches en retard?\""]
      }
    ]
  },
  projects: {
    title: "📁 Gestion des Projets",
    content: [
      {
        title: "Tableau de bord projet",
        text: "Le dashboard projet affiche: les KPIs principaux (budget, avancement, délais), les tâches récentes, l'activité de l'équipe, et les alertes importantes."
      },
      {
        title: "Statuts de projet",
        list: ["🟡 Planification - Projet en phase de conception", "🔵 En cours - Construction active", "🟠 En pause - Projet suspendu temporairement", "🟢 Terminé - Projet livré", "🔴 Annulé - Projet abandonné"]
      },
      {
        title: "Gestion des tâches",
        text: "Créez des tâches, assignez-les aux membres de l'équipe, définissez les priorités et les échéances. Les agents IA peuvent suggérer des tâches basées sur l'avancement du projet."
      }
    ]
  },
  agents: {
    title: "🤖 Agents IA",
    content: [
      {
        title: "Comment fonctionnent les agents?",
        text: "Les agents sont organisés en 4 niveaux hiérarchiques. Quand vous posez une question, le système route automatiquement vers l'agent le plus qualifié."
      },
      {
        title: "Niveaux d'agents",
        list: ["L0 - Supreme Owner: Décisions stratégiques critiques", "L1 - Directeurs: Direction par département (18 agents)", "L2 - Managers: Coordination d'équipes (27 agents)", "L3 - Spécialistes: Exécution des tâches (100+ agents)"]
      },
      {
        title: "Exemples de requêtes",
        examples: [
          { query: "Calcule les charges pour un plancher de 150m² résidentiel", agent: "Ingénieur Structure (L3)" },
          { query: "Prépare une soumission pour le client ABC", agent: "Spécialiste Soumissions (L3)" },
          { query: "Analyse la rentabilité du projet", agent: "Finance Director (L1)" },
          { query: "Génère le rapport hebdomadaire", agent: "Rapport Generator (L3)" }
        ]
      }
    ]
  },
  calculators: {
    title: "🧮 Calculateurs",
    content: [
      {
        title: "8 Calculateurs disponibles",
        list: ["🧱 Béton - Volume, coût, type de mélange", "⚖️ Charges - Charges mortes et vives", "🔗 Armatures - Quantités d'acier", "🎨 Peinture - Surface et litres nécessaires", "🪵 Bois - Quantités de charpente", "📐 Gypse - Panneaux nécessaires", "🏠 Plancher - Surface et matériaux", "🏗️ Toiture - Surface et pente"]
      },
      {
        title: "Utilisation",
        steps: ["Sélectionnez le calculateur souhaité", "Entrez les dimensions et paramètres", "Cliquez sur 'Calculer'", "Exportez les résultats en PDF ou ajoutez-les au projet"]
      }
    ]
  },
  reports: {
    title: "📄 Rapports",
    content: [
      {
        title: "Types de rapports",
        list: ["Rapport journalier - Activités du jour", "Rapport hebdomadaire - Résumé de la semaine", "Estimation - Coûts détaillés", "RFI - Demande d'information", "Inspection - Contrôle qualité", "Soumission - Offre client"]
      },
      {
        title: "Génération automatique",
        text: "Les agents peuvent générer des rapports automatiquement. Dites simplement 'Génère un rapport journalier' et l'agent compilera toutes les données pertinentes."
      },
      {
        title: "Formats d'export",
        list: ["PDF - Document formaté professionnel", "Excel - Données tabulaires modifiables", "Word - Document éditable", "JSON - Intégration système"]
      }
    ]
  },
  mobile: {
    title: "📱 Application Mobile",
    content: [
      {
        title: "Fonctionnalités terrain",
        list: ["📸 Capture de photos avec géolocalisation", "📝 Rapports rapides en 2 clics", "✅ Listes de vérification", "⚠️ Signalement de problèmes", "👥 Communication d'équipe", "📍 Suivi GPS des équipes"]
      },
      {
        title: "Mode hors-ligne",
        text: "L'app fonctionne sans connexion. Les données se synchronisent automatiquement quand vous retrouvez le réseau."
      }
    ]
  },
  settings: {
    title: "⚙️ Paramètres",
    content: [
      {
        title: "Profil utilisateur",
        list: ["Modifier vos informations personnelles", "Changer votre mot de passe", "Configurer la double authentification", "Gérer vos notifications"]
      },
      {
        title: "Paramètres d'entreprise (Admin)",
        list: ["Gérer les utilisateurs et rôles", "Configurer les intégrations", "Personnaliser les templates", "Voir les statistiques d'utilisation"]
      }
    ]
  },
  faq: {
    title: "❓ FAQ",
    content: [
      { q: "Comment réinitialiser mon mot de passe?", a: "Cliquez sur 'Mot de passe oublié' sur la page de connexion et suivez les instructions par email." },
      { q: "Puis-je utiliser ROADY sur plusieurs appareils?", a: "Oui! Votre compte est synchronisé sur tous vos appareils (web, mobile, tablette)." },
      { q: "Les agents IA sont-ils disponibles 24/7?", a: "Oui, les agents fonctionnent en continu. Aucune attente, réponses instantanées." },
      { q: "Mes données sont-elles sécurisées?", a: "Absolument. Nous utilisons le chiffrement de bout en bout et sommes conformes aux normes de l'industrie." },
      { q: "Comment contacter le support?", a: "Via le chat in-app, par email à support@roady.app, ou par téléphone au 1-800-ROADY." }
    ]
  }
};

export default function UserGuide() {
  const [activeSection, setActiveSection] = useState('intro');
  const [searchTerm, setSearchTerm] = useState('');

  const currentSection = sections[activeSection];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 flex-shrink-0">
        <div className="mb-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            📚 Guide ROADY
          </h1>
          <p className="text-xs text-slate-400 mt-1">Documentation utilisateur</p>
        </div>
        
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 rounded-lg text-sm mb-4 border border-slate-600 focus:border-blue-500 outline-none"
        />
        
        <nav className="space-y-1">
          {Object.entries(sections).map(([key, section]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                activeSection === key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {section.title}
            </button>
          ))}
        </nav>
        
        <div className="mt-8 p-3 bg-slate-700 rounded-lg">
          <p className="text-xs text-slate-400">Besoin d'aide?</p>
          <p className="text-sm text-blue-400 mt-1">support@roady.app</p>
          <p className="text-sm text-blue-400">1-800-ROADY</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-3xl font-bold mb-6">{currentSection.title}</h2>
        
        <div className="space-y-6">
          {currentSection.content.map((item, idx) => (
            <div key={idx} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              {item.title && <h3 className="text-xl font-semibold mb-3 text-blue-400">{item.title}</h3>}
              
              {item.text && <p className="text-slate-300 mb-3">{item.text}</p>}
              
              {item.list && (
                <ul className="space-y-2">
                  {item.list.map((li, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              {item.steps && (
                <ol className="space-y-2">
                  {item.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300">
                      <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs flex-shrink-0">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
              
              {item.examples && !item.examples[0]?.query && (
                <div className="mt-3 space-y-2">
                  {item.examples.map((ex, i) => (
                    <div key={i} className="px-3 py-2 bg-slate-700 rounded-lg text-sm font-mono text-green-400">
                      {ex}
                    </div>
                  ))}
                </div>
              )}
              
              {item.examples && item.examples[0]?.query && (
                <div className="mt-3 space-y-2">
                  {item.examples.map((ex, i) => (
                    <div key={i} className="p-3 bg-slate-700 rounded-lg">
                      <p className="text-sm text-green-400 font-mono">"{ex.query}"</p>
                      <p className="text-xs text-slate-400 mt-1">→ Traité par: {ex.agent}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {item.tip && (
                <div className="mt-3 p-3 bg-amber-900/30 border border-amber-700 rounded-lg">
                  <p className="text-sm text-amber-400">💡 Conseil: {item.tip}</p>
                </div>
              )}
              
              {item.q && (
                <div>
                  <p className="font-semibold text-white">{item.q}</p>
                  <p className="text-slate-400 mt-1">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
          <button
            onClick={() => {
              const keys = Object.keys(sections);
              const idx = keys.indexOf(activeSection);
              if (idx > 0) setActiveSection(keys[idx - 1]);
            }}
            className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-all"
          >
            ← Précédent
          </button>
          <button
            onClick={() => {
              const keys = Object.keys(sections);
              const idx = keys.indexOf(activeSection);
              if (idx < keys.length - 1) setActiveSection(keys[idx + 1]);
            }}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-all"
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>
  );
}
