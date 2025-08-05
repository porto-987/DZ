import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2, Settings } from 'lucide-react';
import { useElevenLabs } from '@/hooks/useElevenLabs';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TextToSpeechButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  children?: React.ReactNode;
}

const VOICE_OPTIONS = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria (Féminine)' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Masculine)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Féminine)' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam (Masculine)' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte (Féminine)' }
];

export function TextToSpeechButton({ 
  text, 
  className = '', 
  size = 'sm', 
  variant = 'outline',
  children 
}: TextToSpeechButtonProps) {
  const [apiKey, setApiKey] = useState(() => 
    localStorage.getItem('elevenlabs_api_key') || ''
  );
  const [selectedVoice, setSelectedVoice] = useState(
    localStorage.getItem('elevenlabs_voice') || '9BWtsMINqrJLrRacOk9x'
  );
  const [showSettings, setShowSettings] = useState(false);

  const { speak, stop, isPlaying, isLoading, error } = useElevenLabs({
    apiKey,
    voiceId: selectedVoice,
    model: 'eleven_multilingual_v2'
  });

  const handleSpeak = async () => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    if (isPlaying) {
      stop();
    } else {
      await speak({ text });
    }
  };

  const saveSettings = () => {
    localStorage.setItem('elevenlabs_api_key', apiKey);
    localStorage.setItem('elevenlabs_voice', selectedVoice);
    setShowSettings(false);
  };

  const getButtonContent = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (isPlaying) return <VolumeX className="w-4 h-4" />;
    return <Volume2 className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={variant}
        size={size}
        onClick={handleSpeak}
        disabled={isLoading}
        className={className}
        title={isPlaying ? 'Arrêter la lecture' : 'Lire le texte'}
      >
        {getButtonContent()}
        {children}
      </Button>

      <Popover open={showSettings} onOpenChange={setShowSettings}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Paramètres de synthèse vocale"
          >
            <Settings className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Configuration ElevenLabs</h4>
              <p className="text-sm text-muted-foreground">
                Configurez votre clé API et vos préférences vocales
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-key">Clé API ElevenLabs</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Entrez votre clé API..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Votre clé API est stockée localement
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice">Voix</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une voix" />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <Button onClick={saveSettings} className="w-full">
              Sauvegarder
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}