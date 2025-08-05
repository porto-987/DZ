import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, CheckCircle, XCircle, Eye, FileText, Users
} from "lucide-react";
import { toast } from '@/hooks/use-toast';

import { ApprovalQueueModalProps } from '@/types/modalInterfaces';

export function ApprovalQueueModal({ isOpen, onClose, onApprove, onReject }: ApprovalQueueModalProps) {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (onApprove) {
        await onApprove({});
      }
      toast({
        title: "Approuvé",
        description: "L'élément a été approuvé avec succès.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'approbation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez fournir une raison de rejet.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (onReject) {
        await onReject({}, rejectionReason);
      }
      toast({
        title: "Rejeté",
        description: "L'élément a été rejeté.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du rejet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            File d'Attente d'Approbation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Nouvelle procédure administrative</h3>
                    <p className="text-sm text-muted-foreground">Procédure pour la gestion des demandes de congés</p>
                  </div>
                  <Badge variant="outline">En attente</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Soumis par: Jean Dupont | Le: 15/01/2024
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label>Raison du rejet (optionnel)</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Expliquez pourquoi vous rejetez cet élément..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeter
          </Button>
          <Button onClick={handleApprove} disabled={loading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approuver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}