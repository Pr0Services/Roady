/**
 * ROADY Construction - Système d'Internationalisation
 * Support: Français (FR), English (EN), Español (ES)
 */

// ============================================
// i18n/config.ts - Configuration
// ============================================

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';

export const supportedLanguages = ['fr', 'en', 'es'] as const;
export type SupportedLanguage = typeof supportedLanguages[number];

export const languageNames: Record<SupportedLanguage, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español'
};

export const languageFlags: Record<SupportedLanguage, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸'
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { fr: { translation: fr }, en: { translation: en }, es: { translation: es } },
    fallbackLng: 'fr',
    supportedLngs: supportedLanguages,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;

// ============================================
// i18n/locales/fr.json - Français
// ============================================

const fr = {
  // Common
  common: {
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    create: "Créer",
    search: "Rechercher",
    filter: "Filtrer",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    confirm: "Confirmer",
    back: "Retour",
    next: "Suivant",
    previous: "Précédent",
    yes: "Oui",
    no: "Non",
    all: "Tous",
    none: "Aucun",
    actions: "Actions",
    status: "Statut",
    date: "Date",
    name: "Nom",
    description: "Description",
    total: "Total",
    download: "Télécharger",
    export: "Exporter",
    import: "Importer",
    refresh: "Actualiser"
  },

  // Navigation
  nav: {
    home: "Accueil",
    projects: "Projets",
    tasks: "Tâches",
    reports: "Rapports",
    agents: "Agents IA",
    tools: "Outils",
    calculators: "Calculateurs",
    settings: "Paramètres",
    profile: "Profil",
    logout: "Déconnexion",
    help: "Aide"
  },

  // Auth
  auth: {
    login: "Connexion",
    logout: "Déconnexion",
    signup: "Inscription",
    email: "Adresse courriel",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    forgotPassword: "Mot de passe oublié?",
    resetPassword: "Réinitialiser le mot de passe",
    rememberMe: "Se souvenir de moi",
    loginSuccess: "Connexion réussie",
    loginError: "Identifiants invalides",
    logoutSuccess: "Déconnexion réussie",
    sessionExpired: "Session expirée, veuillez vous reconnecter"
  },

  // Dashboard
  dashboard: {
    welcome: "Bienvenue, {{name}}!",
    overview: "Vue d'ensemble",
    activeProjects: "Projets actifs",
    pendingTasks: "Tâches en attente",
    openRFIs: "RFIs ouvertes",
    teamOnSite: "Équipe sur le terrain",
    recentActivity: "Activité récente",
    quickActions: "Actions rapides",
    todaySchedule: "Horaire d'aujourd'hui",
    notifications: "Notifications"
  },

  // Projects
  projects: {
    title: "Projets",
    newProject: "Nouveau projet",
    projectName: "Nom du projet",
    client: "Client",
    budget: "Budget",
    startDate: "Date de début",
    endDate: "Date de fin prévue",
    status: {
      planning: "Planification",
      active: "En cours",
      paused: "En pause",
      completed: "Terminé",
      cancelled: "Annulé"
    },
    progress: "Avancement",
    team: "Équipe",
    addMember: "Ajouter un membre",
    documents: "Documents",
    timeline: "Échéancier",
    expenses: "Dépenses"
  },

  // Tasks
  tasks: {
    title: "Tâches",
    newTask: "Nouvelle tâche",
    assignee: "Assigné à",
    priority: {
      low: "Basse",
      medium: "Moyenne",
      high: "Haute",
      urgent: "Urgente"
    },
    status: {
      todo: "À faire",
      inProgress: "En cours",
      review: "En révision",
      completed: "Terminée"
    },
    dueDate: "Date d'échéance",
    overdue: "En retard",
    completedOn: "Complétée le"
  },

  // Reports
  reports: {
    title: "Rapports",
    daily: "Rapport journalier",
    weekly: "Rapport hebdomadaire",
    monthly: "Rapport mensuel",
    generate: "Générer un rapport",
    type: "Type de rapport",
    dateRange: "Période",
    includePhotos: "Inclure les photos",
    includeWeather: "Inclure la météo",
    weather: "Météo",
    workPerformed: "Travaux effectués",
    materials: "Matériaux utilisés",
    equipment: "Équipements",
    workforce: "Main-d'œuvre",
    issues: "Problèmes rencontrés",
    notes: "Notes"
  },

  // Agents
  agents: {
    title: "Agents IA",
    chat: "Discuter avec l'agent",
    selectAgent: "Sélectionner un agent",
    thinking: "L'agent réfléchit...",
    suggestions: "Suggestions",
    history: "Historique",
    newConversation: "Nouvelle conversation",
    levels: {
      l0: "Direction Suprême",
      l1: "Directeurs",
      l2: "Managers",
      l3: "Spécialistes"
    }
  },

  // Calculators
  calculators: {
    title: "Calculateurs",
    concrete: {
      name: "Béton",
      length: "Longueur (m)",
      width: "Largeur (m)",
      thickness: "Épaisseur (cm)",
      type: "Type de béton",
      waste: "Perte (%)",
      volume: "Volume",
      cost: "Coût estimé"
    },
    loads: {
      name: "Charges",
      area: "Surface (m²)",
      floors: "Nombre d'étages",
      usage: "Usage",
      residential: "Résidentiel",
      commercial: "Commercial",
      industrial: "Industriel",
      deadLoad: "Charge morte",
      liveLoad: "Charge vive",
      totalLoad: "Charge totale"
    },
    rebar: {
      name: "Armatures",
      volume: "Volume de béton (m³)",
      ratio: "Ratio d'armature (%)",
      barSize: "Calibre des barres",
      weight: "Poids total"
    },
    paint: {
      name: "Peinture",
      wallLength: "Périmètre des murs (m)",
      wallHeight: "Hauteur des murs (m)",
      coats: "Nombre de couches",
      doors: "Nombre de portes",
      windows: "Nombre de fenêtres",
      area: "Surface à peindre",
      liters: "Litres nécessaires"
    }
  },

  // Settings
  settings: {
    title: "Paramètres",
    language: "Langue",
    theme: "Thème",
    notifications: "Notifications",
    security: "Sécurité",
    company: "Entreprise",
    integrations: "Intégrations",
    billing: "Facturation",
    themes: {
      light: "Clair",
      dark: "Sombre",
      system: "Système"
    }
  },

  // Errors
  errors: {
    generic: "Une erreur s'est produite",
    notFound: "Page non trouvée",
    unauthorized: "Non autorisé",
    forbidden: "Accès refusé",
    serverError: "Erreur du serveur",
    networkError: "Erreur de connexion",
    validationError: "Erreur de validation",
    tryAgain: "Veuillez réessayer"
  },

  // Success messages
  success: {
    saved: "Enregistré avec succès",
    created: "Créé avec succès",
    updated: "Mis à jour avec succès",
    deleted: "Supprimé avec succès",
    sent: "Envoyé avec succès"
  },

  // Units
  units: {
    currency: "CAD",
    meters: "m",
    squareMeters: "m²",
    cubicMeters: "m³",
    kilograms: "kg",
    liters: "L",
    hours: "h",
    days: "jours"
  }
};

// ============================================
// i18n/locales/en.json - English
// ============================================

const en = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    search: "Search",
    filter: "Filter",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    previous: "Previous",
    yes: "Yes",
    no: "No",
    all: "All",
    none: "None",
    actions: "Actions",
    status: "Status",
    date: "Date",
    name: "Name",
    description: "Description",
    total: "Total",
    download: "Download",
    export: "Export",
    import: "Import",
    refresh: "Refresh"
  },

  nav: {
    home: "Home",
    projects: "Projects",
    tasks: "Tasks",
    reports: "Reports",
    agents: "AI Agents",
    tools: "Tools",
    calculators: "Calculators",
    settings: "Settings",
    profile: "Profile",
    logout: "Logout",
    help: "Help"
  },

  auth: {
    login: "Login",
    logout: "Logout",
    signup: "Sign Up",
    email: "Email address",
    password: "Password",
    confirmPassword: "Confirm password",
    forgotPassword: "Forgot password?",
    resetPassword: "Reset password",
    rememberMe: "Remember me",
    loginSuccess: "Login successful",
    loginError: "Invalid credentials",
    logoutSuccess: "Logout successful",
    sessionExpired: "Session expired, please log in again"
  },

  dashboard: {
    welcome: "Welcome, {{name}}!",
    overview: "Overview",
    activeProjects: "Active Projects",
    pendingTasks: "Pending Tasks",
    openRFIs: "Open RFIs",
    teamOnSite: "Team On Site",
    recentActivity: "Recent Activity",
    quickActions: "Quick Actions",
    todaySchedule: "Today's Schedule",
    notifications: "Notifications"
  },

  projects: {
    title: "Projects",
    newProject: "New Project",
    projectName: "Project Name",
    client: "Client",
    budget: "Budget",
    startDate: "Start Date",
    endDate: "Expected End Date",
    status: {
      planning: "Planning",
      active: "Active",
      paused: "Paused",
      completed: "Completed",
      cancelled: "Cancelled"
    },
    progress: "Progress",
    team: "Team",
    addMember: "Add Member",
    documents: "Documents",
    timeline: "Timeline",
    expenses: "Expenses"
  },

  tasks: {
    title: "Tasks",
    newTask: "New Task",
    assignee: "Assignee",
    priority: { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" },
    status: { todo: "To Do", inProgress: "In Progress", review: "Review", completed: "Completed" },
    dueDate: "Due Date",
    overdue: "Overdue",
    completedOn: "Completed on"
  },

  calculators: {
    title: "Calculators",
    concrete: {
      name: "Concrete",
      length: "Length (m)",
      width: "Width (m)",
      thickness: "Thickness (cm)",
      type: "Concrete Type",
      waste: "Waste (%)",
      volume: "Volume",
      cost: "Estimated Cost"
    },
    loads: {
      name: "Loads",
      area: "Area (m²)",
      floors: "Number of Floors",
      usage: "Usage",
      residential: "Residential",
      commercial: "Commercial",
      industrial: "Industrial",
      deadLoad: "Dead Load",
      liveLoad: "Live Load",
      totalLoad: "Total Load"
    }
  },

  settings: {
    title: "Settings",
    language: "Language",
    theme: "Theme",
    notifications: "Notifications",
    security: "Security",
    company: "Company",
    integrations: "Integrations",
    billing: "Billing",
    themes: { light: "Light", dark: "Dark", system: "System" }
  },

  errors: {
    generic: "An error occurred",
    notFound: "Page not found",
    unauthorized: "Unauthorized",
    forbidden: "Access denied",
    serverError: "Server error",
    networkError: "Connection error",
    validationError: "Validation error",
    tryAgain: "Please try again"
  },

  success: {
    saved: "Saved successfully",
    created: "Created successfully",
    updated: "Updated successfully",
    deleted: "Deleted successfully",
    sent: "Sent successfully"
  },

  units: { currency: "CAD", meters: "m", squareMeters: "m²", cubicMeters: "m³", kilograms: "kg", liters: "L", hours: "h", days: "days" }
};

// ============================================
// i18n/locales/es.json - Español
// ============================================

const es = {
  common: {
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    create: "Crear",
    search: "Buscar",
    filter: "Filtrar",
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    confirm: "Confirmar",
    back: "Volver",
    next: "Siguiente",
    previous: "Anterior",
    yes: "Sí",
    no: "No",
    all: "Todos",
    none: "Ninguno",
    actions: "Acciones",
    status: "Estado",
    date: "Fecha",
    name: "Nombre",
    description: "Descripción",
    total: "Total"
  },

  nav: {
    home: "Inicio",
    projects: "Proyectos",
    tasks: "Tareas",
    reports: "Informes",
    agents: "Agentes IA",
    tools: "Herramientas",
    calculators: "Calculadoras",
    settings: "Configuración",
    profile: "Perfil",
    logout: "Cerrar sesión",
    help: "Ayuda"
  },

  auth: {
    login: "Iniciar sesión",
    logout: "Cerrar sesión",
    signup: "Registrarse",
    email: "Correo electrónico",
    password: "Contraseña",
    forgotPassword: "¿Olvidó su contraseña?",
    rememberMe: "Recordarme",
    loginSuccess: "Inicio de sesión exitoso",
    loginError: "Credenciales inválidas"
  },

  dashboard: {
    welcome: "¡Bienvenido, {{name}}!",
    overview: "Resumen",
    activeProjects: "Proyectos Activos",
    pendingTasks: "Tareas Pendientes",
    openRFIs: "RFIs Abiertas",
    teamOnSite: "Equipo en Obra",
    recentActivity: "Actividad Reciente",
    quickActions: "Acciones Rápidas"
  },

  projects: {
    title: "Proyectos",
    newProject: "Nuevo Proyecto",
    projectName: "Nombre del Proyecto",
    client: "Cliente",
    budget: "Presupuesto",
    startDate: "Fecha de Inicio",
    endDate: "Fecha de Fin Prevista",
    status: {
      planning: "Planificación",
      active: "En Curso",
      paused: "En Pausa",
      completed: "Completado",
      cancelled: "Cancelado"
    }
  },

  calculators: {
    title: "Calculadoras",
    concrete: {
      name: "Hormigón",
      length: "Longitud (m)",
      width: "Ancho (m)",
      thickness: "Espesor (cm)",
      type: "Tipo de Hormigón",
      volume: "Volumen",
      cost: "Costo Estimado"
    }
  },

  settings: {
    title: "Configuración",
    language: "Idioma",
    theme: "Tema",
    themes: { light: "Claro", dark: "Oscuro", system: "Sistema" }
  }
};

// ============================================
// hooks/useTranslation.ts
// ============================================

import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';

export function useTranslation() {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = useCallback((lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  }, [i18n]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  }, [i18n.language]);

  const formatDate = useCallback((date: Date | string) => {
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }, [i18n.language]);

  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat(i18n.language).format(num);
  }, [i18n.language]);

  return {
    t,
    i18n,
    currentLanguage: i18n.language as SupportedLanguage,
    changeLanguage,
    formatCurrency,
    formatDate,
    formatNumber,
    languages: supportedLanguages,
    languageNames,
    languageFlags
  };
}

// ============================================
// components/LanguageSelector.tsx
// ============================================

import React from 'react';

export function LanguageSelector() {
  const { currentLanguage, changeLanguage, languages, languageNames, languageFlags } = useTranslation();

  return (
    <div className="flex gap-2">
      {languages.map(lang => (
        <button
          key={lang}
          onClick={() => changeLanguage(lang)}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${
            currentLanguage === lang
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <span>{languageFlags[lang]}</span>
          <span>{languageNames[lang]}</span>
        </button>
      ))}
    </div>
  );
}

export { fr, en, es };
