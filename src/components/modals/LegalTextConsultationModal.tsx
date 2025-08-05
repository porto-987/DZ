import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Search, BookOpen, Scale } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface LegalTextConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  text?: any;
}

export function LegalTextConsultationModal({ isOpen, onClose, text }: LegalTextConsultationModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    jurisdiction: '',
    date: '',
    version: '',
    searchKeywords: '',
    includeAnnotations: false,
    includeHistory: false,
    exportFormat: 'pdf',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Consultation juridique:', formData);
    toast({
      title: "Consultation configurée",
      description: "La consultation de textes juridiques a été configurée avec succès.",
    });
    onClose();
    setFormData({
      title: '',
      category: '',
      jurisdiction: '',
      date: '',
      version: '',
      searchKeywords: '',
      includeAnnotations: false,
      includeHistory: false,
      exportFormat: 'pdf',
      description: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consultation de textes juridiques
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre du document</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Titre du document juridique"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="civil">Droit civil</SelectItem>
                  <SelectItem value="commercial">Droit commercial</SelectItem>
                  <SelectItem value="labor">Droit du travail</SelectItem>
                  <SelectItem value="tax">Droit fiscal</SelectItem>
                  <SelectItem value="administrative">Droit administratif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="jurisdiction">Juridiction</Label>
              <Select onValueChange={(value) => setFormData({...formData, jurisdiction: value})}>
                <SelectTrigger id="jurisdiction">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="france">France</SelectItem>
                  <SelectItem value="eu">Union Européenne</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                  <SelectItem value="regional">Régional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date d'application</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({...formData, version: e.target.value})}
                placeholder="1.0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="searchKeywords">Mots-clés de recherche</Label>
            <Input
              id="searchKeywords"
              value={formData.searchKeywords}
              onChange={(e) => setFormData({...formData, searchKeywords: e.target.value})}
              placeholder="Entrez des mots-clés pour la recherche"
            />
          </div>

          <div>
            <Label htmlFor="exportFormat">Format d'export</Label>
            <Select onValueChange={(value) => setFormData({...formData, exportFormat: value})}>
              <SelectTrigger id="exportFormat">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">Word</SelectItem>
                <SelectItem value="txt">Texte</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeAnnotations"
                checked={formData.includeAnnotations}
                onCheckedChange={(checked) => setFormData({...formData, includeAnnotations: checked as boolean})}
              />
              <Label htmlFor="includeAnnotations">Inclure les annotations</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeHistory"
                checked={formData.includeHistory}
                onCheckedChange={(checked) => setFormData({...formData, includeHistory: checked as boolean})}
              />
              <Label htmlFor="includeHistory">Inclure l'historique des modifications</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Notes supplémentaires"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              Lancer la consultation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}