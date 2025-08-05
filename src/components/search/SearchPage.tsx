import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Mic, 
  Filter, 
  History,
  Settings
} from 'lucide-react';
import { AdvancedSearchForm } from './AdvancedSearchForm';
import { VoiceSearchInterface } from '../voice/VoiceSearchInterface';
import { SearchResultsWithVoice } from './SearchResultsWithVoice';
import { SearchPreferencesService, type SearchPreferences } from '@/services/searchPreferencesService';
import { toast } from 'sonner';

// Données de démonstration
const mockResults = [
  {
    id: '1',
    title: 'Loi n° 23-01 du 14 février 2023 relative au numérique en Algérie',
    type: 'Loi',
    date: '14 février 2023',
    institution: 'Présidence de la République',
    summary: 'Cette loi définit le cadre juridique pour le développement du numérique en Algérie, incluant la gouvernance électronique, la protection des données et la cybersécurité.',
    status: 'En vigueur',
    content: 'La présente loi a pour objet de définir les règles générales relatives au numérique en République algérienne démocratique et populaire, en vue de promouvoir l\'économie numérique et d\'accompagner la transformation digitale de l\'administration publique et des entreprises.'
  },
  {
    id: '2',
    title: 'Décret exécutif n° 23-158 du 23 avril 2023 fixant les modalités d\'application de la loi sur le numérique',
    type: 'Décret',
    date: '23 avril 2023',
    institution: 'Premier ministère',
    summary: 'Ce décret précise les modalités d\'application de la loi relative au numérique, notamment en matière de certification électronique et de signature numérique.',
    status: 'Publié',
    content: 'Le présent décret a pour objet de fixer les modalités d\'application des dispositions de la loi n° 23-01 du 14 février 2023 relative au numérique, particulièrement en ce qui concerne les procédures de certification électronique.'
  }
];

export function SearchPage() {
  const [searchResults, setSearchResults] = useState(mockResults);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('advanced');

  const handleSearch = useCallback(async (criteria: any) => {
    setIsLoading(true);
    
    try {
      // Simuler une recherche
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filtrer les résultats basés sur les critères
      let filteredResults = mockResults;
      
      if (criteria.keywords) {
        filteredResults = filteredResults.filter(result =>
          result.title.toLowerCase().includes(criteria.keywords.toLowerCase()) ||
          result.summary.toLowerCase().includes(criteria.keywords.toLowerCase())
        );
      }
      
      if (criteria.documentType) {
        filteredResults = filteredResults.filter(result =>
          result.type.toLowerCase().includes(criteria.documentType.toLowerCase())
        );
      }
      
      setSearchResults(filteredResults);
      
      toast.success(`${filteredResults.length} résultat(s) trouvé(s)`);
      
    } catch (error) {
      toast.error('Erreur lors de la recherche');
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleVoiceSearch = useCallback((query: string) => {
    handleSearch({ keywords: query });
  }, [handleSearch]);

  const handleVoiceCommand = useCallback((command: string) => {
    const [action, target] = command.split(':');
    
    switch (action) {
      case 'navigate':
        // Ici vous pouvez gérer la navigation
        toast.info(`Navigation vers: ${target}`);
        break;
      default:
        toast.info(`Commande reçue: ${command}`);
    }
  }, []);

  const handleSavePreferences = useCallback((preferences: SearchPreferences) => {
    toast.success(`Recherche "${preferences.name}" sauvegardée`);
  }, []);

  const handleViewDetail = useCallback((id: string) => {
    const result = searchResults.find(r => r.id === id);
    if (result) {
      toast.info(`Ouverture du détail: ${result.title}`);
      // Ici vous pouvez ouvrir une modale ou naviguer vers une page de détail
    }
  }, [searchResults]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Recherche juridique avancée
        </h1>
        <p className="text-gray-600 text-lg">
          Recherche intelligente avec reconnaissance vocale et synthèse audio
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Recherche avancée
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Interface vocale
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Résultats ({searchResults.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="advanced" className="mt-6">
          <AdvancedSearchForm 
            onSearch={handleSearch}
            onSavePreferences={handleSavePreferences}
          />
        </TabsContent>

        <TabsContent value="voice" className="mt-6">
          <VoiceSearchInterface 
            onSearch={handleVoiceSearch}
            onVoiceCommand={handleVoiceCommand}
          />
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <SearchResultsWithVoice 
            results={searchResults}
            isLoading={isLoading}
            onViewDetail={handleViewDetail}
          />
        </TabsContent>
      </Tabs>

      {/* Statistiques de recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Statistiques de recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {searchResults.length}
              </div>
              <div className="text-sm text-gray-600">Résultats actuels</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {SearchPreferencesService.getAll().length}
              </div>
              <div className="text-sm text-gray-600">Recherches sauvegardées</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {mockResults.length}
              </div>
              <div className="text-sm text-gray-600">Base de données</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                5
              </div>
              <div className="text-sm text-gray-600">Filtres actifs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}