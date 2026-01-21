import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechProps {
  onTranscript: (text: string) => void;
}

export function useSpeech({ onTranscript }: UseSpeechProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setIsSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscriptChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptChunk += event.results[i][0].transcript;
          } else {
             // We can handle interim results if we want real-time updates without committing
             // But for this simple implementation, we might just want to update the input
             const interim = event.results[i][0].transcript;
             onTranscript(interim);
          }
        }
        
        if (finalTranscriptChunk) {
            onTranscript(finalTranscriptChunk);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
             setIsListening(false);
        }
      };
      
      recognitionRef.current.onend = () => {
         // If we want it to be continuous, we restart it here unless stopped manually
         // But for a chat input, usually we want it to stop or we manage state carefully.
         // Let's rely on isListening state.
         if (isListening) {
             try {
                recognitionRef.current.start();
             } catch(e) {
                setIsListening(false);
             }
         }
      };
    }
  }, [isListening, onTranscript]); // Check dependencies

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  }, [isListening]);

  const speak = useCallback((text: string) => {
    if (isMuted || !text) return;
    
    // Strip markdown/html for speech
    const textToSpeak = text.replace(/[*_#]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    window.speechSynthesis.cancel(); // Cancel previous
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return {
    isSupported,
    isListening,
    toggleListening,
    speak,
    cancelSpeech,
    isMuted,
    setIsMuted
  };
}
