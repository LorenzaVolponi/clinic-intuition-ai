import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface SpeechRecognitionEventResult {
  transcript: string;
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<ArrayLike<SpeechRecognitionEventResult>>;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface VoiceAssistantProps {
  title: string;
  description: string;
  onTranscript?: (text: string) => void;
  speechText?: string;
  listenLabel?: string;
  stopListenLabel?: string;
  speakLabel?: string;
  stopSpeakLabel?: string;
  disabled?: boolean;
}

export const VoiceAssistant = ({
  title,
  description,
  onTranscript,
  speechText,
  listenLabel = 'Falar',
  stopListenLabel = 'Parar ditado',
  speakLabel = 'Ler em voz alta',
  stopSpeakLabel = 'Parar leitura',
  disabled = false,
}: VoiceAssistantProps) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const recognitionSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const canListen = Boolean(onTranscript) && recognitionSupported && !disabled;
  const canSpeak = Boolean(speechText) && speechSupported && !disabled;

  useEffect(() => () => {
    recognitionRef.current?.stop();
    if (speechSupported) {
      window.speechSynthesis.cancel();
    }
  }, [speechSupported]);

  const startListening = () => {
    if (!canListen) return;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'pt-BR';
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();

      if (transcript) {
        onTranscript?.(transcript);
        setStatusMessage(`Texto capturado: “${transcript}”`);
      }
    };
    recognition.onerror = (event) => {
      setStatusMessage(`Não consegui ouvir com clareza (${event.error || 'erro de voz'}). Você pode digitar normalmente.`);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setStatusMessage('Ouvindo em português do Brasil...');
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setStatusMessage('Ditado pausado.');
  };

  const speak = () => {
    if (!canSpeak || !speechText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setStatusMessage('Não consegui concluir a leitura em voz alta neste navegador.');
    };

    setIsSpeaking(true);
    setStatusMessage('Lendo o resumo clínico em voz alta...');
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setStatusMessage('Leitura pausada.');
  };

  return (
    <Card className="border-primary/15 bg-primary-soft/20 shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {onTranscript && (
            <Button
              type="button"
              variant={isListening ? 'destructive' : 'outline'}
              onClick={isListening ? stopListening : startListening}
              disabled={!canListen && !isListening}
              className="rounded-full"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isListening ? stopListenLabel : listenLabel}
            </Button>
          )}

          {speechText && (
            <Button
              type="button"
              variant={isSpeaking ? 'destructive' : 'outline'}
              onClick={isSpeaking ? stopSpeaking : speak}
              disabled={!canSpeak && !isSpeaking}
              className="rounded-full"
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {isSpeaking ? stopSpeakLabel : speakLabel}
            </Button>
          )}
        </div>

        {statusMessage && <p className="text-xs text-muted-foreground">{statusMessage}</p>}

        {onTranscript && !recognitionSupported && (
          <Alert className="bg-background/80">
            <AlertTitle>Ditado indisponível</AlertTitle>
            <AlertDescription>
              Este navegador não expôs a API de reconhecimento de voz. Você ainda pode preencher a anamnese digitando.
            </AlertDescription>
          </Alert>
        )}

        {speechText && !speechSupported && (
          <Alert className="bg-background/80">
            <AlertTitle>Leitura indisponível</AlertTitle>
            <AlertDescription>
              Este navegador não expôs a API de síntese de voz. O resumo segue disponível em texto.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
