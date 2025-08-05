/**
 * Service de workflow d'approbation intégré pour les documents algériens
 * Implémente la queue d'approbation avant enregistrement final
 */

import { MappedField, MappingResult } from './intelligentMappingService';
import { StructuredPublication } from './algerianLegalRegexService';

export interface ApprovalItem {
  id: string;
  documentId: string;
  documentType: string;
  mappedFields: MappedField[];
  unmappedFields: string[];
  suggestedMappings: MappedField[];
  overallConfidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  reviewer?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  submittedAt: Date;
  comments: ApprovalComment[];
  originalDocument: {
    filename: string;
    pages: number;
    format: string;
    size: number;
  };
  processingMetadata: {
    algorithmUsed: string;
    extractionTime: number;
  };
  mappingResults: {
    confidence: number;
    unmappedFields: string[];
  };
  metadata: {
    processingTime: number;
    entitiesExtracted: number;
    fieldsMapped: number;
    fieldsUnmapped: number;
    documentSize: number;
    language: string;
  };
}

export interface ApprovalComment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  type: 'comment' | 'correction' | 'approval' | 'rejection';
  fieldId?: string;
  oldValue?: string;
  newValue?: string;
}

export interface ApprovalBatch {
  id: string;
  name: string;
  items: ApprovalItem[];
  status: 'pending' | 'approved' | 'rejected' | 'partial';
  createdAt: Date;
  completedAt?: Date;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: {
    totalItems: number;
    approvedItems: number;
    rejectedItems: number;
    averageConfidence: number;
  };
}

export interface ApprovalHistory {
  itemId: string;
  action: 'created' | 'assigned' | 'reviewed' | 'approved' | 'rejected' | 'corrected';
  timestamp: Date;
  user: string;
  details: Record<string, any>;
}

export interface ApprovalSettings {
  autoAssignment: boolean;
  notificationEnabled: boolean;
  escalationTimeout: number; // heures
  requireDoubleValidation: boolean;
  confidenceThreshold: number;
  batchProcessingEnabled: boolean;
  learningModeEnabled: boolean;
}

class ApprovalWorkflowService {
  private approvalQueue: ApprovalItem[] = [];
  private approvalBatches: ApprovalBatch[] = [];
  private approvalHistory: ApprovalHistory[] = [];
  private settings: ApprovalSettings = {
    autoAssignment: true,
    notificationEnabled: true,
    escalationTimeout: 48,
    requireDoubleValidation: false,
    confidenceThreshold: 0.8,
    batchProcessingEnabled: true,
    learningModeEnabled: true
  };

  /**
   * Création d'un item d'approbation depuis le mapping
   */
  async createApprovalItem(
    mappingResult: MappingResult,
    documentData: StructuredPublication,
    priority: ApprovalItem['priority'] = 'medium'
  ): Promise<ApprovalItem> {
    console.log('🇩🇿 Creating approval item for Algerian document...');

    const item: ApprovalItem = {
      id: this.generateId(),
      documentId: this.generateDocumentId(documentData),
      documentType: documentData.type,
      mappedFields: mappingResult.mappedFields,
      unmappedFields: mappingResult.unmappedFields,
      suggestedMappings: mappingResult.suggestedMappings,
      overallConfidence: mappingResult.overallConfidence,
      status: this.determineInitialStatus(mappingResult),
      priority: this.determinePriority(mappingResult, priority),
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: new Date(),
      assignedTo: this.autoAssignReviewer(mappingResult),
      comments: [],
      originalDocument: {
        filename: `document_${Date.now()}.pdf`,
        pages: 1,
        format: 'PDF',
        size: this.calculateDocumentSize(documentData)
      },
      processingMetadata: {
        algorithmUsed: 'AlgerianLegalRegex',
        extractionTime: mappingResult.processingTime
      },
      mappingResults: {
        confidence: mappingResult.overallConfidence,
        unmappedFields: mappingResult.unmappedFields
      },
      metadata: {
        processingTime: mappingResult.processingTime,
        entitiesExtracted: documentData.entities.length,
        fieldsMapped: mappingResult.mappedFields.length,
        fieldsUnmapped: mappingResult.unmappedFields.length,
        documentSize: this.calculateDocumentSize(documentData),
        language: this.detectLanguage(documentData)
      }
    };

    this.approvalQueue.push(item);
    this.addToHistory(item.id, 'created', 'system', { documentType: documentData.type });

    console.log(`✅ Approval item created: ${item.id}, Status: ${item.status}, Priority: ${item.priority}`);
    return item;
  }

  /**
   * Révision manuelle des mappings incertains
   */
  async reviewMapping(
    itemId: string,
    reviewer: string,
    corrections: Array<{
      fieldId: string;
      oldValue: string;
      newValue: string;
      reason: string;
    }>
  ): Promise<ApprovalItem> {
    const item = this.approvalQueue.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Approval item not found: ${itemId}`);
    }

    console.log(`🔍 Reviewing mapping for item: ${itemId} by ${reviewer}`);

    // Appliquer les corrections
    for (const correction of corrections) {
      const field = item.mappedFields.find(f => f.fieldId === correction.fieldId);
      if (field) {
        field.mappedValue = correction.newValue;
        field.confidence = Math.min(field.confidence + 0.1, 1.0);
        field.status = 'mapped';
      }

      // Ajouter un commentaire de correction
      item.comments.push({
        id: this.generateId(),
        author: reviewer,
        content: correction.reason,
        timestamp: new Date(),
        type: 'correction',
        fieldId: correction.fieldId,
        oldValue: correction.oldValue,
        newValue: correction.newValue
      });
    }

    // Mettre à jour le statut
    item.status = this.recalculateStatus(item);
    item.updatedAt = new Date();
    item.reviewer = reviewer;

    this.addToHistory(itemId, 'reviewed', reviewer, { corrections: corrections.length });

    console.log(`✅ Mapping reviewed: ${corrections.length} corrections applied`);
    return item;
  }

  /**
   * Validation par lot pour documents similaires
   */
  async createApprovalBatch(
    items: ApprovalItem[],
    assignedTo: string,
    priority: ApprovalBatch['priority'] = 'medium'
  ): Promise<ApprovalBatch> {
    console.log('🇩🇿 Creating approval batch for similar documents...');

    const batch: ApprovalBatch = {
      id: this.generateId(),
      name: `Batch ${new Date().toISOString().split('T')[0]} - ${items.length} items`,
      items,
      status: 'pending',
      createdAt: new Date(),
      assignedTo,
      priority,
      metadata: {
        totalItems: items.length,
        approvedItems: 0,
        rejectedItems: 0,
        averageConfidence: items.reduce((sum, item) => sum + item.overallConfidence, 0) / items.length
      }
    };

    this.approvalBatches.push(batch);

    // Mettre à jour les items
    for (const item of items) {
      item.status = 'under_review';
      item.assignedTo = assignedTo;
      item.updatedAt = new Date();
    }

    console.log(`✅ Approval batch created: ${batch.id} with ${items.length} items`);
    return batch;
  }

  /**
   * Validation d'un item d'approbation
   */
  async approveItem(
    itemId: string,
    approver: string,
    comments?: string
  ): Promise<ApprovalItem> {
    const item = this.approvalQueue.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Approval item not found: ${itemId}`);
    }

    console.log(`✅ Approving item: ${itemId} by ${approver}`);

    item.status = 'approved';
    item.updatedAt = new Date();
    item.reviewer = approver;

    if (comments) {
      item.comments.push({
        id: this.generateId(),
        author: approver,
        content: comments,
        timestamp: new Date(),
        type: 'approval'
      });
    }

    this.addToHistory(itemId, 'approved', approver, { overallConfidence: item.overallConfidence });

    // Apprentissage si activé
    if (this.settings.learningModeEnabled) {
      this.learnFromApproval(item);
    }

    console.log(`✅ Item approved: ${itemId}`);
    return item;
  }

  /**
   * Rejet d'un item d'approbation
   */
  async rejectItem(
    itemId: string,
    rejector: string,
    reason: string
  ): Promise<ApprovalItem> {
    const item = this.approvalQueue.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Approval item not found: ${itemId}`);
    }

    console.log(`❌ Rejecting item: ${itemId} by ${rejector}`);

    item.status = 'rejected';
    item.updatedAt = new Date();
    item.reviewer = rejector;

    item.comments.push({
      id: this.generateId(),
      author: rejector,
      content: reason,
      timestamp: new Date(),
      type: 'rejection'
    });

    this.addToHistory(itemId, 'rejected', rejector, { reason });

    console.log(`❌ Item rejected: ${itemId}`);
    return item;
  }

  /**
   * Historique des corrections pour apprentissage
   */
  async getApprovalHistory(itemId: string): Promise<ApprovalHistory[]> {
    return this.approvalHistory.filter(h => h.itemId === itemId);
  }

  /**
   * Obtenir les items en attente d'approbation
   */
  async getPendingItems(assignedTo?: string): Promise<ApprovalItem[]> {
    let items = this.approvalQueue.filter(item => 
      item.status === 'pending' || item.status === 'under_review'
    );

    if (assignedTo) {
      items = items.filter(item => item.assignedTo === assignedTo);
    }

    // Tri par priorité et date de création
    return items.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Obtenir les statistiques d'approbation
   */
  async getApprovalStats(): Promise<{
    totalItems: number;
    pendingItems: number;
    approvedItems: number;
    rejectedItems: number;
    averageConfidence: number;
    averageProcessingTime: number;
  }> {
    const totalItems = this.approvalQueue.length;
    const pendingItems = this.approvalQueue.filter(i => i.status === 'pending' || i.status === 'under_review').length;
    const approvedItems = this.approvalQueue.filter(i => i.status === 'approved').length;
    const rejectedItems = this.approvalQueue.filter(i => i.status === 'rejected').length;
    
    const averageConfidence = this.approvalQueue.length > 0 
      ? this.approvalQueue.reduce((sum, item) => sum + item.overallConfidence, 0) / this.approvalQueue.length
      : 0;
    
    const averageProcessingTime = this.approvalQueue.length > 0
      ? this.approvalQueue.reduce((sum, item) => sum + item.metadata.processingTime, 0) / this.approvalQueue.length
      : 0;

    return {
      totalItems,
      pendingItems,
      approvedItems,
      rejectedItems,
      averageConfidence,
      averageProcessingTime
    };
  }

  /**
   * Configuration des paramètres d'approbation
   */
  async updateApprovalSettings(settings: Partial<ApprovalSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    console.log('⚙️ Approval settings updated:', this.settings);
  }

  // Méthodes utilitaires privées
  private generateId(): string {
    return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDocumentId(documentData: StructuredPublication): string {
    return `doc_${documentData.type}_${documentData.number || Date.now()}`;
  }

  private determineInitialStatus(mappingResult: MappingResult): ApprovalItem['status'] {
    if (mappingResult.overallConfidence >= this.settings.confidenceThreshold) {
      return this.settings.requireDoubleValidation ? 'under_review' : 'approved';
    }
    return 'pending';
  }

  private determinePriority(
    mappingResult: MappingResult,
    basePriority: ApprovalItem['priority']
  ): ApprovalItem['priority'] {
    // Augmenter la priorité si la confiance est faible
    if (mappingResult.overallConfidence < 0.6) {
      return 'high';
    }
    
    // Augmenter la priorité s'il y a beaucoup de champs non mappés
    if (mappingResult.unmappedFields.length > mappingResult.mappedFields.length) {
      return 'high';
    }

    return basePriority;
  }

  private autoAssignReviewer(mappingResult: MappingResult): string {
    if (!this.settings.autoAssignment) {
      return 'unassigned';
    }

    // Logique d'assignation automatique basée sur le type de document
    const documentType = mappingResult.metadata.documentType;
    
    const reviewerMapping = {
      'loi': 'legal_reviewer',
      'decret': 'legal_reviewer',
      'arrete': 'admin_reviewer',
      'journal_officiel': 'official_reviewer'
    };

    return reviewerMapping[documentType as keyof typeof reviewerMapping] || 'general_reviewer';
  }

  private recalculateStatus(item: ApprovalItem): ApprovalItem['status'] {
    const mappedFields = item.mappedFields.filter(f => f.status === 'mapped');
    const unmappedFields = item.unmappedFields.length;
    
    if (unmappedFields === 0 && item.overallConfidence >= this.settings.confidenceThreshold) {
      return this.settings.requireDoubleValidation ? 'under_review' : 'approved';
    }
    
    return 'pending';
  }

  private calculateDocumentSize(documentData: StructuredPublication): number {
    return documentData.content.length + 
           documentData.articles.reduce((sum, article) => sum + article.length, 0);
  }

  private detectLanguage(documentData: StructuredPublication): string {
    // Détection simple basée sur la présence de caractères arabes
    const hasArabic = /[\u0600-\u06FF]/.test(documentData.content);
    const hasFrench = /[àâäéèêëïîôöùûüÿç]/i.test(documentData.content);
    
    if (hasArabic && hasFrench) return 'mixed';
    if (hasArabic) return 'ar';
    if (hasFrench) return 'fr';
    return 'unknown';
  }

  private addToHistory(
    itemId: string,
    action: ApprovalHistory['action'],
    user: string,
    details: Record<string, any>
  ): void {
    this.approvalHistory.push({
      itemId,
      action,
      timestamp: new Date(),
      user,
      details
    });
  }

  private learnFromApproval(item: ApprovalItem): void {
    // Apprentissage basé sur les corrections approuvées
    console.log('🧠 Learning from approved item:', item.id);
    
    // Ici, on pourrait implémenter un système d'apprentissage
    // pour améliorer les mappings futurs basés sur les corrections
  }

  /**
   * Get queue items (for compatibility)
   */
  getQueueItems(): ApprovalItem[] {
    return this.approvalQueue;
  }

  /**
   * Get approval statistics (for compatibility)
   */
  async getApprovalStatsExtended() {
    const total = this.approvalQueue.length;
    const pending = this.approvalQueue.filter(item => item.status === 'pending').length;
    const approved = this.approvalQueue.filter(item => item.status === 'approved').length;
    const rejected = this.approvalQueue.filter(item => item.status === 'rejected').length;
    const underReview = this.approvalQueue.filter(item => item.status === 'under_review').length;
    const needsCorrection = this.approvalQueue.filter(item => item.status === 'pending').length; // Using pending as fallback

    return {
      total,
      pending,
      approved,
      rejected,
      underReview,
      needsCorrection,
      autoApprovalRate: total > 0 ? (approved / total) * 100 : 0,
      averageReviewTime: 2.5 // Mock value
    };
  }

  /**
   * Process review action (for compatibility)
   */
  async processReviewAction(itemId: string, action: {
    action: 'approve' | 'reject' | 'request_correction';
    comments?: string;
    corrections?: Record<string, any>;
    reviewerId: string;
  }): Promise<boolean> {
    const item = this.approvalQueue.find(i => i.id === itemId);
    if (!item) return false;

    switch (action.action) {
      case 'approve':
        await this.approveItem(itemId, action.reviewerId);
        break;
      case 'reject':
        await this.rejectItem(itemId, action.reviewerId, action.comments || 'Rejected');
        break;
      case 'request_correction':
        item.status = 'under_review';
        break;
    }

    return true;
  }

  /**
   * Batch approve items (for compatibility)
   */
  async batchApprove(criteria: {
    minConfidence: number;
    reviewerId: string;
  }): Promise<string[]> {
    const eligibleItems = this.approvalQueue.filter(item => 
      item.status === 'pending' && 
      item.overallConfidence >= criteria.minConfidence
    );

    const approvedIds: string[] = [];
    for (const item of eligibleItems) {
      await this.approveItem(item.id, criteria.reviewerId);
      approvedIds.push(item.id);
    }

    return approvedIds;
  }

  /**
   * Nettoyage des items anciens
   */
  async cleanupOldItems(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const initialCount = this.approvalQueue.length;
    this.approvalQueue = this.approvalQueue.filter(item => 
      item.updatedAt > cutoffDate || item.status === 'pending'
    );

    const removedCount = initialCount - this.approvalQueue.length;
    console.log(`🧹 Cleaned up ${removedCount} old approval items`);
  }
}

export const approvalWorkflowService = new ApprovalWorkflowService();
export default approvalWorkflowService;