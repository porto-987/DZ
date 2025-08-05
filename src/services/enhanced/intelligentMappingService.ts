/**
 * Service de mapping intelligent pour les formulaires algériens
 * Implémente le mapping basé sur les expressions régulières extraites
 */

import { StructuredPublication, LegalEntity } from './algerianLegalRegexService';

export interface MappedField {
  fieldId: string;
  fieldName: string; // Ajout de la propriété fieldName
  originalValue: string;
  mappedValue: string;
  confidence: number;
  status: 'mapped' | 'unmapped' | 'pending' | 'suggested';
  source: 'regex' | 'ai' | 'manual' | 'nomenclature';
  metadata?: Record<string, any>;
}

export interface MappedSection {
  sectionId: string;
  fields: MappedField[];
}

export interface FormStructure {
  id: string;
  name: string;
  fields: FormField[];
  algerianSpecific: boolean;
  category: 'legal' | 'administrative' | 'commercial' | 'civil';
}

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  required: boolean;
  algerianNomenclature?: string[];
  regexPatterns?: string[];
  validationRules?: string[];
  mappingPriority: number;
}

export interface MappingResult {
  formId: string;
  mappedFields: MappedField[];
  unmappedFields: string[];
  suggestedMappings: MappedField[];
  overallConfidence: number;
  processingTime: number;
  sections?: MappedSection[]; // Ajout de la propriété sections
  warnings?: string[]; // Ajout de la propriété warnings
  metadata: {
    documentType: string;
    entitiesExtracted: number;
    fieldsMapped: number;
    fieldsUnmapped: number;
  };
}

class IntelligentMappingService {
  private readonly ALGERIAN_NOMENCLATURE = {
    // Types de documents
    documentTypes: {
      'loi': ['loi', 'قانون', 'law'],
      'decret': ['décret', 'مرسوم', 'decree'],
      'arrete': ['arrêté', 'قرار', 'order'],
      'ordonnance': ['ordonnance', 'أمر', 'ordinance']
    },

    // Institutions
    institutions: {
      'presidence': ['présidence', 'الرئاسة', 'presidency'],
      'ministere': ['ministère', 'الوزارة', 'ministry'],
      'direction': ['direction', 'المديرية', 'directorate'],
      'service': ['service', 'المصلحة', 'service']
    },

    // Pouvoirs émetteurs
    powerEmitters: {
      'presidentiel': ['présidentiel', 'رئاسي', 'presidential'],
      'ministeriel': ['ministériel', 'وزاري', 'ministerial'],
      'gouvernemental': ['gouvernemental', 'حكومي', 'governmental']
    },

    // Dates
    dateFormats: {
      'hijri': ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'],
      'gregorian': ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    }
  };

  private readonly MAPPING_RULES = {
    // Règles de mapping basées sur les expressions régulières
    publicationType: {
      patterns: [/loi/i, /décret/i, /arrêté/i, /ordonnance/i],
      fieldTypes: ['document_type', 'type_publication'],
      confidence: 0.95
    },
    number: {
      patterns: [/n°\s*(\d+)/i, /numéro\s*(\d+)/i],
      fieldTypes: ['document_number', 'numero'],
      confidence: 0.9
    },
    date: {
      patterns: [/(\d{1,2}\/\d{1,2}\/\d{4})/i, /(\d{1,2}\s+\w+\s+\d{4})/i],
      fieldTypes: ['date_publication', 'date_emission'],
      confidence: 0.85
    },
    institution: {
      patterns: [/Présidence/i, /Ministère/i, /Direction/i, /Service/i],
      fieldTypes: ['institution_emetteur', 'organisme'],
      confidence: 0.9
    },
    content: {
      patterns: [/Article\s+(\d+)/i, /المادة\s+(\d+)/i],
      fieldTypes: ['contenu', 'articles'],
      confidence: 0.8
    }
  };

  /**
   * Mappe les données extraites vers un formulaire
   */
  async mapExtractedDataToForm(
    extractedData: StructuredPublication,
    formType: string
  ): Promise<MappingResult> {
    const startTime = Date.now();
    
    // Récupérer la structure du formulaire
    const formStructure = this.getFormStructure(formType);
    if (!formStructure) {
      throw new Error(`Type de formulaire non supporté: ${formType}`);
    }

    const mappedFields: MappedField[] = [];
    const unmappedFields: string[] = [];

    // Étape 1: Mapping par entités extraites
    for (const entity of extractedData.entities) {
      const mappedField = this.mapEntityToFormField(entity, formStructure);
      if (mappedField) {
        mappedFields.push(mappedField);
      }
    }

    // Étape 2: Mapping par expressions régulières
    const regexMappings = this.mapByRegexPatterns(extractedData, formStructure);
    mappedFields.push(...regexMappings);

    // Étape 3: Mapping par nomenclature algérienne
    const nomenclatureMappings = this.mapByAlgerianNomenclature(extractedData, formStructure);
    mappedFields.push(...nomenclatureMappings);

    // Étape 4: Identifier les champs non mappés
    const mappedFieldIds = new Set(mappedFields.map(field => field.fieldId));
    for (const field of formStructure.fields) {
      if (!mappedFieldIds.has(field.id)) {
        unmappedFields.push(field.id);
      }
    }

    // Étape 5: Générer des suggestions pour les champs non mappés
    const suggestions = this.generateSuggestions(extractedData, unmappedFields, formStructure);

    // Étape 6: Calculer la confiance globale
    const overallConfidence = this.calculateOverallConfidence(mappedFields);

    // Étape 7: Traiter les champs non mappés
    const unmappedMappings = this.handleUnmappedFields(unmappedFields, formStructure, extractedData);

    const processingTime = Date.now() - startTime;

    return {
      formId: formStructure.id,
      mappedFields: [...mappedFields, ...unmappedMappings],
      unmappedFields,
      suggestedMappings: suggestions,
      overallConfidence,
      processingTime,
      metadata: {
        documentType: extractedData.type || 'unknown',
        entitiesExtracted: extractedData.entities.length,
        fieldsMapped: mappedFields.length,
        fieldsUnmapped: unmappedFields.length
      }
    };
  }

  /**
   * Mapping d'une entité vers un champ de formulaire
   */
  private mapEntityToFormField(entity: LegalEntity, formStructure: FormStructure): MappedField | null {
    for (const field of formStructure.fields) {
      const confidence = this.calculateEntityFieldConfidence(entity, field);
      
      if (confidence > 0.7) {
        return {
          fieldId: field.id,
          fieldName: field.name, // Ajout de fieldName
          originalValue: entity.value,
          mappedValue: this.transformValueForField(entity.value, field),
          confidence,
          status: 'mapped',
          source: 'regex',
          metadata: {
            entityType: entity.type,
            fieldType: field.type,
            originalPosition: entity.position
          }
        };
      }
    }

    return null;
  }

  /**
   * Mapping basé sur les expressions régulières
   */
  private mapByRegexPatterns(extractedData: StructuredPublication, formStructure: FormStructure): MappedField[] {
    const mappings: MappedField[] = [];
    const allText = this.extractAllText(extractedData);

    for (const [ruleName, rule] of Object.entries(this.MAPPING_RULES)) {
      for (const pattern of rule.patterns) {
        const matches = allText.match(pattern);
        if (matches) {
          for (const fieldType of rule.fieldTypes) {
            const field = formStructure.fields.find(f => 
              f.id.toLowerCase().includes(fieldType.toLowerCase()) ||
              f.name.toLowerCase().includes(fieldType.toLowerCase())
            );

            if (field) {
              mappings.push({
                fieldId: field.id,
                fieldName: field.name, // Ajout de fieldName
                originalValue: matches[0],
                mappedValue: this.transformValueForField(matches[0], field),
                confidence: rule.confidence,
                status: 'mapped',
                source: 'regex',
                metadata: {
                  ruleName,
                  pattern: pattern.source,
                  fieldType
                }
              });
            }
          }
        }
      }
    }

    return mappings;
  }

  /**
   * Mapping basé sur la nomenclature algérienne
   */
  private mapByAlgerianNomenclature(extractedData: StructuredPublication, formStructure: FormStructure): MappedField[] {
    const mappings: MappedField[] = [];
    const allText = this.extractAllText(extractedData).toLowerCase();

    for (const [category, terms] of Object.entries(this.ALGERIAN_NOMENCLATURE)) {
      for (const [term, variations] of Object.entries(terms)) {
        const hasMatch = variations.some(variation => allText.includes(variation.toLowerCase()));
        
        if (hasMatch) {
          const field = this.findFieldByNomenclature(formStructure, category, term);
          if (field) {
            const matchedVariation = variations.find(v => allText.includes(v.toLowerCase()));
            mappings.push({
              fieldId: field.id,
              fieldName: field.name, // Ajout de fieldName
              originalValue: matchedVariation || term,
              mappedValue: this.transformValueForField(matchedVariation || term, field),
              confidence: 0.85,
              status: 'mapped',
              source: 'nomenclature',
              metadata: {
                category,
                term,
                matchedVariation
              }
            });
          }
        }
      }
    }

    return mappings;
  }

  /**
   * Génération de suggestions pour les champs non mappés
   */
  private generateSuggestions(
    extractedData: StructuredPublication,
    unmappedFields: string[],
    formStructure: FormStructure
  ): MappedField[] {
    const suggestions: MappedField[] = [];

    for (const fieldId of unmappedFields) {
      const field = formStructure.fields.find(f => f.id === fieldId);
      if (!field) continue;

      // Analyse du contenu pour générer des suggestions
      const suggestion = this.analyzeContentForSuggestion(extractedData, field);
      if (suggestion) {
        suggestions.push({
          fieldId: field.id,
          fieldName: field.name, // Ajout de fieldName
          originalValue: suggestion.value,
          mappedValue: suggestion.mappedValue,
          confidence: suggestion.confidence,
          status: 'suggested',
          source: 'ai',
          metadata: {
            suggestionType: suggestion.type,
            reasoning: suggestion.reasoning
          }
        });
      }
    }

    return suggestions;
  }

  /**
   * Validation croisée avec la nomenclature algérienne
   */
  private validateWithAlgerianNomenclature(mapping: MappedField): boolean {
    const value = mapping.mappedValue.toLowerCase();
    
    // Vérification avec la nomenclature algérienne
    for (const [category, terms] of Object.entries(this.ALGERIAN_NOMENCLATURE)) {
      for (const [term, variations] of Object.entries(terms)) {
        if (variations.some(v => value.includes(v.toLowerCase()))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Gestion des champs non mappés avec suggestions
   */
  private handleUnmappedFields(
    unmappedFields: string[],
    formStructure: FormStructure,
    extractedData: StructuredPublication
  ): MappedField[] {
    const suggestions: MappedField[] = [];

    for (const fieldId of unmappedFields) {
      const field = formStructure.fields.find(f => f.id === fieldId);
      if (!field) continue;

      // Analyse du contenu pour générer des suggestions
      const bestMatch = this.findBestMatchForField(field, extractedData);
      if (bestMatch) {
        suggestions.push({
          fieldId: field.id,
          fieldName: field.name, // Ajout de fieldName
          originalValue: bestMatch.value,
          mappedValue: bestMatch.mappedValue,
          confidence: bestMatch.confidence,
          status: 'suggested',
          source: 'ai',
          metadata: {
            reasoning: bestMatch.reasoning
          }
        });
      }
    }

    return suggestions;
  }

  /**
   * Score de confiance dynamique
   */
  private calculateDynamicConfidence(mapping: MappedField, extractedData: StructuredPublication): number {
    let confidence = mapping.confidence;

    // Bonus pour la validation avec la nomenclature algérienne
    if (this.validateWithAlgerianNomenclature(mapping)) {
      confidence += 0.1;
    }

    // Bonus pour la cohérence avec le type de document
    if (this.isConsistentWithDocumentType(mapping, extractedData)) {
      confidence += 0.05;
    }

    // Bonus pour la position dans le document
    if (mapping.metadata?.originalPosition) {
      const position = mapping.metadata.originalPosition;
      if (position.start < extractedData.content.length * 0.3) {
        confidence += 0.05; // Bonus pour les informations en début de document
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Map to Algerian nomenclature (for compatibility)
   */
  mapToAlgerianNomenclature(text: string): Record<string, any> {
    // Basic mapping implementation
    return {
      mappedTerms: [],
      nomenclature: 'algerian_legal',
      confidence: 0.8
    };
  }

  // Méthodes utilitaires
  private calculateEntityFieldConfidence(entity: LegalEntity, field: FormField): number {
    const baseConfidence = entity.confidence;
    const fieldTypeMatch = this.calculateFieldTypeMatch(entity, field);
    const nomenclatureMatch = this.calculateNomenclatureMatch(entity, field);
    
    return (baseConfidence + fieldTypeMatch + nomenclatureMatch) / 3;
  }

  private calculateFieldTypeMatch(entity: LegalEntity, field: FormField): number {
    const typeMapping = {
      'date': ['date'],
      'number': ['number'],
      'text': ['publication_type', 'power_emitter', 'institution', 'content']
    };

    const entityType = entity.type;
    const fieldType = field.type;

    for (const [fieldTypeKey, entityTypes] of Object.entries(typeMapping)) {
      if (fieldType === fieldTypeKey && entityTypes.includes(entityType)) {
        return 0.9;
      }
    }

    return 0.5;
  }

  private calculateNomenclatureMatch(entity: LegalEntity, field: FormField): number {
    if (!field.algerianNomenclature) return 0.5;

    const entityValue = entity.value.toLowerCase();
    const nomenclature = field.algerianNomenclature.map(n => n.toLowerCase());

    for (const term of nomenclature) {
      if (entityValue.includes(term)) {
        return 0.9;
      }
    }

    return 0.3;
  }

  private transformValueForField(value: string, field: FormField): string {
    switch (field.type) {
      case 'date':
        return this.normalizeDate(value);
      case 'number':
        return this.extractNumber(value);
      case 'text':
        return this.normalizeText(value);
      default:
        return value;
    }
  }

  private normalizeDate(value: string): string {
    // Normalisation des dates
    const dateMatch = value.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    return dateMatch ? dateMatch[1] : value;
  }

  private extractNumber(value: string): string {
    // Extraction des nombres
    const numberMatch = value.match(/(\d+)/);
    return numberMatch ? numberMatch[1] : value;
  }

  private normalizeText(value: string): string {
    // Normalisation du texte
    return value.trim().replace(/\s+/g, ' ');
  }

  private extractAllText(extractedData: StructuredPublication): string {
    return [
      extractedData.type,
      extractedData.powerEmitter,
      extractedData.number,
      extractedData.date,
      extractedData.institution,
      extractedData.content,
      ...extractedData.articles
    ].join(' ');
  }

  private findFieldByNomenclature(formStructure: FormStructure, category: string, term: string): FormField | null {
    return formStructure.fields.find(field => 
      field.algerianNomenclature?.some(n => 
        n.toLowerCase().includes(term.toLowerCase()) ||
        n.toLowerCase().includes(category.toLowerCase())
      )
    ) || null;
  }

  private analyzeContentForSuggestion(extractedData: StructuredPublication, field: FormField): any {
    // Analyse du contenu pour générer des suggestions
    const allText = this.extractAllText(extractedData).toLowerCase();
    
    // Recherche de patterns spécifiques au champ
    const patterns = this.getFieldPatterns(field);
    
    for (const pattern of patterns) {
      const match = allText.match(pattern);
      if (match) {
        return {
          value: match[0],
          mappedValue: this.transformValueForField(match[0], field),
          confidence: 0.7,
          type: 'pattern_match',
          reasoning: `Pattern match: ${pattern.source}`
        };
      }
    }

    return null;
  }

  private getFieldPatterns(field: FormField): RegExp[] {
    const patterns: RegExp[] = [];

    switch (field.type) {
      case 'date':
        patterns.push(/(\d{1,2}\/\d{1,2}\/\d{4})/);
        break;
      case 'number':
        patterns.push(/n°\s*(\d+)/i);
        break;
      case 'text':
        patterns.push(/[A-Z][a-z]+/);
        break;
    }

    return patterns;
  }

  private findBestMatchForField(field: FormField, extractedData: StructuredPublication): any {
    // Recherche du meilleur match pour un champ
    const allText = this.extractAllText(extractedData);
    
    // Analyse basée sur le type de champ
    switch (field.type) {
      case 'date':
        return this.findBestDateMatch(allText);
      case 'number':
        return this.findBestNumberMatch(allText);
      case 'text':
        return this.findBestTextMatch(allText, field);
      default:
        return null;
    }
  }

  private findBestDateMatch(text: string): any {
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (dateMatch) {
      return {
        value: dateMatch[0],
        mappedValue: dateMatch[1],
        confidence: 0.8,
        reasoning: 'Date pattern detected'
      };
    }
    return null;
  }

  private findBestNumberMatch(text: string): any {
    const numberMatch = text.match(/n°\s*(\d+)/i);
    if (numberMatch) {
      return {
        value: numberMatch[0],
        mappedValue: numberMatch[1],
        confidence: 0.8,
        reasoning: 'Number pattern detected'
      };
    }
    return null;
  }

  private findBestTextMatch(text: string, field: FormField): any {
    // Recherche basée sur la nomenclature algérienne
    if (field.algerianNomenclature) {
      for (const term of field.algerianNomenclature) {
        const match = text.match(new RegExp(term, 'i'));
        if (match) {
          return {
            value: match[0],
            mappedValue: match[0],
            confidence: 0.7,
            reasoning: `Nomenclature match: ${term}`
          };
        }
      }
    }
    return null;
  }

  private isConsistentWithDocumentType(mapping: MappedField, extractedData: StructuredPublication): boolean {
    // Vérification de la cohérence avec le type de document
    const documentType = extractedData.type.toLowerCase();
    const fieldValue = mapping.mappedValue.toLowerCase();

    const typeConsistency = {
      'loi': ['loi', 'law'],
      'decret': ['décret', 'decree'],
      'arrete': ['arrêté', 'order']
    };

    const expectedTerms = typeConsistency[documentType as keyof typeof typeConsistency];
    if (expectedTerms) {
      return expectedTerms.some(term => fieldValue.includes(term));
    }

    return true;
  }

  private calculateOverallConfidence(mappedFields: MappedField[]): number {
    if (mappedFields.length === 0) return 0;
    
    const totalConfidence = mappedFields.reduce((sum, field) => sum + field.confidence, 0);
    return totalConfidence / mappedFields.length;
  }

  /**
   * Récupère les types de formulaires disponibles
   */
  getAvailableFormTypes(): string[] {
    return [
      'loi',
      'decret', 
      'arrete',
      'ordonnance',
      'decision',
      'circulaire',
      'instruction',
      'avis',
      'proclamation'
    ];
  }

  /**
   * Récupère la structure d'un formulaire par type
   */
  getFormStructure(formType: string): FormStructure | null {
    const defaultStructure: FormStructure = {
      id: formType,
      name: `Formulaire ${formType}`,
      fields: [
        {
          id: 'document_type',
          name: 'Type de document',
          type: 'select',
          required: true,
          algerianNomenclature: ['loi', 'décret', 'arrêté', 'ordonnance'],
          mappingPriority: 1
        },
        {
          id: 'document_number',
          name: 'Numéro du document',
          type: 'text',
          required: true,
          regexPatterns: ['/n°\\s*(\\d+)/i'], // Convertir RegExp en string
          mappingPriority: 2
        },
        {
          id: 'date_emission',
          name: 'Date d\'émission',
          type: 'date',
          required: true,
          mappingPriority: 3
        },
        {
          id: 'institution',
          name: 'Institution émettrice',
          type: 'text',
          required: true,
          algerianNomenclature: ['présidence', 'ministère', 'direction'],
          mappingPriority: 4
        },
        {
          id: 'content',
          name: 'Contenu',
          type: 'textarea',
          required: false,
          mappingPriority: 5
        }
      ],
      algerianSpecific: true,
      category: 'legal'
    };

    return defaultStructure;
  }
}

export const intelligentMappingService = new IntelligentMappingService();
export default intelligentMappingService;