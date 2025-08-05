// @ts-nocheck
// Exemples de workflows d'approbation pour textes juridiques et procédures administratives algériennes

// Types spécifiques aux workflows algériens
export interface AlgerianWorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  assignee?: string;
  assigneeRole?: string;
  assigneeAvatar?: string;
  dueDate?: Date;
  completedAt?: Date;
  comments?: string[];
  required: boolean;
  order: number;
  legalReferences?: string[];
  administrativeLevel?: 'commune' | 'wilaya' | 'national';
  documentType?: 'arrete' | 'decret' | 'loi' | 'circulaire' | 'instruction';
}

export interface AlgerianWorkflowConfig extends WorkflowConfig {
  steps: AlgerianWorkflowStep[];
  type: 'legal_text' | 'administrative_procedure' | 'regulatory_watch' | 'legal_consultation';
  legalCategory?: 'civil' | 'penal' | 'administrative' | 'commercial' | 'labor' | 'constitutional';
  administrativeLevel?: 'commune' | 'wilaya' | 'national';
  urgencyLevel?: 'normal' | 'urgent' | 'very_urgent';
  confidentialityLevel?: 'public' | 'internal' | 'confidential' | 'secret';
  affectedSectors?: string[];
  budgetImpact?: 'none' | 'low' | 'medium' | 'high';
  publicImpact?: 'none' | 'low' | 'medium' | 'high';
}

// Exemples de workflows pour textes juridiques
export const legalTextWorkflows: AlgerianWorkflowConfig[] = [
  {
    id: 'workflow-legal-001',
    title: 'Approbation Décret Exécutif - Code de la Route',
    description: 'Workflow d\'approbation pour la modification du code de la route - Nouveaux articles sur la sécurité routière',
    type: 'legal_text',
    legalCategory: 'administrative',
    administrativeLevel: 'national',
    urgencyLevel: 'urgent',
    confidentialityLevel: 'public',
    affectedSectors: ['Transport', 'Sécurité', 'Infrastructure'],
    budgetImpact: 'medium',
    publicImpact: 'high',
    steps: [
      {
        id: 'step-1',
        name: 'Rédaction Initiale',
        description: 'Rédaction du projet de décret par la direction des transports',
        status: 'completed',
        assignee: 'Ahmed Bensalem',
        assigneeRole: 'Directeur des Transports',
        required: true,
        order: 1,
        legalReferences: ['Code de la Route (Loi 01-14)', 'Constitution algérienne'],
        administrativeLevel: 'national',
        documentType: 'decret',
        completedAt: new Date('2024-01-15')
      },
      {
        id: 'step-2',
        name: 'Validation Juridique',
        description: 'Validation par le service juridique du ministère',
        status: 'in_progress',
        assignee: 'Fatima Zerrouki',
        assigneeRole: 'Chef de Service Juridique',
        required: true,
        order: 2,
        legalReferences: ['Code civil', 'Procédure administrative'],
        administrativeLevel: 'national',
        documentType: 'decret',
        dueDate: new Date('2024-01-20')
      },
      {
        id: 'step-3',
        name: 'Consultation Interministérielle',
        description: 'Consultation avec les ministères concernés (Intérieur, Justice, Finances)',
        status: 'pending',
        assignee: 'Mohamed Larbi',
        assigneeRole: 'Coordinateur Interministériel',
        required: true,
        order: 3,
        legalReferences: ['Procédure de consultation interministérielle'],
        administrativeLevel: 'national',
        documentType: 'decret'
      },
      {
        id: 'step-4',
        name: 'Validation du Conseil d\'État',
        description: 'Examen et validation par le Conseil d\'État',
        status: 'pending',
        assignee: 'Khadidja Benali',
        assigneeRole: 'Conseiller d\'État',
        required: true,
        order: 4,
        legalReferences: ['Constitution', 'Loi organique du Conseil d\'État'],
        administrativeLevel: 'national',
        documentType: 'decret'
      },
      {
        id: 'step-5',
        name: 'Signature du Premier Ministre',
        description: 'Signature finale par le Premier Ministre',
        status: 'pending',
        assignee: 'Premier Ministre',
        assigneeRole: 'Premier Ministre',
        required: true,
        order: 5,
        legalReferences: ['Constitution', 'Décret présidentiel'],
        administrativeLevel: 'national',
        documentType: 'decret'
      }
    ],
    currentStep: 1,
    status: 'in_review',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
    submittedBy: 'Ministère des Transports',
    priority: 'high',
    estimatedDuration: 30
  },
  {
    id: 'workflow-legal-002',
    title: 'Approbation Arrêté Wilayal - Urbanisme',
    description: 'Workflow d\'approbation pour un arrêté wilayal concernant l\'urbanisme à Alger',
    type: 'legal_text',
    legalCategory: 'administrative',
    administrativeLevel: 'wilaya',
    urgencyLevel: 'normal',
    confidentialityLevel: 'public',
    affectedSectors: ['Urbanisme', 'Construction', 'Environnement'],
    budgetImpact: 'low',
    publicImpact: 'medium',
    steps: [
      {
        id: 'step-1',
        name: 'Étude Technique',
        description: 'Étude technique par la direction de l\'urbanisme de la wilaya',
        status: 'completed',
        assignee: 'Karim Messaoudi',
        assigneeRole: 'Directeur de l\'Urbanisme',
        required: true,
        order: 1,
        legalReferences: ['Code de l\'urbanisme', 'Plan d\'aménagement urbain'],
        administrativeLevel: 'wilaya',
        documentType: 'arrete',
        completedAt: new Date('2024-01-12')
      },
      {
        id: 'step-2',
        name: 'Validation Environnementale',
        description: 'Validation par la direction de l\'environnement',
        status: 'completed',
        assignee: 'Samira Boudiaf',
        assigneeRole: 'Directrice de l\'Environnement',
        required: true,
        order: 2,
        legalReferences: ['Code de l\'environnement', 'Étude d\'impact'],
        administrativeLevel: 'wilaya',
        documentType: 'arrete',
        completedAt: new Date('2024-01-14')
      },
      {
        id: 'step-3',
        name: 'Consultation Citoyenne',
        description: 'Consultation publique et associations',
        status: 'in_progress',
        assignee: 'Hassan Tounsi',
        assigneeRole: 'Chargé de la Participation Citoyenne',
        required: true,
        order: 3,
        legalReferences: ['Code de la participation citoyenne'],
        administrativeLevel: 'wilaya',
        documentType: 'arrete',
        dueDate: new Date('2024-01-25')
      },
      {
        id: 'step-4',
        name: 'Validation du Wali',
        description: 'Validation et signature par le Wali d\'Alger',
        status: 'pending',
        assignee: 'Wali d\'Alger',
        assigneeRole: 'Wali',
        required: true,
        order: 4,
        legalReferences: ['Code de la wilaya', 'Décret de nomination'],
        administrativeLevel: 'wilaya',
        documentType: 'arrete'
      }
    ],
    currentStep: 2,
    status: 'in_review',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-14'),
    submittedBy: 'Direction de l\'Urbanisme - Wilaya d\'Alger',
    priority: 'medium',
    estimatedDuration: 20
  }
];

// Exemples de workflows pour procédures administratives
export const administrativeProcedureWorkflows: AlgerianWorkflowConfig[] = [
  {
    id: 'workflow-admin-001',
    title: 'Procédure d\'Attribution de Marché Public',
    description: 'Workflow d\'approbation pour l\'attribution d\'un marché public de construction d\'école',
    type: 'administrative_procedure',
    legalCategory: 'administrative',
    administrativeLevel: 'wilaya',
    urgencyLevel: 'urgent',
    confidentialityLevel: 'internal',
    affectedSectors: ['Éducation', 'Construction', 'Finances'],
    budgetImpact: 'high',
    publicImpact: 'high',
    steps: [
      {
        id: 'step-1',
        name: 'Préparation du Dossier',
        description: 'Préparation du dossier d\'appel d\'offres par la direction des travaux publics',
        status: 'completed',
        assignee: 'Omar Benchaabane',
        assigneeRole: 'Directeur des Travaux Publics',
        required: true,
        order: 1,
        legalReferences: ['Code des marchés publics', 'Cahier des charges type'],
        administrativeLevel: 'wilaya',
        documentType: 'instruction',
        completedAt: new Date('2024-01-10')
      },
      {
        id: 'step-2',
        name: 'Validation Budgétaire',
        description: 'Validation budgétaire par la direction des finances',
        status: 'completed',
        assignee: 'Leila Mansouri',
        assigneeRole: 'Directrice des Finances',
        required: true,
        order: 2,
        legalReferences: ['Loi de finances', 'Règlement budgétaire'],
        administrativeLevel: 'wilaya',
        documentType: 'instruction',
        completedAt: new Date('2024-01-12')
      },
      {
        id: 'step-3',
        name: 'Publication Appel d\'Offres',
        description: 'Publication de l\'appel d\'offres dans le journal officiel',
        status: 'in_progress',
        assignee: 'Yacine Boudiaf',
        assigneeRole: 'Chargé de Communication',
        required: true,
        order: 3,
        legalReferences: ['Code des marchés publics', 'Journal officiel'],
        administrativeLevel: 'wilaya',
        documentType: 'instruction',
        dueDate: new Date('2024-01-18')
      },
      {
        id: 'step-4',
        name: 'Évaluation des Offres',
        description: 'Évaluation des offres reçues par la commission d\'évaluation',
        status: 'pending',
        assignee: 'Commission d\'Évaluation',
        assigneeRole: 'Commission Technique',
        required: true,
        order: 4,
        legalReferences: ['Code des marchés publics', 'Critères d\'évaluation'],
        administrativeLevel: 'wilaya',
        documentType: 'instruction'
      },
      {
        id: 'step-5',
        name: 'Attribution et Notification',
        description: 'Attribution du marché et notification au lauréat',
        status: 'pending',
        assignee: 'Wali',
        assigneeRole: 'Autorité Contractante',
        required: true,
        order: 5,
        legalReferences: ['Code des marchés publics', 'Procédure d\'attribution'],
        administrativeLevel: 'wilaya',
        documentType: 'instruction'
      }
    ],
    currentStep: 2,
    status: 'in_review',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-12'),
    submittedBy: 'Direction des Travaux Publics - Wilaya d\'Oran',
    priority: 'high',
    estimatedDuration: 45
  },
  {
    id: 'workflow-admin-002',
    title: 'Procédure de Recrutement Fonctionnaire',
    description: 'Workflow d\'approbation pour le recrutement de fonctionnaires dans l\'administration',
    type: 'administrative_procedure',
    legalCategory: 'administrative',
    administrativeLevel: 'national',
    urgencyLevel: 'normal',
    confidentialityLevel: 'internal',
    affectedSectors: ['Administration', 'Ressources Humaines'],
    budgetImpact: 'medium',
    publicImpact: 'low',
    steps: [
      {
        id: 'step-1',
        name: 'Identification des Besoins',
        description: 'Identification des besoins en personnel par la direction des ressources humaines',
        status: 'completed',
        assignee: 'Nadia Bensalem',
        assigneeRole: 'Directrice des RH',
        required: true,
        order: 1,
        legalReferences: ['Statut général de la fonction publique', 'Organigramme'],
        administrativeLevel: 'national',
        documentType: 'instruction',
        completedAt: new Date('2024-01-08')
      },
      {
        id: 'step-2',
        name: 'Validation Budgétaire',
        description: 'Validation du budget par la direction des finances',
        status: 'completed',
        assignee: 'Ahmed Tounsi',
        assigneeRole: 'Directeur des Finances',
        required: true,
        order: 2,
        legalReferences: ['Loi de finances', 'Plafond d\'emplois'],
        administrativeLevel: 'national',
        documentType: 'instruction',
        completedAt: new Date('2024-01-10')
      },
      {
        id: 'step-3',
        name: 'Publication Concours',
        description: 'Publication de l\'avis de concours dans le journal officiel',
        status: 'in_progress',
        assignee: 'Samir Benali',
        assigneeRole: 'Chargé de Communication',
        required: true,
        order: 3,
        legalReferences: ['Statut général de la fonction publique', 'Journal officiel'],
        administrativeLevel: 'national',
        documentType: 'instruction',
        dueDate: new Date('2024-01-20')
      },
      {
        id: 'step-4',
        name: 'Organisation Concours',
        description: 'Organisation et supervision des épreuves de concours',
        status: 'pending',
        assignee: 'Commission de Concours',
        assigneeRole: 'Commission Technique',
        required: true,
        order: 4,
        legalReferences: ['Statut général de la fonction publique', 'Règlement de concours'],
        administrativeLevel: 'national',
        documentType: 'instruction'
      },
      {
        id: 'step-5',
        name: 'Proclamation Résultats',
        description: 'Proclamation des résultats et nomination des lauréats',
        status: 'pending',
        assignee: 'Ministre',
        assigneeRole: 'Autorité de Nomination',
        required: true,
        order: 5,
        legalReferences: ['Statut général de la fonction publique', 'Décret de nomination'],
        administrativeLevel: 'national',
        documentType: 'instruction'
      }
    ],
    currentStep: 2,
    status: 'in_review',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-10'),
    submittedBy: 'Direction des Ressources Humaines - Ministère de l\'Intérieur',
    priority: 'medium',
    estimatedDuration: 60
  }
];

// Exemples de workflows pour veille réglementaire
export const regulatoryWatchWorkflows: AlgerianWorkflowConfig[] = [
  {
    id: 'workflow-watch-001',
    title: 'Veille Réglementaire - Secteur Bancaire',
    description: 'Workflow de veille réglementaire pour les nouvelles réglementations bancaires',
    type: 'regulatory_watch',
    legalCategory: 'commercial',
    administrativeLevel: 'national',
    urgencyLevel: 'urgent',
    confidentialityLevel: 'internal',
    affectedSectors: ['Banque', 'Finance', 'Économie'],
    budgetImpact: 'high',
    publicImpact: 'high',
    steps: [
      {
        id: 'step-1',
        name: 'Détection Changement Réglementaire',
        description: 'Détection d\'un nouveau texte réglementaire par l\'équipe de veille',
        status: 'completed',
        assignee: 'Kamel Boudiaf',
        assigneeRole: 'Analyste de Veille',
        required: true,
        order: 1,
        legalReferences: ['Journal officiel', 'Bulletins officiels'],
        administrativeLevel: 'national',
        documentType: 'circulaire',
        completedAt: new Date('2024-01-15')
      },
      {
        id: 'step-2',
        name: 'Analyse Impact',
        description: 'Analyse de l\'impact sur le secteur bancaire',
        status: 'in_progress',
        assignee: 'Sara Mansouri',
        assigneeRole: 'Analyste Juridique',
        required: true,
        order: 2,
        legalReferences: ['Code monétaire et financier', 'Réglementation bancaire'],
        administrativeLevel: 'national',
        documentType: 'circulaire',
        dueDate: new Date('2024-01-18')
      },
      {
        id: 'step-3',
        name: 'Rédaction Rapport',
        description: 'Rédaction du rapport d\'analyse et recommandations',
        status: 'pending',
        assignee: 'Hassan Benchaabane',
        assigneeRole: 'Rédacteur Technique',
        required: true,
        order: 3,
        legalReferences: ['Méthodologie d\'analyse', 'Standards de reporting'],
        administrativeLevel: 'national',
        documentType: 'circulaire'
      },
      {
        id: 'step-4',
        name: 'Validation Direction',
        description: 'Validation par la direction générale',
        status: 'pending',
        assignee: 'Directeur Général',
        assigneeRole: 'Directeur Général',
        required: true,
        order: 4,
        legalReferences: ['Procédure de validation'],
        administrativeLevel: 'national',
        documentType: 'circulaire'
      },
      {
        id: 'step-5',
        name: 'Diffusion Interne',
        description: 'Diffusion du rapport aux services concernés',
        status: 'pending',
        assignee: 'Service Communication',
        assigneeRole: 'Chargé de Communication',
        required: true,
        order: 5,
        legalReferences: ['Procédure de diffusion'],
        administrativeLevel: 'national',
        documentType: 'circulaire'
      }
    ],
    currentStep: 1,
    status: 'in_review',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    submittedBy: 'Service de Veille Réglementaire - Banque d\'Algérie',
    priority: 'high',
    estimatedDuration: 15
  }
];

// Exemples de workflows pour consultations juridiques
export const legalConsultationWorkflows: AlgerianWorkflowConfig[] = [
  {
    id: 'workflow-consult-001',
    title: 'Consultation Juridique - Investissement Étranger',
    description: 'Workflow de consultation juridique pour un projet d\'investissement étranger',
    type: 'legal_consultation',
    legalCategory: 'commercial',
    administrativeLevel: 'national',
    urgencyLevel: 'urgent',
    confidentialityLevel: 'confidential',
    affectedSectors: ['Investissement', 'Commerce', 'Économie'],
    budgetImpact: 'high',
    publicImpact: 'medium',
    steps: [
      {
        id: 'step-1',
        name: 'Réception Demande',
        description: 'Réception et analyse de la demande de consultation',
        status: 'completed',
        assignee: 'Amina Bensalem',
        assigneeRole: 'Chargée d\'Accueil',
        required: true,
        order: 1,
        legalReferences: ['Code de l\'investissement', 'Procédure de consultation'],
        administrativeLevel: 'national',
        documentType: 'instruction',
        completedAt: new Date('2024-01-12')
      },
      {
        id: 'step-2',
        name: 'Analyse Juridique Préliminaire',
        description: 'Analyse juridique préliminaire par l\'équipe juridique',
        status: 'in_progress',
        assignee: 'Omar Zerrouki',
        assigneeRole: 'Juriste Senior',
        required: true,
        order: 2,
        legalReferences: ['Code de l\'investissement', 'Code des douanes', 'Code fiscal'],
        administrativeLevel: 'national',
        documentType: 'instruction',
        dueDate: new Date('2024-01-16')
      },
      {
        id: 'step-3',
        name: 'Consultation Interministérielle',
        description: 'Consultation avec les ministères concernés',
        status: 'pending',
        assignee: 'Fatima Benali',
        assigneeRole: 'Coordinatrice Interministérielle',
        required: true,
        order: 3,
        legalReferences: ['Procédure de consultation interministérielle'],
        administrativeLevel: 'national',
        documentType: 'instruction'
      },
      {
        id: 'step-4',
        name: 'Rédaction Avis Juridique',
        description: 'Rédaction de l\'avis juridique final',
        status: 'pending',
        assignee: 'Khadidja Mansouri',
        assigneeRole: 'Rédactrice Juridique',
        required: true,
        order: 4,
        legalReferences: ['Standards de rédaction juridique'],
        administrativeLevel: 'national',
        documentType: 'instruction'
      },
      {
        id: 'step-5',
        name: 'Validation et Signature',
        description: 'Validation et signature par le directeur juridique',
        status: 'pending',
        assignee: 'Directeur Juridique',
        assigneeRole: 'Directeur Juridique',
        required: true,
        order: 5,
        legalReferences: ['Procédure de validation'],
        administrativeLevel: 'national',
        documentType: 'instruction'
      }
    ],
    currentStep: 1,
    status: 'in_review',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
    submittedBy: 'Service Juridique - Agence Nationale d\'Investissement',
    priority: 'high',
    estimatedDuration: 25
  }
];

// Fonction pour obtenir tous les exemples de workflows
export const getAllAlgerianWorkflowExamples = (): AlgerianWorkflowConfig[] => {
  return [
    ...legalTextWorkflows,
    ...administrativeProcedureWorkflows,
    ...regulatoryWatchWorkflows,
    ...legalConsultationWorkflows
  ];
};

// Fonction pour obtenir les workflows par type
export const getWorkflowsByType = (type: AlgerianWorkflowConfig['type']): AlgerianWorkflowConfig[] => {
  switch (type) {
    case 'legal_text':
      return legalTextWorkflows;
    case 'administrative_procedure':
      return administrativeProcedureWorkflows;
    case 'regulatory_watch':
      return regulatoryWatchWorkflows;
    case 'legal_consultation':
      return legalConsultationWorkflows;
    default:
      return [];
  }
};

// Fonction pour obtenir les workflows par niveau administratif
export const getWorkflowsByAdministrativeLevel = (level: AlgerianWorkflowConfig['administrativeLevel']): AlgerianWorkflowConfig[] => {
  return getAllAlgerianWorkflowExamples().filter(workflow => workflow.administrativeLevel === level);
};

// Fonction pour obtenir les workflows par urgence
export const getWorkflowsByUrgency = (urgency: AlgerianWorkflowConfig['urgencyLevel']): AlgerianWorkflowConfig[] => {
  return getAllAlgerianWorkflowExamples().filter(workflow => workflow.urgencyLevel === urgency);
};

// Fonction pour créer un nouveau workflow basé sur un template
export const createWorkflowFromTemplate = (templateId: string, customData: Partial<AlgerianWorkflowConfig>): AlgerianWorkflowConfig => {
  const allWorkflows = getAllAlgerianWorkflowExamples();
  const template = allWorkflows.find(w => w.id === templateId);
  
  if (!template) {
    throw new Error(`Template de workflow non trouvé: ${templateId}`);
  }
  
  return {
    ...template,
    ...customData,
    id: `workflow-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'draft'
  };
};