/**
 * Service d'expressions régulières juridiques algériennes
 * Implémente la segmentation et extraction selon l'annexe
 */

export interface LegalEntity {
  type: 'publication_type' | 'power_emitter' | 'number' | 'date' | 'institution' | 'reference' | 'content';
  value: string;
  confidence: number;
  position: { start: number; end: number };
  metadata?: Record<string, any>;
}

export interface StructuredPublication {
  type: string;
  powerEmitter: string;
  number: string;
  date: string;
  hijriDate?: string;
  gregorianDate?: string;
  institution: string;
  references: string[];
  content: string;
  articles: string[];
  confidence: number;
  entities: LegalEntity[];
}

export interface PublicationLink {
  type: 'annexe' | 'modification' | 'abrogation' | 'approval' | 'conformity' | 'extension' | 'vu';
  sourcePublication: string;
  targetPublication: string;
  description: string;
  confidence: number;
}

class AlgerianLegalRegexService {
  private readonly PUBLICATION_PATTERNS = {
    // Types de publications
    loi: /(?:loi|قانون)\s*n°\s*(\d+[-\d]*)/gi,
    decret: /(?:décret|مرسوم)\s*n°\s*(\d+[-\d]*)/gi,
    arrete: /(?:arrêté|قرار)\s*n°\s*(\d+[-\d]*)/gi,
    ordonnance: /(?:ordonnance|أمر)\s*n°\s*(\d+[-\d]*)/gi,
    
    // Pouvoirs émetteurs
    presidentiel: /(?:présidentiel|رئاسي)/gi,
    ministeriel: /(?:ministériel|وزاري)/gi,
    gouvernemental: /(?:gouvernemental|حكومي)/gi,
    
    // Numéros
    numero: /n°\s*(\d+[-\d]*)/gi,
    
    // Dates (Hijri + Grégorien)
    dateHijri: /(\d{1,2}\s+(?:محرم|صفر|ربيع الأول|ربيع الثاني|جمادى الأولى|جمادى الآخرة|رجب|شعبان|رمضان|شوال|ذو القعدة|ذو الحجة)\s+\d{4})/gi,
    dateGregorien: /(\d{1,2}\/\d{1,2}\/\d{4})/gi,
    
    // Institutions
    institution: /(?:Présidence|Ministère|Direction|Service|الرئاسة|الوزارة|المديرية|المصلحة)[\s:]+([^\n]+)/gi,
    
    // Références
    reference: /(?:Vu|vu|رؤية)\s+([^,\n]+)/gi,
    
    // Articles
    article: /(?:Article|المادة)\s+(\d+)[\s:]+([^\n]+)/gi
  };

  private readonly LINK_PATTERNS = {
    annexe: /(?:annexe|ملحق)\s+([^\n]+)/gi,
    modification: /(?:modifie|يعدل)\s+([^\n]+)/gi,
    abrogation: /(?:abroge|يلغي)\s+([^\n]+)/gi,
    approval: /(?:approuve|يوافق على)\s+([^\n]+)/gi,
    conformity: /(?:conformité|مطابقة)\s+([^\n]+)/gi,
    extension: /(?:étend|يمتد)\s+([^\n]+)/gi,
    vu: /(?:Vu|vu|رؤية)\s+([^,\n]+)/gi
  };

  /**
   * Segmentation par titres et métadonnées selon l'annexe
   */
  segmentByTitlesAndMetadata(text: string): LegalEntity[] {
    const entities: LegalEntity[] = [];
    let position = 0;

    // Extraction des types de publications
    for (const [type, pattern] of Object.entries(this.PUBLICATION_PATTERNS)) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'publication_type',
          value: match[0],
          confidence: this.calculateConfidence(match[0], type),
          position: { start: match.index, end: match.index + match[0].length },
          metadata: { subtype: type, number: match[1] }
        });
      }
    }

    // Extraction des pouvoirs émetteurs
    const powerPatterns = {
      presidentiel: /(?:présidentiel|رئاسي)/gi,
      ministeriel: /(?:ministériel|وزاري)/gi,
      gouvernemental: /(?:gouvernemental|حكومي)/gi
    };

    for (const [power, pattern] of Object.entries(powerPatterns)) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'power_emitter',
          value: match[0],
          confidence: 0.9,
          position: { start: match.index, end: match.index + match[0].length },
          metadata: { powerType: power }
        });
      }
    }

    return entities;
  }

  /**
   * Capture des dates (Hijri + Grégorien) selon l'annexe
   */
  extractDates(text: string): LegalEntity[] {
    const entities: LegalEntity[] = [];

    // Dates Hijri
    const hijriPattern = /(\d{1,2}\s+(?:محرم|صفر|ربيع الأول|ربيع الثاني|جمادى الأولى|جمادى الآخرة|رجب|شعبان|رمضان|شوال|ذو القعدة|ذو الحجة)\s+\d{4})/gi;
    let hijriMatch;
    while ((hijriMatch = hijriPattern.exec(text)) !== null) {
      entities.push({
        type: 'date',
        value: hijriMatch[0],
        confidence: 0.95,
        position: { start: hijriMatch.index, end: hijriMatch.index + hijriMatch[0].length },
        metadata: { calendar: 'hijri', gregorian: this.convertHijriToGregorian(hijriMatch[0]) }
      });
    }

    // Dates Grégoriennes
    const gregorianPattern = /(\d{1,2}\/\d{1,2}\/\d{4})/gi;
    let gregorianMatch;
    while ((gregorianMatch = gregorianPattern.exec(text)) !== null) {
      entities.push({
        type: 'date',
        value: gregorianMatch[0],
        confidence: 0.9,
        position: { start: gregorianMatch.index, end: gregorianMatch.index + gregorianMatch[0].length },
        metadata: { calendar: 'gregorian' }
      });
    }

    return entities;
  }

  /**
   * Gestion des références et liens selon l'annexe
   */
  extractReferencesAndLinks(text: string): PublicationLink[] {
    const links: PublicationLink[] = [];

    // Liens "Vu"
    const vuPattern = /(?:Vu|vu|رؤية)\s+([^,\n]+)/gi;
    let vuMatch;
    while ((vuMatch = vuPattern.exec(text)) !== null) {
      links.push({
        type: 'vu',
        sourcePublication: this.extractCurrentPublication(text),
        targetPublication: vuMatch[1].trim(),
        description: `Référence à ${vuMatch[1].trim()}`,
        confidence: 0.85
      });
    }

    // Annexes
    const annexePattern = /(?:annexe|ملحق)\s+([^\n]+)/gi;
    let annexeMatch;
    while ((annexeMatch = annexePattern.exec(text)) !== null) {
      links.push({
        type: 'annexe',
        sourcePublication: this.extractCurrentPublication(text),
        targetPublication: annexeMatch[1].trim(),
        description: `Annexe: ${annexeMatch[1].trim()}`,
        confidence: 0.8
      });
    }

    // Modifications
    const modificationPattern = /(?:modifie|يعدل)\s+([^\n]+)/gi;
    let modificationMatch;
    while ((modificationMatch = modificationPattern.exec(text)) !== null) {
      links.push({
        type: 'modification',
        sourcePublication: this.extractCurrentPublication(text),
        targetPublication: modificationMatch[1].trim(),
        description: `Modification de ${modificationMatch[1].trim()}`,
        confidence: 0.8
      });
    }

    // Abrogations
    const abrogationPattern = /(?:abroge|يلغي)\s+([^\n]+)/gi;
    let abrogationMatch;
    while ((abrogationMatch = abrogationPattern.exec(text)) !== null) {
      links.push({
        type: 'abrogation',
        sourcePublication: this.extractCurrentPublication(text),
        targetPublication: abrogationMatch[1].trim(),
        description: `Abrogation de ${abrogationMatch[1].trim()}`,
        confidence: 0.8
      });
    }

    // Approbations
    const approvalPattern = /(?:approuve|يوافق على)\s+([^\n]+)/gi;
    let approvalMatch;
    while ((approvalMatch = approvalPattern.exec(text)) !== null) {
      links.push({
        type: 'approval',
        sourcePublication: this.extractCurrentPublication(text),
        targetPublication: approvalMatch[1].trim(),
        description: `Approbation de ${approvalMatch[1].trim()}`,
        confidence: 0.8
      });
    }

    // Contrôle de conformité
    const conformityPattern = /(?:conformité|مطابقة)\s+([^\n]+)/gi;
    let conformityMatch;
    while ((conformityMatch = conformityPattern.exec(text)) !== null) {
      links.push({
        type: 'conformity',
        sourcePublication: this.extractCurrentPublication(text),
        targetPublication: conformityMatch[1].trim(),
        description: `Contrôle de conformité: ${conformityMatch[1].trim()}`,
        confidence: 0.8
      });
    }

    // Extensions
    const extensionPattern = /(?:étend|يمتد)\s+([^\n]+)/gi;
    let extensionMatch;
    while ((extensionMatch = extensionPattern.exec(text)) !== null) {
      links.push({
        type: 'extension',
        sourcePublication: this.extractCurrentPublication(text),
        targetPublication: extensionMatch[1].trim(),
        description: `Extension de ${extensionMatch[1].trim()}`,
        confidence: 0.8
      });
    }

    return links;
  }

  /**
   * Identification des institutions et contenus selon l'annexe
   */
  extractInstitutionsAndContent(text: string): LegalEntity[] {
    const entities: LegalEntity[] = [];

    // Institutions
    const institutionPattern = /(?:Présidence|Ministère|Direction|Service|الرئاسة|الوزارة|المديرية|المصلحة)[\s:]+([^\n]+)/gi;
    let institutionMatch;
    while ((institutionMatch = institutionPattern.exec(text)) !== null) {
      entities.push({
        type: 'institution',
        value: institutionMatch[0],
        confidence: 0.9,
        position: { start: institutionMatch.index, end: institutionMatch.index + institutionMatch[0].length },
        metadata: { institutionName: institutionMatch[1].trim() }
      });
    }

    // Contenu principal (articles)
    const articlePattern = /(?:Article|المادة)\s+(\d+)[\s:]+([^\n]+)/gi;
    let articleMatch;
    while ((articleMatch = articlePattern.exec(text)) !== null) {
      entities.push({
        type: 'content',
        value: articleMatch[0],
        confidence: 0.85,
        position: { start: articleMatch.index, end: articleMatch.index + articleMatch[0].length },
        metadata: { articleNumber: articleMatch[1], content: articleMatch[2].trim() }
      });
    }

    return entities;
  }

  /**
   * Traitement complet d'un texte selon l'annexe
   */
  processText(text: string): StructuredPublication {
    const entities = [
      ...this.segmentByTitlesAndMetadata(text),
      ...this.extractDates(text),
      ...this.extractInstitutionsAndContent(text)
    ];

    const links = this.extractReferencesAndLinks(text);

    // Construction de la publication structurée
    const publication: StructuredPublication = {
      type: this.extractPublicationType(entities),
      powerEmitter: this.extractPowerEmitter(entities),
      number: this.extractNumber(entities),
      date: this.extractDate(entities),
      hijriDate: this.extractHijriDate(entities),
      gregorianDate: this.extractGregorianDate(entities),
      institution: this.extractInstitution(entities),
      references: links.map(link => link.targetPublication),
      content: this.extractMainContent(text, entities),
      articles: this.extractArticles(entities),
      confidence: this.calculateOverallConfidence(entities),
      entities
    };

    return publication;
  }

  /**
   * Méthodes utilitaires
   */
  private calculateConfidence(value: string, type: string): number {
    // Logique de calcul de confiance basée sur la qualité du match
    const baseConfidence = 0.8;
    const lengthBonus = Math.min(value.length / 100, 0.2);
    const typeBonus = type === 'date' ? 0.1 : 0;
    
    return Math.min(baseConfidence + lengthBonus + typeBonus, 1.0);
  }

  private convertHijriToGregorian(hijriDate: string): string {
    // Simulation de conversion Hijri vers Grégorien
    return '2024/01/01';
  }

  private extractCurrentPublication(text: string): string {
    // Extraction de la publication courante
    const numberMatch = text.match(/n°\s*(\d+[-\d]*)/i);
    return numberMatch ? numberMatch[1] : 'Publication inconnue';
  }

  private extractPublicationType(entities: LegalEntity[]): string {
    const typeEntity = entities.find(e => e.type === 'publication_type');
    return typeEntity?.value || 'Type inconnu';
  }

  private extractPowerEmitter(entities: LegalEntity[]): string {
    const powerEntity = entities.find(e => e.type === 'power_emitter');
    return powerEntity?.value || 'Émetteur inconnu';
  }

  private extractNumber(entities: LegalEntity[]): string {
    const numberEntity = entities.find(e => e.metadata?.number);
    return numberEntity?.metadata?.number || '';
  }

  private extractDate(entities: LegalEntity[]): string {
    const dateEntity = entities.find(e => e.type === 'date');
    return dateEntity?.value || '';
  }

  private extractHijriDate(entities: LegalEntity[]): string {
    const hijriEntity = entities.find(e => e.type === 'date' && e.metadata?.calendar === 'hijri');
    return hijriEntity?.value || '';
  }

  private extractGregorianDate(entities: LegalEntity[]): string {
    const gregorianEntity = entities.find(e => e.type === 'date' && e.metadata?.calendar === 'gregorian');
    return gregorianEntity?.value || '';
  }

  private extractInstitution(entities: LegalEntity[]): string {
    const institutionEntity = entities.find(e => e.type === 'institution');
    return institutionEntity?.metadata?.institutionName || '';
  }

  private extractMainContent(text: string, entities: LegalEntity[]): string {
    // Extraction du contenu principal en excluant les métadonnées
    const metadataPositions = entities
      .filter(e => e.type !== 'content')
      .map(e => ({ start: e.position.start, end: e.position.end }))
      .sort((a, b) => a.start - b.start);

    let content = text;
    for (let i = metadataPositions.length - 1; i >= 0; i--) {
      const pos = metadataPositions[i];
      content = content.slice(0, pos.start) + content.slice(pos.end);
    }

    return content.trim();
  }

  private extractArticles(entities: LegalEntity[]): string[] {
    return entities
      .filter(e => e.type === 'content')
      .map(e => e.value);
  }

  private calculateOverallConfidence(entities: LegalEntity[]): number {
    if (entities.length === 0) return 0;
    
    const totalConfidence = entities.reduce((sum, entity) => sum + entity.confidence, 0);
    return totalConfidence / entities.length;
  }
}

export const algerianLegalRegexService = new AlgerianLegalRegexService();
export default algerianLegalRegexService;