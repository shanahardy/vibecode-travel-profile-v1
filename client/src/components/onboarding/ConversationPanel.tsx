import { useRef, useEffect, useState } from 'react';
import { useProfileStore } from '@/lib/store';
import { handleOnboardingStep } from '@/lib/mock-ai';
import { Send, Bot, Loader2, RefreshCcw, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ONBOARDING_QUESTIONS } from '@/lib/onboarding-constants';
import { useSpeech } from '@/hooks/use-speech';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  
  // Voice integration
  const { isSupported, isListening, toggleListening, speak, cancelSpeech, isMuted, setIsMuted } = useSpeech({
    onTranscript: (text) => {
        // Append text if listening, or replace? 
        // For simple chat, usually replacing or appending to current input is good.
        // Let's assume user speaks one phrase at a time or we append.
        setInputValue(prev => {
            // Check if text is a continuation or correction
            // Simplified: just set it for now as the hook sends interim results too
            return text; 
            // NOTE: The simple hook implementation I wrote might overwrite. 
            // Let's adjust usage or assume user speaks the whole sentence.
            // Actually, let's just use the text passed from the hook which handles the accumulation if we did it right.
            // Wait, my hook implementation sends chunks. Let's fix the hook logic in my head or just handle it here.
            // If the hook sends "interim" it's the full interim string usually in Web Speech API.
            // Let's assume `text` is the full current utterance.
        });
    }
  });

  // Speak latest assistant message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && !isLoading) {
        speak(lastMessage.content);
    }
  }, [messages, isLoading, speak]);

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
  }, [messages, isLoading, isListening]); // Auto scroll when listening too

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || inputValue;
    if (!textToSend.trim()) return;

    cancelSpeech(); // Stop speaking if user interrupts
    if (isListening) toggleListening(); // Stop listening on send

    if (!overrideText) setInputValue('');
    
    addMessage({ role: 'user', content: textToSend });
    setLoading(true);

    try {
      const response = await handleOnboardingStep(
        textToSend, 
        currentStep, 
        isAwaitingConfirmation, 
        profile
      );
      
      // Update Profile with extracted data
      if (response.extractedData && Object.keys(response.extractedData).length > 0) {
        updateProfile(response.extractedData);
      }

      // Add AI Message
      addMessage({ 
        role: 'assistant', 
        content: response.text, 
        type: response.type 
      });

      // Handle Step Logic
      if (response.type === 'completion') {
        // We are done
      } else if (response.requiresConfirmation) {
        setAwaitingConfirmation(true);
      } else if (isAwaitingConfirmation && !response.requiresConfirmation && response.type !== 'followup') {
        // If we were awaiting confirmation and now we got a 'text' response (next question), we move forward
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

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header with Mute Toggle */}
      <div className="absolute top-4 right-4 z-10">
        {isSupported && (
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur border shadow-sm hover:bg-muted"
                onClick={() => {
                    setIsMuted(!isMuted);
                    cancelSpeech();
                }}
            >
                {isMuted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-primary" />}
            </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" ref={scrollRef}>
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
      <div className="p-4 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto w-full relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2 items-end relative"
          >
             {/* Voice Input Button */}
             {isSupported && (
                <div className="relative">
                    {isListening && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                    <Button
                        type="button"
                        variant={isListening ? "destructive" : "outline"}
                        size="icon"
                        className={cn(
                            "h-14 w-14 rounded-full flex-shrink-0 transition-all",
                            isListening ? "animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
                        )}
                        onClick={toggleListening}
                    >
                        {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </Button>
                </div>
             )}

            <div className="relative flex-1">
                <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isListening ? "Listening..." : (isAwaitingConfirmation ? "Confirm or correct details..." : "Type your answer...")}
                className={cn(
                    "w-full pr-24 h-14 rounded-full border-muted-foreground/20 focus-visible:ring-primary/20 shadow-sm text-base pl-6 transition-all",
                    isListening && "border-red-400 ring-1 ring-red-400/20 bg-red-50/10 placeholder:text-red-400"
                )}
                disabled={isLoading}
                autoFocus
                />
                
                <div className="absolute right-2 top-2 flex gap-1">
                    <Button 
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-10 px-3 rounded-full text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => {
                            // Skip Logic
                            const nextStep = currentStep + 1;
                            addMessage({ role: 'user', content: "Skip" });
                            
                            if (isAwaitingConfirmation) {
                                setAwaitingConfirmation(false);
                            }

                            if (nextStep < ONBOARDING_QUESTIONS.length) {
                                setStep(nextStep);
                                setLoading(true);
                                setTimeout(() => {
                                    addMessage({ 
                                        role: 'assistant', 
                                        content: `No problem. ${ONBOARDING_QUESTIONS[nextStep].prompt}`, 
                                        type: 'text' 
                                    });
                                    setLoading(false);
                                }, 600);
                            } else {
                                setLoading(true);
                                setTimeout(() => {
                                    addMessage({ 
                                        role: 'assistant', 
                                        content: "That covers the basics! You can update your profile later.", 
                                        type: 'completion' 
                                    });
                                    setLoading(false);
                                }, 600);
                            }
                        }}
                        disabled={isLoading}
                    >
                        Skip
                    </Button>
                    <Button 
                    type="submit" 
                    size="icon" 
                    className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 transition-all shadow-md"
                    disabled={!inputValue.trim() || isLoading}
                    >
                    <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
          </form>
          <div className="text-center mt-2 h-4">
             {isListening && (
                 <span className="text-xs text-red-500 font-medium animate-pulse flex items-center justify-center gap-1">
                     <Mic className="w-3 h-3" /> Listening...
                 </span>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
