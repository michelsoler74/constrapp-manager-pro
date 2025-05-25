
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
  error?: any;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
}

interface SpeechInputProps {
  onResult: (transcript: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SpeechInput: React.FC<SpeechInputProps> = ({
  onResult,
  placeholder = 'Hablar',
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const errorMsg = 'El reconocimiento de voz no está disponible en este navegador';
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    setIsListening(true);
    setError(null);

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI() as SpeechRecognitionInstance;
    
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      console.log('Speech recognition started');
      toast.info('Escuchando...');
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Speech recognition result:', transcript);
      onResult(transcript);
      toast.success(`Texto capturado: "${transcript}"`);
      setIsListening(false);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      const errorMsg = `Error de reconocimiento: ${event.error}`;
      setError(errorMsg);
      toast.error(errorMsg);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
      toast.error('Error al iniciar el reconocimiento de voz');
    }
  };

  return (
    <div className="flex flex-col">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={startListening}
        disabled={isListening || disabled}
        className="flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap"
      >
        {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
        {isListening ? 'Escuchando...' : placeholder}
      </Button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default SpeechInput;
