import { useState, useRef, useEffect } from 'react';
import { useProfileStore, Message, Trip } from '@/lib/store';
import { handlePlannerMessage } from '@/lib/planner-ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PlannerChatProps {
  tripIndex: number;
}

export function PlannerChat({ tripIndex }: PlannerChatProps) {
  const { profile, updateSection } = useProfileStore();
  const trip = profile.upcomingTrips?.[tripIndex];
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize messages if empty
  useEffect(() => {
    if (trip && (!trip.plannerMessages || trip.plannerMessages.length === 0)) {
        const initialMsg: Message = {
            id: 'init',
            role: 'assistant',
            content: `Hi! I'm your planning assistant for ${trip.destination}. How can I help you prepare?`,
            timestamp: Date.now(),
            type: 'text'
        };
        updateTripMessages([initialMsg]);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }
  }, [trip?.plannerMessages, isLoading]);

  const updateTripMessages = (newMessages: Message[]) => {
    if (!profile.upcomingTrips) return;
    const newTrips = [...profile.upcomingTrips];
    // Merge existing messages with new ones properly
    const currentMessages = newTrips[tripIndex].plannerMessages || [];
    newTrips[tripIndex].plannerMessages = [...currentMessages, ...newMessages];
    updateSection('upcomingTrips', newTrips);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !trip) return;

    const userMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: 'user',
        content: inputValue,
        timestamp: Date.now(),
        type: 'text'
    };

    setInputValue('');
    updateTripMessages([userMsg]);
    setIsLoading(true);

    try {
        const response = await handlePlannerMessage(userMsg.content, trip.destination);
        
        const aiMsg: Message = {
            id: Math.random().toString(36).substring(7),
            role: 'assistant',
            content: response.text,
            timestamp: Date.now(),
            type: response.type
        };

        updateTripMessages([aiMsg]);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  if (!trip) return <div>Trip not found</div>;

  return (
    <div className="flex flex-col h-full bg-background">
        <div className="p-4 border-b flex items-center gap-2 bg-muted/20">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-semibold text-sm">Trip Planner</h3>
                <p className="text-[10px] text-muted-foreground">Focus: {trip.destination}</p>
            </div>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4 pb-4">
                {trip.plannerMessages?.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "flex gap-2 max-w-[85%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1",
                            msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                            {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        </div>
                        <div className={cn(
                            "rounded-2xl px-3 py-2 text-sm",
                            msg.role === 'user' 
                                ? "bg-primary text-primary-foreground rounded-tr-none" 
                                : "bg-muted rounded-tl-none"
                        )}>
                            {msg.content}
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <div className="flex gap-2 max-w-[85%]">
                         <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-muted text-muted-foreground">
                            <Bot className="w-3 h-3" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-none px-3 py-2 text-sm flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="text-xs opacity-70">Planning...</span>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>

        <div className="p-3 border-t bg-background">
            <form 
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                }}
                className="flex gap-2"
            >
                <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about flights, hotels..."
                    className="flex-1 h-9 text-sm"
                    disabled={isLoading}
                />
                <Button type="submit" size="icon" className="h-9 w-9" disabled={!inputValue.trim() || isLoading}>
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    </div>
  );
}