import { useState, useCallback } from 'react';

interface ElevenLabsConfig {
  apiKey?: string;
  voiceId?: string;
  model?: string;
}

interface TextToSpeechOptions {
  text: string;
  voiceId?: string;
  model?: string;
  stability?: number;
  similarity_boost?: number;
}

export function useElevenLabs(config: ElevenLabsConfig = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback(async (options: TextToSpeechOptions) => {
    if (!config.apiKey) {
      setError('ElevenLabs API key is required');
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${options.voiceId || config.voiceId || '9BWtsMINqrJLrRacOk9x'}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': config.apiKey
          },
          body: JSON.stringify({
            text: options.text,
            model_id: options.model || config.model || 'eleven_multilingual_v2',
            voice_settings: {
              stability: options.stability || 0.5,
              similarity_boost: options.similarity_boost || 0.75
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onloadeddata = () => {
        setIsLoading(false);
        setIsPlaying(true);
        audio.play();
      };

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };

      audio.onerror = () => {
        setError('Erreur lors de la lecture audio');
        setIsLoading(false);
        setIsPlaying(false);
      };

      setCurrentAudio(audio);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setIsLoading(false);
    }
  }, [config.apiKey, config.voiceId, config.model, currentAudio]);

  const stop = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }
  }, [currentAudio]);

  const pause = useCallback(() => {
    if (currentAudio && isPlaying) {
      currentAudio.pause();
      setIsPlaying(false);
    }
  }, [currentAudio, isPlaying]);

  const resume = useCallback(() => {
    if (currentAudio && !isPlaying) {
      currentAudio.play();
      setIsPlaying(true);
    }
  }, [currentAudio, isPlaying]);

  return {
    speak,
    stop,
    pause,
    resume,
    isPlaying,
    isLoading,
    error
  };
}