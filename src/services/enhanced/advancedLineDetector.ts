/**
 * Service de détection avancée des lignes (Étapes 2-3 de l'algorithme)
 * Utilise des techniques de morphologie mathématique et HoughLinesP
 * Implémente la dilatation/érosion pour améliorer la détection
 */

import { DetectedLine } from '../imageProcessingService';
import { PageImage } from './pdfImageExtractor';

export interface LineDetectionConfig {
  // Configuration HoughLinesP
  threshold: number;        // Seuil de détection des lignes
  minLineLength: number;    // Longueur minimale des lignes
  maxLineGap: number;       // Écart maximal dans une ligne
  
  // Configuration morphologique
  dilationKernel: number;   // Taille du noyau de dilatation
  erosionKernel: number;    // Taille du noyau d'érosion
  
  // Filtres
  minAngleThreshold: number; // Angle minimum pour classification
  maxAngleThreshold: number; // Angle maximum pour classification
  confidenceThreshold: number; // Seuil de confiance
}

export interface MorphologicalResult {
  processedImageData: ImageData;
  processingTime: number;
  operationsApplied: string[];
}

export interface LineDetectionResult {
  horizontalLines: DetectedLine[];
  verticalLines: DetectedLine[];
  allDetectedLines: DetectedLine[];
  processingTime: number;
  confidence: number;
  morphologicalResult: MorphologicalResult;
}

class AdvancedLineDetector {
  private readonly DEFAULT_CONFIG: LineDetectionConfig = {
    threshold: 100,
    minLineLength: 50,
    maxLineGap: 5,
    dilationKernel: 3,
    erosionKernel: 2,
    minAngleThreshold: 10,
    maxAngleThreshold: 170,
    confidenceThreshold: 0.6
  };

  /**
   * Étapes 2-3 : Détecter toutes les lignes horizontales et verticales
   * Utilise dilatation/érosion puis HoughLinesP
   */
  async detectLines(
    pageImage: PageImage, 
    config: Partial<LineDetectionConfig> = {}
  ): Promise<LineDetectionResult> {
    
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = performance.now();

    console.log(`📐 Starting advanced line detection on page ${pageImage.pageNumber}...`);

    try {
      // Étape 1: Appliquer les opérations morphologiques
      console.log('🔧 Applying morphological operations (dilation/erosion)...');
      const imageData = new ImageData(
        pageImage.data || new Uint8ClampedArray(pageImage.width * pageImage.height * 4),
        pageImage.width,
        pageImage.height
      );
      const morphResult = await this.applyMorphologicalOperations(
        imageData, // Passer un ImageData au lieu d'un Uint8ClampedArray
        mergedConfig
      );

      // Étape 2: Détecter les lignes avec algorithme HoughLinesP simulé
      console.log('🎯 Detecting lines with HoughLinesP algorithm...');
      const detectedLines = await this.simulateHoughLinesP(
        morphResult.processedImageData, 
        mergedConfig
      );

      // Étape 3: Classifier les lignes en horizontales et verticales
      console.log('📊 Classifying lines into horizontal and vertical...');
      const { horizontal, vertical } = this.classifyLines(detectedLines, mergedConfig);

      // Calculer la confiance globale
      const confidence = this.calculateDetectionConfidence(horizontal, vertical, detectedLines);

      const processingTime = performance.now() - startTime;

      console.log(`✅ Line detection completed: ${horizontal.length} horizontal, ${vertical.length} vertical in ${processingTime.toFixed(2)}ms`);

      return {
        horizontalLines: horizontal,
        verticalLines: vertical,
        allDetectedLines: detectedLines,
        processingTime,
        confidence,
        morphologicalResult: morphResult
      };

    } catch (error) {
      console.error('❌ Line detection failed:', error);
      throw new Error(`Line detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Applique les opérations morphologiques : dilatation et érosion
   * Améliore la détection des lignes selon l'algorithme
   */
  private async applyMorphologicalOperations(
    imageData: ImageData, 
    config: LineDetectionConfig
  ): Promise<MorphologicalResult> {
    
    const startTime = performance.now();
    const operations: string[] = [];

    // Créer une copie des données
    const processedData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    // Conversion en niveaux de gris pour le traitement
    this.convertToGrayscale(processedData);
    operations.push('grayscale');

    // Dilatation : élargir les lignes noires
    console.log(`🔍 Applying dilation with kernel size ${config.dilationKernel}...`);
    this.applyDilation(processedData, config.dilationKernel);
    operations.push('dilation');

    // Érosion : réduire les zones élargies
    console.log(`🔧 Applying erosion with kernel size ${config.erosionKernel}...`);
    this.applyErosion(processedData, config.erosionKernel);
    operations.push('erosion');

    // Binarisation pour améliorer la détection
    this.applyBinarization(processedData);
    operations.push('binarization');

    const processingTime = performance.now() - startTime;

    return {
      processedImageData: processedData,
      processingTime,
      operationsApplied: operations
    };
  }

  /**
   * Simule l'algorithme HoughLinesP d'OpenCV
   * Détecte les lignes droites dans l'image traitée
   */
  private async simulateHoughLinesP(
    imageData: ImageData, 
    config: LineDetectionConfig
  ): Promise<DetectedLine[]> {
    
    const lines: DetectedLine[] = [];
    const { width, height, data } = imageData;

    // Simulation simplifiée de la transformée de Hough
    // Dans un vrai système, ceci utiliserait OpenCV.js
    
    // Détecter les lignes horizontales
    for (let y = 0; y < height; y += 10) {
      const linePoints = this.scanHorizontalLine(data, width, height, y, config);
      if (linePoints.length >= config.minLineLength / 10) {
        const line = this.createLineFromPoints(linePoints, 'horizontal');
        if (line) lines.push(line);
      }
    }

    // Détecter les lignes verticales
    for (let x = 0; x < width; x += 10) {
      const linePoints = this.scanVerticalLine(data, width, height, x, config);
      if (linePoints.length >= config.minLineLength / 10) {
        const line = this.createLineFromPoints(linePoints, 'vertical');
        if (line) lines.push(line);
      }
    }

    // Filtrer et nettoyer les lignes détectées
    const filteredLines = this.filterAndMergeLines(lines, config);

    console.log(`🎯 HoughLinesP simulation: ${filteredLines.length} lines detected`);
    return filteredLines;
  }

  /**
   * Classe les lignes détectées en horizontales et verticales
   */
  private classifyLines(
    lines: DetectedLine[], 
    config: LineDetectionConfig
  ): { horizontal: DetectedLine[], vertical: DetectedLine[] } {
    
    const horizontal: DetectedLine[] = [];
    const vertical: DetectedLine[] = [];

    for (const line of lines) {
      const angle = this.calculateLineAngle(line);
      const absAngle = Math.abs(angle);

      if (absAngle < config.minAngleThreshold || absAngle > config.maxAngleThreshold) {
        // Ligne horizontale
        horizontal.push({
          ...line,
          type: 'horizontal',
          confidence: this.calculateLineConfidence(line, 'horizontal')
        });
      } else if (absAngle > 80 && absAngle < 100) {
        // Ligne verticale
        vertical.push({
          ...line,
          type: 'vertical',
          confidence: this.calculateLineConfidence(line, 'vertical')
        });
      }
    }

    return { horizontal, vertical };
  }

  // Méthodes utilitaires pour les opérations morphologiques

  private convertToGrayscale(imageData: ImageData): void {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      data[i] = gray;     // R
      data[i + 1] = gray; // G
      data[i + 2] = gray; // B
      // Alpha reste inchangé
    }
  }

  private applyDilation(imageData: ImageData, kernelSize: number): void {
    const { width, height, data } = imageData;
    const originalData = new Uint8ClampedArray(data);
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = halfKernel; y < height - halfKernel; y++) {
      for (let x = halfKernel; x < width - halfKernel; x++) {
        let maxValue = 0;

        // Parcourir le noyau
        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
            maxValue = Math.max(maxValue, originalData[pixelIndex]);
          }
        }

        const currentIndex = (y * width + x) * 4;
        data[currentIndex] = maxValue;
        data[currentIndex + 1] = maxValue;
        data[currentIndex + 2] = maxValue;
      }
    }
  }

  private applyErosion(imageData: ImageData, kernelSize: number): void {
    const { width, height, data } = imageData;
    const originalData = new Uint8ClampedArray(data);
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = halfKernel; y < height - halfKernel; y++) {
      for (let x = halfKernel; x < width - halfKernel; x++) {
        let minValue = 255;

        // Parcourir le noyau
        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
            minValue = Math.min(minValue, originalData[pixelIndex]);
          }
        }

        const currentIndex = (y * width + x) * 4;
        data[currentIndex] = minValue;
        data[currentIndex + 1] = minValue;
        data[currentIndex + 2] = minValue;
      }
    }
  }

  private applyBinarization(imageData: ImageData, threshold: number = 128): void {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i]; // Déjà en niveaux de gris
      const binary = gray < threshold ? 0 : 255;
      data[i] = binary;
      data[i + 1] = binary;
      data[i + 2] = binary;
    }
  }

  // Méthodes de détection de lignes

  private scanHorizontalLine(
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    y: number, 
    config: LineDetectionConfig
  ): Array<{x: number, y: number}> {
    const points: Array<{x: number, y: number}> = [];
    
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      const pixelValue = data[pixelIndex];
      
      // Détecter les pixels noirs (lignes)
      if (pixelValue < 128) {
        points.push({ x, y });
      }
    }
    
    return points;
  }

  private scanVerticalLine(
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    x: number, 
    config: LineDetectionConfig
  ): Array<{x: number, y: number}> {
    const points: Array<{x: number, y: number}> = [];
    
    for (let y = 0; y < height; y++) {
      const pixelIndex = (y * width + x) * 4;
      const pixelValue = data[pixelIndex];
      
      // Détecter les pixels noirs (lignes)
      if (pixelValue < 128) {
        points.push({ x, y });
      }
    }
    
    return points;
  }

  private createLineFromPoints(
    points: Array<{x: number, y: number}>, 
    expectedType: 'horizontal' | 'vertical'
  ): DetectedLine | null {
    
    if (points.length < 2) return null;

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    return {
      x1: firstPoint.x,
      y1: firstPoint.y,
      x2: lastPoint.x,
      y2: lastPoint.y,
      type: expectedType,
      confidence: this.calculateLineConfidenceFromPoints(points, expectedType)
    };
  }

  private filterAndMergeLines(lines: DetectedLine[], config: LineDetectionConfig): DetectedLine[] {
    // Filtrer par longueur minimale et confiance
    const filtered = lines.filter(line => {
      const length = this.calculateLineLength(line);
      return length >= config.minLineLength && line.confidence >= config.confidenceThreshold;
    });

    // Fusionner les lignes proches (implémentation simplifiée)
    return this.mergeNearbyLines(filtered, config.maxLineGap);
  }

  private mergeNearbyLines(lines: DetectedLine[], maxGap: number): DetectedLine[] {
    // Implémentation simplifiée du merge
    // Dans une vraie implémentation, on grouperait les lignes proches
    return lines;
  }

  private calculateLineAngle(line: DetectedLine): number {
    return Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * 180 / Math.PI;
  }

  private calculateLineLength(line: DetectedLine): number {
    return Math.sqrt(
      Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2)
    );
  }

  private calculateLineConfidence(line: DetectedLine, expectedType: 'horizontal' | 'vertical'): number {
    const angle = this.calculateLineAngle(line);
    const length = this.calculateLineLength(line);
    
    // Calculer la confiance basée sur l'angle et la longueur
    let angleConfidence = 1.0;
    
    if (expectedType === 'horizontal') {
      const absAngle = Math.abs(angle);
      angleConfidence = absAngle < 5 ? 1.0 : Math.max(0, 1 - absAngle / 90);
    } else {
      const targetAngle = 90;
      angleConfidence = Math.max(0, 1 - Math.abs(angle - targetAngle) / 90);
    }
    
    const lengthConfidence = Math.min(1.0, length / 200);
    
    return (angleConfidence + lengthConfidence) / 2;
  }

  private calculateLineConfidenceFromPoints(
    points: Array<{x: number, y: number}>, 
    expectedType: 'horizontal' | 'vertical'
  ): number {
    if (points.length < 2) return 0;
    
    // Calculer la variance pour déterminer la rectitude
    const length = points.length;
    let variance = 0;
    
    if (expectedType === 'horizontal') {
      const avgY = points.reduce((sum, p) => sum + p.y, 0) / length;
      variance = points.reduce((sum, p) => sum + Math.pow(p.y - avgY, 2), 0) / length;
    } else {
      const avgX = points.reduce((sum, p) => sum + p.x, 0) / length;
      variance = points.reduce((sum, p) => sum + Math.pow(p.x - avgX, 2), 0) / length;
    }
    
    // Plus la variance est faible, plus la ligne est droite
    return Math.max(0, 1 - variance / 100);
  }

  private calculateDetectionConfidence(
    horizontal: DetectedLine[], 
    vertical: DetectedLine[], 
    allLines: DetectedLine[]
  ): number {
    if (allLines.length === 0) return 0;
    
    const classifiedLines = horizontal.length + vertical.length;
    const classificationRate = classifiedLines / allLines.length;
    
    const avgConfidence = allLines.reduce((sum, line) => sum + line.confidence, 0) / allLines.length;
    
    return (classificationRate + avgConfidence) / 2;
  }
}

export const advancedLineDetector = new AdvancedLineDetector();
export default advancedLineDetector;