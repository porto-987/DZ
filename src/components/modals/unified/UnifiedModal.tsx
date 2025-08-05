/**
 * Composant Modal Unifié
 * Interface utilisateur harmonisée et accessible
 */

import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModalConfig, ModalSize, ModalAction } from './types';
import { logger } from '@/utils/logger';

interface UnifiedModalProps {
  config: ModalConfig;
  onClose: () => void;
  isOpen: boolean;
}

const getSizeClasses = (size: ModalSize): string => {
  const sizeMap = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    full: 'sm:max-w-[95vw] max-h-[95vh]'
  };
  return sizeMap[size] || sizeMap.md;
};

export const UnifiedModal: React.FC<UnifiedModalProps> = ({ 
  config, 
  onClose, 
  isOpen 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Gestion du focus pour l'accessibilité
  useEffect(() => {
    if (isOpen && contentRef.current) {
      const focusableElements = contentRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) {
        firstElement.focus();
      }
    }
  }, [isOpen]);

  // Gestion de l'échap et des événements clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && config.closable !== false) {
        event.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prévenir le scroll du body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, config.closable, onClose]);

  const handleAction = async (action: ModalAction) => {
    try {
      logger.debug('UI', 'Action de modal exécutée', { 
        modalId: config.id, 
        actionId: action.id 
      }, 'UnifiedModal');
      
      await action.onClick();
    } catch (error) {
      logger.error('UI', 'Erreur lors de l\'exécution d\'une action de modal', {
        modalId: config.id,
        actionId: action.id,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 'UnifiedModal');
    }
  };

  const renderModalContent = () => {
    switch (config.type) {
      case 'confirmation':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">{config.message}</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={config.onCancel || onClose}
              >
                {config.cancelText || 'Annuler'}
              </Button>
              <Button
                variant={config.variant === 'destructive' ? 'destructive' : 'default'}
                onClick={async () => {
                  await config.onConfirm();
                  onClose();
                }}
              >
                {config.confirmText || 'Confirmer'}
              </Button>
            </div>
          </div>
        );

      case 'form':
        const FormComponent = config.formComponent;
        return (
          <div className="space-y-4">
            <FormComponent
              {...config.formProps}
              onSubmit={async (data: any) => {
                await config.onSubmit(data);
                onClose();
              }}
              onCancel={config.onCancel || onClose}
            />
          </div>
        );

      case 'display':
        return (
          <div className={cn(
            "space-y-4",
            config.scrollable && "max-h-[60vh] overflow-y-auto"
          )}>
            {config.content}
            {config.footerActions && config.footerActions.length > 0 && (
              <>
                <Separator />
                <div className="flex justify-end gap-2">
                  {config.footerActions.map((action) => (
                    <Button
                      key={action.id}
                      variant={action.variant || 'default'}
                      onClick={() => handleAction(action)}
                      disabled={action.disabled}
                      className="min-w-20"
                    >
                      {action.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {action.icon && !action.loading && (
                        <action.icon className="mr-2 h-4 w-4" />
                      )}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case 'workflow':
        return (
          <div className="space-y-6">
            {/* Indicateur de progression */}
            <div className="flex items-center space-x-2">
              {config.steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    index <= (config.currentStep || 0) 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  {index < config.steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5",
                      index < (config.currentStep || 0) 
                        ? "bg-primary" 
                        : "bg-muted"
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Étape courante */}
            {config.steps[config.currentStep || 0] && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">
                    {config.steps[config.currentStep || 0].title}
                  </h3>
                  {config.steps[config.currentStep || 0].description && (
                    <p className="text-sm text-muted-foreground">
                      {config.steps[config.currentStep || 0].description}
                    </p>
                  )}
                </div>
                
                <div className="min-h-[200px]">
                  {React.createElement(
                    config.steps[config.currentStep || 0].component,
                    config.steps[config.currentStep || 0].props || {}
                  )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    disabled={(config.currentStep || 0) === 0}
                    onClick={() => {
                      const newStep = Math.max(0, (config.currentStep || 0) - 1);
                      config.onStepChange?.(newStep);
                    }}
                  >
                    Précédent
                  </Button>
                  
                  <Button
                    onClick={() => {
                      const currentStepIndex = config.currentStep || 0;
                      if (currentStepIndex === config.steps.length - 1) {
                        config.onComplete?.({});
                        onClose();
                      } else {
                        const newStep = Math.min(
                          config.steps.length - 1, 
                          currentStepIndex + 1
                        );
                        config.onStepChange?.(newStep);
                      }
                    }}
                  >
                    {(config.currentStep || 0) === config.steps.length - 1 
                      ? 'Terminer' 
                      : 'Suivant'
                    }
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center text-muted-foreground">
            Type de modal non supporté: {config.type}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={config.closable !== false ? onClose : undefined}>
      <DialogContent 
        ref={contentRef}
        className={cn(
          getSizeClasses(config.size || 'md'),
          "p-0 overflow-hidden",
          config.className
        )}
        aria-labelledby="modal-title"
        aria-describedby={config.description ? "modal-description" : undefined}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle id="modal-title" className="text-lg font-semibold">
                {config.title}
              </DialogTitle>
              {config.description && (
                <DialogDescription id="modal-description" className="mt-1">
                  {config.description}
                </DialogDescription>
              )}
            </div>
            
            {config.closable !== false && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-background/50"
                aria-label="Fermer la modal"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          {renderModalContent()}
        </div>

        {/* Actions génériques */}
        {config.actions && config.actions.length > 0 && (
          <>
            <Separator />
            <div className="px-6 py-4 bg-muted/30">
              <div className="flex justify-end gap-2">
                {config.actions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant || 'default'}
                    onClick={() => handleAction(action)}
                    disabled={action.disabled}
                    className="min-w-20"
                  >
                    {action.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {action.icon && !action.loading && (
                      <action.icon className="mr-2 h-4 w-4" />
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};