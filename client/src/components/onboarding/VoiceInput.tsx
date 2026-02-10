import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/store';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onSend: () => void;
  lastMessage?: Message;
  isProcessing: boolean;
}

export function VoiceInput({ onTranscript, onSend, lastMessage, isProcessing }: VoiceInputProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscriptChunk = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptChunk += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscriptChunk) {
            setTranscript(prev => {
                const newValue = (prev + ' ' + finalTranscriptChunk).trim();
                onTranscript(newValue);
                return newValue;
            });
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
             setIsListening(false);
        }
      };
      
      recognitionRef.current.onend = () => {
         if (isListening) {
             try {
                recognitionRef.current.start();
             } catch(e) {
                setIsListening(false);
             }
         }
      };
    }
  }, [onTranscript]);

  useEffect(() => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started
      }
    } else if (!isListening && recognitionRef.current) {
        try {
            recognitionRef.current.stop();
        } catch(e) {
            // Already stopped
        }
    }
  }, [isListening]);

  // Voiceflow TTS - play audio responses
  useEffect(() => {
      if (!lastMessage || isMuted || isListening) return;

      // Cancel currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Play Voiceflow TTS if available
      if (lastMessage.ttsUrl) {
        try {
          audioRef.current = new Audio(lastMessage.ttsUrl);
          audioRef.current.play().catch(error => {
            console.warn('[TTS] Failed to play audio:', error);
          });
        } catch (error) {
          console.warn('[TTS] Failed to create audio element:', error);
        }
      }

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      }
  }, [lastMessage, isMuted, isListening]); // Don't speak while listening

  if (!isSupported) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
              <p>Voice input is not supported in this browser.</p>
          </div>
      )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8 p-6 bg-gradient-to-b from-background to-muted/20">
        
        {/* Visualizer / Status */}
        <div className="relative">
            <div className={cn(
                "w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 border-4",
                isListening 
                    ? "bg-primary border-primary/30 shadow-[0_0_60px_rgba(var(--primary),0.6)] scale-110 animate-pulse" 
                    : "bg-muted border-border"
            )}>
                <Mic className={cn(
                    "w-16 h-16 transition-colors duration-300", 
                    isListening ? "text-primary-foreground" : "text-muted-foreground"
                )} />
            </div>
            
            {/* Ripple effects when listening */}
            {isListening && (
                <>
                    <div className="absolute inset-0 rounded-full border border-primary/40 animate-[ping_2s_linear_infinite]" />
                    <div className="absolute inset-0 rounded-full border border-primary/20 animate-[ping_2s_linear_infinite_0.5s]" />
                </>
            )}
        </div>
        
        {/* Transcript Preview */}
        <div className="w-full max-w-lg min-h-[60px] text-center">
            {transcript ? (
                <p className="text-lg font-medium leading-relaxed">{transcript}</p>
            ) : (
                <p className="text-muted-foreground italic">
                    {isListening ? "Listening... say something..." : "Tap the microphone to start speaking"}
                </p>
            )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 w-full max-w-xs items-center">
            <Button
                variant={isListening ? "destructive" : "default"}
                size="lg"
                className="rounded-full w-full h-14 text-lg font-medium shadow-lg transition-transform active:scale-95"
                onClick={() => setIsListening(!isListening)}
                disabled={isProcessing}
            >
                {isListening ? (
                    <><MicOff className="mr-2 h-5 w-5" /> Stop Listening</>
                ) : (
                    <><Mic className="mr-2 h-5 w-5" /> Tap to Speak</>
                )}
            </Button>
            
            {transcript && (
                <Button 
                    variant="secondary" 
                    size="lg"
                    className="rounded-full w-full h-12"
                    onClick={() => {
                        onSend();
                        setTranscript('');
                        setIsListening(false);
                    }}
                    disabled={isProcessing || !transcript.trim()}
                >
                    <Send className="mr-2 h-4 w-4" /> Send Message
                </Button>
            )}
            
             <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                    setIsMuted(!isMuted);
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current = null;
                    }
                }}
            >
                {isMuted ? (
                    <><VolumeX className="h-3 w-3 mr-1" /> Unmute Assistant</>
                ) : (
                    <><Volume2 className="h-3 w-3 mr-1" /> Mute Assistant</>
                )}
            </Button>
        </div>
    </div>
  );
}
