// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, Building, Eye, MessageSquare, 
  Users, Calendar, AlertTriangle, CheckCircle,
  ArrowRight, Copy, Play, Settings
} from "lucide-react";
import { 
  getAllAlgerianWorkflowExamples, 
  getWorkflowsByType, 
  getWorkflowsByAdministrativeLevel,
  getWorkflowsByUrgency,
  createWorkflowFromTemplate,
  AlgerianWorkflowConfig 
} from '@/data/algerianWorkflowExamples';
import { ApprovalWorkflowSystem } from './ApprovalWorkflowSystem';

interface AlgerianWorkflowExamplesProps {
  onSelectWorkflow?: (workflow: AlgerianWorkflowConfig) => void;
  onUseTemplate?: (templateId: string) => void;
}

export function AlgerianWorkflowExamples({
  onSelectWorkflow,
  onUseTemplate
}: AlgerianWorkflowExamplesProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<AlgerianWorkflowConfig | null>(null);

  const allWorkflows = getAllAlgerianWorkflowExamples();
  
  const filteredWorkflows = allWorkflows.filter(workflow => {
    const typeMatch = selectedType === 'all' || workflow.type === selectedType;
    const levelMatch = selectedLevel === 'all' || workflow.administrativeLevel === selectedLevel;
    const urgencyMatch = selectedUrgency === 'all' || workflow.urgencyLevel === selectedUrgency;
    return typeMatch && levelMatch && urgencyMatch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'legal_text':
        return <FileText className="h-4 w-4" />;
      case 'administrative_procedure':
        return <Building className="h-4 w-4" />;
      case 'regulatory_watch':
        return <Eye className="h-4 w-4" />;
      case 'legal_consultation':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'legal_text':
        return 'Texte Juridique';
      case 'administrative_procedure':
        return 'Procédure Administrative';
      case 'regulatory_watch':
        return 'Veille Réglementaire';
      case 'legal_consultation':
        return 'Consultation Juridique';
      default:
        return type;
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'commune':
        return 'Commune';
      case 'wilaya':
        return 'Wilaya';
      case 'national':
        return 'National';
      default:
        return level;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      case 'very_urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleWorkflowSelect = (workflow: AlgerianWorkflowConfig) => {
    setSelectedWorkflow(workflow);
    onSelectWorkflow?.(workflow);
  };

  const handleUseTemplate = (templateId: string) => {
    try {
      const newWorkflow = createWorkflowFromTemplate(templateId, {
        title: `Nouveau workflow basé sur ${templateId}`,
        description: 'Workflow créé à partir d\'un template'
      });
      onUseTemplate?.(templateId);
      console.log('Nouveau workflow créé:', newWorkflow);
    } catch (error) {
      console.error('Erreur lors de la création du workflow:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exemples de Workflows Algériens</h2>
          <p className="text-gray-600">
            Templates de workflows pour textes juridiques et procédures administratives
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurer
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type de workflow" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="legal_text">Textes Juridiques</SelectItem>
            <SelectItem value="administrative_procedure">Procédures Administratives</SelectItem>
            <SelectItem value="regulatory_watch">Veille Réglementaire</SelectItem>
            <SelectItem value="legal_consultation">Consultations Juridiques</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Niveau administratif" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            <SelectItem value="commune">Commune</SelectItem>
            <SelectItem value="wilaya">Wilaya</SelectItem>
            <SelectItem value="national">National</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Niveau d'urgence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les urgences</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="very_urgent">Très urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Affichage des workflows */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Vue Grille</TabsTrigger>
          <TabsTrigger value="list">Vue Liste</TabsTrigger>
          <TabsTrigger value="detail">Vue Détaillée</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(workflow.type)}
                      <Badge variant="outline">
                        {getTypeLabel(workflow.type)}
                      </Badge>
                    </div>
                    <Badge className={getUrgencyColor(workflow.urgencyLevel || 'normal')}>
                      {workflow.urgencyLevel}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{workflow.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {workflow.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Niveau:</span>
                      <Badge variant="secondary">
                        {getLevelLabel(workflow.administrativeLevel || 'national')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Étapes:</span>
                      <span className="font-medium">{workflow.steps.length}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Durée estimée:</span>
                      <span className="font-medium">{workflow.estimatedDuration}h</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Impact budgétaire:</span>
                      <Badge variant={workflow.budgetImpact === 'high' ? 'destructive' : 'secondary'}>
                        {workflow.budgetImpact}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleWorkflowSelect(workflow)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUseTemplate(workflow.id)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Utiliser
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="space-y-4">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getTypeIcon(workflow.type)}
                      <div>
                        <h3 className="font-semibold">{workflow.title}</h3>
                        <p className="text-sm text-gray-600">{workflow.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{getTypeLabel(workflow.type)}</Badge>
                      <Badge className={getUrgencyColor(workflow.urgencyLevel || 'normal')}>
                        {workflow.urgencyLevel}
                      </Badge>
                      <Button size="sm" onClick={() => handleWorkflowSelect(workflow)}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detail" className="space-y-6">
          {selectedWorkflow ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Détails du Workflow</h3>
                <Button variant="outline" onClick={() => setSelectedWorkflow(null)}>
                  Retour à la liste
                </Button>
              </div>
              
              <ApprovalWorkflowSystem
                workflow={selectedWorkflow}
                readOnly={true}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sélectionnez un workflow
              </h3>
              <p className="text-gray-600">
                Cliquez sur "Voir" pour afficher les détails d'un workflow
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques des Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{allWorkflows.length}</div>
              <div className="text-sm text-gray-600">Total workflows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {allWorkflows.filter(w => w.type === 'legal_text').length}
              </div>
              <div className="text-sm text-gray-600">Textes juridiques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {allWorkflows.filter(w => w.type === 'administrative_procedure').length}
              </div>
              <div className="text-sm text-gray-600">Procédures administratives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {allWorkflows.filter(w => w.urgencyLevel === 'urgent').length}
              </div>
              <div className="text-sm text-gray-600">Urgents</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}