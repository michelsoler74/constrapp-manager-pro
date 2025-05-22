
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';

interface SpeechInputProps {
  onResult: (transcript: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SpeechInput: React.FC<SpeechInputProps> = ({
  onResult,
  placeholder = 'Hablar para ingresar texto',
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('El reconocimiento de voz no está disponible en este navegador');
      setError('El reconocimiento de voz no está disponible en este navegador');
      return;
    }

    setIsListening(true);
    setError(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      toast.info('Escuchando...');
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      toast.success('Texto capturado');
    };
    
    recognition.onerror = (event) => {
      setError(`Error: ${event.error}`);
      toast.error(`Error de reconocimiento: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={startListening}
        disabled={isListening || disabled}
        className="flex items-center gap-2"
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {isListening ? 'Escuchando...' : placeholder}
      </Button>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default SpeechInput;
