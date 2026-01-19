import { useRef, useEffect, useState } from 'react';
import { useProfileStore } from '@/lib/store';
import { handleOnboardingStep } from '@/lib/mock-ai';
import { Send, Bot, Loader2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ONBOARDING_QUESTIONS } from '@/lib/onboarding-constants';

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
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setInputValue('');
    
    addMessage({ role: 'user', content: userMsg });
    setLoading(true);

    try {
      const response = await handleOnboardingStep(
        userMsg, 
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
      <div className="p-4 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto w-full relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2 items-center relative"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isAwaitingConfirmation ? "Confirm with 'Yes' or provide corrections..." : "Type your answer..."}
              className="flex-1 pr-12 h-14 rounded-full border-muted-foreground/20 focus-visible:ring-primary/20 shadow-sm text-base pl-6"
              disabled={isLoading}
              autoFocus
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-2 top-2 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 transition-all shadow-md"
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground">
               {isAwaitingConfirmation ? "Please confirm the details above to proceed." : "Tip: You can say \"I'm done\" when you've finished answering."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
