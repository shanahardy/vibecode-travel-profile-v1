import { useState, useRef, useEffect } from 'react';
import { useProfileStore } from '@/lib/store';
import { generateAIResponse } from '@/lib/mock-ai';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function ConversationInterface() {
  const { messages, addMessage, isLoading, setLoading, profile, updateProfile } = useProfileStore();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setInputValue('');
    
    // Add User Message
    addMessage({ role: 'user', content: userMsg });
    setLoading(true);

    try {
      // Get AI Response
      const response = await generateAIResponse(userMsg, profile);
      
      // Update Profile if data extracted
      if (response.extractedData && Object.keys(response.extractedData).length > 0) {
        updateProfile(response.extractedData);
      }

      // Add AI Message
      addMessage({ role: 'assistant', content: response.text });
    } catch (error) {
      console.error(error);
      addMessage({ role: 'assistant', content: "Sorry, I had a bit of a hiccup. Could you say that again?" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full max-w-3xl mx-auto bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Travel Assistant
          </h2>
          <p className="text-xs text-muted-foreground">Building your profile</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => useProfileStore.getState().resetConversation()}>
          Reset
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/20" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex w-full",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-card border border-border text-foreground rounded-bl-none"
                )}
              >
                {msg.content}
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
      <div className="p-4 bg-card border-t border-border">
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
            placeholder="Type your answer..."
            className="flex-1 pr-12 h-12 rounded-full border-muted-foreground/20 focus-visible:ring-primary/20"
            disabled={isLoading}
            autoFocus
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1 top-1 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 transition-all shadow-md"
            disabled={!inputValue.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
