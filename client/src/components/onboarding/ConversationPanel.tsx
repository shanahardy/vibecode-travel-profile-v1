import { useRef, useEffect, useState } from 'react';
import { useProfileStore } from '@/lib/store';
import { initVoiceflowSession, sendMessage as sendVoiceflowMessage, parseVoiceflowResponse } from '@/lib/voiceflow-client';
import { Send, Loader2, RefreshCcw, Volume2, VolumeX, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

// Status Badge Component
const VoiceflowStatusBadge = ({ status }: { status: 'connecting' | 'connected' | 'error' }) => {
  const statusConfig = {
    connecting: {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      text: 'Connecting...',
      className: 'bg-muted text-muted-foreground'
    },
    connected: {
      icon: <MessageSquare className="h-3 w-3" />,
      text: 'Voiceflow AI',
      className: 'bg-primary/10 text-primary border-primary/20'
    },
    error: {
      icon: <AlertCircle className="h-3 w-3" />,
      text: 'Connection Error',
      className: 'bg-destructive/10 text-destructive border-destructive/20'
    }
  };

  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1
        text-xs font-medium rounded-full border
        ${config.className}
      `}
    >
      {config.icon}
      <span>{config.text}</span>
    </motion.div>
  );
};

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
    setAwaitingConfirmation,
    setVoiceflowSessionId
  } = useProfileStore();

  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoSpeak, setAutoSpeak] = useState(true); // Default to auto-speak on
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [voiceflowStatus, setVoiceflowStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Voiceflow session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        setVoiceflowStatus('connecting');
        const response = await initVoiceflowSession();
        setSessionInitialized(true);
        setVoiceflowSessionId(response.sessionId);
        setVoiceflowStatus('connected');

        // Add initial messages from Voiceflow
        if (response.initialMessages && response.initialMessages.length > 0) {
          response.initialMessages.forEach((msg, index) => {
            const ttsUrl = response.initialTtsUrls?.[index] || undefined;
            console.log('[TTS] Initial message', index, 'has TTS URL:', ttsUrl ? 'YES' : 'NO', ttsUrl);
            addMessage({
              role: 'assistant',
              content: msg,
              type: 'text',
              ttsUrl
            });
          });
        }

        // Update profile with any initial data
        if (response.profileData && Object.keys(response.profileData).length > 0) {
          updateProfile(response.profileData);
        }
      } catch (error: any) {
        console.error('[Voiceflow] Session initialization failed:', error);

        // Determine user-friendly error message
        let errorMessage = 'Sorry, I encountered an error starting our conversation.';
        const errorText = error.message?.toLowerCase() || '';

        if (errorText.includes('not configured') || errorText.includes('placeholder')) {
          errorMessage = 'Voiceflow is not configured yet. Please contact the administrator to set up the VOICEFLOW_API_KEY in Replit Secrets.';
        } else if (errorText.includes('401') || errorText.includes('403') || errorText.includes('unauthorized')) {
          errorMessage = 'Authentication failed. The Voiceflow API key may be invalid or expired. Please contact the administrator.';
        } else if (errorText.includes('404') || errorText.includes('not found')) {
          errorMessage = 'Voiceflow project not found. Please check the VOICEFLOW_PROJECT_KEY configuration.';
        } else if (errorText.includes('network') || errorText.includes('fetch')) {
          errorMessage = 'Network error connecting to Voiceflow. Please check your internet connection and try again.';
        } else {
          errorMessage += ' Please refresh the page to try again.';
        }

        setSessionError(error.message || 'Failed to initialize voice session');
        setVoiceflowStatus('error');
        addMessage({
          role: 'assistant',
          content: errorMessage,
          type: 'text'
        });
      } finally {
        setLoading(false);
      }
    };

    if (messages.length === 0 && !sessionInitialized) {
      initSession();
    }
  }, [messages.length, sessionInitialized, addMessage, updateProfile, setLoading, setVoiceflowSessionId]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Voiceflow TTS - play audio responses
  useEffect(() => {
    const lastMessage = messages.slice().reverse().find(m => m.role === 'assistant');

    if (!lastMessage || !autoSpeak || isLoading) return;

    console.log('[TTS] Attempting to play audio for message:', {
      content: lastMessage.content.substring(0, 50),
      hasTtsUrl: !!lastMessage.ttsUrl,
      ttsUrl: lastMessage.ttsUrl,
      autoSpeak,
      isLoading
    });

    // Cancel currently playing audio
    if (audioRef.current) {
      console.log('[TTS] Canceling previous audio');
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Play Voiceflow TTS if available
    if (lastMessage.ttsUrl) {
      try {
        console.log('[TTS] Creating Audio element with URL:', lastMessage.ttsUrl);
        audioRef.current = new Audio(lastMessage.ttsUrl);
        audioRef.current.play().then(() => {
          console.log('[TTS] Audio playback started successfully');
        }).catch(error => {
          console.warn('[TTS] Failed to play audio:', error);
        });
      } catch (error) {
        console.warn('[TTS] Failed to create audio element:', error);
      }
    } else {
      console.warn('[TTS] No TTS URL available for message - agent might be using Text blocks instead of Speak blocks');
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [messages, autoSpeak, isLoading]);

  const handleSendMessage = async () => {
    const textToSend = inputValue.trim();
    if (!textToSend) return;

    setInputValue('');
    addMessage({ role: 'user', content: textToSend });
    setLoading(true);

    try {
      // Send message to Voiceflow
      const response = await sendVoiceflowMessage(textToSend);

      // Add agent messages to chat
      if (response.messages && response.messages.length > 0) {
        response.messages.forEach((msg, index) => {
          const ttsUrl = response.ttsUrls?.[index] || undefined;
          console.log('[TTS] Response message', index, 'has TTS URL:', ttsUrl ? 'YES' : 'NO', ttsUrl);
          addMessage({
            role: 'assistant',
            content: msg,
            type: 'text',
            ttsUrl
          });
        });
      }

      // Update profile with extracted data
      if (response.profileData && Object.keys(response.profileData).length > 0) {
        updateProfile(response.profileData);
      }

      // Check for conversation completion
      if (response.isComplete) {
        setStep(6); // Move to completion step
        addMessage({
          role: 'assistant',
          content: 'Great! We have all the information we need. Your profile is ready!',
          type: 'completion'
        });
      }

    } catch (error: any) {
      console.error('[Voiceflow] Message error:', error);

      // Determine user-friendly error message
      let errorMessage = 'Sorry, I encountered an error.';
      const errorText = error.message?.toLowerCase() || '';

      if (errorText.includes('session') || errorText.includes('401')) {
        errorMessage = 'Your session may have expired. Please refresh the page to restart the conversation.';
      } else if (errorText.includes('network') || errorText.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (errorText.includes('timeout')) {
        errorMessage = 'The request timed out. Please try sending your message again.';
      } else {
        errorMessage += ' Please try again.';
      }

      addMessage({
        role: 'assistant',
        content: errorMessage,
        type: 'text'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header with Status Badge */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b">
        <h3 className="text-sm font-medium text-muted-foreground">
          AI Assistant
        </h3>
        <VoiceflowStatusBadge status={voiceflowStatus} />
      </div>

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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2 items-center relative transition-all duration-300 rounded-3xl border p-1 shadow-sm border-muted-foreground/20 bg-background"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                isAwaitingConfirmation
                  ? "Confirm with 'Yes' or provide corrections..."
                  : "Type your response..."
              }
              className="flex-1 h-12 border-none shadow-none focus-visible:ring-0 bg-transparent text-base px-4"
              disabled={isLoading || sessionError !== null}
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

          <div className="text-center mt-2 px-4">
            <span className="text-[10px] text-muted-foreground">
              {sessionError
                ? sessionError
                : isAwaitingConfirmation
                  ? "Please confirm details."
                  : "Tip: Answer naturally and conversationally."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
