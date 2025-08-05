// Gestionnaire centralisé des modales fonctionnelles pour l'application
import React, { useState, useCallback } from 'react';

export interface ModalData {
  type: string;
  title: string;
  data?: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

// [SUPPRIMÉ] modalManager et hooks associés. Toute gestion de modale doit passer par UnifiedModalSystem (voir /components/modals/UnifiedModalSystem.tsx)

// Fonctions d'ouverture de modales spécifiques
export const openTimelineExportModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openAdvancedFiltersModal = (section: string) => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openStatisticsModal = (section: string) => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openAlertsConfigModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openKnowledgeGraphModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openDataImportModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openAIAnalysisModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openDebateParticipationModal = (debateTitle: string) => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openWorkflowModal = (workflowType: string = 'new') => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openApprovalTasksModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openApprovalHistoryModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openFavoriteFiltersModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openClearFavoritesModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openTermSuggestionModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openLegalQuizModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openForumReplyModal = (topicTitle: string) => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openUserDiscussionsModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openPopularTopicsModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openOnlineExpertsModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openForumRulesModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openDocumentSuggestionModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openAccessRequestModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openDocumentPreviewModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openAutoWritingModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openCoherenceCheckModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openLegalTranslationModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openDeduplicationModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openNewsletterModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openNewsArchiveModal = () => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openCommentModal = (itemTitle: string) => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openFullScreenModal = (documentTitle: string) => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};

export const openPrintModal = (documentTitle: string) => {
  // This function will now directly call the modal system
  // For example: UnifiedModalSystem.openModal({ ... });
};