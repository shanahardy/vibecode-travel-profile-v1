import { useRef, useEffect, useState } from 'react';
import { useProfileStore } from '@/lib/store';
import { handleOnboardingStep } from '@/lib/mock-ai';
import { Send, Loader2, RefreshCcw, Mic, MicOff, Volume2, VolumeX, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ONBOARDING_QUESTIONS } from '@/lib/onboarding-constants';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export function ConversationPanel() {
  const { 
    messages, 
    addMessage, 
    isLoading, 
    setLoading, 
    profile, 
    updateProfile, 
    currentStep, 
    setStep,
    isAwaitingConfirmation,
    setAwaitingConfirmation
  } = useProfileStore();
  
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true); // Default to auto-speak on
  const recognitionRef = useRef<any>(null);

  // Initialize first message if empty
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: ONBOARDING_QUESTIONS[0].prompt,
        type: 'text'
      });
    }
  }, [messages.length, addMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isListening]); // Scroll when listening status changes too

  // Speech Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSpeechSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
             setIsListening(false);
        }
      };
      
      recognitionRef.current.onend = () => {
         // If we were listening and it stopped unexpectedly (silence), restart if still "listening" state
         // But usually we want to let user control it. 
         // For now, let's auto-stop if silence to avoid infinite loops of silence
         if (isListening) {
             // Optional: keep it alive
             // try { recognitionRef.current.start(); } catch(e) {}
         } else {
             setIsListening(false);
         }
      };
    }
  }, []);


  // Toggle Listening
  const toggleListening = () => {
    if (!isSpeechSupported) return;

    if (isListening) {
        setIsListening(false);
        recognitionRef.current?.stop();
    } else {
        setIsListening(true);
        try {
            recognitionRef.current?.start();
        } catch (e) {
            console.error(e);
        }
    }
  };

  // Text to Speech
  useEffect(() => {
      const lastMessage = messages.slice().reverse().find(m => m.role === 'assistant');
      
      if (!lastMessage || !autoSpeak || isListening) return; // Don't speak if listening
      
      // Only speak new messages (simple check: if it's the last one and we just stopped loading)
      if (!isLoading) {
          const textToSpeak = lastMessage.content.replace(/[*_#]/g, '');
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
      }
      
      return () => {
          window.speechSynthesis.cancel();
      }
  }, [messages, autoSpeak, isListening, isLoading]);


  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || inputValue;
    if (!textToSend.trim()) return;

    setInputValue('');
    
    // Stop listening when sending
    if (isListening) {
        setIsListening(false);
        recognitionRef.current?.stop();
    }
    
    addMessage({ role: 'user', content: textToSend });
    setLoading(true);

    try {
      const response = await handleOnboardingStep(
        textToSend, 
        currentStep, 
        isAwaitingConfirmation, 
        profile
      );
      
      if (response.extractedData && Object.keys(response.extractedData).length > 0) {
        updateProfile(response.extractedData);
      }

      addMessage({ 
        role: 'assistant', 
        content: response.text, 
        type: response.type 
      });

      if (response.type === 'completion') {
        // We are done
      } else if (response.requiresConfirmation) {
        setAwaitingConfirmation(true);
      } else if (isAwaitingConfirmation && !response.requiresConfirmation && response.type !== 'followup') {
        setAwaitingConfirmation(false);
        setStep(currentStep + 1);
      }

    } catch (error) {
      console.error(error);
      addMessage({ role: 'assistant', content: "Sorry, I had a bit of a hiccup. Could you say that again?" });
    } finally {
      setLoading(false);
    }
  };

  // Update onresult handler with fresh state (inputValue, handleSendMessage)
  // Moved here because it depends on handleSendMessage
  useEffect(() => {
    if (!recognitionRef.current) return;

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
            // Check for completion phrases to auto-submit
            const lowerFinal = finalTranscriptChunk.toLowerCase().trim().replace(/[.,!?]$/, '');
            const completionPhrases = ["done", "i'm finished", "that's it", "im finished", "i am finished"];
            
            const matchedPhrase = completionPhrases.find(p => lowerFinal.endsWith(p) || lowerFinal === p);

            if (matchedPhrase) {
                // Stop listening
                setIsListening(false);
                recognitionRef.current.stop();

                // Clean the transcript (remove the completion phrase)
                const regex = new RegExp(`${matchedPhrase}[.,!?]*$`, 'i');
                const cleanFinal = finalTranscriptChunk.replace(regex, '').trim();
                
                // Construct full message
                const fullText = (inputValue + ' ' + cleanFinal).trim();
                
                // Submit if there's content (or even if empty, if "done" implies skip? No, usually implies submission of what's said)
                // If they just say "done", fullText might be empty if inputValue was empty.
                // If fullText is empty, maybe they mean "skip" or "I have nothing to add"? 
                // For now, let's assume they want to submit whatever they have.
                if (fullText) {
                    handleSendMessage(fullText);
                } else {
                    // If they just say "done" with no other input, treat it as sending "Done" or skipping?
                    // Let's send "Done" so the AI sees it.
                    handleSendMessage("Done");
                }
                return;
            }

            setInputValue(prev => (prev + ' ' + finalTranscriptChunk).trim());
        }
    };
  }, [inputValue, handleSendMessage, setIsListening]);

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex w-full",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-card border border-border text-foreground rounded-bl-none",
                  msg.type === 'confirmation' && "border-primary/50 bg-primary/5"
                )}
              >
                {msg.type === 'confirmation' && (
                  <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wide">
                    <RefreshCcw className="w-3 h-3" /> Confirmation Needed
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start w-full"
          >
            <div className="bg-card border border-border rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border relative z-10">
        <div className="max-w-4xl mx-auto w-full relative">
          
          {/* Voice Indicator Overlay (Optional) */}
          {isListening && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2 shadow-lg z-20">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  Listening...
              </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={cn(
                "flex gap-2 items-center relative transition-all duration-300 rounded-3xl border p-1 shadow-sm",
                isListening ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-muted-foreground/20 bg-background"
            )}
          >
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-10 w-10 rounded-full transition-all duration-300 ml-1",
                                isListening ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "text-muted-foreground hover:bg-muted"
                            )}
                            onClick={toggleListening}
                            disabled={!isSpeechSupported || isLoading}
                        >
                            {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {isListening ? "Stop Listening" : "Use Voice Input"}
                    </TooltipContent>
                </Tooltip>
             </TooltipProvider>

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                  isListening 
                    ? "Speak now..." 
                    : isAwaitingConfirmation 
                        ? "Confirm with 'Yes' or provide corrections..." 
                        : "Type or use voice..."
              }
              className="flex-1 h-12 border-none shadow-none focus-visible:ring-0 bg-transparent text-base px-2"
              disabled={isLoading}
              autoFocus
            />
            
            <div className="flex items-center gap-1 pr-1">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button 
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8 rounded-full", autoSpeak ? "text-primary" : "text-muted-foreground")}
                                onClick={() => setAutoSpeak(!autoSpeak)}
                             >
                                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                             </Button>
                        </TooltipTrigger>
                         <TooltipContent>
                            {autoSpeak ? "Mute Assistant Voice" : "Enable Assistant Voice"}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 transition-all shadow-md ml-1"
                  disabled={!inputValue.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
            </div>
          </form>
          
          <div className="text-center mt-2 flex justify-between px-4">
             <Button 
                variant="link" 
                size="sm" 
                className="text-muted-foreground text-xs p-0 h-auto"
                onClick={() => {
                    const nextStep = currentStep + 1;
                    addMessage({ role: 'user', content: "Skip" });
                    if (isAwaitingConfirmation) setAwaitingConfirmation(false);
                    if (nextStep < ONBOARDING_QUESTIONS.length) {
                        setStep(nextStep);
                        setLoading(true);
                        setTimeout(() => {
                            addMessage({ role: 'assistant', content: `Okay, moving on. ${ONBOARDING_QUESTIONS[nextStep].prompt}`, type: 'text' });
                            setLoading(false);
                        }, 600);
                    }
                }}
             >
                Skip Question
             </Button>
            <span className="text-[10px] text-muted-foreground pt-1">
              {isAwaitingConfirmation ? "Please confirm details." : "Tip: Speak naturally to answer."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
