/**
 * Service d'extraction de contenu avancée (Étape 6 de l'algorithme)
 * Traitement OCR multi-régions avec reconnaissance adaptative
 * Optimisé pour les documents administratifs algériens
 */

import { ContentRegion } from './borderRemovalService';
import { PageImage } from './pdfImageExtractor';
import { createWorker, PSM, OEM } from 'tesseract.js';

export interface TextRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'text' | 'table' | 'header' | 'footer' | 'signature';
  confidence: number;
  text?: string;
  language?: 'fra' | 'ara' | 'mixed';
}

export interface ExtractionResult {
  pageNumber: number;
  regions: TextRegion[];
  fullText: string;
  confidence: number;
  processingTime: number;
  language: 'fra' | 'ara' | 'mixed';
  metadata: {
    originalDimensions: { width: number; height: number };
    processedRegions: number;
    averageConfidence: number;
    detectedLanguages: string[];
  };
}

export interface ContentExtractionConfig {
  languages: string[];
  enableLanguageDetection: boolean;
  qualityThreshold: number;
  retryLowQuality: boolean;
  textCleanup: boolean;
  adaptiveOCR: boolean;
}

class ContentExtractionService {
  private readonly DEFAULT_CONFIG: ContentExtractionConfig = {
    languages: ['fra+ara'],
    enableLanguageDetection: true,
    qualityThreshold: 0.7,
    retryLowQuality: true,
    textCleanup: true,
    adaptiveOCR: true
  };

  private workers: Map<string, any> = new Map();

  /**
   * Étape 6 : Extraction de contenu multi-régions avec OCR adaptatif
   */
  async extractContent(
    pageImage: PageImage,
    contentRegion: ContentRegion,
    textColumns: Array<{ x: number, y: number, width: number, height: number }>,
    config: Partial<ContentExtractionConfig> = {}
  ): Promise<ExtractionResult> {
    
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = performance.now();

    console.log('🔍 Starting advanced content extraction...');
    console.log(`📊 Processing ${textColumns.length} text regions`);

    try {
      // Diviser en régions de texte
      const textRegions = this.createTextRegions(textColumns, contentRegion);

      // Traitement OCR par région
      const processedRegions = await this.processRegions(
        pageImage, 
        textRegions, 
        mergedConfig
      );

      // Assembler le texte complet
      const fullText = this.assembleFullText(processedRegions);

      // Détecter la langue dominante
      const detectedLanguage = this.detectDominantLanguage(processedRegions);

      // Calculer les métriques
      const metrics = this.calculateMetrics(processedRegions);

      const processingTime = performance.now() - startTime;

      console.log(`✅ Content extraction completed: ${processedRegions.length} regions processed in ${processingTime.toFixed(2)}ms`);

      return {
        pageNumber: pageImage.pageNumber,
        regions: processedRegions,
        fullText,
        confidence: metrics.averageConfidence,
        processingTime,
        language: detectedLanguage,
        metadata: {
          originalDimensions: {
            width: pageImage.originalWidth,
            height: pageImage.originalHeight
          },
          processedRegions: processedRegions.length,
          averageConfidence: metrics.averageConfidence,
          detectedLanguages: metrics.detectedLanguages
        }
      };

    } catch (error) {
      console.error('❌ Content extraction failed:', error);
      throw new Error(`Content extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Créer les régions de texte à partir des colonnes détectées
   */
  private createTextRegions(
    textColumns: Array<{ x: number, y: number, width: number, height: number }>,
    contentRegion: ContentRegion
  ): TextRegion[] {
    
    return textColumns.map((column, index) => ({
      x: column.x,
      y: column.y,
      width: column.width,
      height: column.height,
      type: this.determineRegionType(column, index, textColumns.length),
      confidence: 0,
      language: undefined
    }));
  }

  /**
   * Détermine le type de région basé sur sa position
   */
  private determineRegionType(
    column: { x: number, y: number, width: number, height: number },
    index: number,
    totalColumns: number
  ): TextRegion['type'] {
    
    // Première région souvent en-tête
    if (index === 0 && column.height < 100) {
      return 'header';
    }

    // Dernière région souvent pied de page ou signature
    if (index === totalColumns - 1 && column.height < 150) {
      return 'footer';
    }

    // Régions étroites souvent des tables
    if (column.width < 200) {
      return 'table';
    }

    return 'text';
  }

  /**
   * Traitement OCR adaptatif par région
   */
  private async processRegions(
    pageImage: PageImage,
    regions: TextRegion[],
    config: ContentExtractionConfig
  ): Promise<TextRegion[]> {
    
    const processedRegions: TextRegion[] = [];

    for (const region of regions) {
      try {
        console.log(`🔤 Processing region ${region.type} at (${region.x},${region.y})`);

        // Extraire l'image de la région
        const regionCanvas = this.extractRegionImage(pageImage, region);

        // Configuration OCR adaptative basée sur le type de région
        const ocrConfig = this.getAdaptiveOCRConfig(region.type, config);

        // Traitement OCR
        const ocrResult = await this.performOCR(regionCanvas, ocrConfig);

        // Nettoyage du texte si activé
        const cleanedText = config.textCleanup 
          ? this.cleanupText(ocrResult.text, region.type)
          : ocrResult.text;

        // Détecter la langue si activé
        const detectedLanguage = config.enableLanguageDetection
          ? this.detectRegionLanguage(cleanedText)
          : 'fra' as const;

        const processedRegion: TextRegion = {
          ...region,
          text: cleanedText,
          confidence: ocrResult.confidence,
          language: detectedLanguage
        };

        // Re-traitement si qualité insuffisante
        if (config.retryLowQuality && ocrResult.confidence < config.qualityThreshold) {
          console.log(`🔄 Retrying low-quality region (confidence: ${ocrResult.confidence})`);
          const retryResult = await this.retryOCRWithEnhancement(regionCanvas, ocrConfig);
          processedRegion.text = retryResult.text;
          processedRegion.confidence = retryResult.confidence;
        }

        processedRegions.push(processedRegion);

      } catch (error) {
        console.error(`❌ Error processing region:`, error);
        // Ajouter région avec erreur mais continuer
        processedRegions.push({
          ...region,
          text: '',
          confidence: 0,
          language: 'fra'
        });
      }
    }

    return processedRegions;
  }

  /**
   * Extraction d'image de région
   */
  private extractRegionImage(pageImage: PageImage, region: TextRegion): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    // Ajuster les coordonnées selon l'échelle
    const scaledX = region.x * pageImage.scale;
    const scaledY = region.y * pageImage.scale;
    const scaledWidth = region.width * pageImage.scale;
    const scaledHeight = region.height * pageImage.scale;

    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    // Extraire la région de l'image originale
    ctx.drawImage(
      pageImage.canvas,
      scaledX, scaledY, scaledWidth, scaledHeight,
      0, 0, scaledWidth, scaledHeight
    );

    return canvas;
  }

  /**
   * Configuration OCR adaptative selon le type de région
   */
  private getAdaptiveOCRConfig(regionType: TextRegion['type'], config: ContentExtractionConfig) {
    const baseConfig = {
      lang: config.languages.join('+'),
      tessedit_char_whitelist: '',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      tessedit_ocr_engine_mode: OEM.LSTM_ONLY
    };

    switch (regionType) {
      case 'table':
        return {
          ...baseConfig,
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK_VERT_TEXT,
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ .,;:-()[]{}/'
        };

      case 'header':
      case 'footer':
        return {
          ...baseConfig,
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ 0123456789.,;:-'
        };

      case 'signature':
        return {
          ...baseConfig,
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ 0123456789.,-'
        };

      default: // 'text'
        return {
          ...baseConfig,
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK
        };
    }
  }

  /**
   * Traitement OCR avec Tesseract
   */
  private async performOCR(canvas: HTMLCanvasElement, ocrConfig: any): Promise<{ text: string, confidence: number }> {
    const worker = await this.getOrCreateWorker(ocrConfig.lang);
    
    try {
      const { data } = await worker.recognize(canvas);
      return {
        text: data.text,
        confidence: data.confidence / 100
      };
    } catch (error) {
      console.error('OCR processing error:', error);
      return { text: '', confidence: 0 };
    }
  }

  /**
   * Obtenir ou créer un worker Tesseract
   */
  private async getOrCreateWorker(language: string) {
    if (!this.workers.has(language)) {
      const worker = await createWorker();
      await (worker as any).loadLanguage(language);
      await (worker as any).initialize(language);
      this.workers.set(language, worker as any);
    }
    return this.workers.get(language);
  }

  /**
   * Re-traitement avec amélioration d'image
   */
  private async retryOCRWithEnhancement(
    canvas: HTMLCanvasElement, 
    ocrConfig: any
  ): Promise<{ text: string, confidence: number }> {
    
    // Amélioration de l'image pour OCR
    const enhancedCanvas = this.enhanceImageForOCR(canvas);
    
    // Re-traitement OCR
    return this.performOCR(enhancedCanvas, ocrConfig);
  }

  /**
   * Amélioration d'image pour OCR
   */
  private enhanceImageForOCR(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const enhancedCanvas = document.createElement('canvas');
    const ctx = enhancedCanvas.getContext('2d');
    
    if (!ctx) return canvas;

    enhancedCanvas.width = canvas.width;
    enhancedCanvas.height = canvas.height;

    // Augmenter le contraste
    ctx.filter = 'contrast(150%) brightness(110%)';
    ctx.drawImage(canvas, 0, 0);

    return enhancedCanvas;
  }

  /**
   * Nettoyage de texte selon le type de région
   */
  private cleanupText(text: string, regionType: TextRegion['type']): string {
    let cleaned = text
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .replace(/[^\w\sÀ-ÿأ-ي.,;:()\-\[\]{}]/g, '') // Garder seulement caractères valides
      .trim();

    if (regionType === 'table') {
      // Nettoyage spécifique aux tables
      cleaned = cleaned.replace(/\|/g, ' ').replace(/\s+/g, ' ');
    }

    return cleaned;
  }

  /**
   * Détection de langue par région
   */
  private detectRegionLanguage(text: string): 'fra' | 'ara' | 'mixed' {
    const arabicPattern = /[\u0600-\u06FF]/;
    const frenchPattern = /[a-zA-ZÀ-ÿ]/;
    
    const hasArabic = arabicPattern.test(text);
    const hasFrench = frenchPattern.test(text);
    
    if (hasArabic && hasFrench) return 'mixed';
    if (hasArabic) return 'ara';
    return 'fra';
  }

  /**
   * Détecter la langue dominante du document
   */
  private detectDominantLanguage(regions: TextRegion[]): 'fra' | 'ara' | 'mixed' {
    const languages = regions.map(r => r.language).filter(Boolean);
    const frenchCount = languages.filter(l => l === 'fra').length;
    const arabicCount = languages.filter(l => l === 'ara').length;
    const mixedCount = languages.filter(l => l === 'mixed').length;

    if (mixedCount > 0 || (frenchCount > 0 && arabicCount > 0)) return 'mixed';
    if (arabicCount > frenchCount) return 'ara';
    return 'fra';
  }

  /**
   * Assemblage du texte complet
   */
  private assembleFullText(regions: TextRegion[]): string {
    return regions
      .filter(region => region.text && region.text.length > 0)
      .map(region => region.text)
      .join('\n\n');
  }

  /**
   * Calcul des métriques de qualité
   */
  private calculateMetrics(regions: TextRegion[]) {
    const validRegions = regions.filter(r => r.confidence > 0);
    const averageConfidence = validRegions.length > 0
      ? validRegions.reduce((sum, r) => sum + r.confidence, 0) / validRegions.length
      : 0;

    const detectedLanguages = [...new Set(regions.map(r => r.language).filter(Boolean))];

    return {
      averageConfidence,
      detectedLanguages
    };
  }

  /**
   * Nettoyage des ressources
   */
  async cleanup(): Promise<void> {
    for (const [language, worker] of this.workers) {
      try {
        await worker.terminate();
      } catch (error) {
        console.error(`Error terminating worker for ${language}:`, error);
      }
    }
    this.workers.clear();
    console.log('🧹 Content extraction workers cleaned up');
  }
}

export const contentExtractionService = new ContentExtractionService();
export default contentExtractionService;