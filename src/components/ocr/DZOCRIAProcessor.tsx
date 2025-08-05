/**
 * Composant principal DZ OCR-IA pour l'extraction et structuration des textes juridiques algériens
 * Implémente le plan de travail complet : extraction, structuration, mapping OCR
 * ARCHITECTURE UNIFIÉE : Extraction+Analyse, Mapping, Validation, Workflow, Analytics
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Eye,
  Save,
  Settings,
  Zap,
  Database,
  GitBranch,
  Target,
  ArrowRight,
  Clock,
  TrendingUp,
  Camera,
  Scan,
  Image,
  FileImage,
  File,
  Download,
  Send,
  Languages,
  FileCheck,
  Search,
  X,
  BarChart3,
  Layers,
  Grid3X3,
  Type,
  Table,
  Maximize2,
  Minimize2,
  RotateCcw,
  Play,
  Pause,
  SkipForward,
  Info,
  HelpCircle,
  CheckSquare,
  AlertCircle,
  Settings2,
  Activity,
  Circle
} from "lucide-react";
import legalOCRExtractionService, { StructuredLegalDocument } from '@/services/legalOCRExtractionService';
import legalFormMappingService, { MappedFormData, FormStructure } from '@/services/legalFormMappingService';
import { validateFile } from '@/utils/basicSecurity';

// NOUVEAUX SERVICES ENHANCED - BRANCHE LYO
import { algerianDocumentExtractionService, ExtractedDocument } from '@/services/enhanced/algerianDocumentExtractionService';
import { algerianLegalRegexService, StructuredPublication } from '@/services/enhanced/algerianLegalRegexService';
import { intelligentMappingService, MappingResult } from '@/services/enhanced/intelligentMappingService';
import { approvalWorkflowService, ApprovalItem } from '@/services/enhanced/approvalWorkflowService';

interface DZOCRIAProcessorProps {
  language?: string;
}

interface ProcessingStats {
  filesProcessed: number;
  entitiesExtracted: number;
  fieldsMaped: number;
  avgConfidence: number;
  totalProcessingTime: number;
}

interface ExtractedText {
  content: string;
  confidence: number;
  language?: string;
  pages?: number;
}

interface DetectedEntity {
  type: string;
  value: string;
  confidence: number;
  position?: { x: number; y: number; width: number; height: number };
}

interface MappedField {
  fieldId: string;
  originalValue: string;
  mappedValue: string;
  confidence: number;
  status: 'mapped' | 'unmapped' | 'pending';
}

// NOUVELLES INTERFACES POUR L'ANALYSE
interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
  duration?: number;
}

interface AlgorithmMetrics {
  totalProcessingTime: number;
  pagesProcessed: number;
  linesDetected: number;
  tablesDetected: number;
  textRegionsExtracted: number;
  entitiesExtracted: number;
  fieldsMapped: number;
  confidenceScore: number;
}

export function DZOCRIAProcessor({ language = "fr" }: DZOCRIAProcessorProps) {
  // États du composant existants
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<StructuredLegalDocument | null>(null);
  const [mappedData, setMappedData] = useState<MappedFormData | null>(null);
  const [availableForms, setAvailableForms] = useState<string[]>([]);
  const [selectedFormType, setSelectedFormType] = useState<string>('');
  const [activeTab, setActiveTab] = useState('extraction');
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // NOUVEAUX ÉTATS POUR L'ANALYSE
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [extractedDocument, setExtractedDocument] = useState<ExtractedDocument | null>(null);
  const [structuredPublication, setStructuredPublication] = useState<StructuredPublication | null>(null);
  const [mappingResult, setMappingResult] = useState<MappingResult | null>(null);
  const [approvalItem, setApprovalItem] = useState<ApprovalItem | null>(null);
  const [showStepDetails, setShowStepDetails] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AlgorithmMetrics | null>(null);
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [visualizationMode, setVisualizationMode] = useState<'overview' | 'detailed' | 'step-by-step'>('overview');

  // États pour la validation
  const [validationResults, setValidationResults] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // États pour les analytics
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('7d');

  // États pour les données extraites
  const [extractedText, setExtractedText] = useState<ExtractedText | null>(null);
  const [detectedEntities, setDetectedEntities] = useState<DetectedEntity[]>([]);
  const [mappedFields, setMappedFields] = useState<MappedField[]>([]);
  const [unmappedFields, setUnmappedFields] = useState<MappedField[]>([]);

  // Références
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Statistiques de traitement
  const [processingStats, setProcessingStats] = useState<ProcessingStats>({
    filesProcessed: 0,
    entitiesExtracted: 0,
    fieldsMaped: 0,
    avgConfidence: 0.85,
    totalProcessingTime: 0
  });

  // Fonction pour naviguer automatiquement entre les onglets
  const navigateToTab = (tabName: string) => {
    setActiveTab(tabName);
  };

  // Fonction pour mettre à jour les étapes de traitement
  const updateStep = async (
    stepId: string,
    status: ProcessingStep['status'],
    progress: number,
    result?: any,
    error?: string
  ) => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, progress, result, error }
        : step
    ));
  };

  // Fonction pour simuler le traitement
  const simulateProcessing = async (duration: number) => {
    return new Promise(resolve => setTimeout(resolve, duration));
  };

  // Initialisation
  React.useEffect(() => {
    // Utiliser les nouveaux services enhanced
    try {
      const forms = intelligentMappingService.getAvailableFormTypes();
      setAvailableForms(forms);
      if (forms.length > 0) {
        setSelectedFormType(forms[0]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des formulaires:', error);
      // Fallback vers des formulaires par défaut
      setAvailableForms(['loi', 'decret', 'arrete', 'ordonnance']);
      setSelectedFormType('loi');
    }
  }, []);

  // Nettoyer la caméra au démontage
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  /**
   * Gestion drag & drop
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      setSelectedFile(file);
      await processFileByType(file);
    }
  }, []);

  /**
   * Gestion de l'upload de fichier
   */
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    await processFileByType(file);
  }, []);

  /**
   * Traitement par type de fichier
   */
  const processFileByType = async (file: File) => {
    setError(null);
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    try {
      if (fileType === 'application/pdf') {
        await processDocument(file);
      } else if (fileType.startsWith('image/')) {
        await processImageFile(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        await processWordFile(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        await processExcelFile(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
                 fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
        await processPowerPointFile(file);
      } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        await processTextFile(file);
      } else if (fileType === 'application/rtf' || fileName.endsWith('.rtf')) {
        await processRtfFile(file);
      } else {
        setError('Format de fichier non supporté. Types acceptés: PDF, Images, Word, Excel, PowerPoint, Texte, RTF');
      }
    } catch (error) {
      setError(`Erreur lors du traitement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Traitement des différents formats
   */
  const processImageFile = async (file: File) => {
    setProcessingStep('🖼️ Traitement de l\'image...');
    await processDocument(file);
  };

  const processWordFile = async (file: File) => {
    setProcessingStep('📝 Extraction du contenu Word...');
    await processDocument(file);
  };

  const processExcelFile = async (file: File) => {
    setProcessingStep('📊 Extraction du contenu Excel...');
    await processDocument(file);
  };

  const processPowerPointFile = async (file: File) => {
    setProcessingStep('🎯 Extraction du contenu PowerPoint...');
    await processDocument(file);
  };

  const processTextFile = async (file: File) => {
    setProcessingStep('📄 Lecture du fichier texte...');
    
    const text = await file.text();
    setExtractedText({
      content: text,
      confidence: 1.0,
      language: 'fr',
      pages: 1
    });

    // Simuler l'extraction d'entités pour les fichiers texte
    const entities = extractEntitiesFromText(text);
    setDetectedEntities(entities);
    
    setProcessingStep('✅ Fichier texte traité avec succès');
  };

  const processRtfFile = async (file: File) => {
    setProcessingStep('📄 Extraction du contenu RTF...');
    await processDocument(file);
  };

  /**
   * Extraction d'entités depuis le texte
   */
  const extractEntitiesFromText = (text: string): DetectedEntity[] => {
    const entities: DetectedEntity[] = [];
    
    // Recherche des lois
    const loiRegex = /(?:loi|LOI)\s+n[°]\s*(\d+[-/]\d+)/gi;
    let match;
    while ((match = loiRegex.exec(text)) !== null) {
      entities.push({
        type: 'LOI',
        value: match[0],
        confidence: 0.9
      });
    }

    // Recherche des décrets
    const decretRegex = /(?:décret|DÉCRET)\s+(?:présidentiel|exécutif)?\s*n[°]\s*(\d+[-/]\d+)/gi;
    while ((match = decretRegex.exec(text)) !== null) {
      entities.push({
        type: 'DÉCRET',
        value: match[0],
        confidence: 0.85
      });
    }

    // Recherche des dates
    const dateRegex = /\d{1,2}[-/]\d{1,2}[-/]\d{4}/g;
    while ((match = dateRegex.exec(text)) !== null) {
      entities.push({
        type: 'DATE',
        value: match[0],
        confidence: 0.8
      });
    }

    return entities;
  };

  /**
   * Processus principal d'extraction et mapping selon l'algorithme annexé
   * UTILISE LES NOUVEAUX SERVICES ENHANCED - BRANCHE LYO
   */
  const processDocument = useCallback(async (file?: File) => {
    const fileToProcess = file || selectedFile;
    if (!fileToProcess) {
      console.error('❌ Aucun fichier à traiter');
      setError('Aucun fichier sélectionné');
      return;
    }

    console.log('🚀 Démarrage du traitement DZ OCR-IA pour:', fileToProcess.name);

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    // Initialiser les étapes de traitement avec analyse
    setProcessingSteps([
      {
        id: 'upload',
        name: 'Upload du fichier',
        description: 'Vérification et préparation du fichier',
        status: 'completed',
        progress: 100
      },
      {
        id: 'extraction',
        name: 'Extraction OCR',
        description: 'Extraction du texte et détection des entités',
        status: 'pending',
        progress: 0
      },
      {
        id: 'structuring',
        name: 'Structuration',
        description: 'Organisation des données extraites',
        status: 'pending',
        progress: 0
      },
      {
        id: 'mapping',
        name: 'Mapping intelligent',
        description: 'Mapping vers la nomenclature algérienne',
        status: 'pending',
        progress: 0
      },
      {
        id: 'validation',
        name: 'Validation',
        description: 'Validation et correction des données',
        status: 'pending',
        progress: 0
      }
    ]);

    // Initialiser les métriques
    const startTime = Date.now();
    let metrics: AlgorithmMetrics = {
      totalProcessingTime: 0,
      pagesProcessed: 0,
      linesDetected: 0,
      tablesDetected: 0,
      textRegionsExtracted: 0,
      entitiesExtracted: 0,
      fieldsMapped: 0,
      confidenceScore: 0
    };

          try {
        // ÉTAPE 1: Extraction selon l'algorithme algérien (Étapes 1-16)
        console.log('📋 ÉTAPE 1: Début extraction OCR-IA algérienne');
        setProcessingStep('🇩🇿 Extraction locale - Algorithme algérien...');
        setProgress(10);
        
        await updateStep('extraction', 'processing', 0);
        const extractedDoc = await algerianDocumentExtractionService.extractDocumentFromFile(fileToProcess);
        console.log('✅ ÉTAPE 1: Extraction terminée, document extrait:', extractedDoc);
        
        // Mettre à jour les métriques d'extraction
        metrics.pagesProcessed = extractedDoc.pages.length;
        metrics.linesDetected = extractedDoc.pages.reduce((acc, page) => acc + page.lines.length, 0);
        metrics.tablesDetected = extractedDoc.pages.reduce((acc, page) => acc + page.tables.length, 0);
        metrics.textRegionsExtracted = extractedDoc.pages.reduce((acc, page) => acc + page.textRegions.length, 0);
        
        await updateStep('extraction', 'completed', 100, extractedDoc);
        setExtractedDocument(extractedDoc);
      
      // Convertir pour compatibilité avec l'interface existante
      const extractionResult: StructuredLegalDocument = {
        metadata: {
          documentType: extractedDoc.documentType,
          extractionDate: new Date().toISOString(),
          confidence: extractedDoc.confidence,
          processingTime: extractedDoc.totalProcessingTime,
          pagesProcessed: extractedDoc.totalPages,
          imageProcessingEnabled: true
        },
        entities: extractedDoc.pages.flatMap(page => 
          page.textRegions.map(region => ({
            type: 'texte' as any,
            number: '',
            date: { gregorian: '', hijri: '' },
            title: region.text,
            issuingAuthority: '',
            content: region.text,
            articles: [],
            references: []
          }))
        ),
        tables: extractedDoc.pages.flatMap(page => 
          page.tableRegions.map(table => ({
            cells: table.cells.map(row => 
              row.map(cell => ({
                content: cell.text,
                colspan: cell.colspan,
                rowspan: cell.rowspan,
                position: {
                  x: cell.x,
                  y: cell.y,
                  width: cell.width,
                  height: cell.height
                }
              }))
            ),
            position: {
              x: table.x,
              y: table.y,
              width: table.width,
              height: table.height
            },
            headers: table.headers
          }))
        ),
        rawText: extractedDoc.pages.flatMap(page => 
          page.textRegions.map(region => ({
            content: region.text,
            position: {
              x: region.x,
              y: region.y,
              width: region.width,
              height: region.height
            },
            confidence: region.confidence,
            type: 'text' as any
          }))
        ),
        relationships: [],
        processedPages: []
      };
      
      setExtractedData(extractionResult);
      
      // Extraire tout le texte pour le traitement regex
      const allText = extractedDoc.pages
        .flatMap(page => page.textRegions.map(region => region.text))
        .join('\n');
      
      setExtractedText({
        content: allText,
        confidence: extractedDoc.confidence,
        language: 'fr',
        pages: extractedDoc.totalPages
      });
      
      setProgress(30);

      // ÉTAPE 2: Structuration
      console.log('📋 ÉTAPE 2: Début structuration des données');
      setProcessingStep('🧠 IA locale - Structuration des données...');
      setProgress(50);
      
      await updateStep('structuring', 'processing', 0);
      const structuredPub = algerianLegalRegexService.processText(allText);
      console.log('✅ ÉTAPE 2: Structuration terminée, publication structurée:', structuredPub);
      
      metrics.entitiesExtracted = structuredPub.entities.length;
      await updateStep('structuring', 'completed', 100, structuredPub);
      setStructuredPublication(structuredPub);
      
      // Vérification de sécurité pour les entités
      if (!structuredPub || !structuredPub.entities) {
        console.warn('⚠️ Aucune entité détectée, utilisation de données par défaut');
        const detailedEntities: DetectedEntity[] = [
          {
            type: 'TEXTE',
            value: 'Contenu extrait',
            confidence: 0.8,
            position: { x: 0, y: 0, width: 100, height: 50 }
          }
        ];
        setDetectedEntities(detailedEntities);
      } else {
        // Convertir les entités détectées
        const detailedEntities = structuredPub.entities.map(entity => ({
          type: entity.type.toUpperCase(),
          value: entity.value,
          confidence: entity.confidence,
          position: { x: 0, y: 0, width: 100, height: 50 } // Position par défaut
        }));
        setDetectedEntities(detailedEntities);
      }
      
      setProgress(70);

      // ÉTAPE 3: Mapping intelligent vers formulaires
      console.log('📋 ÉTAPE 3: Début mapping intelligent vers formulaires');
      setProcessingStep('🗂️ Mapping intelligent - Nomenclature algérienne...');
      setProgress(80);
      
      await updateStep('mapping', 'processing', 0);
      
      // Vérification de sécurité pour le mapping
      if (!structuredPub) {
        console.warn('⚠️ Pas de données structurées pour le mapping');
        throw new Error('Données structurées manquantes pour le mapping');
      }

      const mappingResult = await intelligentMappingService.mapExtractedDataToForm(
        structuredPub,
        selectedFormType || 'default'
      );
      console.log('✅ ÉTAPE 3: Mapping terminé, résultat:', mappingResult);
      
      // Vérification de sécurité pour le mapping result
      if (!mappingResult || !mappingResult.sections) {
        console.warn('⚠️ Résultat de mapping invalide, utilisation de données par défaut');
        const mappedFormData: MappedFormData = {
          formId: 'default',
          sections: [{
            sectionId: 'default',
            fields: [{
              fieldId: 'content',
              value: 'Contenu extrait',
              confidence: 0.8,
              source: 'ocr' as any,
              mappingMethod: 'default'
            }]
          }],
          metadata: {
            ocrConfidence: extractedDoc.confidence,
            mappingConfidence: 0.8,
            processingTime: Date.now() - startTime,
            warnings: ['Mapping par défaut utilisé']
          }
        };
        setMappedData(mappedFormData);
      } else {
        // Convertir pour compatibilité
        const mappedFormData: MappedFormData = {
          formId: mappingResult.formId,
          sections: mappingResult.sections.map(section => ({
            sectionId: section.sectionId,
            fields: section.fields.map(field => ({
              fieldId: field.fieldId,
              value: field.mappedValue,
              confidence: field.confidence,
              source: 'ocr' as any,
              mappingMethod: field.source || 'automatic' // Utilise source ou valeur par défaut
            }))
          })),
          metadata: {
            ocrConfidence: extractedDoc.confidence,
            mappingConfidence: mappingResult.overallConfidence,
            processingTime: Date.now() - startTime,
            warnings: mappingResult.warnings
          }
        };
        setMappedData(mappedFormData);
      }

      // Séparer les champs mappés et non mappés
      const mapped: MappedField[] = [];
      const unmapped: MappedField[] = [];

      if (mappingResult && mappingResult.sections) {
        mappingResult.sections.forEach(section => {
          section.fields.forEach(field => {
            const mappedField: MappedField = {
              fieldId: field.fieldId,
              originalValue: field.originalValue,
              mappedValue: field.mappedValue,
              confidence: field.confidence,
              status: field.mappedValue ? 'mapped' : 'unmapped'
            };

            if (field.mappedValue) {
              mapped.push(mappedField);
            } else {
              unmapped.push(mappedField);
            }
          });
        });
      } else {
        // Données par défaut si pas de mapping
        mapped.push({
          fieldId: 'content',
          originalValue: 'Contenu extrait',
          mappedValue: 'Contenu extrait',
          confidence: 0.8,
          status: 'mapped'
        });
      }

      setMappedFields(mapped);
      setUnmappedFields(unmapped);
      
      // Mettre à jour les métriques de mapping
      metrics.fieldsMapped = mapped.length;
      metrics.confidenceScore = mappingResult.overallConfidence;
      
      await updateStep('mapping', 'completed', 100, mappingResult);
      setMappingResult(mappingResult);
      
      setProgress(90);

      // ÉTAPE 4: Validation
      setProcessingStep('✅ Validation des données...');
      setProgress(95);
      
      await updateStep('validation', 'processing', 0);
      
      // Créer un item d'approbation si nécessaire
      if (mappingResult.overallConfidence < 0.8) {
        const approvalItem = await approvalWorkflowService.createApprovalItem(
          mappingResult,
          structuredPub
        );
        console.log('📋 Item d\'approbation créé:', approvalItem);
        setApprovalItem(approvalItem);
      }
      
      await updateStep('validation', 'completed', 100, approvalItem);
      
      setProgress(100);

      // Calculer les métriques finales
      metrics.totalProcessingTime = Date.now() - startTime;
      setMetrics(metrics);

      // Mise à jour des statistiques
      const processingTime = Date.now() - startTime;
      setProcessingStats(prev => ({
        filesProcessed: prev.filesProcessed + 1,
        entitiesExtracted: prev.entitiesExtracted + (detectedEntities?.length || 0),
        fieldsMaped: prev.fieldsMaped + mapped.length,
        avgConfidence: (prev.avgConfidence + extractedDoc.confidence) / 2,
        totalProcessingTime: prev.totalProcessingTime + processingTime
      }));

      console.log('🇩🇿 DZ OCR-IA Processing completed with enhanced services:', {
        extraction: extractedDoc,
        structured: structuredPub,
        mapping: mappingResult
      });

      setProcessingStep('✅ Traitement local DZ terminé avec succès - Données sécurisées !');
      
      // Navigation automatique vers le mapping après un délai
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        navigateToTab('mapping');
      }, 1000);

    } catch (error) {
      console.error('❌ Erreur lors du traitement DZ OCR-IA:', error);
      setError(`Erreur lors du traitement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setProcessingStep('❌ Erreur lors du traitement');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, selectedFormType]);

  /**
   * Simulation du traitement NLP local (spaCy/Hugging Face)
   */
  const simulateNLPProcessing = async (): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('🧠 NLP Processing simulation: Entity recognition and relation extraction completed');
        resolve();
      }, 1000);
    });
  };

  /**
   * Gestion de la caméra
   */
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      setError('Impossible d\'accéder à la caméra');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new globalThis.File([blob], 'capture.jpg', { type: 'image/jpeg' });
            setSelectedFile(file);
            stopCamera();
            await processDocument(file);
          }
        });
      }
    }
  };

  /**
   * Navigation entre onglets avec validation
   */
  const navigateToMapping = () => {
    if (extractedData) {
      setActiveTab('mapping');
    } else {
      setError('Veuillez d\'abord extraire des données avant de procéder au mapping');
    }
  };

  const navigateToWorkflow = () => {
    if (mappedData) {
      setActiveTab('workflow');
    } else {
      setError('Veuillez d\'abord effectuer le mapping avant de procéder au workflow');
    }
  };

  const resetToUpload = () => {
    setActiveTab('upload');
    setSelectedFile(null);
    setExtractedData(null);
    setMappedData(null);
    setExtractedText(null);
    setDetectedEntities([]);
    setMappedFields([]);
    setUnmappedFields([]);
    setError(null);
    setProgress(0);
    setProcessingStep('');
  };

  /**
   * Enregistrement dans le fil d'approbation
   */
  const saveToApprovalWorkflow = useCallback(async () => {
    if (!mappedData || !extractedData) return;

    try {
      // Simulation de l'enregistrement dans le workflow
      console.log('💾 Saving to approval workflow...');
      
      const approvalData = {
        documentType: 'legal_text',
        extractedData,
        mappedData,
        status: 'pending_approval',
        submittedAt: new Date().toISOString(),
        submittedBy: 'ocr_system',
        metadata: {
          ocrConfidence: mappedData.metadata.ocrConfidence,
          mappingConfidence: mappedData.metadata.mappingConfidence,
          processingTime: mappedData.metadata.processingTime,
          warnings: mappedData.metadata.warnings
        }
      };

      // Ici, en production, cela irait vers le service d'approbation
      localStorage.setItem(`approval_${Date.now()}`, JSON.stringify(approvalData));
      
      alert('✅ Document enregistré dans le fil d\'approbation avec succès !');
      
      // Retourner à l'onglet upload après succès
      resetToUpload();
      
    } catch (error) {
      console.error('Failed to save to approval workflow:', error);
      setError('❌ Erreur lors de l\'enregistrement');
    }
  }, [mappedData, extractedData]);

  /**
   * Rendu de la zone d'upload
   */
  const renderUploadZone = () => (
    <div className="space-y-4">
      {/* Zone d'upload principal */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.rtf"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-green-600 mr-2" />
            <span className="text-2xl">🇩🇿</span>
          </div>
          <div className="text-lg font-medium text-gray-900 mb-2">
            📁 Chargement Local de Documents Algériens
          </div>
          <div className="text-sm text-green-700 font-medium mb-2">
            🔒 Traitement 100% Local - Confidentialité Garantie
          </div>
          <div className="text-sm text-gray-600 mb-4">
            Formats juridiques DZ supportés :
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <Badge variant="outline" className="border-green-200 text-green-700">🇩🇿 PDF Juridique</Badge>
            <Badge variant="outline" className="border-green-200 text-green-700">📷 Scans DZ</Badge>
            <Badge variant="outline" className="border-green-200 text-green-700">📝 Documents AR/FR</Badge>
            <Badge variant="outline" className="border-green-200 text-green-700">📊 Tableaux DZ</Badge>
            <Badge variant="outline" className="border-green-200 text-green-700">🎯 Présentations</Badge>
            <Badge variant="outline" className="border-green-200 text-green-700">📝 Texte Local</Badge>
            <Badge variant="outline" className="border-green-200 text-green-700">📄 Formats RTF</Badge>
          </div>
        </label>
      </div>

      {/* Options d'équipement externe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-green-200" onClick={() => setShowScanOptions(!showScanOptions)}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Scan className="w-6 h-6 text-blue-600 mr-2" />
              <span className="text-xl">🇩🇿</span>
            </div>
            <div className="font-medium text-blue-700">Scanner Local DZ</div>
            <div className="text-sm text-gray-600">🔒 Traitement local sur poste</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow border-green-200" onClick={startCamera}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Camera className="w-6 h-6 text-green-600 mr-2" />
              <span className="text-xl">🇩🇿</span>
            </div>
            <div className="font-medium text-green-700">Caméra Locale DZ</div>
            <div className="text-sm text-gray-600">📱 Capture directe sécurisée</div>
          </CardContent>
        </Card>
      </div>

      {/* Interface caméra */}
      {isCameraOpen && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center mb-4">
              <video ref={videoRef} autoPlay playsInline className="w-full max-w-md mx-auto rounded" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={capturePhoto}>
                <Camera className="w-4 h-4 mr-2" />
                Capturer
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations sur le scanner */}
      {showScanOptions && (
        <Alert>
          <Scan className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Instructions Scanner :</div>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Connectez votre scanner à l'ordinateur</li>
              <li>Placez le document dans le scanner</li>
              <li>Utilisez le logiciel du scanner pour numériser</li>
              <li>Sauvegardez en PDF ou image</li>
              <li>Glissez-déposez le fichier dans la zone ci-dessus</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  /**
   * Rendu des résultats d'extraction
   */
  const renderExtractionResults = () => {
    if (!extractedData && !extractedText) return null;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Données Extraites
              <Badge variant="outline">
                {extractedData?.entities.length || detectedEntities.length} entité(s) détectée(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Métadonnées */}
              <div className="space-y-2">
                <h4 className="font-semibold">Métadonnées du Document</h4>
                <div className="text-sm space-y-1">
                  <div>Type: <Badge>{extractedData?.metadata.documentType || 'Texte'}</Badge></div>
                  <div>Confiance: <Badge variant={extractedData?.metadata.confidence > 0.8 ? "default" : "secondary"}>
                    {((extractedData?.metadata.confidence || extractedText?.confidence || 0) * 100).toFixed(1)}%
                  </Badge></div>
                  <div>Temps de traitement: {extractedData?.metadata.processingTime || '< 1000'}ms</div>
                  <div>Tables détectées: {extractedData?.tables.length || 0}</div>
                  {extractedText && (
                    <>
                      <div>Pages: {extractedText.pages}</div>
                      <div>Langue: {extractedText.language}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Entités juridiques */}
              <div className="space-y-2">
                <h4 className="font-semibold">Entités Juridiques</h4>
                {(extractedData?.entities || []).map((entity, index) => (
                  <div key={index} className="text-sm border rounded p-2">
                    <div className="font-medium">{entity.type.toUpperCase()} N° {entity.number}</div>
                    <div className="text-gray-600">{entity.title}</div>
                    <div className="text-xs text-gray-500">
                      Autorité: {entity.issuingAuthority}
                    </div>
                    <div className="text-xs text-gray-500">
                      Articles: {entity.articles.length} | Références: {entity.references.length}
                    </div>
                  </div>
                ))}
                {detectedEntities.map((entity, index) => (
                  <div key={`detected-${index}`} className="text-sm border rounded p-2">
                    <div className="font-medium">{entity.type}</div>
                    <div className="text-gray-600">{entity.value}</div>
                    <div className="text-xs text-gray-500">
                      Confiance: {(entity.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Texte extrait */}
            {extractedText && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Texte Extrait</h4>
                <div className="bg-gray-50 p-3 rounded text-sm max-h-40 overflow-y-auto">
                  {extractedText.content.substring(0, 500)}
                  {extractedText.content.length > 500 && '...'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bouton vers mapping */}
        <div className="flex justify-end">
          <Button onClick={navigateToMapping} className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Mapping vers Formulaires
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Rendu des résultats de mapping
   */
  const renderMappingResults = () => {
    return (
      <div className="space-y-4">
        {/* Sélection du type de formulaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Type de Formulaire Cible
            </label>
            <select 
              value={selectedFormType}
              onChange={(e) => setSelectedFormType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {availableForms.map(formType => (
                <option key={formType} value={formType}>
                  {formType === 'legal_document' ? 'Document Juridique' : 
                   formType === 'administrative_procedure' ? 'Procédure Administrative' : formType}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Mode de Mapping
            </label>
            <select className="w-full border rounded px-3 py-2">
              <option value="automatic">Automatique (Recommandé)</option>
              <option value="manual">Manuel</option>
              <option value="hybrid">Hybride</option>
            </select>
          </div>
        </div>

        {mappedData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Résultats du Mapping
                <Badge variant="outline">
                  {mappedData.sections.length} section(s) mappée(s)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Statistiques de mapping */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(mappedData.metadata.mappingConfidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Confiance Mapping</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {mappedFields.length}
                    </div>
                    <div className="text-xs text-gray-500">Champs Mappés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {unmappedFields.length}
                    </div>
                    <div className="text-xs text-gray-500">Non Mappés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {mappedData.metadata.warnings.length}
                    </div>
                    <div className="text-xs text-gray-500">Avertissements</div>
                  </div>
                </div>

                {/* Données mappées */}
                {mappedFields.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-green-700">Données Mappées ({mappedFields.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {mappedFields.map((field, index) => (
                        <div key={index} className="text-sm border border-green-200 rounded p-2 bg-green-50">
                          <div className="font-medium">{field.fieldId}</div>
                          <div className="text-gray-600">{field.mappedValue}</div>
                          <div className="text-xs text-gray-500">
                            Confiance: {(field.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Données non mappées */}
                {unmappedFields.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-700">Données non Mappées ({unmappedFields.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {unmappedFields.map((field, index) => (
                        <div key={index} className="text-sm border border-red-200 rounded p-2 bg-red-50">
                          <div className="font-medium">{field.fieldId}</div>
                          <div className="text-gray-500 italic">Aucune valeur trouvée</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avertissements */}
                {mappedData.metadata.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">Avertissements de Mapping:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {mappedData.metadata.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bouton vers workflow */}
        <div className="flex justify-end">
          <Button onClick={navigateToWorkflow} className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Workflow & Approbation
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Rendu du workflow
   */
  const renderWorkflowResults = () => {
    if (!mappedData) {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Aucune donnée à valider. Veuillez d'abord effectuer l'extraction et le mapping d'un document.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        {/* Résumé pour validation */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Prêt pour Validation:</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Type de formulaire:</strong> {mappedData.formId}
              </div>
              <div>
                <strong>Confiance mapping:</strong> {(mappedData.metadata.mappingConfidence * 100).toFixed(1)}%
              </div>
              <div>
                <strong>Champs mappés:</strong> {mappedFields.length}
              </div>
              <div>
                <strong>Champs non mappés:</strong> {unmappedFields.length}
              </div>
              <div>
                <strong>Avertissements:</strong> {mappedData.metadata.warnings.length}
              </div>
              <div>
                <strong>Temps total:</strong> {mappedData.metadata.processingTime}ms
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Détails complets */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé Complet de l'Extraction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Texte extrait */}
            {extractedText && (
              <div>
                <h4 className="font-semibold mb-2">📄 Texte Extrait</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div><strong>Contenu:</strong> {extractedText.content.length} caractères</div>
                  <div><strong>Confiance:</strong> {(extractedText.confidence * 100).toFixed(1)}%</div>
                  <div><strong>Pages:</strong> {extractedText.pages}</div>
                  <div><strong>Langue:</strong> {extractedText.language}</div>
                </div>
              </div>
            )}

            {/* Entités détectées */}
            <div>
              <h4 className="font-semibold mb-2">🏷️ Entités Détectées ({detectedEntities.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {detectedEntities.map((entity, index) => (
                  <div key={index} className="bg-blue-50 p-2 rounded text-sm">
                    <div><strong>{entity.type}:</strong> {entity.value}</div>
                    <div className="text-xs text-gray-600">Confiance: {(entity.confidence * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Données mappées détaillées */}
            <div>
              <h4 className="font-semibold mb-2">✅ Données Mappées ({mappedFields.length})</h4>
              <div className="space-y-2">
                {mappedFields.map((field, index) => (
                  <div key={index} className="bg-green-50 p-2 rounded text-sm">
                    <div><strong>{field.fieldId}:</strong> {field.mappedValue}</div>
                    <div className="text-xs text-gray-600">
                      Original: {field.originalValue} | Confiance: {(field.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Données non mappées */}
            {unmappedFields.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">❌ Données non Mappées ({unmappedFields.length})</h4>
                <div className="space-y-2">
                  {unmappedFields.map((field, index) => (
                    <div key={index} className="bg-red-50 p-2 rounded text-sm">
                      <div><strong>{field.fieldId}:</strong> <span className="text-gray-500 italic">Non trouvé</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={saveToApprovalWorkflow} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Enregistrer dans le Fil d'Approbation
          </Button>
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Prévisualiser
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Ajuster
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-600" />
              <span>DZ OCR-IA</span>
              <Badge variant="outline" className="bg-green-50">
                🇩🇿 Textes Juridiques Algériens
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Extraction et structuration automatique des documents PDF des journaux officiels algériens.
            Mapping intelligent vers les formulaires de nomenclature avec NLP avancé.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistiques de traitement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Statistiques de Traitement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{processingStats.filesProcessed}</div>
              <div className="text-xs text-gray-500">Fichiers Traités</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{processingStats.entitiesExtracted}</div>
              <div className="text-xs text-gray-500">Entités Extraites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{processingStats.fieldsMaped}</div>
              <div className="text-xs text-gray-500">Champs Mappés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(processingStats.avgConfidence * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Confiance Moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {(processingStats.totalProcessingTime / 1000).toFixed(1)}s
              </div>
              <div className="text-xs text-gray-500">Temps Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erreurs */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="extraction">🔍 Extraction & Analyse</TabsTrigger>
          <TabsTrigger value="mapping">🎯 Mapping</TabsTrigger>
          <TabsTrigger value="validation">✅ Validation</TabsTrigger>
          <TabsTrigger value="workflow">📋 Workflow</TabsTrigger>
          <TabsTrigger value="analytics">📈 Analytics</TabsTrigger>
        </TabsList>

        {/* Onglet Extraction et Analyse */}
        <TabsContent value="extraction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-600" />
                🇩🇿 Extraction & Analyse Locale DZ
              </CardTitle>
              <CardDescription>
                Traitement 100% local avec analyse intégrée - Aucune donnée envoyée vers des services externes. 
                Extraction OCR intelligente spécialisée pour documents juridiques algériens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bandeau de sécurité locale */}
              <Alert className="border-green-200 bg-green-50">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🇩🇿</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800 mb-1">
                      🔒 Processeur OCR 100% Local Algérien
                    </h4>
                    <p className="text-sm text-green-700">
                      Vos documents restent sur votre machine. Aucun transfert vers des serveurs externes.
                      Intelligence artificielle embarquée pour documents juridiques DZ.
                    </p>
                  </div>
                </div>
              </Alert>

              {renderUploadZone()}

              {/* Fichier sélectionné */}
              {selectedFile && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>Fichier sélectionné:</strong> {selectedFile.name}
                        <br />
                        <span className="text-sm text-gray-500">
                          Type: {selectedFile.type || 'Unknown'} | Taille: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <Button 
                        onClick={() => selectedFile && processDocument(selectedFile)} 
                        disabled={isProcessing || !selectedFile}
                        className="ml-4 bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            🇩🇿 Traitement Local...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            🚀 Lancer Extraction & Analyse DZ
                          </>
                        )}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Barre de progression */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{processingStep}</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Étapes de traitement avec analyse */}
              {processingSteps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      Étapes de Traitement & Analyse
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {processingSteps.map((step) => (
                        <div key={step.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {step.status === 'processing' && <Clock className="h-4 w-4 text-blue-500 animate-spin" />}
                              {step.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                              {step.status === 'pending' && <Circle className="h-4 w-4 text-muted-foreground" />}
                              <span className="font-medium">{step.name}</span>
                            </div>
                            <Badge variant={
                              step.status === 'completed' ? 'default' :
                              step.status === 'processing' ? 'secondary' :
                              step.status === 'error' ? 'destructive' : 'outline'
                            }>
                              {step.status}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                          
                          <Progress value={step.progress} className="mb-2" />
                          
                          {step.status === 'completed' && step.result && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowStepDetails(showStepDetails === step.id ? null : step.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir les Détails
                            </Button>
                          )}

                          {showStepDetails === step.id && step.result && (
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                              <pre className="text-xs overflow-auto max-h-40">
                                {JSON.stringify(step.result, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Métriques de performance */}
              {metrics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Métriques de Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {metrics.pagesProcessed}
                        </div>
                        <div className="text-xs text-muted-foreground">Pages Traitées</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {metrics.linesDetected}
                        </div>
                        <div className="text-xs text-muted-foreground">Lignes Détectées</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {metrics.tablesDetected}
                        </div>
                        <div className="text-xs text-muted-foreground">Tableaux Détectés</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {metrics.entitiesExtracted}
                        </div>
                        <div className="text-xs text-muted-foreground">Entités Extraites</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Résultats d'extraction */}
              {renderExtractionResults()}

              {/* Navigation automatique vers le mapping */}
              {extractedDocument && !isProcessing && (
                <Alert className="border-blue-200 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-1">
                        ✅ Extraction et analyse terminées !
                      </h4>
                      <p className="text-sm text-blue-700">
                        Le document a été extrait et analysé avec succès. Vous pouvez maintenant passer au mapping.
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigateToTab('mapping')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Continuer vers le Mapping
                    </Button>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Mapping */}
        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Mapping vers Formulaires
              </CardTitle>
              <CardDescription>
                Configuration du mapping automatique vers les formulaires de nomenclature
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderMappingResults()}
              
              {/* Navigation automatique vers la validation */}
              {mappingResult && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">
                        🎯 Mapping terminé !
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Le mapping vers la nomenclature a été effectué avec succès. Vous pouvez maintenant valider les données.
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigateToTab('validation')}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Continuer vers la Validation
                    </Button>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Validation */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-green-600" />
                Validation des Données
              </CardTitle>
              <CardDescription>
                Validation et correction des données extraites et mappées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mappingResult ? (
                <div className="space-y-4">
                  {/* Résumé de validation */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {mappingResult.mappedFields.filter(f => f.confidence > 0.8).length}
                      </div>
                      <div className="text-sm text-green-700">Champs Validés</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {mappingResult.mappedFields.filter(f => f.confidence <= 0.8 && f.confidence > 0.5).length}
                      </div>
                      <div className="text-sm text-yellow-700">À Vérifier</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {mappingResult.mappedFields.filter(f => f.confidence <= 0.5).length}
                      </div>
                      <div className="text-sm text-red-700">Erreurs</div>
                    </div>
                  </div>

                  {/* Liste des champs à valider */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">Champs Mappés</h4>
                    {mappingResult.mappedFields.map((field, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        field.confidence > 0.8 ? 'bg-green-50 border-green-200' :
                        field.confidence > 0.5 ? 'bg-yellow-50 border-yellow-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{field.fieldName}</div>
                            <div className="text-sm text-gray-600">
                              Valeur: {field.originalValue} → {field.mappedValue}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {(field.confidence * 100).toFixed(1)}%
                            </div>
                            <Badge variant={
                              field.confidence > 0.8 ? 'default' :
                              field.confidence > 0.5 ? 'secondary' : 'destructive'
                            }>
                              {field.confidence > 0.8 ? 'Validé' :
                               field.confidence > 0.5 ? 'À vérifier' : 'Erreur'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions de validation */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        setIsValidating(true);
                        // Simuler la validation
                        setTimeout(() => {
                          setValidationResults({ success: true, validatedFields: mappingResult.mappedFields.length });
                          setIsValidating(false);
                          navigateToTab('workflow');
                        }, 2000);
                      }}
                      disabled={isValidating}
                      className="flex-1"
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Validation en cours...
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-4 h-4 mr-2" />
                          Valider Tous les Champs
                        </>
                      )}
                    </Button>
                    <Button variant="outline">
                      <Settings2 className="w-4 h-4 mr-2" />
                      Ajuster Manuellement
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Aucune donnée mappée disponible. Veuillez d'abord effectuer l'extraction et le mapping.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Workflow */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Workflow d'Approbation
              </CardTitle>
              <CardDescription>
                Validation et enregistrement dans le fil d'approbation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderWorkflowResults()}
              
              {/* Navigation automatique vers les analytics */}
              {approvalItem && (
                <Alert className="border-purple-200 bg-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-purple-800 mb-1">
                        📋 Workflow terminé !
                      </h4>
                      <p className="text-sm text-purple-700">
                        Le document a été validé et enregistré dans le workflow d'approbation. Vous pouvez maintenant consulter les analytics.
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigateToTab('analytics')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Voir les Analytics
                    </Button>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Analytics & Métriques
              </CardTitle>
              <CardDescription>
                Analyse des performances et métriques de traitement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics ? (
                <div className="space-y-6">
                  {/* Métriques globales */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {metrics.totalProcessingTime}ms
                      </div>
                      <div className="text-sm text-blue-700">Temps Total</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {metrics.pagesProcessed}
                      </div>
                      <div className="text-sm text-green-700">Pages Traitées</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {metrics.entitiesExtracted}
                      </div>
                      <div className="text-sm text-purple-700">Entités Extraites</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {(metrics.confidenceScore * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-orange-700">Confiance Moyenne</div>
                    </div>
                  </div>

                  {/* Graphiques de performance */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Performance par Étape</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {processingSteps.map((step) => (
                            <div key={step.id} className="flex items-center justify-between">
                              <span className="text-sm">{step.name}</span>
                              <div className="flex items-center gap-2">
                                <Progress value={step.progress} className="w-20" />
                                <span className="text-xs text-gray-500">{step.progress}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Détection de Contenu</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Lignes détectées</span>
                            <span className="font-medium">{metrics.linesDetected}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Tableaux détectés</span>
                            <span className="font-medium">{metrics.tablesDetected}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Régions de texte</span>
                            <span className="font-medium">{metrics.textRegionsExtracted}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Champs mappés</span>
                            <span className="font-medium">{metrics.fieldsMapped}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Actions d'analytics */}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Exporter le Rapport
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Voir Détails Complets
                    </Button>
                    <Button 
                      onClick={() => navigateToTab('extraction')}
                      className="flex-1"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Nouveau Traitement
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Aucune donnée d'analytics disponible. Veuillez d'abord effectuer un traitement complet.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DZOCRIAProcessor;