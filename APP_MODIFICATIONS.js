/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🔧 MODIFICATIONS À FAIRE DANS App.jsx                                      ║
║   Pour intégrer le Advanced Agent Creator                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

ÉTAPE 1: AJOUTER LES IMPORTS (ligne 14, après l'import React)
=========================================================================
*/

// AJOUTER CES 2 LIGNES après "import React, { useState, useEffect..."
import AgentCreator from './components/AgentCreator';
import './components/AgentCreator.css';


/*
ÉTAPE 2: AJOUTER LE STATE POUR LES APIs CONNECTÉES (dans function App(), vers ligne 650)
=========================================================================
*/

// AJOUTER après les autres useState dans la function App()
const [connectedApis, setConnectedApis] = useState({
  // APIs que l'utilisateur a configurées avec leurs clés
  openai: true,      // exemple
  anthropic: false,
  suno: false,
  elevenlabs: false,
  midjourney: false,
  // etc...
});

// State pour le mode du modal (create from scratch vs from template)
const [agentCreatorMode, setAgentCreatorMode] = useState('template'); // 'template' ou 'scratch'
const [selectedTemplateForCreator, setSelectedTemplateForCreator] = useState(null);


/*
ÉTAPE 3: MODIFIER LE HANDLER onHireAgent (vers ligne 800)
=========================================================================
*/

// REMPLACER cette fonction:
const handleHireAgent = async (templateId, name) => {
  // ... ancien code
};

// PAR:
const handleOpenAgentCreator = (template = null) => {
  if (template) {
    setAgentCreatorMode('template');
    setSelectedTemplateForCreator(template);
  } else {
    setAgentCreatorMode('scratch');
    setSelectedTemplateForCreator(null);
  }
  setShowHireAgentModal(true);
};

const handleSaveAgent = async (agentData) => {
  try {
    const response = await fetch(`${API_URL}/api/businesses/${currentBusiness?.id}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: selectedTemplateForCreator?.id || 'custom',
        name: agentData.name,
        role: agentData.role,
        department: agentData.department,
        avatar: agentData.avatar,
        system_prompt: agentData.systemPrompt,
        skills: agentData.skills.join(','),
        apis: agentData.apis,
        cost_per_request: agentData.cost_per_request,
        level: agentData.level,
        catchphrase: agentData.catchphrase,
        personality: agentData.personality,
      })
    });
    
    if (response.ok) {
      showToast(`Agent "${agentData.name}" créé avec succès!`, 'success');
      fetchAgents(); // Refresh la liste
    }
  } catch (error) {
    showToast('Erreur lors de la création', 'error');
  }
  
  setShowHireAgentModal(false);
  setSelectedTemplateForCreator(null);
};


/*
ÉTAPE 4: MODIFIER L'APPEL DANS AgentsSection (vers ligne 1934)
=========================================================================
*/

// REMPLACER:
onClick={() => onHireAgent(template)}

// PAR:
onClick={() => onHireAgent(template)}
// (reste pareil, mais onHireAgent sera maintenant handleOpenAgentCreator)


/*
ÉTAPE 5: AJOUTER UN BOUTON "CREATE FROM SCRATCH" dans AgentsSection
=========================================================================
*/

// AJOUTER dans le header de la section Agents (vers ligne 1875):
<Button 
  variant="primary"
  onClick={() => onCreateFromScratch()}
>
  ✨ Create Custom Agent
</Button>


/*
ÉTAPE 6: REMPLACER LE HireAgentModal PAR AgentCreator (vers ligne 1048)
=========================================================================
*/

// REMPLACER:
<HireAgentModal 
  isOpen={showHireAgentModal}
  onClose={() => {
    setShowHireAgentModal(false);
    setSelectedTemplate(null);
  }}
  template={selectedTemplate}
  onHire={handleHireAgent}
/>

// PAR:
<AgentCreator
  isOpen={showHireAgentModal}
  onClose={() => {
    setShowHireAgentModal(false);
    setSelectedTemplateForCreator(null);
  }}
  template={selectedTemplateForCreator}
  existingAgent={null}
  connectedApis={connectedApis}
  onSave={handleSaveAgent}
/>


/*
ÉTAPE 7: METTRE À JOUR LES PROPS DE AgentsSection (vers ligne 957)
=========================================================================
*/

// REMPLACER:
<AgentsSection 
  agents={agents}
  templates={agentTemplates}
  onHireAgent={(template) => {
    setSelectedTemplate(template);
    setShowHireAgentModal(true);
  }}
/>

// PAR:
<AgentsSection 
  agents={agents}
  templates={agentTemplates}
  onHireAgent={handleOpenAgentCreator}
  onCreateFromScratch={() => handleOpenAgentCreator(null)}
  onEditAgent={(agent) => {
    setSelectedTemplateForCreator(null);
    // TODO: set existing agent for editing
    setShowHireAgentModal(true);
  }}
/>


/*
ÉTAPE 8: METTRE À JOUR LA SIGNATURE DE AgentsSection (vers ligne 1860)
=========================================================================
*/

// REMPLACER:
const AgentsSection = ({ agents, templates, onHireAgent }) => {

// PAR:
const AgentsSection = ({ agents, templates, onHireAgent, onCreateFromScratch, onEditAgent }) => {


/*
╔══════════════════════════════════════════════════════════════════════════════╗
║   FIN DES MODIFICATIONS                                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/
